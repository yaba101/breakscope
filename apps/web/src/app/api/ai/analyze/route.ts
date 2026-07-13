import { NextResponse } from "next/server";
import { z } from "zod";
import { parseAiJson } from "@/lib/ai-analysis";

export const runtime = "nodejs";

const requestSchema = z.object({
  baselineImage: z.string().startsWith("data:image/").max(8_000_000),
  candidateImage: z.string().startsWith("data:image/").max(8_000_000),
  routePath: z.string().startsWith("/").max(180),
  baselineLabel: z.string().max(200),
  candidateLabel: z.string().max(200),
  deterministicSummary: z.unknown(),
  deterministicFindings: z.array(z.unknown()).max(30),
});

const systemPrompt = `You are a senior frontend QA and product design reviewer. Compare the baseline and candidate screenshots using the deterministic evidence supplied. Explain user-visible meaning, not pixel noise. Never invent interactions or hidden content. Return only one JSON object with: executiveSummary, beforePurpose, afterPurpose, verdict (safe|review|block), confidence (0..1), riskScore (0..100), userImpacts (string array), regressions ({title, explanation, severity} array), recommendations (string array). A block verdict requires a likely broken critical task, missing content, or serious accessibility/usability regression.`;

export async function POST(request: Request) {
  const key = process.env.NVIDIA_API_KEY?.trim();
  if (!key) return NextResponse.json({ error: "NVIDIA_API_KEY is not configured" }, { status: 503 });

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid analysis request" }, { status: 400 });
  const model = process.env.NVIDIA_MODEL?.trim() || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning";
  const input = parsed.data;
  const evidence = JSON.stringify({
    routePath: input.routePath,
    baseline: input.baselineLabel,
    candidate: input.candidateLabel,
    summary: input.deterministicSummary,
    findings: input.deterministicFindings,
  });

  try {
    const upstream = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: [
            { type: "text", text: `Review this route comparison. Deterministic evidence:\n${evidence}` },
            { type: "image_url", image_url: { url: input.baselineImage } },
            { type: "image_url", image_url: { url: input.candidateImage } },
          ] },
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 2200,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(90_000),
    });
    if (!upstream.ok) {
      const detail = (await upstream.text()).slice(0, 400);
      return NextResponse.json({ error: `NVIDIA analysis failed (${upstream.status})`, detail }, { status: 502 });
    }
    const payload = await upstream.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("NVIDIA returned no analysis");
    const analysis = parseAiJson(content);
    return NextResponse.json({ analysis: { ...analysis, model, generatedAt: Date.now() } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to analyze this comparison";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
