"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Check, ChevronDown, ChevronLeft, ChevronRight, Clipboard, ExternalLink, Laptop, LoaderCircle, Monitor, ScanSearch, Smartphone, Sparkles, Tablet } from "lucide-react";
import { useMemo, useState, useEffect, type CSSProperties, type ReactNode } from "react";
import { DEVICE_PRESETS, DeviceFrame as BezelDeviceFrame, type DeviceName, type DeviceOrientation, type DevicePreset } from "react-device-bezels";
import type { BrowserEngine, ResponsiveIssue, TestTarget } from "@breakscope/shared";
import { capturedImageMimeType } from "@/lib/captured-image";
import { BreakscopeLogo, deviceChoices } from "./breakscope-brand";

const deviceMaker = (preset: DevicePreset) => preset.platform === "ios" ? "Apple" : preset.name.startsWith("pixel") ? "Google" : preset.name.startsWith("galaxy") ? "Samsung" : preset.name.startsWith("oneplus") ? "OnePlus" : preset.name.startsWith("xiaomi") ? "Xiaomi" : "Android";
const presetByName = (name: DeviceName) => DEVICE_PRESETS.find((preset) => preset.name === name)!;

type DeviceKind = "phone" | "tablet" | "desktop";
type DeviceModelId = DeviceName | "iphone-17-pro" | "iphone-17-pro-max" | "pixel-10-pro" | "pixel-10-pro-xl" | "galaxy-s26" | "galaxy-s26-ultra" | "chrome-desktop" | "safari-desktop" | "edge-desktop";
type PreviewScaleMode = "fit-device" | "fit-screen" | "actual" | "custom";
type ComparisonMode = "failing" | "passing";

interface DeviceModel {
  id: DeviceModelId;
  label: string;
  maker: string;
  platform: "iOS" | "Android" | "Desktop";
  kind: DeviceKind;
  checkpointWidth: number;
  width: number;
  height: number;
  preset?: DevicePreset;
  browser?: "chrome" | "safari" | "edge";
  browserEngine: BrowserEngine;
}

const deviceModels: DeviceModel[] = [
  { id: "iphone-17-pro", label: "iPhone 17 Pro", maker: "Apple", platform: "iOS", kind: "phone", checkpointWidth: 375, width: 402, height: 874, preset: presetByName("iphone-16-pro"), browserEngine: "webkit" },
  { id: "iphone-17-pro-max", label: "iPhone 17 Pro Max", maker: "Apple", platform: "iOS", kind: "phone", checkpointWidth: 375, width: 440, height: 956, preset: presetByName("iphone-16-pro-max"), browserEngine: "webkit" },
  { id: "pixel-10-pro", label: "Pixel 10 Pro", maker: "Google", platform: "Android", kind: "phone", checkpointWidth: 375, width: 412, height: 915, preset: presetByName("pixel-9-pro"), browserEngine: "chromium" },
  { id: "galaxy-s26", label: "Galaxy S26", maker: "Samsung", platform: "Android", kind: "phone", checkpointWidth: 375, width: 360, height: 780, preset: presetByName("galaxy-s25"), browserEngine: "chromium" },
  ...DEVICE_PRESETS.map((preset): DeviceModel => ({ id: preset.name, label: preset.label, maker: deviceMaker(preset), platform: preset.platform === "ios" ? "iOS" : "Android", kind: preset.kind === "phone" ? "phone" : "tablet", checkpointWidth: preset.kind === "phone" ? 375 : 768, width: preset.width, height: preset.height, preset, browserEngine: preset.platform === "ios" ? "webkit" : "chromium" })),
  { id: "chrome-desktop", label: "Desktop 1440", maker: "Desktop", platform: "Desktop", kind: "desktop", checkpointWidth: 1440, width: 1440, height: 900, browserEngine: "chromium" },
  { id: "safari-desktop", label: "Desktop 1280", maker: "Desktop", platform: "Desktop", kind: "desktop", checkpointWidth: 1280, width: 1280, height: 800, browserEngine: "chromium" },
];

function modelForWidth(width: number) {
  return width <= 600 ? deviceModels.find((model) => model.id === "iphone-17-pro")! : width <= 900 ? deviceModels.find((model) => model.id === "ipad-pro-11")! : width < 1440 ? deviceModels.find((model) => model.id === "safari-desktop")! : deviceModels.find((model) => model.id === "chrome-desktop")!;
}

