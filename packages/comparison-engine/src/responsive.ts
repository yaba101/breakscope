import type { ElementSnapshot, ResponsiveIssue, ResponsiveIssueType, ViewportSample } from "@breakscope/shared";

type Draft = Pick<ResponsiveIssue, "type" | "severity" | "confidence" | "title" | "description" | "routePath" | "selector" | "measurements" | "browserEngine" | "interactionState"> & { width: number; elementRect?: ResponsiveIssue["elementRect"]; elementKey?: string; sourceHint?: ResponsiveIssue["sourceHint"] };
const interactiveRoles = new Set(["button", "link", "textbox", "checkbox", "radio", "combobox", "slider"]);
const detectorLabels: Record<ResponsiveIssueType, string> = {
  overflow: "Horizontal overflow", offscreen: "Control reachability", clipping: "Content clipping", overlap: "Element overlap",
  occlusion: "Sticky content coverage", disappearing: "Responsive visibility", "touch-target": "Touch target size",
  "accessible-name": "Accessible names", "image-alt": "Image alternatives",
  accessibility: "Accessibility audit",
  performance: "Performance diagnostics",
};

function stableFingerprint(type: ResponsiveIssueType, routePath: string, selector: string, elementKey?: string, browserEngine = "chromium", interactionState = "default", documentIdentity?: string) {
  return `${browserEngine}:${interactionState}:${type}:${routePath}:${elementKey || (selector === "html" ? documentIdentity : selector) || "document"}`.toLowerCase().replace(/\s+/g, " ");
}

function draft(type: ResponsiveIssueType, sample: ViewportSample, element: ElementSnapshot | undefined, data: Pick<Draft, "severity" | "confidence" | "title" | "description" | "measurements">): Draft {
  return {
    ...data,
    type,
    routePath: sample.routePath,
    selector: element?.selector ?? "html",
    ...(element ? { elementKey: element.key } : {}),
    ...(element ? { elementRect: element.rect } : {}),
    ...(element?.sourceHint ? { sourceHint: element.sourceHint } : {}),
    width: sample.width,
    browserEngine: sample.browserEngine ?? "chromium",
    interactionState: sample.interactionState,
  };
}

