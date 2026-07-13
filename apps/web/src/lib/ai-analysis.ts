import { z } from "zod";

export const aiResultSchema = z.object({
  executiveSummary: z.string().min(10).max(800),
  beforePurpose: z.string().min(3).max(300),
  afterPurpose: z.string().min(3).max(300),
  verdict: z.enum(["safe", "review", "block"]),
  confidence: z.number().min(0).max(1),
  riskScore: z.number().min(0).max(100),
  userImpacts: z.array(z.string().min(3).max(300)).max(6),
  regressions: z.array(z.object({
    title: z.string().min(3).max(140),
    explanation: z.string().min(3).max(500),
    severity: z.enum(["high", "medium", "low"]),
  })).max(8),
  recommendations: z.array(z.string().min(3).max(300)).max(6),
});

export function parseAiJson(content: string) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced ?? content.slice(content.indexOf("{"), content.lastIndexOf("}") + 1);
  const raw = JSON.parse(candidate) as unknown;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("NVIDIA returned an invalid analysis object");
  }
  const result = raw as Record<string, unknown>;
  return aiResultSchema.parse({
    ...result,
    userImpacts: Array.isArray(result.userImpacts) ? result.userImpacts.slice(0, 6) : result.userImpacts,
    regressions: Array.isArray(result.regressions) ? result.regressions.slice(0, 8) : result.regressions,
    recommendations: Array.isArray(result.recommendations) ? result.recommendations.slice(0, 6) : result.recommendations,
  });
}
