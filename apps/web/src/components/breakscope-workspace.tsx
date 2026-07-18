"use client";

import Link from "next/link";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Accessibility, AlertTriangle, ArrowLeft, ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, CircleStop, Code2, Command, CornerDownLeft, Download, Eraser, ExternalLink, EyeOff, FileText, Hand, ImageOff, Keyboard, Laptop, Layers3, LoaderCircle, Maximize2, MessageSquareCode, Minus, Monitor, MoreHorizontal, MoveHorizontal, Option, PanelLeftClose, PanelLeftOpen, Plus, RefreshCw, RotateCcw, ScanSearch, Scissors, Search, Settings2, Smartphone, Star, Tablet, Trash2, WandSparkles, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from "react";
import * as Popover from "@radix-ui/react-popover";
import { DEVICE_PRESETS, DeviceFrame as BezelDeviceFrame, type DeviceName, type DeviceOrientation, type DevicePreset } from "react-device-bezels";
import { analyzeResponsiveSamples } from "@breakscope/comparison-engine";
import type { BrowserEngine, CaptureProfile, DetectorOutcome, ResponsiveIssue, ResponsiveIssueType, TestTarget, ViewportSample } from "@breakscope/shared";
import { isCaptureUrl } from "@breakscope/validation";
import { capturePageLocally, discoverRoutesLocally, scanRouteLocally } from "@/lib/local-capture";
import { breakscopeQueryKeys, workspaceStateQueryOptions } from "@/lib/breakscope-queries";
import { clearBreakscopeState, loadBreakscopeState, saveBreakscopeState, type BreakscopeState, type LocalScanRun, type PersistedScanJob, type PersistedViewportPreview, type RuntimeDiagnosticSample } from "@/lib/breakscope-workspace";
import { BreakscopeLogo, deviceChoices } from "./breakscope-brand";

const defaultWidths = [320, 390, 480, 600, 768, 900, 1024, 1280, 1440];
const evidenceWarningBytes = 48 * 1024 * 1024;
const evidenceLimitBytes = 64 * 1024 * 1024;
type InspectorTab = "activity" | "issue" | "findings" | "checks";
type ComparisonMode = "failing" | "passing";
type DeviceKind = "phone" | "tablet" | "desktop";
type PreviewScaleMode = "fit-device" | "fit-screen" | "actual" | "custom";
type DeviceModelId = DeviceName | "iphone-17-pro" | "iphone-17-pro-max" | "pixel-10-pro" | "pixel-10-pro-xl" | "galaxy-s26" | "galaxy-s26-ultra" | "chrome-desktop" | "safari-desktop" | "edge-desktop";
type DeviceFilter = "recent" | "phone" | "tablet" | "laptop" | "wide";

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
  playwrightDevice?: string;
}

const deviceMaker = (preset: DevicePreset) => preset.platform === "ios" ? "Apple" : preset.name.startsWith("pixel") ? "Google" : preset.name.startsWith("galaxy") ? "Samsung" : preset.name.startsWith("oneplus") ? "OnePlus" : preset.name.startsWith("xiaomi") ? "Xiaomi" : "Android";
const presetByName = (name: DeviceName) => DEVICE_PRESETS.find((preset) => preset.name === name)!;
const deviceModels: DeviceModel[] = [
  { id: "iphone-17-pro", label: "iPhone 17 Pro", maker: "Apple", platform: "iOS", kind: "phone", checkpointWidth: 375, width: 402, height: 874, preset: presetByName("iphone-16-pro"), browserEngine: "webkit", playwrightDevice: "iPhone 13" },
  { id: "iphone-17-pro-max", label: "iPhone 17 Pro Max", maker: "Apple", platform: "iOS", kind: "phone", checkpointWidth: 375, width: 440, height: 956, preset: presetByName("iphone-16-pro-max"), browserEngine: "webkit", playwrightDevice: "iPhone 13 Pro Max" },
  { id: "pixel-10-pro", label: "Pixel 10 Pro", maker: "Google", platform: "Android", kind: "phone", checkpointWidth: 375, width: 412, height: 915, preset: presetByName("pixel-9-pro"), browserEngine: "chromium", playwrightDevice: "Pixel 7" },
  { id: "pixel-10-pro-xl", label: "Pixel 10 Pro XL", maker: "Google", platform: "Android", kind: "phone", checkpointWidth: 375, width: 448, height: 997, preset: presetByName("pixel-9-pro-xl"), browserEngine: "chromium", playwrightDevice: "Pixel 7" },
  { id: "galaxy-s26", label: "Galaxy S26", maker: "Samsung", platform: "Android", kind: "phone", checkpointWidth: 375, width: 360, height: 780, preset: presetByName("galaxy-s25"), browserEngine: "chromium", playwrightDevice: "Galaxy S9+" },
  { id: "galaxy-s26-ultra", label: "Galaxy S26 Ultra", maker: "Samsung", platform: "Android", kind: "phone", checkpointWidth: 375, width: 384, height: 824, preset: presetByName("galaxy-s25-ultra"), browserEngine: "chromium", playwrightDevice: "Galaxy S9+" },
  ...DEVICE_PRESETS.map((preset): DeviceModel => ({ id: preset.name, label: preset.label, maker: deviceMaker(preset), platform: preset.platform === "ios" ? "iOS" : "Android", kind: preset.kind === "phone" ? "phone" : "tablet", checkpointWidth: preset.kind === "phone" ? 375 : 768, width: preset.width, height: preset.height, preset, browserEngine: preset.platform === "ios" ? "webkit" : "chromium", playwrightDevice: preset.kind === "tablet" ? "iPad Pro 11" : preset.platform === "ios" ? "iPhone 13" : "Pixel 7" })),
  { id: "chrome-desktop", label: "Desktop 1440", maker: "Desktop", platform: "Desktop", kind: "desktop", checkpointWidth: 1440, width: 1440, height: 900, browserEngine: "chromium" },
  { id: "safari-desktop", label: "Desktop 1280", maker: "Desktop", platform: "Desktop", kind: "desktop", checkpointWidth: 1280, width: 1280, height: 800, browserEngine: "chromium" },
];
function modelForWidth(width: number) {
  return width <= 600 ? deviceModels.find((model) => model.id === "iphone-17-pro")! : width <= 900 ? deviceModels.find((model) => model.id === "ipad-pro-11")! : width < 1440 ? deviceModels.find((model) => model.id === "safari-desktop")! : deviceModels.find((model) => model.id === "chrome-desktop")!;
}

const browserLabels: Record<BrowserEngine, string> = { chromium: "Chrome", firefox: "Firefox", webkit: "Safari" };
const browserIcons: Record<BrowserEngine, string> = { chromium: "/icons/browsers/chrome.svg", firefox: "/icons/browsers/firefox.svg", webkit: "/icons/browsers/safari.svg" };
const allBrowserEngines: BrowserEngine[] = ["chromium", "firefox", "webkit"];
function captureProfile(model: DeviceModel, browserEngine = model.browserEngine): CaptureProfile {
  return { browserEngine, deviceName: browserEngine === model.browserEngine ? model.playwrightDevice : undefined, isMobile: model.kind !== "desktop", hasTouch: model.kind !== "desktop", deviceScaleFactor: model.kind === "desktop" ? 1 : 2, colorScheme: "light" };
}

interface ResultState {
  issues: ResponsiveIssue[];
  fixed: ResponsiveIssue[];
  suppressedCount: number;
  checks: DetectorOutcome[];
  activeIssue?: ResponsiveIssue;
  hasScanned: boolean;
}

interface AiIssueAnalysis {
  summary: string;
  likelyCause: string;
  recommendation: string;
  codeHint?: string;
  confidence: number;
  model: string;
  generatedAt: number;
}

function safeAiError(status: number, message?: string) {
  if (status === 503) return "AI analysis is not configured yet. Add NVIDIA_API_KEY to enable it.";
  const safeMessage = message?.trim();
  if (safeMessage && safeMessage.length <= 180 && !/[\[\]{}]|zod|invalid_type|too_big|expected string/i.test(safeMessage)) return safeMessage;
  return "The AI explanation could not be generated. Please try again.";
}

function issueMarkdown(issue: ResponsiveIssue, url: string) {
  const ranges = issue.failureRanges.map((range) => range.min === range.max ? `${range.min}px` : `${range.min}–${range.max}px`).join(", ");
  return `## ${issue.title}\n\n- URL: ${new URL(issue.routePath, url)}\n- Failing widths: ${ranges}\n- Closest passing width: ${issue.lastWorkingWidth ? `${issue.lastWorkingWidth}px` : "None sampled"}\n- Selector: \`${issue.selector}\`\n- Evidence: ${Object.entries(issue.measurements).map(([key, value]) => `${key}=${value}`).join(", ")}\n\n### Reproduce\n1. Open the URL.\n2. Resize the viewport to ${issue.evidenceWidth}px.\n3. Inspect \`${issue.selector}\`.\n\n### Expected\nThe content should remain visible, reachable, and usable throughout the tested width range.`;
}

function repairPrompt(issue: ResponsiveIssue, url: string, analysis: AiIssueAnalysis) {
  const ranges = issue.failureRanges.map((range) => range.min === range.max ? `${range.min}px` : `${range.min}–${range.max}px`).join(", ");
  return `Fix this responsive interface issue without changing unrelated behavior.

URL: ${new URL(issue.routePath, url)}
Issue: ${issue.title}
Failing viewport range: ${ranges}
Evidence viewport: ${issue.evidenceWidth}px
Selector: ${issue.selector}
Detector measurements: ${JSON.stringify(issue.measurements)}

Observed problem:
${issue.description}

Likely cause:
${analysis.likelyCause}

Recommended direction:
${analysis.recommendation}${analysis.codeHint ? `\n\nCode direction:\n${analysis.codeHint}` : ""}

Requirements:
- Inspect the existing component and styles before editing.
- Make the smallest robust change that fixes the entire failing range.
- Preserve behavior outside the failing range.
- Keep keyboard access, focus visibility, and reduced-motion support intact.
- Verify the fix at the failing and nearest passing widths.`;
}

function imageDataUrl(image?: ArrayBuffer) {
  if (!image?.byteLength) return Promise.resolve<string | undefined>(undefined);
  return new Promise<string | undefined>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : undefined);
    reader.onerror = () => reject(reader.error ?? new Error("Could not read screenshot evidence"));
    reader.readAsDataURL(new Blob([image], { type: "image/png" }));
  });
}

function formatBytes(bytes = 0) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function arrayBufferBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer); let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  return btoa(binary);
}

function downloadLocalReport(format: "md" | "json" | "html", state: BreakscopeState) {
  const target = state.target;
  if (!target) return;
  const findings = state.latestIssues; const title = `Breakscope report — ${new URL(target.url).host}`;
  const markdown = `# ${title}\n\nGenerated ${new Date().toLocaleString()}\n\n- Routes: ${target.selectedRoutes.join(", ")}\n- Range: ${target.minWidth}–${target.maxWidth}px\n- Findings: ${findings.length}\n\n${findings.map((issue, index) => `${index + 1}. **${issue.title}** — ${issue.routePath} at ${issue.evidenceWidth}px\n   - ${issue.description}\n   - Target: \`${issue.selector}\``).join("\n") || "No findings."}`;
  const serializable = { title, generatedAt: new Date().toISOString(), target, findings: findings.map(({ screenshot: _screenshot, passingScreenshot: _passing, ...issue }) => issue) };
  const html = `<!doctype html><meta charset="utf-8"><title>${title}</title><style>body{font:16px/1.55 system-ui;max-width:960px;margin:48px auto;padding:0 24px;color:#151923}article{border:1px solid #d8d2c7;padding:20px;margin:16px 0}code{background:#f2efe9;padding:2px 5px}img{max-width:100%;border:1px solid #ddd}</style><h1>${title}</h1><p>${new Date().toLocaleString()} · ${findings.length} findings · ${target.minWidth}–${target.maxWidth}px</p>${findings.map((issue) => `<article><h2>${issue.title}</h2><p>${issue.description}</p><p><b>${issue.routePath}</b> at ${issue.evidenceWidth}px</p><code>${issue.selector}</code>${issue.screenshot ? `<p><img alt="Evidence for ${issue.title}" src="data:image/png;base64,${arrayBufferBase64(issue.screenshot)}"></p>` : ""}</article>`).join("") || "<p>No findings.</p>"}`;
  const content = format === "json" ? JSON.stringify(serializable, null, 2) : format === "html" ? html : markdown;
  const href = URL.createObjectURL(new Blob([content], { type: format === "json" ? "application/json" : format === "html" ? "text/html" : "text/markdown" }));
  const link = document.createElement("a"); link.href = href; link.download = `breakscope-${new URL(target.url).host}.${format}`; link.click(); URL.revokeObjectURL(href);
}

