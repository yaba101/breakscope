import type {
  ElementSnapshot,
  PageSnapshot,
  SemanticCategory,
  SemanticEvidence,
  SemanticFinding,
  SemanticSummary,
} from "@uirift/shared";

interface SemanticComparisonOptions {
  changedRatio?: number;
  maxFindings?: number;
}

interface ElementMatch {
  baseline: ElementSnapshot;
  candidate: ElementSnapshot;
  score: number;
}

type FindingDraft = Omit<SemanticFinding, "id">;

const severityWeight = { high: 3, medium: 2, low: 1 } as const;

function normalized(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim();
}

function tokens(value: string) {
  return new Set(normalized(value).split(" ").filter((token) => token.length > 1));
}

function similarity(left: string, right: string) {
  const a = tokens(left);
  const b = tokens(right);
  if (!a.size && !b.size) return 1;
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  return intersection / new Set([...a, ...b]).size;
}

function elementLabel(element: ElementSnapshot) {
  return element.name || element.text || element.attributes.alt || element.role || element.tag;
}

function isMeaningful(element: ElementSnapshot) {
  if (element.attributes.testId || element.attributes.id || element.role) return true;
  if (["section", "article"].includes(element.tag)) return Boolean(element.name || element.text) && element.text.length < 220;
  return ["p", "li", "label"].includes(element.tag) && Boolean(element.text);
}

function matchScore(baseline: ElementSnapshot, candidate: ElementSnapshot) {
  if (baseline.key === candidate.key) return 1;
  if (baseline.attributes.testId && baseline.attributes.testId === candidate.attributes.testId) return 0.99;
  if (baseline.attributes.id && baseline.attributes.id === candidate.attributes.id) return 0.98;

  let score = 0;
  if (baseline.role && baseline.role === candidate.role) score += 0.2;
  if (baseline.tag === candidate.tag) score += 0.12;
  if (baseline.attributes.href && baseline.attributes.href === candidate.attributes.href) score += 0.48;
  if (baseline.name && candidate.name) score += normalized(baseline.name) === normalized(candidate.name) ? 0.55 : similarity(baseline.name, candidate.name) * 0.36;
  if (baseline.text && candidate.text) score += normalized(baseline.text) === normalized(candidate.text) ? 0.42 : similarity(baseline.text, candidate.text) * 0.24;
  if (baseline.selector === candidate.selector) score += 0.36;
  if (Math.abs(baseline.order - candidate.order) <= 2) score += 0.04;
  return Math.min(1, score);
}

function matchElements(baseline: ElementSnapshot[], candidate: ElementSnapshot[]) {
  const candidates = candidate.filter(isMeaningful);
  const used = new Set<string>();
  const matches: ElementMatch[] = [];
  const removed: ElementSnapshot[] = [];

  for (const source of baseline.filter(isMeaningful)) {
    const best = candidates
      .filter((target) => !used.has(target.key))
      .map((target) => ({ target, score: matchScore(source, target) }))
      .sort((left, right) => right.score - left.score)[0];
    if (!best || best.score < 0.62) {
      removed.push(source);
      continue;
    }
    used.add(best.target.key);
    matches.push({ baseline: source, candidate: best.target, score: best.score });
  }

  return {
    matches,
    removed,
    added: candidates.filter((element) => !used.has(element.key)),
  };
}

function evidence(element: ElementSnapshot): SemanticEvidence {
  return {
    key: element.key,
    selector: element.selector,
    role: element.role,
    name: element.name,
    text: element.text,
    inViewport: element.inViewport,
    rect: element.rect,
  };
}

function categoryFor(element: ElementSnapshot): SemanticCategory {
  if (element.role === "link" || element.role === "navigation" || element.attributes.href) return "navigation";
  if (["heading", "button", "textbox", "img"].includes(element.role) || ["p", "li", "label"].includes(element.tag)) return "content";
  return "layout";
}

function structuralSeverity(element: ElementSnapshot) {
  if (element.tag === "h1" || element.role === "main" || element.role === "navigation") return "high" as const;
  if (["heading", "button", "link", "textbox"].includes(element.role)) return "medium" as const;
  return "low" as const;
}

function impactFor(category: SemanticCategory, change: "added" | "removed" | "changed") {
  if (category === "navigation") return change === "removed" ? "Users may lose a navigation path or destination." : "Users may encounter a different navigation path or destination.";
  if (category === "content") return change === "removed" ? "Previously available information or an action may no longer be discoverable." : "The page's message or available action has changed.";
  if (category === "visibility") return "Users may be unable to see or interact with this element.";
  if (category === "layout") return "The visual hierarchy or interaction position has changed.";
  return "The visual presentation has changed and may require design review.";
}

