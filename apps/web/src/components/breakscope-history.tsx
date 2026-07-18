"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Clock3, Monitor, Plus, Route, Trash2, TriangleAlert } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { breakscopeQueryKeys } from "@/lib/breakscope-queries";
import { loadBreakscopeState, saveBreakscopeState, type BreakscopeState, type LocalScanRun } from "@/lib/breakscope-workspace";
import { BreakscopeLogo } from "./breakscope-brand";

export function BreakscopeHistory() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [runs, setRuns] = useState<LocalScanRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void loadBreakscopeState().then((state) => { if (active) setRuns(state.scanHistory ?? []); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function openRun(run: LocalScanRun) {
    const stored = queryClient.getQueryData<BreakscopeState>(breakscopeQueryKeys.workspace()) ?? await loadBreakscopeState();
    const next: BreakscopeState = { ...stored, target: run.target, latestIssues: run.issues, latestPreviews: run.previews, scanJob: undefined, updatedAt: Date.now() };
    queryClient.setQueryData(breakscopeQueryKeys.workspace(), next);
    await saveBreakscopeState(next);
    router.push("/workspace");
  }

  async function removeRun(runId: string) {
    const stored = queryClient.getQueryData<BreakscopeState>(breakscopeQueryKeys.workspace()) ?? await loadBreakscopeState();
    const scanHistory = (stored.scanHistory ?? []).filter((run) => run.id !== runId);
    const next = { ...stored, scanHistory, updatedAt: Date.now() };
    setRuns(scanHistory);
    queryClient.setQueryData(breakscopeQueryKeys.workspace(), next);
    await saveBreakscopeState(next);
  }

  return <main id="main-content" className="bk-history-page">
    <header className="bk-history-header"><BreakscopeLogo /><nav aria-label="History navigation"><Link href="/"><ArrowLeft size={15} /> Home</Link><Link className="primary" href="/"><Plus size={15} /> New test</Link></nav></header>
    <section className="bk-history-shell" aria-labelledby="history-title">
      <header className="bk-history-intro"><span><Clock3 size={16} /> Local scan archive</span><h1 id="history-title">Scan history</h1><p>Reopen previous evidence without rerunning the target. Everything here stays on this device.</p></header>
      {loading ? <div className="bk-history-loading" role="status">Loading local runs…</div> : runs.length ? <div className="bk-history-list">{runs.map((run) => {
        const passed = run.issues.length === 0;
        return <article key={run.id}>
          <div className="bk-history-status">{passed ? <CheckCircle2 size={19} /> : <TriangleAlert size={19} />}<span><b>{passed ? "Passed" : `${run.issues.length} ${run.issues.length === 1 ? "finding" : "findings"}`}</b><small>{new Date(run.createdAt).toLocaleString()}</small></span></div>
          <div className="bk-history-target"><b>{new URL(run.target.url).host}</b><code>{run.target.url}</code></div>
          <dl><div><dt><Route size={14} /> Routes</dt><dd>{run.target.selectedRoutes.length}</dd></div><div><dt><Monitor size={14} /> Checkpoints</dt><dd>{run.target.deviceWidths?.length ?? 0}</dd></div><div><dt><CalendarDays size={14} /> Range</dt><dd>{run.target.minWidth}–{run.target.maxWidth}px</dd></div></dl>
          <div className="bk-history-actions"><button type="button" className="delete" aria-label={`Delete scan from ${new Date(run.createdAt).toLocaleString()}`} onClick={() => void removeRun(run.id)}><Trash2 size={15} /></button><button type="button" className="open" onClick={() => void openRun(run)}>Open scan <ArrowRight size={15} /></button></div>
        </article>;
      })}</div> : <div className="bk-history-empty"><Clock3 size={28} /><h2>No scans yet</h2><p>Run your first responsive test and it will appear here automatically.</p><Link href="/">Start a new test <ArrowRight size={15} /></Link></div>}
    </section>
  </main>;
}