function issuesAt(sample: ViewportSample): Draft[] {
  const issues: Draft[] = [];
  const { snapshot } = sample;
  if (snapshot.performance) {
    const metric = snapshot.performance;
    if (metric.loadMs > 3_000) issues.push(draft("performance", sample, undefined, { severity: metric.loadMs > 6_000 ? "high" : "medium", confidence: 0.96, title: "Page load is slow", description: `The load event completed after ${metric.loadMs}ms in the local browser.`, measurements: { loadMs: metric.loadMs, domContentLoadedMs: metric.domContentLoadedMs, resourceCount: metric.resourceCount } }));
    if (metric.transferBytes > 5_000_000) issues.push(draft("performance", sample, undefined, { severity: metric.transferBytes > 10_000_000 ? "high" : "medium", confidence: 0.98, title: "Page transfers too much data", description: `Resources transferred ${(metric.transferBytes / 1_000_000).toFixed(1)}MB before review.`, measurements: { transferBytes: metric.transferBytes, resourceCount: metric.resourceCount } }));
    if (metric.largestResourceBytes > 1_000_000) issues.push(draft("performance", sample, undefined, { severity: "medium", confidence: 0.98, title: "A resource is unusually large", description: `The largest resource transferred ${(metric.largestResourceBytes / 1_000_000).toFixed(1)}MB.`, measurements: { largestResourceBytes: metric.largestResourceBytes, resource: metric.largestResourceUrl } }));
    if (metric.cumulativeLayoutShift > 0.1) issues.push(draft("performance", sample, undefined, { severity: metric.cumulativeLayoutShift > 0.25 ? "high" : "medium", confidence: 0.9, title: "Page layout shifts while loading", description: `The observed cumulative layout shift was ${metric.cumulativeLayoutShift}.`, measurements: { cumulativeLayoutShift: metric.cumulativeLayoutShift, recommendedMaximum: 0.1 } }));
  }
  for (const violation of snapshot.accessibilityViolations ?? []) for (const node of violation.nodes) {
    const element = snapshot.elements.find((candidate) => candidate.selector === node.selector);
    const severity = violation.impact === "critical" || violation.impact === "serious" ? "high" : violation.impact === "moderate" ? "medium" : "low";
    issues.push(draft("accessibility", sample, element, {
      severity, confidence: 0.99, title: violation.help,
      description: node.failureSummary || `Accessibility rule ${violation.id} failed.`,
      measurements: { rule: violation.id, impact: violation.impact ?? "unknown", wcag: violation.tags.filter((tag) => tag.startsWith("wcag")).join(", "), helpUrl: violation.helpUrl, target: node.selector },
    }));
  }
  if (snapshot.documentWidth > sample.width + 2) {
    issues.push(draft("overflow", sample, undefined, {
      severity: "high", confidence: 0.99, title: "Page creates horizontal scrolling",
      description: `The document is ${snapshot.documentWidth - sample.width}px wider than the viewport.`,
      measurements: { viewportWidth: sample.width, documentWidth: snapshot.documentWidth, overflow: snapshot.documentWidth - sample.width },
    }));
  }

  const visible = snapshot.elements.filter((element) => element.visible);
  for (const element of visible) {
    const interactive = interactiveRoles.has(element.role);
    const right = element.rect.x + element.rect.width;
    if (interactive && (element.rect.x < -2 || right > sample.width + 2)) {
      issues.push(draft("offscreen", sample, element, {
        severity: "high", confidence: 0.98, title: `${element.name || element.role || "Control"} is outside the viewport`,
        description: "An interactive control cannot be fully reached at this width.",
        measurements: { left: element.rect.x, right, viewportWidth: sample.width },
      }));
    }
    if (interactive && (element.rect.width < 44 || element.rect.height < 44)) {
      issues.push(draft("touch-target", sample, element, {
        severity: "medium", confidence: 0.93, title: `${element.name || element.role || "Control"} is difficult to tap`,
        description: "The interactive target is smaller than 44×44px.",
        measurements: { width: element.rect.width, height: element.rect.height, minimum: 44 },
      }));
    }
    const clippedX = element.geometry && element.geometry.scrollWidth > element.geometry.clientWidth + 2 && ["hidden", "clip"].includes(element.styles.overflowX ?? "");
    const clippedY = element.geometry && element.geometry.scrollHeight > element.geometry.clientHeight + 2 && ["hidden", "clip"].includes(element.styles.overflowY ?? "");
    if ((clippedX || clippedY) && (interactive || Boolean(element.text))) {
      issues.push(draft("clipping", sample, element, {
        severity: interactive ? "high" : "medium", confidence: 0.96, title: `${element.name || element.tag} content is clipped`,
        description: "Visible content exceeds a container that hides its overflow.",
        measurements: { clientWidth: element.geometry!.clientWidth, scrollWidth: element.geometry!.scrollWidth, clientHeight: element.geometry!.clientHeight, scrollHeight: element.geometry!.scrollHeight },
      }));
    }
    if (interactive && !element.name) {
      issues.push(draft("accessible-name", sample, element, {
        severity: "medium", confidence: 0.99, title: "Interactive control has no accessible name",
        description: "Assistive technology cannot identify this control.", measurements: { role: element.role },
      }));
    }
    if (element.role === "img" && !element.attributes.alt && !element.attributes.ariaLabel) {
      issues.push(draft("image-alt", sample, element, {
        severity: "medium", confidence: 0.99, title: "Image has no text alternative",
        description: "The image is not described for assistive technology.", measurements: { tag: element.tag },
      }));
    }
  }

  const byParent = new Map<string, ElementSnapshot[]>();
  for (const element of visible.filter((item) => (interactiveRoles.has(item.role) || Boolean(item.text)) && item.rect.width > 4 && item.rect.height > 4)) {
    const siblings = byParent.get(element.parentKey ?? "") ?? [];
    siblings.push(element);
    byParent.set(element.parentKey ?? "", siblings);
  }
  for (const siblings of byParent.values()) {
    for (let a = 0; a < Math.min(siblings.length, 40); a += 1) for (let b = a + 1; b < Math.min(siblings.length, 40); b += 1) {
      const first = siblings[a]!;
      const second = siblings[b]!;
      if ([first.styles.position, second.styles.position].includes("fixed")) continue;
      const x = Math.max(0, Math.min(first.rect.x + first.rect.width, second.rect.x + second.rect.width) - Math.max(first.rect.x, second.rect.x));
      const y = Math.max(0, Math.min(first.rect.y + first.rect.height, second.rect.y + second.rect.height) - Math.max(first.rect.y, second.rect.y));
      const overlap = x * y;
      const smaller = Math.min(first.rect.width * first.rect.height, second.rect.width * second.rect.height);
      const ratio = overlap / Math.max(1, smaller);
      const interactivePair = interactiveRoles.has(first.role) || interactiveRoles.has(second.role);
      const normalFlowText = Boolean(first.text && second.text) && !["absolute", "sticky"].includes(first.styles.position) && !["absolute", "sticky"].includes(second.styles.position);
      if (x > 8 && y > 8 && ratio > (interactivePair ? 0.2 : 0.4) && (interactivePair || normalFlowText)) {
        issues.push(draft("overlap", sample, second, {
          severity: interactiveRoles.has(first.role) || interactiveRoles.has(second.role) ? "high" : "medium", confidence: 0.9,
          title: `${first.name || first.tag} overlaps ${second.name || second.tag}`,
          description: "Sibling content occupies the same visible space.", measurements: { overlapWidth: Math.round(x), overlapHeight: Math.round(y), overlapRatio: Math.round(ratio * 100) },
        }));
      }
    }
  }
  const overlays = visible.filter((element) => ["fixed", "sticky"].includes(element.styles.position) && element.rect.width > 40 && element.rect.height > 20);
  const elementByKey = new Map(snapshot.elements.map((element) => [element.key, element]));
  const contains = (ancestor: ElementSnapshot, descendant: ElementSnapshot) => {
    let parentKey = descendant.parentKey;
    const visited = new Set<string>();
    while (parentKey && !visited.has(parentKey)) {
      if (parentKey === ancestor.key) return true;
      visited.add(parentKey);
      parentKey = elementByKey.get(parentKey)?.parentKey;
    }
    return false;
  };
  for (const overlay of overlays) for (const target of visible.filter((element) => interactiveRoles.has(element.role) && element.key !== overlay.key)) {
    // A link inside a sticky header naturally occupies the same pixels as its
    // container. Containment is not occlusion; only unrelated layers can cover it.
    if (contains(overlay, target) || contains(target, overlay)) continue;
    const x = Math.max(0, Math.min(overlay.rect.x + overlay.rect.width, target.rect.x + target.rect.width) - Math.max(overlay.rect.x, target.rect.x));
    const y = Math.max(0, Math.min(overlay.rect.y + overlay.rect.height, target.rect.y + target.rect.height) - Math.max(overlay.rect.y, target.rect.y));
    const ratio = x * y / Math.max(1, target.rect.width * target.rect.height);
    if (ratio > 0.35) issues.push(draft("occlusion", sample, target, {
      severity: "high", confidence: 0.94, title: `${target.name || target.role} is covered by sticky content`,
      description: "A fixed or sticky element obscures an interactive control.", measurements: { coveredPercent: Math.round(ratio * 100), overlay: overlay.selector },
    }));
  }
  return issues;
}