const browserLabels: Record<BrowserEngine, string> = { chromium: "Chrome", firefox: "Firefox", webkit: "Safari" };
const allBrowserEngines: BrowserEngine[] = ["chromium", "firefox", "webkit"];

interface AiIssueAnalysis {
  summary: string;
  likelyCause: string;
  recommendation: string;
  codeHint?: string;
  confidence: number;
  model: string;
  generatedAt: number;
}

interface ReportPayload {
  target?: TestTarget;
  latestIssues: ResponsiveIssue[];
  latestPreviews?: Array<{
    width: number;
    label: string;
    routePath: string;
    browserEngine?: BrowserEngine;
    deviceModelId?: string;
    image?: string;
  }>;
  aiReviews?: Record<string, AiIssueAnalysis>;
  deviceWidths?: number[];
}

function issueFamilyKey(issue: ResponsiveIssue) {
  return `${issue.routePath}:${issue.type}:${issue.title}:${issue.failureRanges.map((range) => `${range.min}-${range.max}`).join(",")}`;
}

function issueAffectsWidth(issue: ResponsiveIssue, width: number) {
  return issue.failureRanges.some((range) => width >= range.min && width <= range.max);
}

function isPageWideIssue(issue: ResponsiveIssue, checkpointWidths: number[]) {
  return checkpointWidths.length > 1 && checkpointWidths.every((width) => issueAffectsWidth(issue, width));
}

function issueFamilyTitle(issue: ResponsiveIssue, count: number) {
  if (count === 1) return issue.title;
  if (issue.type === "image-alt") return `${count} images have no text alternative`;
  if (issue.type === "accessible-name") return `${count} controls have no accessible name`;
  if (issue.type === "touch-target") return `${count} controls are difficult to tap`;
  return `${count} occurrences · ${issue.title}`;
}

function issueTargetDescription(issue: ResponsiveIssue) {
  const tag = String(issue.measurements.tag ?? issue.selector.split(/\s+|>/).filter(Boolean).at(-1) ?? "element").replace(/[^a-z-]/gi, "");
  return issue.type === "image-alt" ? `${tag || "image"} missing alternative text` : `${tag || "element"} affected by this check`;
}

function groupIssueFamilies(source: ResponsiveIssue[]) {
  const families = new Map<string, ResponsiveIssue[]>();
  for (const issue of source) families.set(issueFamilyKey(issue), [...(families.get(issueFamilyKey(issue)) ?? []), issue]);
  return [...families.values()];
}

function ResultImage({ image, alt }: { image?: ArrayBuffer | string; alt: string }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let disposed = false;
    if (!image) {
      queueMicrotask(() => { if (!disposed) setUrl(""); });
      return;
    }
    if (typeof image === "string") {
      queueMicrotask(() => { if (!disposed) setUrl(image); });
      return;
    }
    if (!image.byteLength) {
      queueMicrotask(() => { if (!disposed) setUrl(""); });
      return;
    }
    const blobUrl = URL.createObjectURL(new Blob([image], { type: capturedImageMimeType(image) }));
    queueMicrotask(() => { if (!disposed) setUrl(blobUrl); });
    return () => { disposed = true; URL.revokeObjectURL(blobUrl); };
  }, [image]);
  if (image && !url) return <div className="bk-preview-image-loading" role="status"><span /><span /><span /><b>Preparing captured viewport…</b></div>;
  if (!url) return <div className="bk-preview-unavailable"><ScanSearch size={28} /><b>Capture unavailable</b></div>;
  // eslint-disable-next-line @next/next/no-img-element
  return <div className="bk-result-image-layer"><img src={url} alt={alt} /></div>;
}

function PreviewSurface({ children }: { children: ReactNode }) {
  return <div className="bk-library-screen-content"><div className="bs-preview">{children}</div></div>;
}

