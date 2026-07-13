"use client";

import * as Tabs from "@radix-ui/react-tabs";
import Image from "next/image";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Eye,
  FolderOpen,
  LocateFixed,
  Maximize2,
  Minus,
  Monitor,
  Plus,
  Sparkles,
  Smartphone,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { changedRegions, demoSemanticFindings, demoSemanticSummary, viewportProfiles, type AiAnalysis, type ChangedRegion, type Decision, type ElementRect, type SemanticFinding, type SemanticSummary, type ViewportProfile } from "@uirift/shared";
import { Button } from "@/components/ui/button";
import { DemoSite } from "@/components/demo-site";
import { cn } from "@/lib/cn";
import { useComparisonTools } from "@/lib/comparison-tools";

type CompareMode = "side-by-side" | "slider" | "overlay" | "diff";

interface PixelInspection {
  x: number;
  y: number;
  baseline?: string;
  candidate?: string;
  loading?: boolean;
  error?: string;
}

interface SnapshotSummary {
  baselineElements: number;
  candidateElements: number;
  baselineDocumentHeight: number;
  candidateDocumentHeight: number;
}

export interface ComparisonLayer {
  id: string;
  routePath: string;
  viewport: ViewportProfile;
  regionCount: number;
  riskScore?: number;
  level?: SemanticSummary["level"];
  aiVerdict?: AiAnalysis["verdict"];
}