function additionOrRemoval(element: ElementSnapshot, changeType: "added" | "removed"): FindingDraft {
  const category = categoryFor(element);
  const label = elementLabel(element);
  const quoted = label ? `“${label.slice(0, 100)}”` : element.tag;
  return {
    changeType,
    category,
    title: `${element.role || element.tag} ${changeType}: ${quoted}`,
    description: `${quoted} was ${changeType === "added" ? "introduced in the candidate" : "present in the baseline but is no longer available"}.`,
    impact: impactFor(category, changeType),
    severity: structuralSeverity(element),
    confidence: element.attributes.id || element.attributes.testId ? 0.99 : element.name ? 0.9 : 0.78,
    ...(changeType === "added" ? { candidate: evidence(element) } : { baseline: evidence(element) }),
  };
}

function pagePurpose(snapshot: PageSnapshot) {
  return snapshot.elements.find((element) => element.tag === "h1" && element.visible)?.text ||
    snapshot.elements.find((element) => element.role === "heading" && element.visible)?.text || snapshot.title;
}

function matchedFindings(match: ElementMatch) {
  const findings: FindingDraft[] = [];
  const { baseline, candidate } = match;
  const before = elementLabel(baseline);
  const after = elementLabel(candidate);
  const sharedEvidence = { baseline: evidence(baseline), candidate: evidence(candidate) };

  if (baseline.visible !== candidate.visible) {
    findings.push({
      changeType: "visibility",
      category: "visibility",
      title: `${before || baseline.role || baseline.tag} became ${candidate.visible ? "visible" : "hidden"}`,
      description: `Visibility changed from ${baseline.visible ? "visible" : "hidden"} to ${candidate.visible ? "visible" : "hidden"}.`,
      impact: impactFor("visibility", "changed"),
      severity: structuralSeverity(candidate),
      confidence: match.score,
      ...sharedEvidence,
    });
    return findings;
  }

  const textChanged = before && after && normalized(before) !== normalized(after) && similarity(before, after) < 0.92;
  const textBearing = ["heading", "button", "link", "textbox", "img"].includes(baseline.role) || ["p", "li", "label"].includes(baseline.tag);
  if (textChanged && textBearing) {
    const primaryHeading = baseline.tag === "h1" || candidate.tag === "h1";
    findings.push({
      changeType: "text",
      category: categoryFor(candidate),
      title: primaryHeading ? "Primary page heading changed" : `${candidate.role || candidate.tag} content changed`,
      description: `Changed from “${before.slice(0, 120)}” to “${after.slice(0, 120)}”.`,
      impact: primaryHeading ? "The page's primary purpose or message may have changed." : impactFor(categoryFor(candidate), "changed"),
      severity: primaryHeading ? "high" : ["button", "link"].includes(candidate.role) ? "medium" : "low",
      confidence: match.score,
      ...sharedEvidence,
    });
  }

  if (baseline.visible && candidate.visible) {
    const dx = candidate.rect.x - baseline.rect.x;
    const dy = candidate.rect.y - baseline.rect.y;
    const moved = Math.abs(dx) > Math.max(12, baseline.rect.width * 0.08) || Math.abs(dy) > Math.max(12, baseline.rect.height * 0.3);
    if (moved) {
      findings.push({
        changeType: "moved",
        category: "layout",
        title: `${after || candidate.role || candidate.tag} moved`,
        description: `Position changed by ${Math.round(dx)}px horizontally and ${Math.round(dy)}px vertically.`,
        impact: impactFor("layout", "changed"),
        severity: Math.abs(dx) + Math.abs(dy) > 120 ? "medium" : "low",
        confidence: match.score,
        ...sharedEvidence,
      });
    }

    const widthDelta = candidate.rect.width - baseline.rect.width;
    const heightDelta = candidate.rect.height - baseline.rect.height;
    const widthRatio = Math.abs(widthDelta) / Math.max(1, baseline.rect.width);
    const heightRatio = Math.abs(heightDelta) / Math.max(1, baseline.rect.height);
    if ((Math.abs(widthDelta) > 10 && widthRatio > 0.12) || (Math.abs(heightDelta) > 10 && heightRatio > 0.12)) {
      findings.push({
        changeType: "resized",
        category: "layout",
        title: `${after || candidate.role || candidate.tag} resized`,
        description: `Size changed from ${Math.round(baseline.rect.width)}×${Math.round(baseline.rect.height)}px to ${Math.round(candidate.rect.width)}×${Math.round(candidate.rect.height)}px.`,
        impact: "Content density, wrapping, or surrounding alignment may be affected.",
        severity: Math.max(widthRatio, heightRatio) > 0.4 ? "medium" : "low",
        confidence: match.score,
        ...sharedEvidence,
      });
    }
  }

  const changedStyles = (Object.keys(baseline.styles) as Array<keyof ElementSnapshot["styles"]>)
    .filter((key) => baseline.styles[key] !== candidate.styles[key]);
  const importantStyleChange = changedStyles.filter((key) => ["color", "backgroundColor", "fontSize", "fontWeight"].includes(key));
  if (importantStyleChange.length >= 2 && (candidate.role || candidate.attributes.id || candidate.attributes.testId)) {
    findings.push({
      changeType: "style",
      category: "style",
      title: `${after || candidate.role || candidate.tag} styling changed`,
      description: `Changed ${importantStyleChange.join(", ")}.`,
      impact: impactFor("style", "changed"),
      severity: "low",
      confidence: match.score,
      ...sharedEvidence,
    });
  }
  return findings;
}