function DevRuntimePanel({ retainedBytes, history, onSample }: { retainedBytes: number; history: RuntimeDiagnosticSample[]; onSample: (sample: RuntimeDiagnosticSample) => void }) {
  const [stats, setStats] = useState<{ app?: { rssBytes: number; heapUsedBytes: number }; capture?: { activeCaptures?: number; completedCaptures?: number; rssBytes?: number; heapUsedBytes?: number; ok?: boolean } }>({});
  const lastRecordedAt = useRef(0);
  const onSampleRef = useRef(onSample);
  onSampleRef.current = onSample;
  useEffect(() => {
    const refresh = () => void fetch("/api/dev/runtime").then((response) => response.ok ? response.json() : undefined).then((data) => { if (data) { setStats(data); if (Date.now() - lastRecordedAt.current >= 30_000) { lastRecordedAt.current = Date.now(); onSampleRef.current({ id: crypto.randomUUID(), capturedAt: Date.now(), retainedBytes, appHeapBytes: data.app?.heapUsedBytes ?? 0, appRssBytes: data.app?.rssBytes ?? 0, captureHeapBytes: data.capture?.heapUsedBytes ?? 0, captureRssBytes: data.capture?.rssBytes ?? 0, completedCaptures: data.capture?.completedCaptures ?? 0 }); } } }).catch(() => undefined);
    refresh();
    const timer = window.setInterval(refresh, 5_000);
    return () => window.clearInterval(timer);
  }, []);
  const oldest = history.at(-1); const latest = history[0];
  return <aside className="bk-dev-runtime" aria-label="Development runtime diagnostics"><b>Runtime diagnostics</b><span>Browser evidence retained: <strong>{formatBytes(retainedBytes)}</strong></span><span>Next heap / RSS: <strong>{formatBytes(stats.app?.heapUsedBytes)} / {formatBytes(stats.app?.rssBytes)}</strong></span><span>Capture active / completed: <strong>{stats.capture?.activeCaptures ?? "—"} / {stats.capture?.completedCaptures ?? "—"}</strong></span><span>Capture heap / RSS: <strong>{formatBytes(stats.capture?.heapUsedBytes)} / {formatBytes(stats.capture?.rssBytes)}</strong></span>{latest && <span>Stored trend ({history.length}): <strong>{oldest ? `${formatBytes(oldest.appHeapBytes)} → ` : ""}{formatBytes(latest.appHeapBytes)} heap</strong></span>}</aside>;
}

function WorkspaceControls({ retainedBytes, diagnosticsHistory, disabled, onExport, onDiagnosticSample, onClearEvidence, onClearPreferences, onResetWorkspace }: { retainedBytes: number; diagnosticsHistory: RuntimeDiagnosticSample[]; disabled: boolean; onExport: (format: "md" | "json" | "html") => void; onDiagnosticSample: (sample: RuntimeDiagnosticSample) => void; onClearEvidence: () => void; onClearPreferences: () => void; onResetWorkspace: () => void }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  return <Popover.Root>
    <Popover.Trigger asChild><button type="button" className="bk-workspace-controls-trigger" aria-label="Open workspace controls"><MoreHorizontal size={18} /><span>Controls</span></button></Popover.Trigger>
    <Popover.Portal><Popover.Content className="bk-workspace-controls" side="right" align="end" sideOffset={10} aria-label="Workspace controls">
      <header><div><b>Workspace controls</b><span className={retainedBytes >= evidenceWarningBytes ? "warning" : ""}>{retainedBytes ? `${formatBytes(retainedBytes)} of ${formatBytes(evidenceLimitBytes)} evidence retained` : "No captured evidence retained"}</span></div><Popover.Close aria-label="Close workspace controls"><X size={15} /></Popover.Close></header>
      <button type="button" className="bk-workspace-control-primary" disabled={disabled || !retainedBytes} onClick={onClearEvidence}><Eraser size={16} /><span><b>Clear captured evidence</b><small>Keep this test configuration</small></span></button>
      <button type="button" className="bk-workspace-control-row" onClick={() => setMoreOpen((open) => !open)} aria-expanded={moreOpen}><MoreHorizontal size={16} /><span>More actions</span><ChevronDown size={15} /></button>
      {moreOpen && <div className="bk-workspace-control-more"><section className="bk-local-storage-summary"><b>Saved on this device</b><span>Test setup, presets, screenshots, issue evidence, and view preferences.</span><small>AI repair briefs remain in memory for this session only.</small></section><section className="bk-report-export"><b><Download size={14} /> Export local report</b><div><button type="button" onClick={() => onExport("md")}>Markdown</button><button type="button" onClick={() => onExport("json")}>JSON</button><button type="button" onClick={() => onExport("html")}>HTML + images</button></div></section><button type="button" disabled={disabled} onClick={onClearPreferences}><Settings2 size={15} /> Reset view preferences</button><button type="button" onClick={() => window.location.reload()}><RefreshCw size={15} /> Reload workspace</button>{process.env.NODE_ENV === "development" && <DevRuntimePanel retainedBytes={retainedBytes} history={diagnosticsHistory} onSample={onDiagnosticSample} />}</div>}
      <div className="bk-workspace-control-danger">{confirmingReset ? <><p>Remove this test, its captured evidence, and local preferences?</p><div><button type="button" onClick={() => setConfirmingReset(false)}>Cancel</button><button type="button" onClick={onResetWorkspace}><Trash2 size={15} /> Reset workspace</button></div></> : <button type="button" onClick={() => setConfirmingReset(true)}><Trash2 size={15} /> Reset workspace</button>}</div>
      <Popover.Arrow className="bk-workspace-controls-arrow" width={12} height={7} />
    </Popover.Content></Popover.Portal>
  </Popover.Root>;
}

function ResultImage({ image, alt, retryLabel, retrying, onRetry, onReady, children }: { image?: ArrayBuffer; alt: string; retryLabel?: string; retrying?: boolean; onRetry?: () => void; onReady?: () => void; children?: ReactNode }) {
  const [source, setSource] = useState<{ image?: ArrayBuffer; url: string }>({ url: "" });
  const [failedUrl, setFailedUrl] = useState("");
  useEffect(() => {
    let disposed = false;
    if (!image?.byteLength) {
      queueMicrotask(() => { if (!disposed) setSource({ image, url: "" }); });
      return () => { disposed = true; };
    }
    const url = URL.createObjectURL(new Blob([image], { type: "image/png" }));
    queueMicrotask(() => { if (!disposed) setSource({ image, url }); });
    return () => { disposed = true; URL.revokeObjectURL(url); };
  }, [image]);
  if (image?.byteLength && source.image !== image) return <div className="bk-preview-image-loading" role="status"><span /><span /><span /><b>Preparing captured viewport…</b></div>;
  if (!source.url || failedUrl === source.url) return <div className="bk-preview-unavailable"><ScanSearch size={28} /><b>Capture unavailable</b><span>Only this viewport needs to be captured again.</span>{onRetry && <button type="button" disabled={retrying} onClick={onRetry}>{retrying ? <LoaderCircle className="spin" size={15} /> : <RotateCcw size={15} />}{retrying ? "Recapturing…" : retryLabel ?? "Retry capture"}</button>}</div>;
  // Blob URLs are generated at runtime and should bypass Next's image optimizer.
  // eslint-disable-next-line @next/next/no-img-element
  return <div className="bk-result-image-layer"><img src={source.url} alt={alt} onLoad={onReady} onError={() => setFailedUrl(source.url)} />{children}</div>;
}

function PreviewSurface({ scanning, previewRef, scrollProgress, issuePosition, onScroll, onUserInteraction, children }: { scanning?: boolean; previewRef?: RefObject<HTMLDivElement | null>; scrollProgress: number; issuePosition?: number; onScroll?: () => void; onUserInteraction?: () => void; children: ReactNode }) {
  const section = Math.min(8, Math.floor(scrollProgress * 8) + 1);
  return <div className="bk-library-screen-content"><div className="bs-preview" ref={previewRef} tabIndex={0} aria-label="Scrollable captured page" onScroll={onScroll} onWheel={(event) => { onUserInteraction?.(); event.stopPropagation(); }} onPointerDown={onUserInteraction} onKeyDown={(event) => { const preview = event.currentTarget; const step = preview.clientHeight * .82; const next = event.key === "PageDown" || event.key === " " ? preview.scrollTop + step : event.key === "PageUp" ? preview.scrollTop - step : event.key === "Home" ? 0 : event.key === "End" ? preview.scrollHeight : undefined; if (next !== undefined) { event.preventDefault(); preview.scrollTo({ top: next, behavior: "auto" }); } }}>{children}</div>{scanning && <div className="bk-scan-overlay"><i /><span>Scanning section {section} of 8</span></div>}{(scanning || issuePosition !== undefined) && <div className={`bk-page-minimap ${scanning ? "is-scanning" : "has-issue"}`} aria-label={`${Math.round(scrollProgress * 100)}% through page`}><span className="bk-minimap-progress" style={{ height: `${Math.max(8, scrollProgress * 100)}%` }} />{Array.from({ length: 8 }, (_, index) => <span key={index} className={`bk-minimap-section ${index < section ? "scanned" : ""}`} style={{ top: `${index * 12.5}%` }} />)}{issuePosition !== undefined && <b className="bk-minimap-issue" style={{ top: `${Math.min(96, Math.max(1, issuePosition * 100))}%` }} />}</div>}</div>;
}

function DeviceFrame({ model, browserEngine, orientation, scaleMode, previewZoom, url, scanning, previewRef, scrollProgress, issuePosition, onScroll, onUserInteraction, children }: { model: DeviceModel; browserEngine: BrowserEngine; orientation: DeviceOrientation; scaleMode: PreviewScaleMode; previewZoom: number; url: string; scanning?: boolean; previewRef?: RefObject<HTMLDivElement | null>; scrollProgress: number; issuePosition?: number; onScroll?: () => void; onUserInteraction?: () => void; children: ReactNode }) {
  const preview = <PreviewSurface scanning={scanning} previewRef={previewRef} scrollProgress={scrollProgress} issuePosition={issuePosition} onScroll={onScroll} onUserInteraction={onUserInteraction}>{children}</PreviewSurface>;
  if (model.preset) {
    const fittedZoom = model.kind === "phone" ? orientation === "portrait" ? .72 : .7 : orientation === "portrait" ? .48 : .58;
    const zoom = scaleMode === "actual" ? 1 : scaleMode === "custom" ? previewZoom / 100 : scaleMode === "fit-screen" ? fittedZoom * 1.18 : fittedZoom;
    return <div className={`bk-library-device ${model.kind} scale-${scaleMode}`} aria-label={`${model.label} device frame`}><BezelDeviceFrame className="bk-native-device-frame" device={model.preset.name} orientation={orientation} color={model.preset.defaultColor} zoom={zoom} contentClassName="bk-bezel-content">{preview}</BezelDeviceFrame></div>;
  }
  const browserClass = browserEngine === "webkit" ? "safari" : browserEngine === "firefox" ? "firefox" : "chrome";
  const hardwareClass = model.checkpointWidth >= 1440 ? "wide-display" : "laptop-display";
  return <div className={`bk-browser-frame ${hardwareClass} ${browserClass} scale-${scaleMode}`} style={scaleMode === "custom" ? { width: `${previewZoom}%`, height: `${previewZoom}%` } : undefined} aria-label={`${model.label} in ${browserLabels[browserEngine]}`}><div className="bk-browser-chrome"><span><i /><i /><i /></span><code>{url}</code><b /></div>{preview}</div>;
}

function DeviceGlyph({ model }: { model: DeviceModel }) {
  const Icon = model.kind === "phone" ? Smartphone : model.kind === "tablet" ? Tablet : model.checkpointWidth >= 1440 ? Monitor : Laptop;
  return <span className={`bk-device-glyph ${model.kind} ${model.platform.toLowerCase()}`}><Icon size={17} /><i /></span>;
}

