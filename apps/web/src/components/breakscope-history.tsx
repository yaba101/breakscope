"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Clock3, Flag, Images, LoaderCircle, Monitor, Plus, Route, Trash2, TriangleAlert } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { compareRgba } from "@breakscope/comparison-engine";
import { breakscopeQueryKeys } from "@/lib/breakscope-queries";
import { loadBreakscopeState, loadScanRunArtifacts, saveBreakscopeState, type BreakscopeState, type LocalScanRun } from "@/lib/breakscope-workspace";
import { capturedImageMimeType } from "@/lib/captured-image";
import { BreakscopeLogo } from "./breakscope-brand";

interface VisualRunComparison { changedRatio: number; previous: string; current: string; diff: string; width: number }

async function compareRunPreviews(current: LocalScanRun, baselineRun: LocalScanRun): Promise<VisualRunComparison> {
  const candidate = current.previews.find((preview) => baselineRun.previews.some((item) => item.width === preview.width && item.routePath === preview.routePath && (item.browserEngine ?? "chromium") === (preview.browserEngine ?? "chromium")));
  if (!candidate) throw new Error("No matching checkpoint exists in the selected baseline.");
  const baseline = baselineRun.previews.find((item) => item.width === candidate.width && item.routePath === candidate.routePath && (item.browserEngine ?? "chromium") === (candidate.browserEngine ?? "chromium"))!;
  const [beforeBitmap, afterBitmap] = await Promise.all([createImageBitmap(new Blob([baseline.image], { type: capturedImageMimeType(baseline.image) })), createImageBitmap(new Blob([candidate.image], { type: capturedImageMimeType(candidate.image) }))]);
  const width = Math.min(beforeBitmap.width, afterBitmap.width); const height = Math.min(beforeBitmap.height, afterBitmap.height);
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height; const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas comparison is unavailable.");
  context.drawImage(beforeBitmap, 0, 0, width, height); const before = context.getImageData(0, 0, width, height);
  context.clearRect(0, 0, width, height); context.drawImage(afterBitmap, 0, 0, width, height); const after = context.getImageData(0, 0, width, height);
  const comparison = compareRgba(before.data, after.data, width, height); const diff = new ImageData(Uint8ClampedArray.from(comparison.diff), width, height); context.putImageData(diff, 0, 0);
  const diffUrl = canvas.toDataURL("image/png");
  const toUrl = (image: ArrayBuffer) => { const bytes = new Uint8Array(image); let binary = ""; for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000)); return `data:${capturedImageMimeType(image)};base64,${btoa(binary)}`; };
  beforeBitmap.close(); afterBitmap.close();
  return { changedRatio: comparison.changedRatio, previous: toUrl(baseline.image), current: toUrl(candidate.image), diff: diffUrl, width: candidate.width };
}

