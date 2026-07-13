import { describe, expect, it } from "vitest";
import { parseAiJson } from "./ai-analysis";

const valid = {
  executiveSummary: "The candidate replaces the main purchase path and needs product review.",
  beforePurpose: "Explain plans and let a visitor choose one.",
  afterPurpose: "Promote one plan and move the purchase action.",
  verdict: "review",
  confidence: 0.91,
  riskScore: 74,
  userImpacts: ["Returning users may not find the previous action."],
  regressions: [{ title: "Primary action moved", explanation: "The action moved below the fold.", severity: "high" }],
  recommendations: ["Verify the purchase action remains visible at 900px height."],
};

describe("parseAiJson", () => {
  it("accepts fenced structured analysis", () => {
    expect(parseAiJson(`\`\`\`json\n${JSON.stringify(valid)}\n\`\`\``).verdict).toBe("review");
  });

  it("rejects an unbounded risk score", () => {
    expect(() => parseAiJson(JSON.stringify({ ...valid, riskScore: 140 }))).toThrow();
  });

  it("keeps the most important regressions when the model returns too many", () => {
    const regressions = Array.from({ length: 10 }, (_, index) => ({
      title: `Regression ${index + 1}`,
      explanation: `Explanation for regression ${index + 1}.`,
      severity: "medium",
    }));
    expect(parseAiJson(JSON.stringify({ ...valid, regressions })).regressions).toHaveLength(8);
  });
});