function disappearingDrafts(samples: ViewportSample[]): Draft[] {
  const drafts: Draft[] = [];
  const byRoute = new Map<string, ViewportSample[]>();
  for (const sample of samples.filter((item) => !item.interactionState)) {
    const key = `${sample.browserEngine ?? "chromium"}:${sample.routePath}`;
    byRoute.set(key, [...(byRoute.get(key) ?? []), sample]);
  }
  for (const [, routeSamples] of byRoute) {
    const routePath = routeSamples[0]!.routePath;
    const browserEngine = routeSamples[0]!.browserEngine ?? "chromium";
    const ordered = routeSamples.sort((a, b) => a.width - b.width);
    const controls = new Map<string, ElementSnapshot>();
    for (const sample of ordered) for (const element of sample.snapshot.elements) {
      if (interactiveRoles.has(element.role) && element.name) controls.set(element.key, element);
    }
    for (const [key, reference] of controls) {
      const states = ordered.map((sample) => ({ sample, visible: sample.snapshot.elements.some((element) => element.key === key && element.visible) }));
      if (!states.some((state) => state.visible) || !states.some((state) => !state.visible)) continue;
      for (const state of states.filter((item) => !item.visible)) drafts.push({
        type: "disappearing", routePath, selector: reference.selector, elementKey: reference.key, width: state.sample.width, browserEngine,
        elementRect: reference.rect, severity: "high", confidence: 0.95,
        title: `${reference.name} disappears at some widths`, description: "An interactive control is available at other tested widths but unavailable here.",
        measurements: { role: reference.role, accessibleName: reference.name },
      });
    }
  }
  return drafts;
}