function DeviceFrame({ model, browserEngine, orientation, scaleMode, url, children }: { model: DeviceModel; browserEngine: BrowserEngine; orientation: DeviceOrientation; scaleMode: PreviewScaleMode; url: string; children: ReactNode }) {
  const preview = <PreviewSurface>{children}</PreviewSurface>;
  if (model.preset) {
    const fittedZoom = model.kind === "phone" ? orientation === "portrait" ? .72 : .7 : orientation === "portrait" ? .48 : .58;
    const zoom = scaleMode === "actual" ? 1 : scaleMode === "custom" ? .72 : scaleMode === "fit-screen" ? fittedZoom * 1.18 : fittedZoom;
    return <div className={`bk-library-device ${model.kind} scale-${scaleMode}`} aria-label={`${model.label} device frame`}><BezelDeviceFrame className="bk-native-device-frame" device={model.preset.name} orientation={orientation} color={model.preset.defaultColor} zoom={zoom} contentClassName="bk-bezel-content">{preview}</BezelDeviceFrame></div>;
  }
  const browserClass = browserEngine === "webkit" ? "safari" : browserEngine === "firefox" ? "firefox" : "chrome";
  return <div className={`bk-browser-frame ${browserClass} scale-${scaleMode}`} aria-label={`${model.label} in ${browserLabels[browserEngine]}`}><div className="bk-browser-chrome"><span><i /><i /><i /></span><code>{url}</code><b /></div>{preview}</div>;
}

function ViewportIssueInspector({ width, checkpointWidths, routePath, issues, pageWideIssues, selectedIssue, aiAnalysis, onSelect }: { width: number; checkpointWidths: number[]; routePath: string; issues: ResponsiveIssue[]; pageWideIssues: ResponsiveIssue[]; selectedIssue?: ResponsiveIssue; aiAnalysis?: AiIssueAnalysis; onSelect: (issue: ResponsiveIssue) => void }) {
  const issueFamilies = useMemo(() => groupIssueFamilies(issues), [issues]);
  const pageWideFamilies = useMemo(() => groupIssueFamilies(pageWideIssues), [pageWideIssues]);
  const renderFamilies = (families: ResponsiveIssue[][], startIndex = 0) => families.map((family, index) => {
    const selected = family.some((issue) => selectedIssue?.fingerprint === issue.fingerprint);
    const issue = selected ? family.find((item) => item.fingerprint === selectedIssue?.fingerprint)! : family[0]!;
    return <article key={issueFamilyKey(issue)} className={selected ? "active" : ""}>
      <button type="button" className="bk-viewport-issue-trigger" aria-expanded={selected} onClick={() => onSelect(issue)}><i>{startIndex + index + 1}</i><span><b>{issueFamilyTitle(issue, family.length)}</b><small>{issue.type.replaceAll("-", " ")} · {issue.severity} severity{family.length > 1 ? ` · ${family.length} occurrences` : ""}</small></span><ChevronDown size={16} /></button>
      {selected && <div className="bk-viewport-issue-detail">
        <p>{issue.description}</p>
        <dl><div><dt>{isPageWideIssue(issue, checkpointWidths) ? "Scope" : "Fails"}</dt><dd>{isPageWideIssue(issue, checkpointWidths) ? "Every checkpoint" : `${issue.failureRanges.map((range) => range.min === range.max ? range.min : `${range.min}–${range.max}`).join(", ")}px`}</dd></div><div><dt>Target</dt><dd>{issueTargetDescription(issue)}</dd></div></dl>
        {aiAnalysis && <section className="bk-ai-issue-review"><header className="bk-ai-review-header"><span><Sparkles size={14} /> AI repair brief</span><b>{Math.round(aiAnalysis.confidence * 100)}% confidence</b></header><div className="bk-ai-result"><section><span>What&apos;s happening</span><p>{aiAnalysis.summary}</p></section><section><span>Likely cause</span><p>{aiAnalysis.likelyCause}</p></section><section className="bk-ai-recommendation"><span>Recommended fix</span><p>{aiAnalysis.recommendation}</p></section></div></section>}
        <div className="bs-actions"><button type="button" onClick={() => void navigator.clipboard.writeText(issue.selector)}><Clipboard size={15} /> Copy selector</button><a href={issue.routePath} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Open page</a></div>
      </div>}
    </article>;
  });
  return <div className="bk-viewport-inspector">
    <header><div><span>Viewport status</span><h2>{width}px · {issues.length ? "Needs attention" : "Passed"}</h2><p><code>{routePath}</code> · {issues.length ? `${issueFamilies.length} responsive ${issueFamilies.length === 1 ? "issue" : "issues"} at this checkpoint` : "No responsive failures at this checkpoint"}</p></div><b aria-label={issues.length ? `${issueFamilies.length} responsive issues` : "Responsive checks passed"}>{issues.length || "OK"}</b></header>
    {issues.length ? <div className="bk-viewport-issue-list">{renderFamilies(issueFamilies)}</div> : <div className="bk-viewport-clear"><Check size={22} /><b>No responsive issues at {width}px</b><p>This checkpoint passed every width-dependent detector.</p></div>}
    {pageWideIssues.length > 0 && <section className="bk-page-wide-findings"><header><div><b>Page-wide checks</b><span>Independent of viewport size</span></div><em>{pageWideFamilies.length} {pageWideFamilies.length === 1 ? "family" : "families"} · {pageWideIssues.length} {pageWideIssues.length === 1 ? "element" : "elements"}</em></header><div className="bk-viewport-issue-list">{renderFamilies(pageWideFamilies, issueFamilies.length)}</div></section>}
  </div>;
}