function DevicePicker({ activeModel, orientation, recentIds, pinnedIds, onModelSelect, onOrientationChange, onTogglePin }: { activeModel: DeviceModel; orientation: DeviceOrientation; recentIds: DeviceModelId[]; pinnedIds: DeviceModelId[]; onModelSelect: (model: DeviceModel) => void; onOrientationChange: (orientation: DeviceOrientation) => void; onTogglePin: (id: DeviceModelId) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DeviceFilter>("recent");
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setOpen(true); }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);
  const normalizedQuery = query.trim().toLowerCase();
  const visibleModels = deviceModels.filter((model) => {
    if (normalizedQuery) return `${model.label} ${model.maker} ${model.platform}`.toLowerCase().includes(normalizedQuery);
    if (filter === "recent") return recentIds.includes(model.id);
    if (filter === "phone") return model.kind === "phone";
    if (filter === "tablet") return model.kind === "tablet";
    if (filter === "laptop") return model.kind === "desktop" && model.checkpointWidth < 1440;
    return model.kind === "desktop" && model.checkpointWidth >= 1440;
  });
  const groupedModels = visibleModels.reduce<Map<string, DeviceModel[]>>((groups, model) => {
    groups.set(model.maker, [...(groups.get(model.maker) ?? []), model]);
    return groups;
  }, new Map());
  const filters: Array<{ id: DeviceFilter; label: string }> = [{ id: "recent", label: "Recent" }, { id: "phone", label: "Phone" }, { id: "tablet", label: "Tablet" }, { id: "laptop", label: "Laptop" }, { id: "wide", label: "Wide" }];
  const pinned = pinnedIds.includes(activeModel.id);
  return <Popover.Root open={open} onOpenChange={(next) => { setOpen(next); if (!next) setQuery(""); }}>
    <Popover.Trigger className="bk-device-picker-trigger" aria-label={`Device shell: ${activeModel.label}`}><DeviceGlyph model={activeModel} /><span><small>Device shell · {activeModel.maker}</small><b>{activeModel.label}</b></span><em>{activeModel.width} × {activeModel.height}</em><ChevronDown size={16} /></Popover.Trigger>
    <Popover.Portal><Popover.Content className="bk-device-picker-popover" align="center" sideOffset={8} collisionPadding={12} onOpenAutoFocus={(event) => { event.preventDefault(); requestAnimationFrame(() => document.querySelector<HTMLInputElement>(".bk-device-search input")?.focus()); }}>
      <header><div><b>Choose a device</b><span>{deviceModels.length} emulation profiles</span></div><span className="bk-picker-actions"><button type="button" className={pinned ? "active" : ""} aria-label={pinned ? `Unpin ${activeModel.label}` : `Pin ${activeModel.label}`} onClick={() => onTogglePin(activeModel.id)}><Star size={15} fill={pinned ? "currentColor" : "none"} /></button><button type="button" aria-label="Close device picker" onClick={() => setOpen(false)}><X size={16} /></button></span></header>
      <label className="bk-device-search"><Search size={16} /><input aria-label="Search devices" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search iPhone, Pixel, Galaxy…" /><kbd>⌘K</kbd></label>
      <nav className="bk-device-filters" aria-label="Device categories">{filters.map((option) => <button type="button" key={option.id} className={filter === option.id && !normalizedQuery ? "active" : ""} onClick={() => { setFilter(option.id); setQuery(""); }}>{option.label}</button>)}</nav>
      <div className="bk-device-catalog">{groupedModels.size ? [...groupedModels].map(([group, models]) => <section key={group}><h3>{group}<span>{models.length}</span></h3><div>{models.map((model) => <button type="button" key={model.id} className={activeModel.id === model.id ? "active" : ""} aria-pressed={activeModel.id === model.id} onClick={() => { onModelSelect(model); setOpen(false); }}><DeviceGlyph model={model} /><span><b>{model.label}</b><small>{model.platform} · {model.width} × {model.height}</small></span>{activeModel.id === model.id ? <Check size={16} /> : <ArrowRight size={14} />}</button>)}</div></section>) : <div className="bk-device-no-results"><Search size={22} /><b>No matching devices</b><span>Try a model, maker, or platform.</span></div>}</div>
      {activeModel.kind !== "desktop" && <footer><span>Orientation</span><div role="group" aria-label="Device orientation"><button type="button" className={orientation === "portrait" ? "active" : ""} aria-pressed={orientation === "portrait"} onClick={() => onOrientationChange("portrait")}><Smartphone size={15} /> Portrait</button><button type="button" className={orientation === "landscape" ? "active" : ""} aria-pressed={orientation === "landscape"} onClick={() => onOrientationChange("landscape")}><Smartphone className="landscape" size={15} /> Landscape</button></div></footer>}
      <Popover.Arrow className="bk-device-picker-arrow" />
    </Popover.Content></Popover.Portal>
  </Popover.Root>;
}

function CheckpointSwitcher({ widths, activeWidth, browserEngine, previews, issues, onSelect }: { widths: number[]; activeWidth: number; browserEngine: BrowserEngine; previews: PersistedViewportPreview[]; issues: ResponsiveIssue[]; onSelect: (width: number) => void }) {
  const selectedWidth = activeWidth <= 600 ? widths.find((width) => width <= 600) : activeWidth <= 900 ? widths.find((width) => width > 600 && width <= 900) : activeWidth < 1440 ? widths.find((width) => width > 900 && width < 1440) : widths.find((width) => width >= 1440);
  const icon = (width: number) => width <= 600 ? <Smartphone size={18} /> : width <= 900 ? <Tablet size={18} /> : width < 1440 ? <Laptop size={19} /> : <Monitor size={19} />;
  return <div className="bk-checkpoint-control"><span>Captured checkpoints</span><div className="bk-device-switcher" role="group" aria-label="Captured checkpoints">{widths.map((width) => {
    const choice = deviceChoices.find((device) => device.width === width);
    const ready = previews.some((preview) => preview.width === width && (preview.browserEngine ?? "chromium") === browserEngine);
    const failed = issues.some((issue) => (issue.browserEngine ?? "chromium") === browserEngine && !isPageWideIssue(issue, widths) && issueAffectsWidth(issue, width));
    const selected = selectedWidth === width;
    return <button type="button" key={width} className={`${selected ? "active" : ""} ${failed ? "failed" : ready ? "ready" : ""}`} aria-label={`${choice?.label ?? "Custom"} ${width}px`} aria-pressed={selected} onClick={() => onSelect(width)}>{icon(width)}<span><b>{choice?.label ?? "Custom"}</b><small>{width}px</small></span></button>;
  })}</div></div>;
}

function BrowserSwitcher({ engines, activeEngine, activeWidth, routePath, previews, issues, onSelect }: { engines: BrowserEngine[]; activeEngine: BrowserEngine; activeWidth: number; routePath: string; previews: PersistedViewportPreview[]; issues: ResponsiveIssue[]; onSelect: (engine: BrowserEngine) => void }) {
  return <div className="bk-browser-control"><span>Browser</span><div className="bk-browser-switcher" role="group" aria-label="Test browser">{engines.map((engine) => {
    const ready = previews.some((preview) => preview.width === activeWidth && preview.routePath === routePath && (preview.browserEngine ?? "chromium") === engine);
    const failed = issues.some((issue) => issue.routePath === routePath && (issue.browserEngine ?? "chromium") === engine && issueAffectsWidth(issue, activeWidth));
    const status = failed ? "issues found" : ready ? "capture ready" : "capture unavailable";
    return <button type="button" key={engine} className={`${activeEngine === engine ? "active" : ""} ${failed ? "failed" : ready ? "ready" : "unavailable"}`} aria-label={`${browserLabels[engine]}, ${status}`} aria-pressed={activeEngine === engine} onClick={() => onSelect(engine)}><Image src={browserIcons[engine]} width={20} height={20} alt="" aria-hidden="true" unoptimized /><span><b>{browserLabels[engine]}</b><small>{failed ? "Issues" : ready ? "Ready" : "Not captured"}</small></span><i aria-hidden="true" /></button>;
  })}</div></div>;
}

function WorkspaceEmpty({ routeCount, minWidth, maxWidth, disabled, onRun }: { routeCount: number; minWidth: number; maxWidth: number; disabled: boolean; onRun: () => void }) {
  return <div className="bk-workspace-empty"><div className="bk-empty-browser"><span><i /><i /><i /></span><div><Smartphone size={21} /><Tablet size={22} /><Laptop size={23} /></div></div><h2>Ready to inspect every breakpoint</h2><p>Breakscope will render real checkpoints, sweep the responsive range, and capture evidence for the most important failures.</p><dl><div><dt>Routes</dt><dd>{routeCount}</dd></div><div><dt>Range</dt><dd>{minWidth}–{maxWidth}px</dd></div><div><dt>Checkpoints</dt><dd>4 devices</dd></div></dl><button type="button" disabled={disabled} onClick={onRun}><ArrowRight size={17} /> Run stress test</button></div>;
}

