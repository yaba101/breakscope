import { describe, expect, it } from "vitest";
import type { ElementSnapshot, PageSnapshot, ViewportSample } from "@breakscope/shared";
import { analyzeResponsiveSamples } from "./responsive";

function sample(width: number, documentWidth = width, elements: ElementSnapshot[] = []): ViewportSample {
  const snapshot: PageSnapshot = { url: "http://localhost", title: "Test", language: "en", viewportWidth: width, viewportHeight: 900, documentWidth, documentHeight: 900, capturedAt: 1, elements };
  return { routePath: "/", width, height: 900, snapshot };
}

function button(visible: boolean): ElementSnapshot {
  return { key: "testid:checkout", order: 0, tag: "button", role: "button", name: "Checkout", text: "Checkout", selector: "[data-testid=checkout]", parentKey: "main", visible, inViewport: visible, rect: { x: 20, y: 20, width: 100, height: 48 }, attributes: { id: "", testId: "checkout", href: "", type: "button", alt: "", placeholder: "", ariaLabel: "" }, styles: { display: visible ? "block" : "none", position: "static", color: "", backgroundColor: "", fontSize: "16px", fontWeight: "400", borderRadius: "0" }, geometry: { clientWidth: 100, clientHeight: 48, scrollWidth: 100, scrollHeight: 48 } };
}

describe("analyzeResponsiveSamples", () => {
  it("groups repeated overflow and reports the failure range", () => {
    const result = analyzeResponsiveSamples([sample(320, 360), sample(390, 430), sample(768)]);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({ type: "overflow", minFailWidth: 320, maxFailWidth: 390, lastWorkingWidth: 768 });
    expect(result.checks.find((check) => check.type === "overflow")?.status).toBe("failed");
  });

  it("marks a repeated fingerprint as still broken", () => {
    const first = analyzeResponsiveSamples([sample(320, 360)]).issues[0]!;
    expect(analyzeResponsiveSamples([sample(320, 360)], [first.fingerprint]).issues[0]?.verification).toBe("still-broken");
  });

  it("keeps separate middle-band failure ranges", () => {
    const result = analyzeResponsiveSamples([sample(320), sample(500, 540), sample(700)]);
    expect(result.issues[0]?.failureRanges).toEqual([{ min: 500, max: 500 }]);
  });

  it("detects an important control that disappears", () => {
    const result = analyzeResponsiveSamples([sample(390, 390, [button(true)]), sample(768, 768, [button(false)])]);
    expect(result.allIssues.some((issue) => issue.type === "disappearing" && issue.elementKey === "testid:checkout")).toBe(true);
  });

  it("does not treat controls inside sticky containers as occluded", () => {
    const nav: ElementSnapshot = { ...button(true), key: "nav", tag: "nav", role: "navigation", name: "", selector: "nav", parentKey: "body", rect: { x: 0, y: 0, width: 320, height: 64 }, styles: { ...button(true).styles, position: "sticky" } };
    const link: ElementSnapshot = { ...button(true), key: "nav-link", tag: "a", role: "link", name: "Home", selector: "nav > a", parentKey: "nav", rect: { x: 12, y: 8, width: 80, height: 48 } };
    const result = analyzeResponsiveSamples([sample(320, 320, [nav, link])]);
    expect(result.allIssues.some((issue) => issue.type === "occlusion")).toBe(false);
  });

  it("returns the complete prioritized inventory instead of truncating findings", () => {
    const controls = Array.from({ length: 5 }, (_, index): ElementSnapshot => ({
      ...button(true), key: `button:${index}`, name: `Action ${index}`, selector: `main > button:nth-of-type(${index + 1})`, rect: { x: 12, y: index * 60, width: 32, height: 32 },
    }));
    const result = analyzeResponsiveSamples([sample(390, 390, controls)]);
    expect(result.issues).toHaveLength(5);
    expect(result.suppressedCount).toBe(0);
  });
});
