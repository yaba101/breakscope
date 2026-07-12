import { describe, expect, it } from "vitest";
import { compareRgba } from "./index";

describe("compareRgba", () => {
  it("detects a changed pixel", () => {
    const baseline = new Uint8ClampedArray([255, 255, 255, 255, 255, 255, 255, 255]);
    const candidate = new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255]);
    const result = compareRgba(baseline, candidate, 2, 1);
    expect(result.changedPixels).toBe(1);
    expect(result.changedRatio).toBe(0.5);
  });
});