export function comparePageSnapshots(
  baseline: PageSnapshot,
  candidate: PageSnapshot,
  options: SemanticComparisonOptions = {},
) {
  const { matches, removed, added } = matchElements(baseline.elements, candidate.elements);
  const meaningfulBaseline = baseline.elements.filter(isMeaningful).length;
  const meaningfulCandidate = candidate.elements.filter(isMeaningful).length;
  const matchRate = matches.length / Math.max(1, meaningfulBaseline, meaningfulCandidate);
  const drafts: FindingDraft[] = [];
  const baselinePurpose = pagePurpose(baseline);
  const candidatePurpose = pagePurpose(candidate);
  const purposeChanged = baselinePurpose && candidatePurpose && normalized(baselinePurpose) !== normalized(candidatePurpose);
  const changedRatio = options.changedRatio ?? 0;
  const majorStructureChange = (Math.max(meaningfulBaseline, meaningfulCandidate) >= 6 && matchRate < 0.55) || changedRatio > 0.45;

  if (majorStructureChange || purposeChanged) {
    drafts.push({
      changeType: "page",
      category: "page",
      title: majorStructureChange ? "Major page redesign detected" : "Page purpose changed",
      description: purposeChanged
        ? `The primary page message changed from “${baselinePurpose.slice(0, 140)}” to “${candidatePurpose.slice(0, 140)}”.`
        : `Only ${Math.round(matchRate * 100)}% of meaningful interface elements could be matched between versions.`,
      impact: "The page's information architecture or primary user journey may have changed and requires review.",
      severity: "high",
      confidence: Math.max(0.72, Math.min(0.98, 1 - matchRate + 0.25)),
    });
  }

  if (baseline.title !== candidate.title) {
    drafts.push({
      changeType: "text",
      category: "page",
      title: "Document title changed",
      description: `Changed from “${baseline.title}” to “${candidate.title}”.`,
      impact: "Browser tabs, bookmarks, and search result labels may change.",
      severity: "medium",
      confidence: 1,
    });
  }

  const heightRatio = Math.abs(candidate.documentHeight - baseline.documentHeight) / Math.max(1, baseline.documentHeight);
  if (heightRatio > 0.15) {
    drafts.push({
      changeType: "resized",
      category: "page",
      title: "Page length changed significantly",
      description: `Document height changed from ${baseline.documentHeight}px to ${candidate.documentHeight}px (${Math.round(heightRatio * 100)}%).`,
      impact: "Sections may have been added, removed, or substantially rearranged below the fold.",
      severity: heightRatio > 0.4 ? "high" : "medium",
      confidence: 1,
    });
  }

  drafts.push(...removed.map((element) => additionOrRemoval(element, "removed")));
  drafts.push(...added.map((element) => additionOrRemoval(element, "added")));
  for (const match of matches) drafts.push(...matchedFindings(match));

  const categoryOrder: Record<SemanticCategory, number> = { page: 0, navigation: 1, content: 2, visibility: 3, layout: 4, style: 5 };
  const findings = drafts
    .sort((left, right) => severityWeight[right.severity] - severityWeight[left.severity] || categoryOrder[left.category] - categoryOrder[right.category] || right.confidence - left.confidence)
    .slice(0, options.maxFindings ?? 30)
    .map((finding, index): SemanticFinding => ({ ...finding, id: `semantic-${index + 1}` }));

  const counts = {
    high: findings.filter((finding) => finding.severity === "high").length,
    medium: findings.filter((finding) => finding.severity === "medium").length,
    low: findings.filter((finding) => finding.severity === "low").length,
    added: findings.filter((finding) => finding.changeType === "added").length,
    removed: findings.filter((finding) => finding.changeType === "removed").length,
    content: findings.filter((finding) => finding.category === "content" || finding.category === "navigation").length,
    layout: findings.filter((finding) => finding.category === "layout").length,
    style: findings.filter((finding) => finding.category === "style").length,
  };
  const riskScore = Math.min(100, Math.round(counts.high * 18 + counts.medium * 7 + counts.low * 2 + (1 - matchRate) * 22 + Math.min(20, changedRatio * 45)));
  const level: SemanticSummary["level"] = findings.length === 0 ? "unchanged" : findings.some((finding) => finding.changeType === "page" && finding.severity === "high") || riskScore >= 60 ? "major" : riskScore >= 30 ? "moderate" : "minor";
  const title = level === "major" ? "Major interface change" : level === "moderate" ? "Significant changes need review" : level === "minor" ? "Minor interface changes" : "No meaningful interface changes";
  const summary: SemanticSummary = {
    level,
    title,
    description: findings.length
      ? `${counts.added} added, ${counts.removed} removed, ${counts.content} content or navigation, and ${counts.layout} layout findings across this page.`
      : "The baseline and candidate have no meaningful semantic differences at this viewport.",
    riskScore,
    matchRate,
    counts,
  };
  return { findings, summary, matches: matches.length, added: added.length, removed: removed.length };
}