export function ReportViewer({ token }: { token: string }) {
  const reportQuery = useQuery({
    queryKey: ["report", token],
    queryFn: async (): Promise<{ payload: ReportPayload }> => {
      const response = await fetch(`/api/public/reports/${token}`);
      if (!response.ok) throw new Error("Report not found or expired");
      return response.json();
    },
  });

  const [activePreviewWidth, setActivePreviewWidth] = useState(375);
  const [activeBrowserEngine, setActiveBrowserEngine] = useState<BrowserEngine>("chromium");
  const [activeDeviceModelId, setActiveDeviceModelId] = useState<DeviceModelId>("iphone-17-pro");
  const [deviceOrientation] = useState<DeviceOrientation>("portrait");
  const [previewScaleMode] = useState<PreviewScaleMode>("fit-device");
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>("failing");
  const [activeIssue, setActiveIssue] = useState<ResponsiveIssue | undefined>();
  const [inspectorWidth] = useState(380);

  const payload = reportQuery.data?.payload;
  const target = payload?.target;
  const issues = useMemo(() => payload?.latestIssues ?? [], [payload?.latestIssues]);
  const previews = payload?.latestPreviews ?? [];
  const aiReviews = payload?.aiReviews ?? {};
  const deviceWidths = payload?.deviceWidths ?? [320, 390, 480, 600, 768, 900, 1024, 1280, 1440];

  const reviewedRoute = activeIssue?.routePath ?? target?.selectedRoutes[0] ?? "/";
  const viewportIssues = issues.filter((issue) => (issue.browserEngine ?? "chromium") === activeBrowserEngine && !isPageWideIssue(issue, deviceWidths) && issue.routePath === reviewedRoute && issueAffectsWidth(issue, activePreviewWidth));
  const pageWideIssues = issues.filter((issue) => (issue.browserEngine ?? "chromium") === activeBrowserEngine && isPageWideIssue(issue, deviceWidths) && issue.routePath === reviewedRoute && issueAffectsWidth(issue, activePreviewWidth));
  const navigableIssues = issues.filter((issue) => (issue.browserEngine ?? "chromium") === activeBrowserEngine && issue.routePath === reviewedRoute);
  const activeIssueIndex = activeIssue ? navigableIssues.findIndex((issue) => issue.fingerprint === activeIssue.fingerprint) : -1;
  const responsiveIssueFamilyCount = useMemo(() => new Set(issues.filter((issue) => !isPageWideIssue(issue, deviceWidths)).map(issueFamilyKey)).size, [issues, deviceWidths]);
  const pageWideIssueFamilyCount = useMemo(() => new Set(issues.filter((issue) => isPageWideIssue(issue, deviceWidths)).map(issueFamilyKey)).size, [issues, deviceWidths]);

  const activePreview = previews.find((preview) => preview.width === activePreviewWidth && (preview.browserEngine ?? "chromium") === activeBrowserEngine);
  const displayedWidth = activeIssue ? (comparisonMode === "passing" && activeIssue.lastWorkingWidth ? activeIssue.lastWorkingWidth : activeIssue.evidenceWidth) : activePreviewWidth;
  const displayedDevice: DeviceKind = displayedWidth <= 600 ? "phone" : displayedWidth <= 900 ? "tablet" : "desktop";
  const selectedModel = deviceModels.find((model) => model.id === activeDeviceModelId) ?? deviceModels[0]!;
  const displayedModel = selectedModel.kind === displayedDevice && (displayedDevice !== "desktop" || (displayedWidth >= 1440 ? selectedModel.checkpointWidth >= 1440 : selectedModel.checkpointWidth < 1440)) ? selectedModel : modelForWidth(displayedWidth);
  const hasExactIssueEvidence = activeIssue?.evidenceWidth === displayedWidth;
  const issueImage = (comparisonMode === "passing" ? activeIssue?.passingScreenshot : hasExactIssueEvidence ? activeIssue?.screenshot : activePreview?.image) as ArrayBuffer | undefined;

  function selectIssue(issue: ResponsiveIssue) {
    const checkpoint = issueAffectsWidth(issue, activePreviewWidth) ? activePreviewWidth : deviceWidths.reduce((closest, width) => Math.abs(width - issue.evidenceWidth) < Math.abs(closest - issue.evidenceWidth) ? width : closest, deviceWidths[0] ?? issue.evidenceWidth);
    setActivePreviewWidth(checkpoint);
    setActiveBrowserEngine(issue.browserEngine ?? "chromium");
    setActiveDeviceModelId(modelForWidth(checkpoint).id);
    setActiveIssue(issue);
    setComparisonMode("failing");
  }

  function stepIssue(direction: -1 | 1) {
    if (!navigableIssues.length) return;
    const nextIndex = (Math.max(0, activeIssueIndex) + direction + navigableIssues.length) % navigableIssues.length;
    selectIssue(navigableIssues[nextIndex]!);
  }

  if (reportQuery.isPending) return <main id="main-content" className="breakscope-shell bk-workspace-page"><div className="bk-workspace-empty"><LoaderCircle className="spin" size={22} /><span>Loading report...</span></div></main>;
  if (reportQuery.isError) return <main id="main-content" className="breakscope-shell bk-workspace-page"><div className="bk-workspace-empty"><AlertTriangle size={32} /><h2>Report not found</h2><p>This report may have expired or been revoked.</p></div></main>;

  return <main id="main-content" className="breakscope-shell bk-workspace-page">
    <header className="bk-command-bar"><div className="bk-command-brand"><BreakscopeLogo /><span>Report</span></div><div className="bk-command-target"><span>{target ? new URL(target.url).host : "Unknown"}</span><code>{target?.url ?? ""}</code></div><div className="bk-command-actions"><span className="bk-command-state complete">{responsiveIssueFamilyCount ? `${responsiveIssueFamilyCount} responsive ${responsiveIssueFamilyCount === 1 ? "issue" : "issues"}` : pageWideIssueFamilyCount ? `${pageWideIssueFamilyCount} page-wide ${pageWideIssueFamilyCount === 1 ? "check" : "checks"}` : "All checks passed"}</span></div></header>
    <section className="bs-workspace" style={{ "--bk-inspector-width": `${inspectorWidth}px` } as CSSProperties}>
      <section className="bk-stage-main">
        <div className="bk-canvas-toolbar"><span><i className={activeIssue ? "fail" : ""} />{activeIssue ? "Failure evidence" : "Captured evidence"}</span><div className="bk-checkpoint-control"><span>Captured checkpoints</span><div className="bk-device-switcher" role="group" aria-label="Captured checkpoints">{deviceWidths.map((width) => {
          const choice = deviceChoices.find((device) => device.width === width);
          const ready = previews.some((preview) => preview.width === width && (preview.browserEngine ?? "chromium") === activeBrowserEngine);
          const failed = issues.some((issue) => (issue.browserEngine ?? "chromium") === activeBrowserEngine && !isPageWideIssue(issue, deviceWidths) && issueAffectsWidth(issue, width));
          const selected = activePreviewWidth === width;
          return <button type="button" key={width} className={`${selected ? "active" : ""} ${failed ? "failed" : ready ? "ready" : ""}`} aria-pressed={selected} onClick={() => { setActivePreviewWidth(width); setActiveDeviceModelId(modelForWidth(width).id); setActiveIssue(undefined); setComparisonMode("failing"); }}>{width <= 600 ? <Smartphone size={18} /> : width <= 900 ? <Tablet size={18} /> : width < 1440 ? <Laptop size={19} /> : <Monitor size={19} />}<span><b>{choice?.label ?? "Custom"}</b><small>{width}px</small></span></button>;
        })}</div></div><b><small>Evidence</small>{displayedWidth}px</b></div>
        <div className="bk-preview-toolbar"><div className="bk-environment-controls"><div className="bk-browser-control"><span>Browser</span><div className="bk-browser-switcher" role="group" aria-label="Test browser">{allBrowserEngines.map((engine) => {
          const ready = previews.some((preview) => preview.width === activePreviewWidth && (preview.browserEngine ?? "chromium") === engine);
          const failed = issues.some((issue) => (issue.browserEngine ?? "chromium") === engine && issueAffectsWidth(issue, activePreviewWidth));
          return <button type="button" key={engine} className={`${activeBrowserEngine === engine ? "active" : ""} ${failed ? "failed" : ready ? "ready" : "unavailable"}`} aria-pressed={activeBrowserEngine === engine} onClick={() => { setActiveBrowserEngine(engine); setActiveIssue(undefined); setComparisonMode("failing"); }}><span><b>{browserLabels[engine]}</b><small>{failed ? "Issues" : ready ? "Ready" : "Not captured"}</small></span><i aria-hidden="true" /></button>;
        })}</div></div></div></div>
        <div className="bk-stage-canvas checkpoint-grid">
          {activeIssue ? <div className="bk-evidence-view"><div className="bk-evidence-bar"><span className={comparisonMode}>{comparisonMode === "passing" ? <Check size={14} /> : <AlertTriangle size={14} />}{comparisonMode === "passing" ? `Passing · ${activeIssue.lastWorkingWidth}px` : `Failing · ${displayedWidth}px`}<small>{activeIssue.selector}</small></span><div className="bk-issue-stepper" aria-label={`Issue ${activeIssueIndex + 1} of ${navigableIssues.length}`}><button type="button" aria-label="Previous issue" onClick={() => stepIssue(-1)}><ChevronLeft size={15} /></button><em><span>Issue</span> {activeIssueIndex + 1} of {navigableIssues.length}</em><button type="button" aria-label="Next issue" onClick={() => stepIssue(1)}><ChevronRight size={15} /></button></div>{activeIssue.passingScreenshot && <div><button className={comparisonMode === "failing" ? "active" : ""} onClick={() => setComparisonMode("failing")}>Failing</button><button className={comparisonMode === "passing" ? "active" : ""} onClick={() => setComparisonMode("passing")}>Passing</button></div>}</div><DeviceFrame model={displayedModel} browserEngine={activeBrowserEngine} orientation={deviceOrientation} scaleMode={previewScaleMode} url={target?.url ?? ""}><ResultImage image={issueImage} alt={`${comparisonMode} evidence for ${activeIssue.title}`} /></DeviceFrame></div>
          : activePreview ? <DeviceFrame model={displayedModel} browserEngine={activeBrowserEngine} orientation={deviceOrientation} scaleMode={previewScaleMode} url={target?.url ?? ""}><ResultImage image={activePreview.image} alt={`${activePreview.label} checkpoint at ${activePreview.width}px`} /></DeviceFrame>
          : <div className="bk-missing-checkpoint"><ScanSearch size={32} /><h2>No capture at {displayedWidth}px</h2></div>}
        </div>
      </section>
      <aside className="bk-inspector bk-context-inspector" style={{ width: inspectorWidth }}><div className="bk-inspector-content">
        <ViewportIssueInspector width={displayedWidth} checkpointWidths={deviceWidths} routePath={reviewedRoute} issues={viewportIssues} pageWideIssues={pageWideIssues} selectedIssue={activeIssue} aiAnalysis={activeIssue ? aiReviews[activeIssue.fingerprint] : undefined} onSelect={selectIssue} />
      </div></aside>
    </section>
    <footer className="bs-footer"><span>Breakscope report</span><span>{browserLabels[activeBrowserEngine]} · Shared report</span></footer>
  </main>;
}
