import type { ElementSnapshot, PageSnapshot } from "@uirift/shared";

export interface AccessibilityFinding {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  remediation: string;
  selector: string;
  element?: ElementSnapshot;
}

const interactiveRoles = new Set(["button", "link", "textbox", "combobox", "checkbox", "radio", "switch"]);

export function analyzeSnapshotAccessibility(baseline?: PageSnapshot, candidate?: PageSnapshot): AccessibilityFinding[] {
  if (!candidate) return [];
  const findings: AccessibilityFinding[] = [];
  const baselineByKey = new Map(baseline?.elements.map((element) => [element.key, element]) ?? []);

  for (const element of candidate.elements) {
    if (!element.visible) continue;
    const name = element.name.trim() || element.attributes.ariaLabel.trim() || element.attributes.alt.trim();
    if (interactiveRoles.has(element.role) && !name) {
      findings.push({
        id: `name-${element.key}`,
        severity: "high",
        title: `${element.role || element.tag} has no accessible name`,
        description: "Screen-reader and voice-control users may not know what this control does.",
        remediation: "Add visible text or an accurate aria-label and verify it in the accessibility tree.",
        selector: element.selector,
        element,
      });
    }
    if (element.tag === "img" && !element.attributes.alt.trim() && !element.name.trim()) {
      findings.push({
        id: `alt-${element.key}`,
        severity: "medium",
        title: "Image has no alternative text",
        description: "The image meaning is unavailable to non-visual users.",
        remediation: "Add useful alt text, or alt=\"\" when the image is purely decorative.",
        selector: element.selector,
        element,
      });
    }
    const previous = baselineByKey.get(element.key);
    if (previous?.visible && previous.role && element.role && previous.role !== element.role) {
      findings.push({
        id: `role-${element.key}`,
        severity: "medium",
        title: `Role changed from ${previous.role} to ${element.role}`,
        description: "The control may announce or behave differently for assistive technology.",
        remediation: "Confirm the new semantic role matches the interaction and keyboard behavior.",
        selector: element.selector,
        element,
      });
    }
  }

  return findings.slice(0, 20);
}
