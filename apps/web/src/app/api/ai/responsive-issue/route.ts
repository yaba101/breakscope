import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const requestSchema = z.object({
  url: z.string().url().max(2_000),
  width: z.number().int().min(240).max(3_840),
  screenshot: z.string().startsWith("data:image/").max(8_000_000).optional(),
  issue: z.object({
    title: z.string().max(180),
    description: z.string().max(800),
    type: z.string().max(100),
    selector: z.string().max(1_000),
    routePath: z.string().startsWith("/").max(300),
    failureRanges: z.array(z.object({ min: z.number(), max: z.number() })).max(20),
    measurements: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
  }),
});

const responseSchema = z.object({
  summary: z.string().min(10).max(600),
  likelyCause: z.string().min(10).max(600),
  recommendation: z.string().min(10).max(800),
  codeHint: z.string().max(600).optional(),
  confidence: z.number().min(0).max(1),
});

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : undefined;
}

function textValue(source: JsonObject, keys: string[], max: number) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim().slice(0, max);
  }
  return undefined;
}

function normalizeAnalysis(value: unknown) {
  const root = asObject(value);
  if (!root) return undefined;
  const source = asObject(root.analysis) ?? asObject(root.issueAnalysis) ?? root;
  const confidenceValue = source.confidence;
  const confidence = typeof confidenceValue === "number" ? confidenceValue : typeof confidenceValue === "string" ? Number.parseFloat(confidenceValue) : Number.NaN;
  const normalized = {
    summary: textValue(source, ["summary", "overview", "explanation"], 600),
    likelyCause: textValue(source, ["likelyCause", "likely_cause", "rootCause", "root_cause", "cause"], 600),
    recommendation: textValue(source, ["recommendation", "recommendedFix", "recommended_fix", "fix", "solution"], 800),
    codeHint: textValue(source, ["codeHint", "code_hint", "codeDirection", "code_direction"], 600),
    confidence: Number.isFinite(confidence) ? Math.min(1, Math.max(0, confidence)) : undefined,
  };
  const parsed = responseSchema.safeParse(normalized);
  return parsed.success ? parsed.data : undefined;
}

const systemPrompt = `You are a senior frontend engineer reviewing one responsive UI failure. Use only the supplied screenshot and deterministic measurements. Explain why the issue matters at this exact viewport, identify the most likely CSS or markup cause, and give one concrete repair direction. Do not invent hidden DOM, frameworks, or product behavior. Return only JSON with: summary, likelyCause, recommendation, optional codeHint, confidence (0..1).`;

export async function POST(request: Request) {
  const key = process.env.NVIDIA_API_KEY?.trim();
  if (!key) return NextResponse.json({ error: "AI analysis is unavailable until NVIDIA_API_KEY is configured." }, { status: 503 });

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "The issue evidence could not be analyzed." }, { status: 400 });
  const model = process.env.NVIDIA_MODEL?.trim() || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning";
  const { screenshot, ...evidence } = parsed.data;
  const content: Array<Record<string, unknown>> = [{ type: "text", text: `Review this responsive issue:\n${JSON.stringify(evidence)}` }];
  if (screenshot) content.push({ type: "image_url", image_url: { url: screenshot } });

  try {
    const upstream = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content }],
        temperature: 0.15,
        top_p: 0.9,
        max_tokens: 1_200,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(90_000),
    });
    if (!upstream.ok) return NextResponse.json({ error: `AI analysis failed (${upstream.status}).` }, { status: 502 });
    const payload = await upstream.json() as { choices?: Array<{ message?: { content?: string } }> };
    const raw = payload.choices?.[0]?.message?.content;
    if (!raw) throw new Error("AI returned no analysis.");
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
    const candidate = fenced ?? raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
    const analysis = normalizeAnalysis(JSON.parse(candidate));
    if (!analysis) return NextResponse.json({ error: "The AI response was incomplete. Please try the analysis again." }, { status: 502 });
    return NextResponse.json({ analysis: { ...analysis, model, generatedAt: Date.now() } });
  } catch {
    return NextResponse.json({ error: "The AI explanation could not be generated. Please try again." }, { status: 502 });
  }
}
