"use client";

import * as Tabs from "@radix-ui/react-tabs";
import Image from "next/image";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  FolderOpen,
  Maximize2,
  Minus,
  Monitor,
  Plus,
  Smartphone,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { changedRegions, viewportProfiles, type ChangedRegion, type Decision, type ViewportProfile } from "@uirift/shared";
import { Button } from "@/components/ui/button";
import { DemoSite } from "@/components/demo-site";
import { cn } from "@/lib/cn";

type CompareMode = "side-by-side" | "slider" | "overlay" | "diff";

function LayerPanel({ projectName, routePath, viewport, regionCount }: {
  projectName: string;
  routePath: string;
  viewport: ViewportProfile;
  regionCount: number;
}) {
  return (
    <aside className="layer-panel">
      <div className="panel-heading">
        <b>TEST LAYERS</b>
        <span>{projectName}</span>
      </div>
      <div className="layer-tree" role="tree" aria-label="Comparison layers">
        <div className="layer-group">
          <div className="layer-group-title">
            <ChevronDown size={12} />
            <FolderOpen size={14} />
            {routePath}
            <span>1</span>
            <Eye size={12} />
          </div>
          <button type="button" className="layer-row selected" role="treeitem" aria-selected="true">
            {viewport.id === "desktop" ? <Monitor size={13} /> : <Smartphone size={13} />}
            <span>{viewport.label}</span>
            <i className={regionCount ? "changed" : "passed"} />
            <em>{regionCount}</em>
            <Eye size={12} />
          </button>
        </div>
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
}) {
  return (
    <aside className="diff-inspector">
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
              <small>Region</small>
              <strong>{regions.length ? `${activeRegion} of ${regions.length}` : "None"}</strong>
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
              FINDINGS <span>{regions.length}</span>
            </div>
            {!regions.length && <p className="empty-findings">No changed regions detected.</p>}
            {regions.map((region) => (
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

function RegionOverlay({ activeRegion, regions }: { activeRegion: number; regions: ChangedRegion[] }) {
  const region = regions[activeRegion - 1] ?? regions[0];
  if (!region) return null;
  return (
    <div
      className="region-overlay"
      style={{
        left: `${region.x}%`,
        top: `${region.y}%`,
        width: `${region.width}%`,
        height: `${region.height}%`,
      }}
    >
      <span>{activeRegion}</span>
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
}) {
  const [mode, setMode] = useState<CompareMode>("side-by-side");
  const [zoom, setZoom] = useState(72);
  const [slider, setSlider] = useState(54);
  const [activeRegion, setActiveRegion] = useState(1);
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

  const changeMode = useCallback((next: CompareMode) => setMode(next), []);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (
        event.target instanceof HTMLElement &&
        event.target.matches("input, textarea, select")
      )
        return;
      if (event.key === "1") changeMode("side-by-side");
      if (event.key === "2") changeMode("slider");
      if (event.key === "3") changeMode("overlay");
      if (event.key === "4") changeMode("diff");
      if (event.key === "+" || event.key === "=")
        setZoom((value) => Math.min(160, value + 10));
      if (event.key === "-") setZoom((value) => Math.max(40, value - 10));
      if (event.key === "0") setZoom(72);
      if (event.key === "]" && regions.length) setActiveRegion((value) => (value % regions.length) + 1);
      if (event.key === "[" && regions.length) setActiveRegion((value) => ((value + regions.length - 2) % regions.length) + 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [changeMode, regions.length]);

  const canvasStyle = { "--workspace-zoom": zoom / 72 } as React.CSSProperties;

  return (
    <div
      className={cn(
        "comparison-workspace",
        publicMode && "public-workspace",
        reportMode && "report-workspace",
      )}
    >
      {!reportMode && <LayerPanel projectName={projectName} routePath={routePath} viewport={viewport} regionCount={regions.length} />}
      <section
        className="comparison-canvas"
        style={canvasStyle}
        aria-label="Visual comparison canvas"
      >
        <div className={cn("frames", `mode-${mode}`)}>
          {mode === "side-by-side" && (
            <>
              <div className="comparison-frame">
                <FrameLabel label={baselineLabel} routePath={routePath} viewport={viewport} />
                <div className="frame-paper">
                  <CapturedView src={baselineSrc} allowFixture={publicMode} />
                </div>
              </div>
              <div className="comparison-frame">
                <FrameLabel candidate label={candidateLabel} routePath={routePath} viewport={viewport} />
                <div className="frame-paper">
                  <CapturedView src={candidateSrc} candidate allowFixture={publicMode} />
                  <RegionOverlay activeRegion={activeRegion} regions={regions} />
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
              <div className="frame-paper slider-paper">
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
                <RegionOverlay activeRegion={activeRegion} regions={regions} />
              </div>
            </div>
          )}
          {mode === "overlay" && (
            <div className="comparison-frame single">
              <div className="dual-labels">
                <FrameLabel label={baselineLabel} routePath={routePath} viewport={viewport} />
                <FrameLabel candidate label={candidateLabel} routePath={routePath} viewport={viewport} />
              </div>
              <div className="frame-paper overlay-paper">
                <CapturedView src={baselineSrc} allowFixture={publicMode} />
                <div className="overlay-candidate">
                  <CapturedView src={candidateSrc} candidate allowFixture={publicMode} />
                </div>
                <RegionOverlay activeRegion={activeRegion} regions={regions} />
              </div>
            </div>
          )}
          {mode === "diff" && (
            <div className="comparison-frame single diff-frame">
              <FrameLabel candidate label={candidateLabel} routePath={routePath} viewport={viewport} />
              <div className="frame-paper">
                <CapturedView src={diffSrc ?? candidateSrc} candidate allowFixture={publicMode} />
                {!diffSrc && <div className="diff-film"><span /><span /><span /><span /><span /></div>}
                <RegionOverlay activeRegion={activeRegion} regions={regions} />
              </div>
            </div>
          )}
        </div>
        <div className="canvas-controls">
          <div className="zoom-controls">
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => setZoom((value) => Math.max(40, value - 10))}
            >
              <Minus size={13} />
            </button>
            <span>{zoom}%</span>
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => setZoom((value) => Math.min(160, value + 10))}
            >
              <Plus size={13} />
            </button>
            <button type="button" onClick={() => setZoom(72)}>
              <Maximize2 size={12} /> Fit
            </button>
            <button type="button" onClick={() => setZoom(100)}>
              1:1
            </button>
          </div>
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
        {mode === "slider" && (
          <label className="sr-only">
            Comparison slider
            <input
              type="range"
              min="0"
              max="100"
              value={slider}
              onChange={(event) => setSlider(Number(event.target.value))}
            />
          </label>
        )}
      </section>
      {!reportMode && (
        <DiffInspector activeRegion={activeRegion} onRegion={setActiveRegion} regions={regions} changedPixels={changedPixels} changedRatio={changedRatio} routePath={routePath} viewport={viewport} baselineLabel={baselineLabel} candidateLabel={candidateLabel} />
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