function DeviceScanPlaceholder({ phase, width, kind }: { phase: string; width: number; kind: DeviceKind }) {
  return <div className={`bk-device-scan-placeholder ${kind}`} role="status" aria-label={`${phase} at ${width} pixels`}>
    <header><span /><nav><i /><i /><i /></nav></header>
    <main><section><i /><i /><i /></section><section><i /><i /></section><section><i /><i /><i /></section></main>
    <footer><span className="bk-scan-glyph"><ScanSearch size={16} /></span><span><b>{phase}</b><small>{width}px · preparing first capture</small></span></footer>
  </div>;
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

function stableIssueSelector(issue: ResponsiveIssue) {
  const values = issue.measurements as Record<string, unknown>;
  if (typeof values.testId === "string" && values.testId) return `[data-testid="${values.testId}"]`;
  if (typeof values.id === "string" && values.id) return `#${CSS.escape(values.id)}`;
  if (typeof values.ariaLabel === "string" && values.ariaLabel) return `[aria-label="${values.ariaLabel}"]`;
  return issue.selector;
}

function selectorBreadcrumb(selector: string) {
  return selector.split(">" ).map((part) => part.trim()).filter(Boolean).slice(-4).join(" › ");
}

function IssueTypeIcon({ type, size = 16 }: { type: ResponsiveIssueType; size?: number }) {
  if (type === "image-alt") return <ImageOff size={size} />;
  if (type === "accessible-name") return <Accessibility size={size} />;
  if (type === "touch-target") return <Hand size={size} />;
  if (type === "overflow" || type === "offscreen") return <MoveHorizontal size={size} />;
  if (type === "clipping") return <Scissors size={size} />;
  if (type === "overlap" || type === "occlusion") return <Layers3 size={size} />;
  if (type === "disappearing") return <EyeOff size={size} />;
  return <AlertTriangle size={size} />;
}

function groupIssueFamilies(source: ResponsiveIssue[]) {
  const families = new Map<string, ResponsiveIssue[]>();
  for (const issue of source) families.set(issueFamilyKey(issue), [...(families.get(issueFamilyKey(issue)) ?? []), issue]);
  return [...families.values()];
}

function ViewportIssueInspector({ width, checkpointWidths, routePath, issues, pageWideIssues, selectedIssue, aiAnalysis, aiPending, aiError, retesting, url, onSelect, onClearSelection, onRetest, onAnalyze }: { width: number; checkpointWidths: number[]; routePath: string; issues: ResponsiveIssue[]; pageWideIssues: ResponsiveIssue[]; selectedIssue?: ResponsiveIssue; aiAnalysis?: AiIssueAnalysis; aiPending: boolean; aiError?: string; retesting: boolean; url: string; onSelect: (issue: ResponsiveIssue) => void; onClearSelection: () => void; onRetest: () => void; onAnalyze: (issue: ResponsiveIssue, mode: "concise" | "technical") => void }) {
  const [copiedPromptFor, setCopiedPromptFor] = useState("");
  const [analysisMode, setAnalysisMode] = useState<"concise" | "technical">("concise");
  const [briefOutcome, setBriefOutcome] = useState<"applied" | "unhelpful" | "">("");
  const [severityFilter, setSeverityFilter] = useState<"all" | ResponsiveIssue["severity"]>("all");
  const filteredIssues = useMemo(() => severityFilter === "all" ? issues : issues.filter((issue) => issue.severity === severityFilter), [issues, severityFilter]);
  const filteredPageWideIssues = useMemo(() => severityFilter === "all" ? pageWideIssues : pageWideIssues.filter((issue) => issue.severity === severityFilter), [pageWideIssues, severityFilter]);
  const issueFamilies = useMemo(() => groupIssueFamilies(filteredIssues), [filteredIssues]);
  const pageWideFamilies = useMemo(() => groupIssueFamilies(filteredPageWideIssues), [filteredPageWideIssues]);
  const renderFamilies = (families: ResponsiveIssue[][]) => families.map((family) => {
    const selected = family.some((issue) => selectedIssue?.fingerprint === issue.fingerprint);
    const issue = selected ? family.find((item) => item.fingerprint === selectedIssue?.fingerprint)! : family[0]!;
    const occurrenceIndex = family.findIndex((item) => item.fingerprint === issue.fingerprint);
    const selectOccurrence = (direction: -1 | 1) => onSelect(family[(occurrenceIndex + direction + family.length) % family.length]!);
    return <article key={issueFamilyKey(issue)} className={selected ? "active" : ""}>
      <button type="button" className="bk-viewport-issue-trigger" aria-expanded={selected} onClick={() => selected ? onClearSelection() : onSelect(issue)}><i aria-label={`${issue.type.replaceAll("-", " ")} issue`}><IssueTypeIcon type={issue.type} /></i><span><b>{issueFamilyTitle(issue, family.length)}</b><small>{issue.type.replaceAll("-", " ")} · {issue.severity} severity{family.length > 1 ? ` · ${family.length} occurrences` : ""}</small></span><ChevronDown size={16} /></button>
      {selected && <div className="bk-viewport-issue-detail">
        {family.length > 1 && <div className="bk-occurrence-nav"><span>Affected element</span><div><button type="button" aria-label="Previous affected element" onClick={() => selectOccurrence(-1)}><ChevronLeft size={15} /></button><output>{occurrenceIndex + 1} of {family.length}</output><button type="button" aria-label="Next affected element" onClick={() => selectOccurrence(1)}><ChevronRight size={15} /></button></div></div>}
        <p>{issue.description}</p>
        <dl><div><dt>{isPageWideIssue(issue, checkpointWidths) ? "Scope" : "Fails"}</dt><dd>{isPageWideIssue(issue, checkpointWidths) ? "Every checkpoint" : `${issue.failureRanges.map((range) => range.min === range.max ? range.min : `${range.min}–${range.max}`).join(", ")}px`}</dd></div><div><dt>Target</dt><dd><b>{issueTargetDescription(issue)}</b><small>Highlighted in the preview</small></dd></div><div><dt>Status</dt><dd>{issue.verification.replace("-", " ")}</dd></div></dl>
        <div className="bk-measurements"><span>Detector evidence</span>{Object.entries(issue.measurements).slice(0, 4).map(([key, value]) => <div key={key}><code>{key}</code><b>{String(value)}</b></div>)}</div>
        <section className="bk-element-context"><header><b>Element context</b><button type="button" onClick={() => void navigator.clipboard.writeText(stableIssueSelector(issue))}><Code2 size={13} /> Copy stable selector</button></header><dl><div><dt>DOM path</dt><dd>{selectorBreadcrumb(issue.selector)}</dd></div><div><dt>Stable target</dt><dd><code>{stableIssueSelector(issue)}</code></dd></div><div><dt>Element box</dt><dd>{issue.elementRect ? `${Math.round(issue.elementRect.width)} × ${Math.round(issue.elementRect.height)} at ${Math.round(issue.elementRect.x)}, ${Math.round(issue.elementRect.y)}` : "Not captured"}</dd></div></dl></section>
        <section className={`bk-ai-issue-review ${aiPending ? "is-loading" : ""}`} aria-busy={aiPending}>
          <header className="bk-ai-review-header"><span><WandSparkles size={14} /> AI repair brief</span>{aiAnalysis && <b>{Math.round(aiAnalysis.confidence * 100)}% confidence</b>}</header>
          <div className="bk-ai-mode" role="group" aria-label="Repair brief detail"><button type="button" className={analysisMode === "concise" ? "active" : ""} aria-pressed={analysisMode === "concise"} onClick={() => setAnalysisMode("concise")}>Concise</button><button type="button" className={analysisMode === "technical" ? "active" : ""} aria-pressed={analysisMode === "technical"} onClick={() => setAnalysisMode("technical")}>Technical</button></div>
          {aiPending ? <div className="bk-ai-loading" role="status"><div aria-hidden="true"><i /><span /><span /><span /></div><b>Building a focused repair</b><small>Reading the screenshot and detector evidence…</small></div> : aiAnalysis ? <div className="bk-ai-result">
            <section><span>What’s happening</span><p>{aiAnalysis.summary}</p></section>
            <section><span>Likely cause</span><p>{aiAnalysis.likelyCause}</p></section>
            <section className="bk-ai-recommendation"><span>Recommended fix</span><p>{aiAnalysis.recommendation}</p></section>
            {aiAnalysis.codeHint && <section className="bk-ai-code-direction"><span>Code direction</span><code>{aiAnalysis.codeHint}</code></section>}
          </div> : <div className="bk-ai-empty"><b>{aiError ? "Repair brief unavailable" : "Preparing repair brief"}</b><p>{aiError ? "Try again to rebuild the diagnosis for this selected target." : "Building a diagnosis and implementation direction for this selected target."}</p></div>}
          {!aiPending && aiError && <p className="bk-ai-error" role="alert">{aiError}</p>}
          {(aiAnalysis || aiError) && <div className={`bs-actions bk-ai-result-actions ${aiAnalysis ? "" : "single"}`}><button type="button" aria-label={aiAnalysis ? "Regenerate repair plan" : "Try again"} disabled={aiPending} onClick={() => onAnalyze(issue, analysisMode)}>{aiAnalysis ? <RefreshCw size={15} /> : <RotateCcw size={15} />}<span><b>{aiAnalysis ? "Regenerate" : "Try again"}</b><small>{analysisMode} brief</small></span></button>{aiAnalysis && <button type="button" aria-label={copiedPromptFor === issue.fingerprint ? "Prompt copied" : "Copy fix prompt"} onClick={() => void navigator.clipboard.writeText(repairPrompt(issue, url, aiAnalysis)).then(() => setCopiedPromptFor(issue.fingerprint))}>{copiedPromptFor === issue.fingerprint ? <Check size={15} /> : <MessageSquareCode size={15} />}<span><b>{copiedPromptFor === issue.fingerprint ? "Copied" : "Copy prompt"}</b><small>Implementation text</small></span></button>}</div>}
          {aiAnalysis && <div className="bk-ai-feedback" aria-label="Repair brief outcome"><span>Was this direction useful?</span><button type="button" className={briefOutcome === "applied" ? "active" : ""} onClick={() => setBriefOutcome("applied")}><Check size={13} /> Applied</button><button type="button" className={briefOutcome === "unhelpful" ? "active" : ""} onClick={() => setBriefOutcome("unhelpful")}><X size={13} /> Not helpful</button></div>}
          <small>The brief runs automatically for the selected target. Regenerate only when you want a new direction.</small>
        </section>
        <div className="bs-actions bk-issue-actions"><button type="button" aria-label="Copy selector" onClick={() => void navigator.clipboard.writeText(issue.selector)}><Code2 size={15} /><span><b>Copy selector</b><small>CSS target</small></span></button><button type="button" aria-label="Copy issue" onClick={() => void navigator.clipboard.writeText(issueMarkdown(issue, url))}><FileText size={15} /><span><b>Copy issue</b><small>Share finding</small></span></button><a aria-label="Open page" href={new URL(issue.routePath, url).toString()} target="_blank" rel="noreferrer"><ExternalLink size={15} /><span><b>Open page</b><small>New tab</small></span></a></div>
      </div>}
    </article>;
  });
  return <div className="bk-viewport-inspector">
    <header><div><span>Viewport status</span><h2>{width}px · {issues.length ? "Needs attention" : "Passed"}</h2><p><code>{routePath}</code> · {issues.length ? `${groupIssueFamilies(issues).length} responsive ${groupIssueFamilies(issues).length === 1 ? "issue" : "issues"} at this checkpoint` : "No responsive failures at this checkpoint"}</p></div><b aria-label={issues.length ? `${groupIssueFamilies(issues).length} responsive issues` : "Responsive checks passed"}>{issues.length || "OK"}</b></header>
    {(issues.length + pageWideIssues.length) > 0 && <div className="bk-inventory-filter"><span>{issues.length + pageWideIssues.length} findings</span><label>Severity<select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value as typeof severityFilter)}><option value="all">All</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label></div>}
    <button type="button" className="bk-targeted-retest" disabled={retesting} onClick={onRetest}>{retesting ? <LoaderCircle className="spin" size={15} /> : <RefreshCw size={15} />}<span><b>{retesting ? "Retesting checkpoint…" : `Retest ${width}px checkpoint`}</b><small>Refresh findings without rerunning the full test</small></span></button>
    {filteredPageWideIssues.length > 0 && <section className="bk-page-wide-findings"><header><div><b>Page-wide checks</b><span>Independent of viewport size</span></div><em>{pageWideFamilies.length} {pageWideFamilies.length === 1 ? "family" : "families"} · {filteredPageWideIssues.length} {filteredPageWideIssues.length === 1 ? "element" : "elements"}</em></header><div className="bk-viewport-issue-list">{renderFamilies(pageWideFamilies)}</div></section>}
    {filteredIssues.length ? <div className="bk-viewport-issue-list">{renderFamilies(issueFamilies)}</div> : issues.length ? <p className="bk-inventory-filter-empty">No {severityFilter} responsive findings at this checkpoint.</p> : <details className="bk-viewport-clear"><summary><Check size={16} /><b>No responsive issues at {width}px</b><ChevronDown size={14} /></summary><p>All viewport-dependent checks passed at this checkpoint.</p></details>}
  </div>;
}

function sampleSignature(sample: ViewportSample) {
  return analyzeResponsiveSamples([sample]).allIssues.map((issue) => issue.fingerprint).sort().join("|");
}

function boundedPreviews(source: PersistedViewportPreview[]) {
  let retained = 0;
  const kept: PersistedViewportPreview[] = [];
  for (const preview of [...source].reverse()) {
    if (retained + preview.image.byteLength > evidenceLimitBytes) continue;
    kept.push(preview);
    retained += preview.image.byteLength;
  }
  return kept.reverse();
}