export function BreakscopeHistory() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [runs, setRuns] = useState<LocalScanRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparingId, setComparingId] = useState("");
  const [baselineRunId, setBaselineRunId] = useState("");
  const [comparisons, setComparisons] = useState<Record<string, VisualRunComparison | string>>({});

  useEffect(() => {
    let active = true;
    void loadBreakscopeState().then((state) => { if (active) { setRuns(state.scanHistory ?? []); setBaselineRunId(state.baselineRunId ?? ""); } }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function openRun(run: LocalScanRun) {
    const hydratedRun = await loadScanRunArtifacts(run.id) ?? run;
    const stored = queryClient.getQueryData<BreakscopeState>(breakscopeQueryKeys.workspace()) ?? await loadBreakscopeState();
    const next: BreakscopeState = { ...stored, target: hydratedRun.target, testProfile: hydratedRun.profile ?? stored.testProfile ?? "responsive", latestIssues: hydratedRun.issues, latestPreviews: hydratedRun.previews, scanJob: undefined, updatedAt: Date.now() };
    queryClient.setQueryData(breakscopeQueryKeys.workspace(), next);
    await saveBreakscopeState(next);
    router.push("/workspace");
  }

  async function removeRun(runId: string) {
    const stored = queryClient.getQueryData<BreakscopeState>(breakscopeQueryKeys.workspace()) ?? await loadBreakscopeState();
    const scanHistory = (stored.scanHistory ?? []).filter((run) => run.id !== runId);
    const nextBaselineRunId = stored.baselineRunId === runId ? undefined : stored.baselineRunId;
    const next = { ...stored, scanHistory, baselineRunId: nextBaselineRunId, updatedAt: Date.now() };
    setRuns(scanHistory);
    setBaselineRunId(nextBaselineRunId ?? "");
    queryClient.setQueryData(breakscopeQueryKeys.workspace(), next);
    await saveBreakscopeState(next);
  }

  async function selectBaseline(runId: string) {
    const stored = queryClient.getQueryData<BreakscopeState>(breakscopeQueryKeys.workspace()) ?? await loadBreakscopeState();
    const next = { ...stored, baselineRunId: runId, updatedAt: Date.now() };
    setBaselineRunId(runId);
    setComparisons({});
    queryClient.setQueryData(breakscopeQueryKeys.workspace(), next);
    await saveBreakscopeState(next);
  }

  async function compareRun(run: LocalScanRun, baseline: LocalScanRun) {
    setComparingId(run.id);
    try {
      const [hydratedRun, hydratedBaseline] = await Promise.all([loadScanRunArtifacts(run.id), loadScanRunArtifacts(baseline.id)]);
      const result = await compareRunPreviews(hydratedRun ?? run, hydratedBaseline ?? baseline);
      setComparisons((current) => ({ ...current, [run.id]: result }));
    }
    catch (reason) { setComparisons((current) => ({ ...current, [run.id]: reason instanceof Error ? reason.message : "Could not compare these runs." })); }
    finally { setComparingId(""); }
  }

  return <main id="main-content" className="bk-history-page">
    <header className="bk-history-header"><BreakscopeLogo /><nav aria-label="History navigation"><Link href="/"><ArrowLeft size={15} /> Home</Link><Link className="primary" href="/"><Plus size={15} /> New test</Link></nav></header>
    <section className="bk-history-shell" aria-labelledby="history-title">
      <header className="bk-history-intro"><span><Clock3 size={16} /> Local change review</span><h1 id="history-title">Changes &amp; baselines</h1><p>Choose one trusted scan as the baseline. Breakscope then shows what changed in a later scan at the same viewport.</p></header>
      {!loading && runs.length > 0 && <div className="bk-baseline-guide" role="status"><Flag size={17} /><span><b>{baselineRunId ? "Baseline ready" : "Choose a baseline first"}</b><small>{baselineRunId ? "Use Review changes on another scan to see its visual difference." : "Mark a trusted scan below. This does not modify or rerun the page."}</small></span></div>}
      {loading ? <div className="bk-history-loading" role="status">Loading local runs…</div> : runs.length ? <div className="bk-history-list">{runs.map((run) => {
        const passed = run.issues.length === 0;
        const baseline = runs.find((candidate) => candidate.id === baselineRunId); const isBaseline = run.id === baselineRunId; const comparison = comparisons[run.id];
        return <article key={run.id} className={isBaseline ? "is-baseline" : ""}>
          <div className="bk-history-status">{passed ? <CheckCircle2 size={19} /> : <TriangleAlert size={19} />}<span><b>{passed ? "Passed" : `${run.issues.length} ${run.issues.length === 1 ? "finding" : "findings"}`}</b><small>{new Date(run.createdAt).toLocaleString()}</small></span></div>
          <div className="bk-history-target"><b>{new URL(run.target.url).host}</b><code>{run.target.url}</code></div>
          <dl><div><dt><Route size={14} /> Routes</dt><dd>{run.target.selectedRoutes.length}</dd></div><div><dt><Monitor size={14} /> Checkpoints</dt><dd>{run.target.deviceWidths?.length ?? 0}</dd></div><div><dt><CalendarDays size={14} /> Range</dt><dd>{run.target.minWidth}–{run.target.maxWidth}px</dd></div></dl>
          <div className="bk-history-actions"><button type="button" className="delete" aria-label={`Delete scan from ${new Date(run.createdAt).toLocaleString()}`} onClick={() => void removeRun(run.id)}><Trash2 size={15} /></button><button type="button" className={`baseline ${isBaseline ? "active" : ""}`} aria-pressed={isBaseline} onClick={() => void selectBaseline(run.id)}><Flag size={15} /> {isBaseline ? "Baseline" : "Set baseline"}</button>{baseline && !isBaseline && <button type="button" className="compare" disabled={comparingId === run.id} onClick={() => void compareRun(run, baseline)}>{comparingId === run.id ? <LoaderCircle className="spin" size={15} /> : <Images size={15} />} Review changes</button>}<button type="button" className="open" onClick={() => void openRun(run)}>Open scan <ArrowRight size={15} /></button></div>
          {comparison && <div className="bk-history-comparison">{typeof comparison === "string" ? <p role="alert">{comparison}</p> : <><header><b>{(comparison.changedRatio * 100).toFixed(2)}% changed</b><span>Current versus baseline · matching {comparison.width}px checkpoint</span></header><div><figure><img src={comparison.previous} alt="Baseline checkpoint" /><figcaption>Baseline</figcaption></figure><figure><img src={comparison.current} alt="Current run checkpoint" /><figcaption>Current</figcaption></figure><figure><img src={comparison.diff} alt="Pixel difference between baseline and current run" /><figcaption>Difference</figcaption></figure></div></>}</div>}
        </article>;
      })}</div> : <div className="bk-history-empty"><Clock3 size={28} /><h2>No scans yet</h2><p>Run your first responsive test and it will appear here automatically.</p><Link href="/">Start a new test <ArrowRight size={15} /></Link></div>}
    </section>
  </main>;
}
