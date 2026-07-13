import { describe, expect, it } from "vitest";
import type { ElementSnapshot, PageSnapshot } from "@uirift/shared";
import { analyzeSnapshotAccessibility } from "./accessibility-analysis";

const element = (overrides: Partial<ElementSnapshot>): ElementSnapshot => ({
  key: "button:1", order: 1, tag: "button", role: "button", name: "", text: "", selector: "button.icon", visible: true, inViewport: true,
  rect: { x: 10, y: 10, width: 40, height: 40 },
  attributes: { id: "", testId: "", href: "", type: "button", alt: "", placeholder: "", ariaLabel: "" },
  styles: { display: "block", position: "static", color: "rgb(0, 0, 0)", backgroundColor: "transparent", fontSize: "16px", fontWeight: "400", borderRadius: "0px" },
  ...overrides,
});
const snapshot = (elements: ElementSnapshot[]): PageSnapshot => ({ url: "https://example.com", title: "Test", language: "en", viewportWidth: 1440, viewportHeight: 900, documentWidth: 1440, documentHeight: 1200, capturedAt: 1, elements });

describe("analyzeSnapshotAccessibility", () => {
  it("reports an unnamed interactive control with actionable remediation", () => {
    const findings = analyzeSnapshotAccessibility(undefined, snapshot([element({})]));
    expect(findings[0]).toMatchObject({ severity: "high", selector: "button.icon" });
    expect(findings[0]?.remediation).toContain("aria-label");
  });

  it("does not flag a named control", () => {
    expect(analyzeSnapshotAccessibility(undefined, snapshot([element({ name: "Open menu" })]))).toEqual([]);
  });
});
