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
  return aiResultSchema.parse(JSON.parse(candidate));
}