function LayerPanel({ projectName, runId, layers }: {
  projectName: string;
  runId?: string;
  layers: ComparisonLayer[];
}) {
  return (
    <aside className="layer-panel">
      <div className="panel-heading">
        <b>TEST LAYERS</b>
        <span>{projectName}</span>
      </div>
      <div className="layer-tree" role="tree" aria-label="Comparison layers">
        {layers.map((layer) => (
          <div className="layer-group" key={layer.id}>
            <div className="layer-group-title">
              <ChevronDown size={12} />
              <FolderOpen size={14} />
              {layer.routePath}
              <span>1</span>
              <Eye size={12} />
            </div>
            {runId ? (
              <Link href={`/app/runs/${layer.id}`} className={cn("layer-row", layer.id === runId && "selected")} role="treeitem" aria-label={`Open ${layer.routePath} ${layer.viewport.label} comparison`} aria-selected={layer.id === runId}>
                {layer.viewport.id === "desktop" ? <Monitor size={13} /> : <Smartphone size={13} />}
                <span>{layer.viewport.label}</span>
                <i className={(layer.riskScore ?? layer.regionCount) ? "changed" : "passed"} />
                <em title={layer.riskScore === undefined ? `${layer.regionCount} changed regions` : `${layer.riskScore}/100 semantic risk`}>{layer.riskScore ?? layer.regionCount}</em>
                <Eye size={12} />
              </Link>
            ) : (
              <div className="layer-row selected" role="treeitem" aria-label={`${layer.routePath} ${layer.viewport.label} comparison`} aria-selected="true">
                {layer.viewport.id === "desktop" ? <Monitor size={13} /> : <Smartphone size={13} />}
                <span>{layer.viewport.label}</span>
                <i className={(layer.riskScore ?? layer.regionCount) ? "changed" : "passed"} />
                <em title={layer.riskScore === undefined ? `${layer.regionCount} changed regions` : `${layer.riskScore}/100 semantic risk`}>{layer.riskScore ?? layer.regionCount}</em>
                <Eye size={12} />
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}

function DiffInspector({
  activeRegion,
  onRegion,
  regions,
  changedPixels,
  changedRatio,
  routePath,
  viewport,
  baselineLabel,
  candidateLabel,
  pixelInspection,
  snapshotSummary,
  semanticFindings = [],
  semanticSummary,
  aiAnalysis,
  aiStatus = "idle",
  aiError,
  onAnalyze,
  activeSemanticId,
  onSemanticFinding,
}: {
  activeRegion: number;
  onRegion: (id: number) => void;
  regions: ChangedRegion[];
  changedPixels: number;
  changedRatio: number;
  routePath: string;
  viewport: ViewportProfile;
  baselineLabel: string;
  candidateLabel: string;
  pixelInspection?: PixelInspection;
  snapshotSummary?: SnapshotSummary;
  semanticFindings?: SemanticFinding[];
  semanticSummary?: SemanticSummary;
  aiAnalysis?: AiAnalysis;
  aiStatus?: "idle" | "loading" | "error";
  aiError?: string;
  onAnalyze?: () => void;
  activeSemanticId?: string;
  onSemanticFinding: (finding: SemanticFinding) => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [findingFilter, setFindingFilter] = useState<"all" | SemanticFinding["category"]>("all");
  const filteredFindings = findingFilter === "all" ? semanticFindings : semanticFindings.filter((finding) => finding.category === findingFilter);
  const findingCount = semanticFindings.length || regions.length;
  return (
    <aside className={cn("diff-inspector", mobileOpen && "open")}>
      <button
        type="button"
        className="inspector-sheet-toggle"
        aria-label={mobileOpen ? "Close inspector" : "Open inspector"}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((open) => !open)}
      >
        {mobileOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>
      <Tabs.Root defaultValue="diff">
        <Tabs.List className="inspector-tabs" aria-label="Inspector">
          <Tabs.Trigger value="diff">DIFF</Tabs.Trigger>
          <Tabs.Trigger value="details">DETAILS</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="diff">
          <section className="inspector-section selection">
            <small>SELECTION</small>
            <p>{routePath} / {viewport.label}</p>
          </section>
          {semanticSummary && (
            <section className={cn("semantic-summary", `level-${semanticSummary.level}`)}>
              <div><small>SEMANTIC ANALYSIS</small><b>{semanticSummary.level}</b></div>
              <h3>{semanticSummary.title}</h3>
              <p>{semanticSummary.description}</p>
              <div className="risk-meter"><i style={{ width: `${semanticSummary.riskScore}%` }} /></div>
              <span>{semanticSummary.riskScore}/100 risk · {Math.round(semanticSummary.matchRate * 100)}% elements matched</span>
            </section>
          )}
          {onAnalyze && (
            <section className={cn("ai-review", aiAnalysis && `verdict-${aiAnalysis.verdict}`)}>
              <div className="ai-review-heading"><small>NVIDIA AI REVIEW</small>{aiAnalysis && <b>{aiAnalysis.verdict}</b>}</div>
              {aiAnalysis ? (
                <>
                  <h3>{aiAnalysis.executiveSummary}</h3>
                  <dl><div><dt>Before</dt><dd>{aiAnalysis.beforePurpose}</dd></div><div><dt>After</dt><dd>{aiAnalysis.afterPurpose}</dd></div></dl>
                  {aiAnalysis.userImpacts.length > 0 && <div className="ai-review-list"><small>USER IMPACT</small><ul>{aiAnalysis.userImpacts.map((item) => <li key={item}>{item}</li>)}</ul></div>}
                  {aiAnalysis.recommendations.length > 0 && <div className="ai-review-list"><small>VERIFY NEXT</small><ul>{aiAnalysis.recommendations.map((item) => <li key={item}>{item}</li>)}</ul></div>}
                  <span>{aiAnalysis.riskScore}/100 risk · {Math.round(aiAnalysis.confidence * 100)}% confidence</span>
                </>
              ) : <p>Ask a vision model to explain the product and user impact of this visual change.</p>}
              {aiError && <p className="ai-review-error" role="alert">{aiError}</p>}
              <Button type="button" variant="secondary" onClick={onAnalyze} disabled={aiStatus === "loading"}>
                <Sparkles size={13} /> {aiStatus === "loading" ? "Analyzing both captures…" : aiAnalysis ? "Refresh AI review" : "Analyze with NVIDIA"}
              </Button>
              <small>Opt-in: both screenshots are sent only when you click.</small>
            </section>
          )}
          {pixelInspection && (
            <section className="inspector-section pixel-inspector" aria-live="polite">
              <small>PIXEL INSPECTOR · X {pixelInspection.x} Y {pixelInspection.y}</small>
              {pixelInspection.loading ? <p>Sampling both captures…</p> : pixelInspection.error ? <p>{pixelInspection.error}</p> : (
                <dl>
                  <div><dt>Baseline</dt><dd><i style={{ background: pixelInspection.baseline }} />{pixelInspection.baseline}</dd></div>
                  <div><dt>Candidate</dt><dd><i style={{ background: pixelInspection.candidate }} />{pixelInspection.candidate}</dd></div>
                </dl>
              )}
            </section>
          )}
          <section className="metric-grid">
            <div>
              <small>Changed pixels</small>
              <strong>{changedPixels.toLocaleString()}</strong>
            </div>
            <div>
              <small>Diff</small>
              <strong>{(changedRatio * 100).toFixed(2)}%</strong>
            </div>
            <div>
              <small>Findings</small>
              <strong>{findingCount || "None"}</strong>
            </div>
          </section>
          <section className="inspector-section">
            <small>DIFF HEATMAP</small>
            <div className="heatmap" aria-label="Diff heatmap">
              {regions.map((region) => (
                <i key={region.id} style={{ left: `${region.x}%`, top: `${region.y}%`, width: `${region.width}%`, height: `${region.height}%` }} />
              ))}
            </div>
          </section>
          <section className="inspector-section findings">
            <div className="section-title">
              FINDINGS <span>{findingCount}</span>
            </div>
            {semanticFindings.length > 0 && (
              <div className="finding-filters" aria-label="Finding filters">
                {(["all", "content", "navigation", "layout", "style", "visibility", "page"] as const).map((filter) => (
                  <button type="button" key={filter} className={findingFilter === filter ? "active" : ""} aria-pressed={findingFilter === filter} onClick={() => setFindingFilter(filter)}>{filter}</button>
                ))}
              </div>
            )}
            {!findingCount && <p className="empty-findings">No meaningful changes detected.</p>}
            {filteredFindings.map((finding, index) => (
              <div className="semantic-finding" key={finding.id}>
                <button
                  type="button"
                  onClick={() => onSemanticFinding(finding)}
                  className={cn(activeSemanticId === finding.id && "active")}
                >
                  <i className={finding.severity} />
                  <em>{index + 1}</em>
                  <span>{finding.title}</span>
                  <b>{finding.severity}</b>
                  <ChevronRight size={13} />
                </button>
                {activeSemanticId === finding.id && (
                  <div className="finding-explanation">
                    <p>{finding.description}</p>
                    <small>{finding.impact}</small>
                    <span>{finding.category} · {Math.round(finding.confidence * 100)}% confidence</span>
                  </div>
                )}
              </div>
            ))}
            {!semanticFindings.length && regions.map((region) => (
              <button
                type="button"
                key={region.id}
                onClick={() => onRegion(region.id)}
                className={cn(activeRegion === region.id && "active")}
              >
                <i className={region.severity} />
                <em>{region.id}</em>
                <span>{region.label}</span>
                <b>{region.severity}</b>
                <ChevronRight size={13} />
              </button>
            ))}
          </section>
        </Tabs.Content>
        <Tabs.Content value="details" className="details-tab">
          <section>
            <small>CAPTURE</small>
            <dl>
              <div>
                <dt>Viewport</dt>
                <dd>{viewport.width}×{viewport.height}</dd>
              </div>
              <div>
                <dt>Browser</dt>
                <dd>Chromium</dd>
              </div>
              <div>
                <dt>Baseline</dt>
                <dd>{baselineLabel}</dd>
              </div>
              <div>
                <dt>Candidate</dt>
                <dd>{candidateLabel}</dd>
              </div>
              {snapshotSummary && (
                <>
                  <div>
                    <dt>Semantic elements</dt>
                    <dd>{snapshotSummary.baselineElements} → {snapshotSummary.candidateElements}</dd>
                  </div>
                  <div>
                    <dt>Document height</dt>
                    <dd>{snapshotSummary.baselineDocumentHeight}px → {snapshotSummary.candidateDocumentHeight}px</dd>
                  </div>
                </>
              )}
            </dl>
          </section>
        </Tabs.Content>
      </Tabs.Root>
    </aside>
  );
}

function FrameLabel({ candidate = false, label, routePath, viewport }: { candidate?: boolean; label: string; routePath: string; viewport: ViewportProfile }) {
  return (
    <div className="frame-label">
      <b>{candidate ? "CANDIDATE" : "BASELINE"}</b>
      <span>· {label}</span>
      <small>{routePath} · {viewport.width}×{viewport.height}</small>
    </div>
  );
}

function RegionOverlay({ activeRegion, regions, focusRect, viewport, focusLabel }: { activeRegion: number; regions: ChangedRegion[]; focusRect?: ElementRect; viewport: ViewportProfile; focusLabel?: string }) {
  const region = regions[activeRegion - 1] ?? regions[0];
  if (!region && !focusRect) return null;
  const bounds = focusRect ? {
    x: (focusRect.x / viewport.width) * 100,
    y: (focusRect.y / viewport.height) * 100,
    width: (focusRect.width / viewport.width) * 100,
    height: (focusRect.height / viewport.height) * 100,
  } : region;
  if (!bounds) return null;
  return (
    <div
      className="region-overlay"
      style={{
        left: `${bounds.x}%`,
        top: `${bounds.y}%`,
        width: `${bounds.width}%`,
        height: `${bounds.height}%`,
      }}
    >
      <span>{focusLabel ?? activeRegion}</span>
    </div>
  );
}

function CapturedView({
  src,
  candidate = false,
  allowFixture = false,
}: {
  src?: string;
  candidate?: boolean;
  allowFixture?: boolean;
}) {
  if (!src) return allowFixture ? <DemoSite candidate={candidate} /> : <div className="capture-unavailable">Capture unavailable</div>;
  return (
    <Image
      className="capture-image"
      src={src}
      alt={candidate ? "Candidate capture" : "Baseline capture"}
      fill
      sizes="(max-width: 767px) 100vw, 760px"
      unoptimized
    />
  );
}

export function ComparisonWorkspace({
  publicMode = false,
  reportMode = false,
  baselineSrc,
  candidateSrc,
  diffSrc,
  runId,
  regions = changedRegions,
  changedPixels = 1256,
  changedRatio = 0.0042,
  initialDecision = "pending",
  onDecision,
  projectName = "Acme Cloud",
  routePath = "/pricing",
  viewport = viewportProfiles.desktop,
  baselineLabel = "main@a1b2c3d",
  candidateLabel = "d4e5f6g",
  layers,
  snapshotSummary,
  semanticFindings: suppliedSemanticFindings,
  semanticSummary: suppliedSemanticSummary,
  aiAnalysis,
  aiStatus,
  aiError,
  onAnalyze,
}: {
  publicMode?: boolean;
  reportMode?: boolean;
  baselineSrc?: string;
  candidateSrc?: string;
  diffSrc?: string;
  runId?: string;
  regions?: ChangedRegion[];
  changedPixels?: number;
  changedRatio?: number;
  initialDecision?: Decision;
  onDecision?: (decision: Exclude<Decision, "pending">) => Promise<void>;
  projectName?: string;
  routePath?: string;
  viewport?: ViewportProfile;
  baselineLabel?: string;
  candidateLabel?: string;
  layers?: ComparisonLayer[];
  snapshotSummary?: SnapshotSummary;
  semanticFindings?: SemanticFinding[];
  semanticSummary?: SemanticSummary;
  aiAnalysis?: AiAnalysis;
  aiStatus?: "idle" | "loading" | "error";
  aiError?: string;
  onAnalyze?: () => void;
}) {
  const semanticFindings = suppliedSemanticFindings ?? (publicMode ? demoSemanticFindings : []);
  const semanticSummary = suppliedSemanticSummary ?? (publicMode ? demoSemanticSummary : undefined);
  const { tool, regionsVisible, setTool } = useComparisonTools();
  const [mode, setMode] = useState<CompareMode>("side-by-side");
  const [zoom, setZoom] = useState(100);
  const [slider, setSlider] = useState(54);
  const [overlayOpacity, setOverlayOpacity] = useState(50);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });
  const [spacePanning, setSpacePanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pixelInspection, setPixelInspection] = useState<PixelInspection>();
  const canvasRef = useRef<HTMLElement>(null);
  const framePaperRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | undefined>(undefined);
  const [activeRegion, setActiveRegion] = useState(1);
  const [activeSemanticId, setActiveSemanticId] = useState(semanticFindings[0]?.id);
  const [decision, setDecision] = useState<"pending" | "accepted" | "rejected">(
    initialDecision,
  );
  const [shareLabel, setShareLabel] = useState("Share");

  async function recordDecision(next: "accepted" | "rejected") {
    setDecision(next);
    if (onDecision) {
      try {
        await onDecision(next);
      } catch {
        setDecision("pending");
      }
      return;
    }
    if (!runId) return;
    const response = await fetch(`/api/runs/${runId}/decision`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: next }),
    });
    if (!response.ok) setDecision("pending");
  }

  async function shareRun() {
    if (!runId) return;
    setShareLabel("Creating…");
    const response = await fetch(`/api/runs/${runId}/share`, {
      method: "POST",
    });
    const payload = (await response.json()) as { url?: string };
    if (!response.ok || !payload.url) {
      setShareLabel("Try again");
      return;
    }
    await navigator.clipboard.writeText(payload.url);
    setShareLabel("Copied");
  }

  const fitView = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.width <= 1 || canvasSize.height <= 1) {
      setZoom(100);
      setPan({ x: 0, y: 0 });
      return;
    }
    const measureAndFit = () => {
      const papers = Array.from(canvas.querySelectorAll<HTMLElement>(".frame-paper"));
      if (!papers.length) return;
      const bounds = papers.map((paper) => paper.getBoundingClientRect());
      const left = Math.min(...bounds.map((item) => item.left));
      const right = Math.max(...bounds.map((item) => item.right));
      const top = Math.min(...bounds.map((item) => item.top));
      const bottom = Math.max(...bounds.map((item) => item.bottom));
      const currentScale = Number(getComputedStyle(canvas).getPropertyValue("--workspace-zoom")) || 1;
      const adjustment = Math.min(
        (canvasSize.width - 70) / Math.max(1, right - left),
        (canvasSize.height - 115) / Math.max(1, bottom - top + 48 * currentScale),
      );
      setZoom(Math.max(5, Math.min(100, currentScale * adjustment * 90)));
      setPan({ x: 0, y: 0 });
    };
    measureAndFit();
  }, [canvasSize.height, canvasSize.width, setPan, setZoom]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (
        event.target instanceof HTMLElement &&
        event.target.matches("input, textarea, select")
      )
        return;
      if (event.key === "1") setMode("side-by-side");
      if (event.key === "2") setMode("slider");
      if (event.key === "3") setMode("overlay");
      if (event.key === "4") setMode("diff");
      if (event.key === "+" || event.key === "=")
        setZoom((value) => Math.min(400, value + 10));
      if (event.key === "-") setZoom((value) => Math.max(5, value - 10));
      if (event.key === "0") fitView();
      if (event.key === "]" && regions.length) setActiveRegion((value) => (value % regions.length) + 1);
      if (event.key === "[" && regions.length) setActiveRegion((value) => ((value + regions.length - 2) % regions.length) + 1);
      if (event.code === "Space") {
        event.preventDefault();
        setSpacePanning(true);
      }
    }
    function onKeyUp(event: KeyboardEvent) {
      if (event.code === "Space") setSpacePanning(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [fitView, regions.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setCanvasSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(fitView);
    return () => window.cancelAnimationFrame(frame);
  }, [fitView, mode, viewport.height, viewport.width]);

  const canvasStyle = {
    "--workspace-zoom": zoom / 100,
    "--workspace-pan-x": `${pan.x}px`,
    "--workspace-pan-y": `${pan.y}px`,
  } as React.CSSProperties;
  const panning = tool === "pan" || spacePanning;

  function actualSize() {
    const paperWidth = framePaperRef.current?.getBoundingClientRect().width;
    if (!paperWidth) return;
    setZoom((current) => Math.min(400, Math.max(5, (viewport.width / (paperWidth / (current / 100))) * 100)));
    setPan({ x: 0, y: 0 });
  }

  function zoomAt(clientX: number, clientY: number, nextZoom: number) {
    const bounds = canvasRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const constrained = Math.min(400, Math.max(5, nextZoom));
    const ratio = constrained / zoom;
    const pointerX = clientX - bounds.left - bounds.width / 2;
    const pointerY = clientY - bounds.top - bounds.height / 2;
    setPan((current) => ({
      x: pointerX - (pointerX - current.x) * ratio,
      y: pointerY - (pointerY - current.y) * ratio,
    }));
    setZoom(constrained);
  }

  function wheelZoom(event: React.WheelEvent<HTMLElement>) {
    event.preventDefault();
    const factor = Math.exp(-event.deltaY * 0.0015);
    zoomAt(event.clientX, event.clientY, zoom * factor);
  }

  function beginPan(event: React.PointerEvent<HTMLElement>) {
    const interactive = event.target instanceof Element && event.target.closest("button, input, a, [role='tab'], [role='treeitem']");
    const middleButton = event.button === 1;
    if (interactive || (!middleButton && (!panning || event.button !== 0))) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    setIsDragging(true);
  }

  function movePan(event: React.PointerEvent<HTMLElement>) {
    if (!drag.current || !panning) return;
    setPan({
      x: drag.current.panX + event.clientX - drag.current.x,
      y: drag.current.panY + event.clientY - drag.current.y,
    });
  }

  function endPan() {
    drag.current = undefined;
    setIsDragging(false);
  }

  const minimapWidth = Math.max(18, Math.min(100, 10_000 / zoom));
  const minimapHeight = Math.max(18, Math.min(100, minimapWidth * 0.72));
  const minimapLeft = Math.max(0, Math.min(100 - minimapWidth, 50 - minimapWidth / 2 - (pan.x / canvasSize.width) * 100));
  const minimapTop = Math.max(0, Math.min(100 - minimapHeight, 50 - minimapHeight / 2 - (pan.y / canvasSize.height) * 100));
  const effectiveSemanticId = semanticFindings.some((finding) => finding.id === activeSemanticId) ? activeSemanticId : semanticFindings[0]?.id;
  const activeSemanticFinding = semanticFindings.find((finding) => finding.id === effectiveSemanticId);
  const activeSemanticEvidence = activeSemanticFinding?.candidate ?? activeSemanticFinding?.baseline;
  const semanticFocusRect = activeSemanticEvidence?.inViewport ? activeSemanticEvidence.rect : undefined;

  function focusSemanticFinding(finding: SemanticFinding) {
    setActiveSemanticId(finding.id);
    setTool("select");
    const selected = finding.candidate ?? finding.baseline;
    const paper = framePaperRef.current;
    if (!selected?.inViewport || !paper) return;
    const basePaperWidth = paper.getBoundingClientRect().width / (zoom / 100);
    const targetZoom = Math.min(190, Math.max(115, 100 * Math.min(
      viewport.width / Math.max(260, selected.rect.width * 2.6),
      viewport.height / Math.max(180, selected.rect.height * 2.6),
    )));
    const scale = (basePaperWidth / viewport.width) * (targetZoom / 100);
    setZoom(targetZoom);
    setPan({
      x: (viewport.width / 2 - selected.rect.x - selected.rect.width / 2) * scale,
      y: (viewport.height / 2 - selected.rect.y - selected.rect.height / 2) * scale,
    });
  }

  function selectRegionAt(event: React.MouseEvent<HTMLDivElement>) {
    if (tool !== "select" || !regions.length) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    const region = regions.find((item) => x >= item.x && x <= item.x + item.width && y >= item.y && y <= item.y + item.height);
    if (region) setActiveRegion(region.id);
  }

  async function samplePixelAt(event: React.MouseEvent<HTMLDivElement>) {
    if (tool !== "inspect") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(viewport.width - 1, Math.floor(((event.clientX - bounds.left) / bounds.width) * viewport.width)));
    const y = Math.max(0, Math.min(viewport.height - 1, Math.floor(((event.clientY - bounds.top) / bounds.height) * viewport.height)));
    setPixelInspection({ x, y, loading: true });
    if (!baselineSrc || !candidateSrc) {
      setPixelInspection({ x, y, error: "Pixel sampling requires captured images." });
      return;
    }
    try {
      const [baseline, candidate] = await Promise.all([samplePixel(baselineSrc, x, y, viewport), samplePixel(candidateSrc, x, y, viewport)]);
      setPixelInspection({ x, y, baseline, candidate });
    } catch {
      setPixelInspection({ x, y, error: "Unable to read this pixel." });
    }
  }

  function interactWithFrame(event: React.MouseEvent<HTMLDivElement>) {
    selectRegionAt(event);
    void samplePixelAt(event);
  }

  return (
    <div
      className={cn(
        "comparison-workspace",
        publicMode && "public-workspace",
        reportMode && "report-workspace",
      )}
    >
      {!reportMode && <LayerPanel projectName={projectName} runId={runId} layers={layers ?? [{ id: runId ?? "demo", routePath, viewport, regionCount: regions.length }]} />}
      <section
        ref={canvasRef}
        className={cn("comparison-canvas", panning && "is-panning", isDragging && "is-dragging", tool === "inspect" && "is-inspecting")}
        style={canvasStyle}
        aria-label="Visual comparison canvas"
        onPointerDown={beginPan}
        onPointerMove={movePan}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        onWheel={wheelZoom}
        onAuxClick={(event) => event.preventDefault()}
      >
        <div className={cn("frames", `mode-${mode}`, isDragging && "dragging")}>
          {mode === "side-by-side" && (
            <>
              <div className="comparison-frame">
                <FrameLabel label={baselineLabel} routePath={routePath} viewport={viewport} />
                <div ref={framePaperRef} className="frame-paper" style={{ aspectRatio: viewport.width / viewport.height }} onClick={interactWithFrame}>
                  <CapturedView src={baselineSrc} allowFixture={publicMode} />
                </div>
              </div>
              <div className="comparison-frame">
                <FrameLabel candidate label={candidateLabel} routePath={routePath} viewport={viewport} />
                <div className="frame-paper" style={{ aspectRatio: viewport.width / viewport.height }} onClick={interactWithFrame}>
                  <CapturedView src={candidateSrc} candidate allowFixture={publicMode} />
                  {regionsVisible && <RegionOverlay activeRegion={activeRegion} regions={regions} focusRect={semanticFocusRect} viewport={viewport} focusLabel={activeSemanticFinding ? String(semanticFindings.indexOf(activeSemanticFinding) + 1) : undefined} />}
                </div>
              </div>
            </>
          )}
          {mode === "slider" && (
            <div className="comparison-frame single">
              <div className="dual-labels">
                <FrameLabel label={baselineLabel} routePath={routePath} viewport={viewport} />
                <FrameLabel candidate label={candidateLabel} routePath={routePath} viewport={viewport} />
              </div>
              <div ref={framePaperRef} className="frame-paper slider-paper" style={{ aspectRatio: viewport.width / viewport.height }} onClick={interactWithFrame}>
                <CapturedView src={baselineSrc} allowFixture={publicMode} />
                <div
                  className="candidate-clip"
                  style={{ clipPath: `inset(0 0 0 ${slider}%)` }}
                >
                  <CapturedView src={candidateSrc} candidate allowFixture={publicMode} />
                </div>
                <div className="slider-line" style={{ left: `${slider}%` }}>
                  <span>{slider}%</span>
                  <i>↔</i>
                </div>
                <input className="slider-input" aria-label="Comparison slider position" type="range" min="0" max="100" value={slider} onChange={(event) => setSlider(Number(event.target.value))} />
                {regionsVisible && <RegionOverlay activeRegion={activeRegion} regions={regions} focusRect={semanticFocusRect} viewport={viewport} focusLabel={activeSemanticFinding ? String(semanticFindings.indexOf(activeSemanticFinding) + 1) : undefined} />}
              </div>
            </div>
          )}
          {mode === "overlay" && (
            <div className="comparison-frame single">
              <div className="dual-labels">
                <FrameLabel label={baselineLabel} routePath={routePath} viewport={viewport} />
                <FrameLabel candidate label={candidateLabel} routePath={routePath} viewport={viewport} />
              </div>
              <div ref={framePaperRef} className="frame-paper overlay-paper" style={{ aspectRatio: viewport.width / viewport.height }} onClick={interactWithFrame}>
                <CapturedView src={baselineSrc} allowFixture={publicMode} />
                <div className="overlay-candidate" style={{ opacity: overlayOpacity / 100 }}>
                  <CapturedView src={candidateSrc} candidate allowFixture={publicMode} />
                </div>
                {regionsVisible && <RegionOverlay activeRegion={activeRegion} regions={regions} focusRect={semanticFocusRect} viewport={viewport} focusLabel={activeSemanticFinding ? String(semanticFindings.indexOf(activeSemanticFinding) + 1) : undefined} />}
              </div>
            </div>
          )}
          {mode === "diff" && (
            <div className="comparison-frame single diff-frame">
              <FrameLabel candidate label={candidateLabel} routePath={routePath} viewport={viewport} />
              <div ref={framePaperRef} className="frame-paper" style={{ aspectRatio: viewport.width / viewport.height }} onClick={interactWithFrame}>
                <CapturedView src={diffSrc ?? candidateSrc} candidate allowFixture={publicMode} />
                {!diffSrc && <div className="diff-film"><span /><span /><span /><span /><span /></div>}
                {regionsVisible && <RegionOverlay activeRegion={activeRegion} regions={regions} focusRect={semanticFocusRect} viewport={viewport} focusLabel={activeSemanticFinding ? String(semanticFindings.indexOf(activeSemanticFinding) + 1) : undefined} />}
              </div>
            </div>
          )}
        </div>
        <button type="button" className="canvas-minimap" aria-label="Reset canvas view" onClick={fitView}>
          <span className="minimap-content"><i style={{ left: `${minimapLeft}%`, top: `${minimapTop}%`, width: `${minimapWidth}%`, height: `${minimapHeight}%` }} /></span>
          <LocateFixed size={12} />
        </button>
        <div className="canvas-controls">
          <div className="zoom-controls">
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => setZoom((value) => Math.max(5, value - 10))}
            >
              <Minus size={13} />
            </button>
            <output aria-label="Canvas zoom">{Math.round(zoom)}%</output>
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => setZoom((value) => Math.min(400, value + 10))}
            >
              <Plus size={13} />
            </button>
            <button type="button" onClick={fitView}>
              <Maximize2 size={12} /> Fit
            </button>
            <button type="button" onClick={actualSize}>
              1:1
            </button>
          </div>
          {mode === "overlay" && (
            <label className="overlay-opacity">Opacity <input aria-label="Candidate overlay opacity" type="range" min="0" max="100" value={overlayOpacity} onChange={(event) => setOverlayOpacity(Number(event.target.value))} /><span>{overlayOpacity}%</span></label>
          )}
          <div className="mode-controls" aria-label="Comparison mode">
            {(["side-by-side", "slider", "overlay", "diff"] as const).map(
              (item, index) => (
                <button
                  type="button"
                  key={item}
                  aria-pressed={mode === item}
                  className={mode === item ? "active" : ""}
                  onClick={() => setMode(item)}
                >
                  <kbd>{index + 1}</kbd>
                  {item === "side-by-side"
                    ? "Side by side"
                    : item[0]?.toUpperCase() + item.slice(1)}
                </button>
              ),
            )}
          </div>
        </div>
      </section>
      {!reportMode && (
        <DiffInspector activeRegion={activeRegion} onRegion={(id) => { setActiveRegion(id); setTool("select"); }} regions={regions} changedPixels={changedPixels} changedRatio={changedRatio} routePath={routePath} viewport={viewport} baselineLabel={baselineLabel} candidateLabel={candidateLabel} pixelInspection={pixelInspection} snapshotSummary={snapshotSummary} semanticFindings={semanticFindings} semanticSummary={semanticSummary} aiAnalysis={aiAnalysis} aiStatus={aiStatus} aiError={aiError} onAnalyze={onAnalyze} activeSemanticId={effectiveSemanticId} onSemanticFinding={focusSemanticFinding} />
      )}
      {!publicMode && !reportMode && (
        <footer className="decision-bar">
          {runId && !onDecision && <Button onClick={shareRun}>{shareLabel}</Button>}
          <Button variant="danger" onClick={() => recordDecision("rejected")}>
            {decision === "rejected" && <Check size={13} />} Reject change
          </Button>
          <Button variant="primary" onClick={() => recordDecision("accepted")}>
            {decision === "accepted" && <Check size={13} />} Accept change
          </Button>
        </footer>
      )}
      {publicMode && !reportMode && (
        <div className="demo-ribbon">
          Seeded public demo · shortcuts 1–4 change modes
        </div>
      )}
    </div>
  );
}

async function samplePixel(src: string, x: number, y: number, viewport: ViewportProfile) {
  const blob = await fetch(src).then((response) => response.blob());
  const image = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(1, 1);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas unavailable");
  context.drawImage(image, Math.floor((x / viewport.width) * image.width), Math.floor((y / viewport.height) * image.height), 1, 1, 0, 0, 1, 1);
  image.close();
  const [r = 0, g = 0, b = 0, a = 0] = context.getImageData(0, 0, 1, 1).data;
  return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})`;
}