function failureRanges(widths: number[], failing: Set<number>) {
  const ranges: Array<{ min: number; max: number }> = [];
  let current: { min: number; max: number } | undefined;
  for (const width of widths) {
    if (failing.has(width)) {
      if (!current) current = { min: width, max: width };
      else current.max = width;
    } else if (current) { ranges.push(current); current = undefined; }
  }
  if (current) ranges.push(current);
  return ranges;
}

export function analyzeResponsiveSamples(samples: ViewportSample[], previousFingerprints: string[] = []) {
  const sorted = [...samples].sort((a, b) => a.width - b.width);
  const drafts = [...sorted.flatMap(issuesAt), ...disappearingDrafts(sorted)];
  const grouped = new Map<string, Draft[]>();
  for (const item of drafts) {
    const fingerprint = stableFingerprint(item.type, item.routePath, item.selector, item.elementKey, item.browserEngine, item.interactionState, String(item.measurements.rule ?? item.title));
    grouped.set(fingerprint, [...(grouped.get(fingerprint) ?? []), item]);
  }
  const issues = [...grouped.entries()].map(([fingerprint, group], index): ResponsiveIssue => {
    const ordered = [...group].sort((a, b) => a.width - b.width);
    const evidence = ordered[0]!;
    const failing = new Set(ordered.map((item) => item.width));
    const routeWidths = sorted.filter((sample) => sample.routePath === evidence.routePath && (sample.browserEngine ?? "chromium") === (evidence.browserEngine ?? "chromium") && (sample.interactionState ?? "default") === (evidence.interactionState ?? "default")).map((sample) => sample.width);
    const working = routeWidths.filter((width) => !failing.has(width));
    const closestWorking = [...working].sort((a, b) => Math.abs(a - evidence.width) - Math.abs(b - evidence.width))[0];
    const ranges = failureRanges(routeWidths, failing);
    const { elementRect, elementKey, sourceHint, width: _width, ...evidenceData } = evidence;
    return {
      ...evidenceData,
      ...(elementRect === undefined ? {} : { elementRect }),
      ...(elementKey === undefined ? {} : { elementKey }),
      ...(sourceHint === undefined ? {} : { sourceHint }),
      id: `issue-${index + 1}`,
      fingerprint,
      minFailWidth: ordered[0]!.width,
      maxFailWidth: ordered.at(-1)!.width,
      failureRanges: ranges,
      evidenceWidth: evidence.width,
      ...(closestWorking === undefined ? {} : { lastWorkingWidth: closestWorking }),
      verification: previousFingerprints.includes(fingerprint) ? "still-broken" : "new",
    };
  }).sort((a, b) => {
    const severity = { high: 3, medium: 2, low: 1 };
    return (severity[b.severity] * b.confidence * (b.maxFailWidth - b.minFailWidth + 1)) - (severity[a.severity] * a.confidence * (a.maxFailWidth - a.minFailWidth + 1));
  });
  const checks = (Object.keys(detectorLabels) as ResponsiveIssueType[]).map((type) => {
    const issueCount = issues.filter((issue) => issue.type === type).length;
    return { type, label: detectorLabels[type], status: issueCount ? "failed" as const : "passed" as const, issueCount };
  });
  return { issues, suppressedCount: 0, allIssues: issues, checks };
}
