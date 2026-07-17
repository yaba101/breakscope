import { describe, expect, it } from "vitest";
import type { ElementSnapshot, PageSnapshot } from "@breakscope/shared";
import { comparePageSnapshots } from "./semantic";

function element(input: Partial<ElementSnapshot> & Pick<ElementSnapshot, "key" | "tag" | "role" | "name">): ElementSnapshot {
  return {
    order: 0,
    text: input.name,
    selector: input.key,
    visible: true,
    inViewport: true,
    rect: { x: 20, y: 20, width: 240, height: 48 },
    attributes: { id: "", testId: "", href: "", type: "", alt: "", placeholder: "", ariaLabel: "" },
    styles: { display: "block", position: "static", color: "rgb(0, 0, 0)", backgroundColor: "rgba(0, 0, 0, 0)", fontSize: "16px", fontWeight: "400", borderRadius: "0px" },
    ...input,
  };
}

function snapshot(elements: ElementSnapshot[], input: Partial<PageSnapshot> = {}): PageSnapshot {
  return {
    url: "https://example.com/experts",
    title: "Experts",
    language: "en",
    viewportWidth: 1440,
    viewportHeight: 900,
    documentWidth: 1440,
    documentHeight: 900,
    capturedAt: 1,
    elements,
    ...input,
  };
}

describe("comparePageSnapshots", () => {
  it("describes a page redesign using interface meaning", () => {
    const baseline = snapshot([
      element({ key: "h1", tag: "h1", role: "heading", name: "Who we work with" }),
      element({ key: "business", tag: "a", role: "link", name: "Business", attributes: { id: "", testId: "", href: "/business", type: "", alt: "", placeholder: "", ariaLabel: "" } }),
      element({ key: "intro", tag: "section", role: "region", name: "Introduction" }),
      element({ key: "services", tag: "section", role: "region", name: "What do you offer?" }),
      element({ key: "footer", tag: "footer", role: "contentinfo", name: "Company" }),
      element({ key: "feedback", tag: "button", role: "button", name: "Give feedback" }),
    ]);
    const candidate = snapshot([
      element({ key: "h1", tag: "h1", role: "heading", name: "What do you need help with?" }),
      element({ key: "experts", tag: "a", role: "link", name: "Experts", attributes: { id: "", testId: "", href: "/experts", type: "", alt: "", placeholder: "", ariaLabel: "" } }),
      element({ key: "search", tag: "input", role: "textbox", name: "Search advisors" }),
      element({ key: "filters", tag: "select", role: "combobox", name: "Countries" }),
      element({ key: "cards", tag: "section", role: "region", name: "Expert directory" }),
      element({ key: "footer", tag: "footer", role: "contentinfo", name: "Company" }),
      element({ key: "feedback", tag: "button", role: "button", name: "Give feedback" }),
    ]);

    const result = comparePageSnapshots(baseline, candidate, { changedRatio: 0.62 });
    expect(result.summary.level).toBe("major");
    expect(result.summary.riskScore).toBeGreaterThan(60);
    expect(result.findings.some((finding) => finding.title === "Major page redesign detected")).toBe(true);
    expect(result.findings.some((finding) => finding.title === "Primary page heading changed")).toBe(true);
    expect(result.findings.some((finding) => finding.title.includes("textbox added"))).toBe(true);
  });

  it("reports movement and resizing with exact evidence", () => {
    const baselineButton = element({ key: "id:checkout", tag: "button", role: "button", name: "Checkout", attributes: { id: "checkout", testId: "", href: "", type: "button", alt: "", placeholder: "", ariaLabel: "" }, rect: { x: 20, y: 20, width: 160, height: 44 } });
    const candidateButton = element({ ...baselineButton, rect: { x: 280, y: 90, width: 240, height: 60 } });
    const result = comparePageSnapshots(snapshot([baselineButton]), snapshot([candidateButton]));
    expect(result.findings.some((finding) => finding.changeType === "moved" && finding.candidate?.key === "id:checkout")).toBe(true);
    expect(result.findings.some((finding) => finding.changeType === "resized")).toBe(true);
  });

  it("does not invent findings for identical snapshots", () => {
    const heading = element({ key: "id:title", tag: "h1", role: "heading", name: "Dashboard", attributes: { id: "title", testId: "", href: "", type: "", alt: "", placeholder: "", ariaLabel: "" } });
    const result = comparePageSnapshots(snapshot([heading]), snapshot([heading]));
    expect(result.findings).toEqual([]);
    expect(result.summary.level).toBe("unchanged");
  });
});