export function BreakscopeWorkspace() {
  const queryClient = useQueryClient();
  const workspaceQuery = useQuery(workspaceStateQueryOptions());
  const [url, setUrl] = useState("http://localhost:3000");
  const [issueDisplayWidth, setIssueDisplayWidth] = useState<number>();
  const [routes, setRoutes] = useState<string[]>([]);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  const [minWidth, setMinWidth] = useState(320);
  const [maxWidth, setMaxWidth] = useState(1440);
  const [deviceWidths, setDeviceWidths] = useState<number[]>([375, 768, 1280, 1440]);
  const [previews, setPreviews] = useState<PersistedViewportPreview[]>([]);
  const [activePreviewWidth, setActivePreviewWidth] = useState(375);
  const [activeBrowserEngine, setActiveBrowserEngine] = useState<BrowserEngine>("chromium");
  const [browserEngines, setBrowserEngines] = useState<BrowserEngine[]>(allBrowserEngines);
  const [activeDeviceModelId, setActiveDeviceModelId] = useState<DeviceModelId>("iphone-17-pro");
  const [deviceOrientation, setDeviceOrientation] = useState<DeviceOrientation>("portrait");
  const [previewScaleMode, setPreviewScaleMode] = useState<PreviewScaleMode>("fit-device");
  const [previewZoom, setPreviewZoom] = useState(72);
  const [recentDeviceIds, setRecentDeviceIds] = useState<DeviceModelId[]>(["iphone-17-pro"]);
  const [pinnedDeviceIds, setPinnedDeviceIds] = useState<DeviceModelId[]>([]);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, width: 0, route: "", phase: "Preparing" });
  const [scanStage, setScanStage] = useState(0);
  const [result, setResult] = useState<ResultState>({ issues: [], fixed: [], suppressedCount: 0, checks: [], hasScanned: false });
  const [error, setError] = useState("");
  const [configCollapsed, setConfigCollapsed] = useState(false);
  const [, setInspectorTab] = useState<InspectorTab>("activity");
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>("failing");
  const [aiReviews, setAiReviews] = useState<Record<string, AiIssueAnalysis>>({});
  const [aiIssueError, setAiIssueError] = useState("");
  const [inspectorWidth, setInspectorWidth] = useState(380);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const scanController = useRef<AbortController | undefined>(undefined);
  const scanPreviewRef = useRef<HTMLDivElement | null>(null);
  const issuePreviewRef = useRef<HTMLDivElement | null>(null);
  const inspectorResizeRef = useRef<{ startX: number; startWidth: number } | undefined>(undefined);
  const autoReviewAttempted = useRef(new Set<string>());
  const manualPauseUntil = useRef(0);
  const didHydrate = useRef(false);
  const handledScanRequest = useRef<string | undefined>(undefined);
  const selectedRouteSet = useMemo(() => new Set(selectedRoutes), [selectedRoutes]);
  const availableRoutes = useMemo(() => routes.filter((route) => !selectedRouteSet.has(route)), [routes, selectedRouteSet]);
  const { issues, fixed, suppressedCount, activeIssue, hasScanned } = result;
  const retainedEvidenceBytes = useMemo(() => previews.reduce((total, preview) => total + preview.image.byteLength, 0) + issues.reduce((total, issue) => total + (issue.screenshot?.byteLength ?? 0) + (issue.passingScreenshot?.byteLength ?? 0), 0), [previews, issues]);
  const scanMutation = useMutation({ mutationKey: breakscopeQueryKeys.scan(), mutationFn: runScanWorkflow });
  const viewportRetryMutation = useMutation({
    mutationKey: [...breakscopeQueryKeys.all, "viewport-retry"],
    mutationFn: async (request: { kind: "checkpoint" | "issue"; width: number; routePath: string; browserEngine?: BrowserEngine; issueFingerprint?: string; evidenceMode?: ComparisonMode }) => {
      const model = modelForWidth(request.width); const browserEngine = request.browserEngine ?? activeBrowserEngine;
      const captured = await capturePageLocally({ url, routePath: request.routePath, viewport: request.width <= 600 ? "mobile" : "desktop", width: request.width, height: 900, profile: captureProfile(model, browserEngine) });
      return { request, image: await captured.image.arrayBuffer(), documentHeight: captured.snapshot.documentHeight };
    },
    onMutate: () => setError(""),
    onSuccess: async ({ request, image, documentHeight }) => {
      setError("");
      const stored = queryClient.getQueryData<BreakscopeState>(breakscopeQueryKeys.workspace()) ?? await loadBreakscopeState();
      if (request.kind === "checkpoint") {
        const preview: PersistedViewportPreview = { width: request.width, label: deviceChoices.find((device) => device.width === request.width)?.label ?? "Custom", routePath: request.routePath, browserEngine: request.browserEngine ?? activeBrowserEngine, image };
        const nextPreviews = [...(stored.latestPreviews ?? previews).filter((item) => !(item.width === request.width && item.routePath === request.routePath && (item.browserEngine ?? "chromium") === preview.browserEngine)), preview].sort((a, b) => a.width - b.width);
        const nextState = { ...stored, latestPreviews: nextPreviews, updatedAt: Date.now() };
        setPreviews(nextPreviews);
        queryClient.setQueryData(breakscopeQueryKeys.workspace(), nextState);
        await saveBreakscopeState(nextState);
        return;
      }
      const patchIssue = (issue: ResponsiveIssue) => issue.fingerprint !== request.issueFingerprint ? issue : request.evidenceMode === "passing" ? { ...issue, passingScreenshot: image } : { ...issue, screenshot: image, documentHeight };
      const nextIssues = stored.latestIssues.map(patchIssue);
      const nextState = { ...stored, latestIssues: nextIssues, updatedAt: Date.now() };
      setResult((current) => ({ ...current, issues: current.issues.map(patchIssue), activeIssue: current.activeIssue ? patchIssue(current.activeIssue) : undefined }));
      queryClient.setQueryData(breakscopeQueryKeys.workspace(), nextState);
      await saveBreakscopeState(nextState);
    },
    onError: (reason) => setError(reason instanceof Error ? `Could not recapture this viewport: ${reason.message}` : "Could not recapture this viewport"),
  });
  const targetedRetestMutation = useMutation({
    mutationKey: [...breakscopeQueryKeys.all, "targeted-retest"],
    mutationFn: async ({ width, routePath, browserEngine }: { width: number; routePath: string; browserEngine: BrowserEngine }) => {
      const sampleWidths = [...new Set([Math.max(minWidth, width - 1), width, Math.min(maxWidth, width + 1)])];
      const profile = captureProfile(modelForWidth(width), browserEngine);
      const samples = await scanRouteLocally({ url, routePath, widths: sampleWidths, height: 900, profile });
      const analysis = analyzeResponsiveSamples(samples);
      const captured = await capturePageLocally({ url, routePath, viewport: width <= 600 ? "mobile" : "desktop", width, height: 900, profile });
      const screenshot = await captured.image.arrayBuffer();
      return { width, routePath, browserEngine, fresh: analysis.issues.map((issue) => ({ ...issue, screenshot, documentHeight: captured.snapshot.documentHeight })) };
    },
    onMutate: () => setError(""),
    onSuccess: async ({ width, routePath, browserEngine, fresh }) => {
      const stored = queryClient.getQueryData<BreakscopeState>(breakscopeQueryKeys.workspace()) ?? await loadBreakscopeState();
      const keep = (issue: ResponsiveIssue) => !((issue.browserEngine ?? "chromium") === browserEngine && issue.routePath === routePath && issueAffectsWidth(issue, width));
      const nextIssues = [...stored.latestIssues.filter(keep), ...fresh];
      const next = { ...stored, latestIssues: nextIssues, latestManifest: nextIssues.map((issue) => ({ ...issue, screenshot: undefined, passingScreenshot: undefined })), updatedAt: Date.now() };
      setResult((current) => ({ ...current, issues: [...current.issues.filter(keep), ...fresh], activeIssue: fresh[0] }));
      queryClient.setQueryData(breakscopeQueryKeys.workspace(), next);
      await saveBreakscopeState(next);
    },
    onError: (reason) => setError(reason instanceof Error ? `Checkpoint retest failed: ${reason.message}` : "Checkpoint retest failed"),
  });
  const aiIssueMutation = useMutation({
    mutationKey: [...breakscopeQueryKeys.all, "ai-issue"],
    mutationFn: async ({ issue, mode = "concise" }: { issue: ResponsiveIssue; mode?: "concise" | "technical" }) => {
      const screenshot = await imageDataUrl(issue.screenshot);
      const response = await fetch("/api/ai/responsive-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          width: issue.evidenceWidth,
          mode,
          screenshot,
          issue: { title: issue.title, description: issue.description, type: issue.type, selector: issue.selector, routePath: issue.routePath, failureRanges: issue.failureRanges, measurements: issue.measurements },
        }),
      });
      const payload = await response.json().catch(() => ({})) as { analysis?: AiIssueAnalysis; error?: string };
      if (!response.ok || !payload.analysis) throw new Error(safeAiError(response.status, payload.error));
      return { fingerprint: issue.fingerprint, analysis: payload.analysis };
    },
    onMutate: () => setAiIssueError(""),
    onSuccess: ({ fingerprint, analysis }) => setAiReviews((current) => ({ ...current, [fingerprint]: analysis })),
    onError: (reason) => setAiIssueError(reason instanceof Error ? reason.message : "AI could not analyze this issue."),
  });
  const scanning = scanMutation.isPending;

  useEffect(() => {
    if (!activeIssue || aiReviews[activeIssue.fingerprint] || aiIssueMutation.isPending || autoReviewAttempted.current.has(activeIssue.fingerprint)) return;
    autoReviewAttempted.current.add(activeIssue.fingerprint);
    aiIssueMutation.mutate({ issue: activeIssue });
  }, [activeIssue, aiIssueMutation, aiReviews]);

  useEffect(() => {
    const state = workspaceQuery.data;
    if (!state || didHydrate.current) return;
    didHydrate.current = true;
    queueMicrotask(() => {
    if (state.target) {
      setUrl(state.target.url); setRoutes(state.availableRoutes?.length ? state.availableRoutes : state.target.selectedRoutes); setSelectedRoutes(state.target.selectedRoutes); setMinWidth(state.target.minWidth); setMaxWidth(state.target.maxWidth);
      if (state.target.deviceWidths?.length) { setDeviceWidths(state.target.deviceWidths); setActivePreviewWidth(state.target.deviceWidths[0]!); }
      const configuredBrowsers = state.target.browserEngines?.length ? state.target.browserEngines : allBrowserEngines;
      setBrowserEngines(configuredBrowsers);
      setActiveBrowserEngine(state.ui?.activeBrowserEngine && configuredBrowsers.includes(state.ui.activeBrowserEngine) ? state.ui.activeBrowserEngine : configuredBrowsers[0]!);
      if (!state.availableRoutes?.length) void discoverRoutesLocally({ url: state.target.url }).then(({ routes: discovered }) => {
        const restoredRoutes = [...new Set([...state.target!.selectedRoutes, ...discovered])].slice(0, 10);
        setRoutes(restoredRoutes);
        const updatedAt = Date.now();
        const next = { ...(queryClient.getQueryData<BreakscopeState>(breakscopeQueryKeys.workspace()) ?? state), availableRoutes: restoredRoutes, updatedAt };
        queryClient.setQueryData(breakscopeQueryKeys.workspace(), next);
        return saveBreakscopeState(next);
      }).catch(() => undefined);
    }
    const restoredPreviews = state.scanRequest ? [] : state.latestPreviews ?? [];
    setPreviews(restoredPreviews);
    if (state.ui?.selectedDeviceModelId && deviceModels.some((model) => model.id === state.ui?.selectedDeviceModelId)) setActiveDeviceModelId(state.ui.selectedDeviceModelId as DeviceModelId);
    if (state.ui?.deviceOrientation) setDeviceOrientation(state.ui.deviceOrientation);
    if (state.ui?.previewScaleMode) setPreviewScaleMode(state.ui.previewScaleMode);
    if (state.ui?.previewZoom) setPreviewZoom(state.ui.previewZoom);

    if (state.ui?.recentDeviceIds) setRecentDeviceIds(state.ui.recentDeviceIds.filter((id): id is DeviceModelId => deviceModels.some((model) => model.id === id)).slice(0, 8));
    if (state.ui?.pinnedDeviceIds) setPinnedDeviceIds(state.ui.pinnedDeviceIds.filter((id): id is DeviceModelId => deviceModels.some((model) => model.id === id)));
    const firstIssue = state.latestIssues[0];
    setResult((current) => ({ ...current, issues: state.scanRequest ? [] : state.latestIssues, activeIssue: state.scanRequest ? undefined : firstIssue, hasScanned: state.scanRequest ? false : Boolean(state.latestIssues.length || restoredPreviews.length) }));
    if (firstIssue) setInspectorTab("issue");
    setPreferencesReady(true);
    });
  }, [queryClient, workspaceQuery.data]);

  useEffect(() => {
    if (workspaceQuery.isError && !preferencesReady) queueMicrotask(() => setPreferencesReady(true));
  }, [preferencesReady, workspaceQuery.isError]);

  useEffect(() => {
    const request = workspaceQuery.data?.scanRequest;
    if (!preferencesReady || !request || scanning || handledScanRequest.current === request.id) return;
    handledScanRequest.current = request.id;
    const current = queryClient.getQueryData<BreakscopeState>(breakscopeQueryKeys.workspace());
    if (!current) return;
    const next = { ...current, scanRequest: undefined, updatedAt: Date.now() };
    queryClient.setQueryData(breakscopeQueryKeys.workspace(), next);
    void saveBreakscopeState(next).then(() => scanMutation.mutate()).catch((reason) => {
      handledScanRequest.current = undefined;
      setError(reason instanceof Error ? reason.message : "Could not start the scan");
    });
  }, [preferencesReady, queryClient, scanMutation, scanning, workspaceQuery.data?.scanRequest]);

  useEffect(() => {
    const job = workspaceQuery.data?.scanJob;
    if (!preferencesReady || scanning || workspaceQuery.data?.scanRequest || !job || !["running", "paused"].includes(job.status) || handledScanRequest.current === job.id) return;
    handledScanRequest.current = job.id;
    scanMutation.mutate();
  }, [preferencesReady, scanMutation, scanning, workspaceQuery.data?.scanJob, workspaceQuery.data?.scanRequest]);

  useEffect(() => {
    if (!preferencesReady || scanning) return;
    const timer = window.setTimeout(() => {
      const state = queryClient.getQueryData<BreakscopeState>(breakscopeQueryKeys.workspace());
      if (!state) return;
      const next = { ...state, ui: { selectedDeviceModelId: activeDeviceModelId, deviceOrientation, recentDeviceIds, pinnedDeviceIds, previewScaleMode, previewZoom, activeBrowserEngine }, updatedAt: Date.now() };
      queryClient.setQueryData(breakscopeQueryKeys.workspace(), next);
      void saveBreakscopeState(next).catch(() => undefined);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [activeBrowserEngine, activeDeviceModelId, deviceOrientation, pinnedDeviceIds, preferencesReady, previewScaleMode, previewZoom, queryClient, recentDeviceIds, scanning]);

  useEffect(() => {
    const preview = scanPreviewRef.current;
    if (!scanning || !preview || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (Date.now() < manualPauseUntil.current) return;
      const maxScroll = Math.max(0, preview.scrollHeight - preview.clientHeight);
      const next = preview.scrollTop + preview.clientHeight * .82;
      const top = next >= maxScroll - 4 ? 0 : next;
      if (typeof preview.scrollTo === "function") preview.scrollTo({ top, behavior: "smooth" });
      else preview.scrollTop = top;
    }, 1900);
    return () => window.clearInterval(timer);
  }, [activePreviewWidth, scanning]);

  const revealActiveIssue = useCallback(() => {
    const preview = issuePreviewRef.current;
    const rect = activeIssue?.elementRect;
    if (!preview || !activeIssue || comparisonMode !== "failing") return;
    const documentHeight = Math.max(1, activeIssue.documentHeight ?? preview.scrollHeight);
    const targetCenter = ((rect?.y ?? 0) + (rect?.height ?? 40) / 2) / documentHeight * preview.scrollHeight;
    const maxScroll = Math.max(0, preview.scrollHeight - preview.clientHeight);
    const top = Math.min(maxScroll, Math.max(0, targetCenter - preview.clientHeight / 2));
    const behavior: ScrollBehavior = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    setScrollProgress(top / Math.max(1, maxScroll));
    if (typeof preview.scrollTo === "function") preview.scrollTo({ top, behavior });
    else preview.scrollTop = top;
  }, [activeIssue, comparisonMode]);

  useEffect(() => {
    if (!activeIssue || comparisonMode !== "failing") return;
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => { secondFrame = window.requestAnimationFrame(revealActiveIssue); });
    return () => { window.cancelAnimationFrame(firstFrame); window.cancelAnimationFrame(secondFrame); };
  }, [activeIssue, comparisonMode, revealActiveIssue]);

  function updatePreviewProgress() {
    const preview = scanPreviewRef.current;
    if (!preview) return;
    setScrollProgress(preview.scrollTop / Math.max(1, preview.scrollHeight - preview.clientHeight));
  }

  function pauseStagedScan() { manualPauseUntil.current = Date.now() + 3500; }
  function toggleRoute(route: string) { setSelectedRoutes((current) => current.includes(route) ? current.filter((item) => item !== route) : current.length < 5 ? [...current, route] : current); }

  async function refineBoundaries(routePath: string, initial: ViewportSample[], signal: AbortSignal, profile: CaptureProfile) {
    const samples = [...initial];
    let ranges = samples.slice(0, -1).map((left, index) => ({ left, right: samples[index + 1]! })).filter(({ left, right }) => sampleSignature(left) !== sampleSignature(right));
    for (let iteration = 0; iteration < 10 && ranges.some(({ left, right }) => right.width - left.width > 2); iteration += 1) {
      const active = ranges.filter(({ left, right }) => right.width - left.width > 2);
      const widths = [...new Set(active.map(({ left, right }) => Math.floor((left.width + right.width) / 2)))];
      setScanStage((current) => Math.max(current, 3));
      setProgress((current) => ({ ...current, width: widths[0] ?? current.width, route: routePath, phase: "Refining breakpoints" }));
      const middleSamples = await scanRouteLocally({ url, routePath, widths, height: 900, profile }, signal);
      samples.push(...middleSamples);
      const middleByWidth = new Map(middleSamples.map((sample) => [sample.width, sample]));
      ranges = ranges.map((range) => {
        if (range.right.width - range.left.width <= 2) return range;
        const middle = middleByWidth.get(Math.floor((range.left.width + range.right.width) / 2))!;
        return sampleSignature(middle) === sampleSignature(range.left) ? { left: middle, right: range.right } : { left: range.left, right: middle };
      });
    }
    return samples;
  }

  async function runScanWorkflow() {
    setInspectorTab("activity"); setError(""); setScrollProgress(0); setScanStage(0); setIssueDisplayWidth(undefined); setResult((current) => ({ ...current, fixed: [], activeIssue: undefined, hasScanned: false }));
    const controller = new AbortController(); scanController.current = controller;
    try {
      const stored = queryClient.getQueryData<BreakscopeState>(breakscopeQueryKeys.workspace()) ?? await loadBreakscopeState();
      const resumable = stored.scanJob && ["running", "paused", "failed"].includes(stored.scanJob.status) && stored.scanJob.url === url && stored.scanJob.routes.join("|") === selectedRoutes.join("|") && stored.scanJob.browserEngines.join("|") === browserEngines.join("|");
      let scanJob: PersistedScanJob = resumable ? { ...stored.scanJob!, status: "running", updatedAt: Date.now() } : { id: crypto.randomUUID(), status: "running", url, routes: selectedRoutes, widths: deviceWidths, browserEngines, completedCheckpoints: [], completedRouteScans: [], samples: [], errors: [], createdAt: Date.now(), updatedAt: Date.now() };
      let persistChain = Promise.resolve();
      const persistJob = () => {
        scanJob = { ...scanJob, updatedAt: Date.now() };
        const current = queryClient.getQueryData<BreakscopeState>(breakscopeQueryKeys.workspace()) ?? stored;
        const next = { ...current, scanJob, updatedAt: Date.now() };
        queryClient.setQueryData(breakscopeQueryKeys.workspace(), next);
        persistChain = persistChain.then(() => saveBreakscopeState(next));
        return persistChain;
      };
      await persistJob();
      setScanStage(1);
      const sameTarget = stored.target?.url === url;
      const previous = sameTarget ? (stored.latestManifest ?? stored.latestIssues).filter((issue) => selectedRouteSet.has(issue.routePath)) : [];
      const widths = [...new Set([minWidth, ...defaultWidths.filter((width) => width > minWidth && width < maxWidth), maxWidth])].sort((a, b) => a - b);
      const samples: ViewportSample[] = [...scanJob.samples]; const routeErrors: string[] = [...scanJob.errors]; const capturedPreviews: PersistedViewportPreview[] = resumable ? [...(stored.latestPreviews ?? [])] : [];
      setProgress({ current: 0, total: selectedRoutes.length, width: minWidth, route: selectedRoutes[0]!, phase: resumable ? "Resuming scan" : "Sweeping geometry" }); setPreviews(capturedPreviews);
      const previewTask = (async () => {
        for (const browserEngine of browserEngines) for (const width of deviceWidths) {
          if (controller.signal.aborted) break;
          const checkpointKey = `${browserEngine}:${selectedRoutes[0]}:${width}`;
          if (scanJob.completedCheckpoints.includes(checkpointKey)) continue;
          setProgress((current) => ({ ...current, width, phase: `Rendering ${width}px checkpoint` }));
          try {
            const model = modelForWidth(width);
            const captured = await capturePageLocally({ url, routePath: selectedRoutes[0]!, viewport: width <= 600 ? "mobile" : "desktop", width, height: 900, profile: captureProfile(model, browserEngine) }, controller.signal);
            const preview = { width, label: deviceChoices.find((device) => device.width === width)?.label ?? "Custom", routePath: selectedRoutes[0]!, browserEngine, deviceModelId: model.id, image: await captured.image.arrayBuffer() };
            capturedPreviews.push(preview);
            const nextPreviews = [...capturedPreviews].sort((a, b) => a.width - b.width);
            setPreviews(nextPreviews);
            queryClient.setQueryData<BreakscopeState>(breakscopeQueryKeys.workspace(), (current) => current ? { ...current, latestPreviews: nextPreviews } : current);
            scanJob = { ...scanJob, completedCheckpoints: [...scanJob.completedCheckpoints, checkpointKey] };
            await persistJob();
            setActivePreviewWidth(width);
          } catch (reason) {
            if (reason instanceof DOMException && reason.name === "AbortError") break;
            const detail = reason instanceof Error ? reason.message : "Capture failed";
            routeErrors.push(`${browserLabels[browserEngine]} ${selectedRoutes[0]} at ${width}px: ${detail.split("\n")[0]?.slice(0, 180)}`);
          }
        }
      })();
      const routeTasks = browserEngines.flatMap((browserEngine) => selectedRoutes.map((routePath, index) => ({ browserEngine, routePath, index })));
      await previewTask;
      setScanStage(2);
      const settled = await Promise.allSettled(routeTasks.map(async ({ browserEngine, routePath, index }) => {
        const routeKey = `${browserEngine}:${routePath}`;
        if (scanJob.completedRouteScans.includes(routeKey)) return [];
        setProgress({ current: index, total: selectedRoutes.length, width: minWidth, route: routePath, phase: "Sweeping geometry" });
        const profile = captureProfile(modelForWidth(minWidth), browserEngine);
        const routeSamples = await refineBoundaries(routePath, await scanRouteLocally({ url, routePath, widths, height: 900, profile }, controller.signal), controller.signal, profile);
        scanJob = { ...scanJob, completedRouteScans: [...scanJob.completedRouteScans, routeKey], samples: [...scanJob.samples, ...routeSamples] };
        await persistJob();
        return routeSamples;
      }));
      settled.forEach((settledResult, index) => {
        if (settledResult.status === "fulfilled") samples.push(...settledResult.value);
        else {
          const task = routeTasks[index]!;
          const detail = settledResult.reason instanceof Error ? settledResult.reason.message : "Capture failed";
          routeErrors.push(`${browserLabels[task.browserEngine]} ${task.routePath}: ${detail.split("\n")[0]?.slice(0, 220)}`);
        }
      });
      scanJob = { ...scanJob, errors: routeErrors };
      await persistJob();
      if (controller.signal.aborted) throw new DOMException("Scan cancelled", "AbortError");
      const analysis = analyzeResponsiveSamples(samples, previous.map((issue) => issue.fingerprint));
      setScanStage(4);
      setProgress({ current: selectedRoutes.length, total: selectedRoutes.length, width: analysis.issues[0]?.evidenceWidth ?? minWidth, route: analysis.issues[0]?.routePath ?? selectedRoutes[0]!, phase: "Capturing evidence" });
      const withEvidence = await Promise.all(analysis.issues.map(async (issue) => {
        const profile = captureProfile(modelForWidth(issue.evidenceWidth), issue.browserEngine ?? "chromium");
        const [captured, passing] = await Promise.all([capturePageLocally({ url, routePath: issue.routePath, viewport: issue.evidenceWidth <= 600 ? "mobile" : "desktop", width: issue.evidenceWidth, height: 900, profile }, controller.signal), issue.lastWorkingWidth ? capturePageLocally({ url, routePath: issue.routePath, viewport: issue.lastWorkingWidth <= 600 ? "mobile" : "desktop", width: issue.lastWorkingWidth, height: 900, profile }, controller.signal) : undefined]);
        return { ...issue, screenshot: await captured.image.arrayBuffer(), documentHeight: captured.snapshot.documentHeight, ...(passing ? { passingScreenshot: await passing.image.arrayBuffer() } : {}) };
      }));
      const currentFingerprints = new Set(analysis.allIssues.map((issue) => issue.fingerprint));
      const fixedIssues = previous.filter((issue) => !currentFingerprints.has(issue.fingerprint)).map((issue) => ({ ...issue, verification: "fixed" as const, screenshot: undefined }));
      const firstIssue = withEvidence[0];
      autoReviewAttempted.current.clear();
      setAiReviews({});
      setResult({ issues: withEvidence, fixed: fixedIssues, suppressedCount: analysis.suppressedCount, checks: analysis.checks, activeIssue: firstIssue, hasScanned: true });
      setInspectorTab(firstIssue ? "issue" : "checks"); setComparisonMode("failing");
      const now = Date.now();
      const target: TestTarget = { id: "current", name: new URL(url).host, url, selectedRoutes, minWidth, maxWidth, executionMode: "local", deviceWidths, browserEngines, createdAt: stored.target?.createdAt ?? now, updatedAt: now };
      scanJob = { ...scanJob, status: routeErrors.length ? "failed" : "completed", errors: routeErrors, updatedAt: now };
      const finalPreviews = boundedPreviews(capturedPreviews);
      setPreviews(finalPreviews);
      const run: LocalScanRun = { id: crypto.randomUUID(), createdAt: now, target, issues: withEvidence, previews: finalPreviews, suppressedCount: analysis.suppressedCount };
      const nextState: BreakscopeState = { ...stored, availableRoutes: routes, target, latestIssues: withEvidence, latestManifest: analysis.allIssues.map((issue) => ({ ...issue, screenshot: undefined, passingScreenshot: undefined })), latestPreviews: finalPreviews, scanHistory: [run, ...(stored.scanHistory ?? [])].slice(0, 5), scanJob, ui: { selectedDeviceModelId: activeDeviceModelId, deviceOrientation, recentDeviceIds, pinnedDeviceIds, previewScaleMode, previewZoom, activeBrowserEngine }, updatedAt: now };
      queryClient.setQueryData(breakscopeQueryKeys.workspace(), nextState);
      await saveBreakscopeState(nextState);
      if (routeErrors.length) setError(`Some routes could not be scanned: ${routeErrors.join(" · ")}`);
    } catch (reason) {
      const aborted = reason instanceof DOMException && reason.name === "AbortError";
      const current = queryClient.getQueryData<BreakscopeState>(breakscopeQueryKeys.workspace());
      if (current?.scanJob) {
        const next = { ...current, scanJob: { ...current.scanJob, status: aborted ? "paused" as const : "failed" as const, updatedAt: Date.now() }, updatedAt: Date.now() };
        queryClient.setQueryData(breakscopeQueryKeys.workspace(), next);
        await saveBreakscopeState(next).catch(() => undefined);
      }
      if (!aborted) setError(reason instanceof Error ? reason.message : "Stress test failed");
    }
    finally { scanController.current = undefined; }
  }

  function scan() {
    if (!isCaptureUrl(url) || !selectedRoutes.length || scanning || minWidth >= maxWidth) return;
    scanMutation.mutate();
  }

  const activePreview = previews.find((preview) => preview.width === activePreviewWidth && (preview.browserEngine ?? "chromium") === activeBrowserEngine);
  const displayedWidth = activeIssue
    ? comparisonMode === "passing" && activeIssue.lastWorkingWidth
      ? activeIssue.lastWorkingWidth
      : issueDisplayWidth ?? activeIssue.evidenceWidth
    : activePreviewWidth;
  const displayedDevice: DeviceKind = displayedWidth <= 600 ? "phone" : displayedWidth <= 900 ? "tablet" : "desktop";
  const selectedModel = deviceModels.find((model) => model.id === activeDeviceModelId) ?? deviceModels[0]!;
  const displayedModel = selectedModel.kind === displayedDevice && (displayedDevice !== "desktop" || (displayedWidth >= 1440 ? selectedModel.checkpointWidth >= 1440 : selectedModel.checkpointWidth < 1440)) ? selectedModel : modelForWidth(displayedWidth);
  const hasExactIssueEvidence = activeIssue?.evidenceWidth === displayedWidth;
  const issueImage = comparisonMode === "passing" ? activeIssue?.passingScreenshot : hasExactIssueEvidence ? activeIssue?.screenshot : activePreview?.image;
  const reviewedRoute = activeIssue?.routePath ?? selectedRoutes[0];
  const navigableIssues = issues.filter((issue) => (issue.browserEngine ?? "chromium") === activeBrowserEngine && issue.routePath === reviewedRoute);
  const activeIssueIndex = activeIssue ? navigableIssues.findIndex((issue) => issue.fingerprint === activeIssue.fingerprint) : -1;
  const checkpointTotal = deviceWidths.length * browserEngines.length;
  const readyCheckpointCount = Math.min(checkpointTotal, new Set(previews.filter((preview) => browserEngines.includes(preview.browserEngine ?? "chromium") && preview.routePath === selectedRoutes[0] && deviceWidths.includes(preview.width)).map((preview) => `${preview.browserEngine ?? "chromium"}:${preview.width}`)).size);
  const scanStageLabels = ["Connecting to page", "Rendering browser checkpoints", "Sweeping responsive range", "Refining breakpoints", "Capturing issue evidence"];
  const scanHeadline = scanStageLabels[scanStage] ?? scanStageLabels[0]!;
  const activitySteps = [
    { label: "Connect to page", detail: selectedRoutes[0] ?? "Waiting for target", done: hasScanned || scanStage > 0 },
    { label: "Render checkpoints", detail: `${readyCheckpointCount} of ${checkpointTotal} browser captures`, done: hasScanned || scanStage > 1 },
    { label: "Sweep responsive range", detail: `${minWidth}–${maxWidth}px`, done: hasScanned || scanStage > 2 },
    { label: "Refine breakpoints", detail: "Within 2px accuracy", done: hasScanned || scanStage > 3 },
    { label: "Capture evidence", detail: "Prioritized blockers", done: hasScanned || scanStage > 4 },
  ];
  const scanPercent = scanStage === 0 ? 5 : scanStage === 1 ? 8 + (readyCheckpointCount / Math.max(1, checkpointTotal)) * 27 : scanStage === 2 ? 48 : scanStage === 3 ? 76 : 94;
  const scanSection = Math.min(8, Math.floor(scrollProgress * 8) + 1);
  const scanWidthPosition = Math.min(100, Math.max(0, ((progress.width - minWidth) / Math.max(1, maxWidth - minWidth)) * 100));
  const retryingViewport = viewportRetryMutation.isPending ? viewportRetryMutation.variables : undefined;
  const viewportIssues = issues.filter((issue) => (issue.browserEngine ?? "chromium") === activeBrowserEngine && !isPageWideIssue(issue, deviceWidths) && issue.routePath === reviewedRoute && issueAffectsWidth(issue, displayedWidth));
  const pageWideIssues = issues.filter((issue) => (issue.browserEngine ?? "chromium") === activeBrowserEngine && isPageWideIssue(issue, deviceWidths) && issue.routePath === reviewedRoute && issueAffectsWidth(issue, displayedWidth));

  function selectModel(model: DeviceModel) {
    const availableWidth = deviceWidths.find((width) => model.kind === "phone" ? width <= 600 : model.kind === "tablet" ? width > 600 && width <= 900 : model.checkpointWidth >= 1440 ? width >= 1440 : width > 900 && width < 1440) ?? model.checkpointWidth;
    setActiveDeviceModelId(model.id); setRecentDeviceIds((current) => [model.id, ...current.filter((id) => id !== model.id)].slice(0, 8)); setActivePreviewWidth(availableWidth); setIssueDisplayWidth(undefined); setResult((current) => ({ ...current, activeIssue: undefined })); setComparisonMode("failing"); setInspectorTab(hasScanned ? "findings" : "activity");
  }

  function togglePin(id: DeviceModelId) { setPinnedDeviceIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [id, ...current]); }

  function selectIssue(issue: ResponsiveIssue) {
    const checkpoint = issueAffectsWidth(issue, activePreviewWidth) ? activePreviewWidth : deviceWidths.reduce((closest, width) => Math.abs(width - issue.evidenceWidth) < Math.abs(closest - issue.evidenceWidth) ? width : closest, deviceWidths[0] ?? issue.evidenceWidth);
    setAiIssueError(""); setActivePreviewWidth(checkpoint); setIssueDisplayWidth(checkpoint); setActiveBrowserEngine(issue.browserEngine ?? "chromium"); setActiveDeviceModelId(modelForWidth(checkpoint).id); setResult((current) => ({ ...current, activeIssue: issue })); setInspectorTab("issue"); setComparisonMode("failing");
  }

  function clearSelectedIssue() {
    setAiIssueError("");
    setIssueDisplayWidth(undefined);
    setResult((current) => ({ ...current, activeIssue: undefined }));
    setComparisonMode("failing");
    setInspectorTab("findings");
  }

  function stepIssue(direction: -1 | 1) {
    if (!navigableIssues.length) return;
    const nextIndex = (Math.max(0, activeIssueIndex) + direction + navigableIssues.length) % navigableIssues.length;
    selectIssue(navigableIssues[nextIndex]!);
  }

  async function clearCapturedEvidence() {
    if (scanning) return;
    const stored = queryClient.getQueryData<BreakscopeState>(breakscopeQueryKeys.workspace()) ?? await loadBreakscopeState();
    const next: BreakscopeState = { ...stored, latestIssues: [], latestManifest: [], latestPreviews: [], scanJob: undefined, updatedAt: Date.now() };
    setPreviews([]);
    setResult({ issues: [], fixed: [], suppressedCount: 0, checks: [], hasScanned: false });
    setAiReviews({});
    autoReviewAttempted.current.clear();
    setIssueDisplayWidth(undefined);
    setError("");
    queryClient.setQueryData(breakscopeQueryKeys.workspace(), next);
    await saveBreakscopeState(next);
  }

  async function resetWorkspace() {
    if (scanning) return;
    await clearBreakscopeState();
    queryClient.removeQueries({ queryKey: breakscopeQueryKeys.workspace() });
    window.location.assign("/");
  }

  async function clearViewPreferences() {
    if (scanning) return;
    const stored = queryClient.getQueryData<BreakscopeState>(breakscopeQueryKeys.workspace()) ?? await loadBreakscopeState();
    const next = { ...stored, ui: undefined, updatedAt: Date.now() };
    setActiveDeviceModelId("iphone-17-pro"); setDeviceOrientation("portrait"); setPreviewScaleMode("fit-device"); setPreviewZoom(72); setRecentDeviceIds(["iphone-17-pro"]); setPinnedDeviceIds([]);
    queryClient.setQueryData(breakscopeQueryKeys.workspace(), next);
    await saveBreakscopeState(next);
  }

  async function recordDiagnosticSample(sample: RuntimeDiagnosticSample) {
    const stored = queryClient.getQueryData<BreakscopeState>(breakscopeQueryKeys.workspace()) ?? await loadBreakscopeState();
    const next = { ...stored, diagnosticsHistory: [sample, ...(stored.diagnosticsHistory ?? [])].slice(0, 60), updatedAt: Date.now() };
    queryClient.setQueryData(breakscopeQueryKeys.workspace(), next);
    await saveBreakscopeState(next);
  }


  function beginInspectorResize(event: ReactPointerEvent<HTMLDivElement>) {
    inspectorResizeRef.current = { startX: event.clientX, startWidth: inspectorWidth };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveInspectorResize(event: ReactPointerEvent<HTMLDivElement>) {
    const start = inspectorResizeRef.current;
    if (!start) return;
    setInspectorWidth(Math.min(620, Math.max(320, start.startWidth + start.startX - event.clientX)));
  }

  function endInspectorResize(event: ReactPointerEvent<HTMLDivElement>) {
    inspectorResizeRef.current = undefined;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function resizeInspectorWithKeyboard(event: ReactKeyboardEvent<HTMLDivElement>) {
    const next = event.key === "ArrowLeft" ? inspectorWidth + 20 : event.key === "ArrowRight" ? inspectorWidth - 20 : event.key === "Home" ? 320 : event.key === "End" ? 620 : undefined;
    if (next === undefined) return;
    event.preventDefault();
    setInspectorWidth(Math.min(620, Math.max(320, next)));
  }

  useEffect(() => {
    const handleShortcut = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "?") { event.preventDefault(); setShortcutsOpen((open) => !open); return; }
      if (event.key === "Escape" && shortcutsOpen) { event.preventDefault(); setShortcutsOpen(false); return; }
      if (event.key === "Escape" && activeIssue) { event.preventDefault(); clearSelectedIssue(); return; }
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") { event.preventDefault(); scan(); return; }
      if (event.altKey && event.key === "ArrowLeft") { event.preventDefault(); stepIssue(-1); return; }
      if (event.altKey && event.key === "ArrowRight") { event.preventDefault(); stepIssue(1); return; }
      if (event.key === "[" || event.key === "]") {
        event.preventDefault();
        const current = Math.max(0, deviceWidths.indexOf(displayedWidth));
        const direction = event.key === "[" ? -1 : 1;
        const width = deviceWidths[(current + direction + deviceWidths.length) % deviceWidths.length];
        if (width) { setActivePreviewWidth(width); setIssueDisplayWidth(undefined); setResult((value) => ({ ...value, activeIssue: undefined })); }
        return;
      }
      if (event.key.toLowerCase() === "b") {
        event.preventDefault();
        const current = Math.max(0, browserEngines.indexOf(activeBrowserEngine));
        setActiveBrowserEngine(browserEngines[(current + 1) % browserEngines.length]!);
        clearSelectedIssue();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  });

  return <main id="main-content" className="breakscope-shell bk-workspace-page">
    <header className="bk-command-bar"><div className="bk-command-brand"><BreakscopeLogo /><span>Responsive lab</span><Link href="/setup" className="bk-edit-setup"><Settings2 size={14} /><span>Edit setup</span></Link></div><div className="bk-command-target"><span>{new URL(url).host}</span><code>{url}</code></div><div className="bk-command-actions"><span className="bk-agent" role="status" aria-label="Local capture agent online"><i aria-hidden="true" /> Agent online</span><button type="button" className="bk-command-run" disabled={!selectedRoutes.length || scanning} aria-describedby={scanning ? "scan-progress-announcement" : undefined} onClick={() => void scan()}>{scanning ? <span className="bk-scan-glyph"><ScanSearch size={16} /></span> : <RotateCcw size={16} />}{scanning ? "Scanning" : hasScanned ? "Run again" : "Run test"}</button></div></header>
    <span id="scan-progress-announcement" className="sr-only" aria-live="polite">{scanning ? `${scanHeadline}, ${Math.round(scanPercent)} percent complete` : hasScanned ? "Test complete" : "Ready to run"}</span>
    {error && <div className="bs-error bk-workspace-error" role="alert"><AlertTriangle size={17} /><span>{error}</span>{workspaceQuery.data?.scanJob?.status === "failed" && <button type="button" className="bk-error-retry" disabled={scanning} onClick={() => scan()}><RefreshCw size={14} /> Retry failed captures</button>}<button type="button" aria-label="Dismiss error" onClick={() => setError("")}><X size={15} /></button></div>}
    {(routes.length > 0 || issues.length > 0 || scanning) ? <section className={`bs-workspace ${configCollapsed ? "config-collapsed" : ""}`} style={{ "--bk-inspector-width": `${inspectorWidth}px` } as CSSProperties}>
      <aside className="bs-config" aria-label="Scan configuration">
        <div className="bk-panel-title">
          <span>Test scope</span>
          <div className="bk-panel-title-actions">
            {!configCollapsed && <Link className="bk-config-edit" href="/setup" aria-label="Edit test setup"><Settings2 size={17} /></Link>}
            <button type="button" aria-label={configCollapsed ? "Expand test configuration" : "Collapse test configuration"} onClick={() => setConfigCollapsed((value) => !value)}>{configCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button>
          </div>
        </div>
        {configCollapsed ? <div className="bk-config-collapsed-summary" aria-label={`${selectedRoutes.length} selected routes, ${availableRoutes.length} available routes`}><b>{selectedRoutes.length}</b><span>selected</span><i /><b>{availableRoutes.length}</b><span>available</span></div> : <div className="bk-config-scroll">
          <section className="bk-config-section" aria-labelledby="workspace-routes-title">
            <div className="bk-config-meta"><span id="workspace-routes-title">Selected routes</span><b>{selectedRoutes.length} / 5</b></div>
            <div className="bs-route-list">{selectedRoutes.map((route) => <button type="button" key={route} className="selected" aria-pressed="true" onClick={() => toggleRoute(route)}><span><Check size={14} /></span><code>{route}</code></button>)}</div>
          </section>
          <section className="bk-config-section bk-available-routes" aria-labelledby="workspace-available-routes-title">
            <div className="bk-config-meta"><span id="workspace-available-routes-title">Available routes</span><b>{availableRoutes.length}</b></div>
            {availableRoutes.length ? <div className="bs-route-list">{availableRoutes.map((route) => <button type="button" key={route} aria-pressed="false" disabled={selectedRoutes.length >= 5} onClick={() => toggleRoute(route)}><span><Plus size={13} /></span><code>{route}</code></button>)}</div> : <p className="bk-route-empty">All discovered routes are selected.</p>}
          </section>
        </div>}
        {!configCollapsed && <div className="bk-config-actions"><WorkspaceControls retainedBytes={retainedEvidenceBytes} diagnosticsHistory={workspaceQuery.data?.diagnosticsHistory ?? []} disabled={scanning} onExport={(format) => { const state = queryClient.getQueryData<BreakscopeState>(breakscopeQueryKeys.workspace()); if (state) downloadLocalReport(format, state); }} onDiagnosticSample={(sample) => void recordDiagnosticSample(sample)} onClearEvidence={() => void clearCapturedEvidence()} onClearPreferences={() => void clearViewPreferences()} onResetWorkspace={() => void resetWorkspace()} /></div>}
      </aside>
      <section className="bk-stage-main">
        <div className="bk-canvas-toolbar"><span><i className={activeIssue ? "fail" : scanning ? "scan" : ""} />{activeIssue ? "Failure evidence" : scanning ? `Scanning section ${scanSection} of 8` : hasScanned ? "Captured evidence" : "Ready to test"}</span><CheckpointSwitcher widths={deviceWidths} activeWidth={displayedWidth} browserEngine={activeBrowserEngine} previews={previews} issues={issues} onSelect={(width) => { setActivePreviewWidth(width); setIssueDisplayWidth(undefined); setActiveDeviceModelId(modelForWidth(width).id); setResult((current) => ({ ...current, activeIssue: undefined })); setComparisonMode("failing"); setInspectorTab(hasScanned ? "findings" : "activity"); }} /><b><small>Evidence</small>{displayedWidth}px</b></div>
        <div className="bk-preview-toolbar"><div className="bk-environment-controls"><DevicePicker activeModel={displayedModel} orientation={deviceOrientation} recentIds={recentDeviceIds} pinnedIds={pinnedDeviceIds} onModelSelect={selectModel} onOrientationChange={setDeviceOrientation} onTogglePin={togglePin} /><BrowserSwitcher engines={browserEngines} activeEngine={activeBrowserEngine} activeWidth={activePreviewWidth} routePath={selectedRoutes[0] ?? "/"} previews={previews} issues={issues} onSelect={(engine) => { setActiveBrowserEngine(engine); setIssueDisplayWidth(undefined); setResult((current) => ({ ...current, activeIssue: undefined })); setComparisonMode("failing"); }} /></div><div className="bk-preview-scale"><span>Preview</span><div role="group" aria-label="Preview scale mode"><button type="button" className={previewScaleMode === "fit-device" ? "active" : ""} aria-pressed={previewScaleMode === "fit-device"} onClick={() => setPreviewScaleMode("fit-device")}><Maximize2 size={14} /> Fit device</button><button type="button" className={previewScaleMode === "fit-screen" ? "active" : ""} aria-pressed={previewScaleMode === "fit-screen"} onClick={() => setPreviewScaleMode("fit-screen")}>Fit screen</button><button type="button" className={previewScaleMode === "actual" ? "active" : ""} aria-pressed={previewScaleMode === "actual"} onClick={() => setPreviewScaleMode("actual")}>100%</button></div><div className="bk-zoom-stepper"><button type="button" aria-label="Zoom out" onClick={() => { setPreviewScaleMode("custom"); setPreviewZoom((value) => Math.max(40, value - 10)); }}><Minus size={14} /></button><output>{previewScaleMode === "actual" ? 100 : previewScaleMode === "custom" ? previewZoom : previewScaleMode === "fit-screen" ? "Fill" : "Fit"}</output><button type="button" aria-label="Zoom in" onClick={() => { setPreviewScaleMode("custom"); setPreviewZoom((value) => Math.min(140, value + 10)); }}><Plus size={14} /></button></div></div></div>
        <div className="bk-stage-canvas checkpoint-grid">
          {scanning && activePreview ? <DeviceFrame model={displayedModel} browserEngine={activeBrowserEngine} orientation={deviceOrientation} scaleMode={previewScaleMode} previewZoom={previewZoom} url={url} scanning previewRef={scanPreviewRef} scrollProgress={scrollProgress} onScroll={updatePreviewProgress} onUserInteraction={pauseStagedScan}><ResultImage image={activePreview.image} alt={`${activePreview.label} checkpoint at ${activePreview.width}px`} /></DeviceFrame>
          : scanning ? <DeviceFrame model={displayedModel} browserEngine={activeBrowserEngine} orientation={deviceOrientation} scaleMode={previewScaleMode} previewZoom={previewZoom} url={url} scanning scrollProgress={0}><DeviceScanPlaceholder phase={scanHeadline} width={progress.width || minWidth} kind={displayedDevice} /></DeviceFrame>
          : activeIssue ? <div className="bk-evidence-view"><div className="bk-evidence-bar"><span className={comparisonMode}>{comparisonMode === "passing" ? <Check size={14} /> : <AlertTriangle size={14} />}{comparisonMode === "passing" ? `Passing · ${activeIssue.lastWorkingWidth}px` : `Failing · ${displayedWidth}px`}<small>{issueTargetDescription(activeIssue)}</small></span><div className="bk-issue-stepper" aria-label={`Issue ${activeIssueIndex + 1} of ${navigableIssues.length}`}><button type="button" aria-label="Previous issue" onClick={() => stepIssue(-1)}><ChevronLeft size={15} /></button><em><span>Issue</span> {activeIssueIndex + 1} of {navigableIssues.length}</em><button type="button" aria-label="Next issue" onClick={() => stepIssue(1)}><ChevronRight size={15} /></button></div>{activeIssue.passingScreenshot && <div><button className={comparisonMode === "failing" ? "active" : ""} onClick={() => setComparisonMode("failing")}>Failing</button><button className={comparisonMode === "passing" ? "active" : ""} onClick={() => setComparisonMode("passing")}>Passing</button></div>}</div><DeviceFrame model={displayedModel} browserEngine={activeBrowserEngine} orientation={deviceOrientation} scaleMode={previewScaleMode} previewZoom={previewZoom} url={url} previewRef={issuePreviewRef} scrollProgress={scrollProgress} issuePosition={comparisonMode === "failing" ? ((activeIssue.elementRect?.y ?? 0) + (activeIssue.elementRect?.height ?? 40) / 2) / Math.max(1, activeIssue.documentHeight ?? 900) : undefined}><ResultImage image={issueImage} alt={`${comparisonMode} evidence for ${activeIssue.title}`} retryLabel={`Retry ${displayedWidth}px capture`} retrying={retryingViewport?.kind === "issue" && retryingViewport.issueFingerprint === activeIssue.fingerprint && retryingViewport.evidenceMode === comparisonMode} onReady={revealActiveIssue} onRetry={() => viewportRetryMutation.mutate({ kind: "issue", width: displayedWidth, routePath: activeIssue.routePath, issueFingerprint: activeIssue.fingerprint, evidenceMode: comparisonMode })}>{comparisonMode === "failing" && issueImage && activeIssue.elementRect && <span key={activeIssue.fingerprint} className="bs-highlight pulse" aria-label={`Highlighted target: ${issueTargetDescription(activeIssue)}`} style={{ left: `${Math.max(0, activeIssue.elementRect.x / activeIssue.evidenceWidth * 100)}%`, top: `${Math.max(0, activeIssue.elementRect.y / Math.max(1, activeIssue.documentHeight ?? 900) * 100)}%`, width: `${Math.min(100, activeIssue.elementRect.width / activeIssue.evidenceWidth * 100)}%`, height: `${Math.min(100, activeIssue.elementRect.height / Math.max(1, activeIssue.documentHeight ?? 900) * 100)}%` }}><b>{issueTargetDescription(activeIssue)}</b><i /></span>}</ResultImage></DeviceFrame></div>
          : activePreview ? <DeviceFrame model={displayedModel} browserEngine={activeBrowserEngine} orientation={deviceOrientation} scaleMode={previewScaleMode} previewZoom={previewZoom} url={url} scrollProgress={scrollProgress}><ResultImage image={activePreview.image} alt={`${activePreview.label} checkpoint at ${activePreview.width}px`} retryLabel={`Retry ${activePreview.width}px capture`} retrying={retryingViewport?.kind === "checkpoint" && retryingViewport.width === activePreview.width} onRetry={() => viewportRetryMutation.mutate({ kind: "checkpoint", width: activePreview.width, routePath: activePreview.routePath, browserEngine: activeBrowserEngine })} /></DeviceFrame>
          : hasScanned ? <div className="bk-missing-checkpoint"><ScanSearch size={32} /><h2>{browserLabels[activeBrowserEngine]} {displayedWidth}px capture unavailable</h2><p>The rest of the scan is intact. Recapture only this browser and viewport.</p><button type="button" disabled={viewportRetryMutation.isPending} onClick={() => viewportRetryMutation.mutate({ kind: "checkpoint", width: displayedWidth, routePath: selectedRoutes[0]!, browserEngine: activeBrowserEngine })}>{viewportRetryMutation.isPending ? <LoaderCircle className="spin" size={16} /> : <RotateCcw size={16} />}{viewportRetryMutation.isPending ? "Recapturing…" : `Retry ${displayedWidth}px capture`}</button></div>
          : <WorkspaceEmpty routeCount={selectedRoutes.length} minWidth={minWidth} maxWidth={maxWidth} disabled={!selectedRoutes.length} onRun={() => void scan()} />}
        </div>
      </section>
      <aside className="bk-inspector bk-context-inspector" aria-live="polite"><div className="bk-inspector-resizer" role="separator" aria-label="Resize issue inspector" aria-orientation="vertical" aria-valuemin={320} aria-valuemax={620} aria-valuenow={inspectorWidth} tabIndex={0} onPointerDown={beginInspectorResize} onPointerMove={moveInspectorResize} onPointerUp={endInspectorResize} onPointerCancel={endInspectorResize} onKeyDown={resizeInspectorWithKeyboard}><span /></div><div className="bk-inspector-content">
        {scanning ? <div className="bk-activity-view bk-live-scan">
          <header className="bk-live-scan-header">
            <div><span><i /> Live responsive analysis</span><output aria-label={`${Math.round(scanPercent)} percent complete`}>{Math.round(scanPercent)}%</output></div>
            <h2>{scanHeadline}</h2>
            <p><code>{progress.route || selectedRoutes[0]}</code><span className="bk-live-viewport">Viewport <b>{progress.width || minWidth}px</b></span></p>
          </header>
          <section className="bk-scan-spectrum" aria-label={`Scanning responsive range from ${minWidth} to ${maxWidth} pixels at ${progress.width || minWidth} pixels`}>
            <div className="bk-spectrum-labels"><span>{minWidth}</span><strong>{progress.width || minWidth}px</strong><span>{maxWidth}</span></div>
            <div className="bk-spectrum-track"><i style={{ width: `${scanWidthPosition}%` }} /><b style={{ left: `${scanWidthPosition}%` }}><span /></b></div>
            <small>Continuous width sweep</small>
          </section>
          <dl className="bk-scan-telemetry">
            <div><dt>Page section</dt><dd>{scanSection}<span>/8</span></dd></div>
            <div><dt>Browser captures</dt><dd>{readyCheckpointCount}<span>/{checkpointTotal}</span></dd></div>
            <div><dt>Route</dt><dd>{Math.max(1, selectedRoutes.indexOf(progress.route) + 1)}<span>/{Math.max(1, selectedRoutes.length)}</span></dd></div>
          </dl>
          <div className="bk-pipeline-heading"><span>Analysis pipeline</span><b>{Math.min(scanStage, activitySteps.length)}/{activitySteps.length}</b></div>
          <ol>{activitySteps.map((step, index) => <li key={step.label} className={step.done ? "done" : index === scanStage ? "active" : ""}><i>{step.done ? <Check size={13} /> : index === scanStage ? <span className="bk-pipeline-loader"><ScanSearch size={14} /></span> : index + 1}</i><span><b>{step.label}</b><small>{step.detail}</small></span></li>)}</ol>
          <button type="button" className="bs-cancel" onClick={() => scanController.current?.abort()}><CircleStop size={16} /><span>Cancel test</span><small>Progress will be saved</small></button>
        </div> : hasScanned ? <ViewportIssueInspector width={displayedWidth} checkpointWidths={deviceWidths} routePath={reviewedRoute ?? "/"} issues={viewportIssues} pageWideIssues={pageWideIssues} selectedIssue={activeIssue} aiAnalysis={activeIssue ? aiReviews[activeIssue.fingerprint] : undefined} aiPending={aiIssueMutation.isPending} aiError={aiIssueError} retesting={targetedRetestMutation.isPending} url={url} onSelect={selectIssue} onClearSelection={clearSelectedIssue} onRetest={() => targetedRetestMutation.mutate({ width: displayedWidth, routePath: reviewedRoute ?? "/", browserEngine: activeBrowserEngine })} onAnalyze={(issue, mode) => aiIssueMutation.mutate({ issue, mode })} /> : <div className="bk-activity-view"><h2>Ready to inspect</h2><p>{`${selectedRoutes.length} route${selectedRoutes.length === 1 ? "" : "s"} · ${minWidth}–${maxWidth}px`}</p><ol>{activitySteps.map((step, index) => <li key={step.label} className={step.done ? "done" : ""}><i>{step.done ? <Check size={13} /> : index + 1}</i><span><b>{step.label}</b><small>{step.detail}</small></span></li>)}</ol></div>}
      </div></aside>
    </section> : <section className="bk-no-target"><ScanSearch size={36} /><h1>No test configured</h1><p>Choose a URL and routes before opening the workspace.</p><Link href="/"><ArrowRight size={17} /> Go to setup</Link></section>}
    {shortcutsOpen && <div className="bk-shortcut-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShortcutsOpen(false); }}><section className="bk-shortcut-reference" role="dialog" aria-modal="true" aria-labelledby="shortcut-dialog-title"><header><span><Keyboard size={18} /><b id="shortcut-dialog-title">Keyboard shortcuts</b></span><button type="button" aria-label="Close keyboard shortcuts" onClick={() => setShortcutsOpen(false)}><X size={16} /></button></header><p>Move through checkpoints and findings without leaving the canvas.</p><dl><div><i><Monitor size={16} /></i><dt>Previous / next checkpoint</dt><dd><kbd aria-label="Left bracket">[</kbd><kbd aria-label="Right bracket">]</kbd></dd></div><div><i><RefreshCw size={16} /></i><dt>Next browser</dt><dd><kbd>B</kbd></dd></div><div><i><ChevronLeft size={16} /><ChevronRight size={16} /></i><dt>Previous / next issue</dt><dd><kbd className="combo" aria-label="Option and left arrow"><Option size={13} /><ArrowLeft size={14} /></kbd><kbd className="combo" aria-label="Option and right arrow"><Option size={13} /><ArrowRight size={14} /></kbd></dd></div><div><i><X size={16} /></i><dt>Clear selected issue</dt><dd><kbd className="escape">Esc</kbd></dd></div><div><i><ScanSearch size={16} /></i><dt>Run test</dt><dd><kbd className="combo command-return" aria-label="Command and Return"><Command size={13} /><CornerDownLeft size={14} /></kbd></dd></div></dl></section></div>}
    <footer className="bs-footer"><span>Breakscope beta</span><button type="button" onClick={() => setShortcutsOpen((open) => !open)}><Keyboard size={12} /> ? shortcuts</button><span>{fixed.length ? `${fixed.length} fixed · ` : ""}{suppressedCount ? `${suppressedCount} suppressed · ` : ""}{browserLabels[activeBrowserEngine]} · Reduced motion</span></footer>
  </main>;
}
