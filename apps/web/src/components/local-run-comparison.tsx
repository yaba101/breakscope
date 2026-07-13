"use client";

import { useEffect, useState } from "react";
import { ComparisonWorkspace, type ComparisonLayer } from "@/components/comparison-workspace";
import { viewportProfiles } from "@uirift/shared";
import { getLocalProject, getLocalRun, listLocalRuns, updateLocalRun, type LocalProject, type LocalRun } from "@/lib/local-workspace";

interface LoadedRun {
  run: LocalRun;
  project: LocalProject;
  baselineSrc: string;
  candidateSrc: string;
  diffSrc?: string;
  layers: ComparisonLayer[];
}

export function LocalRunComparison({ runId }: { runId: string }) {
  const [loaded, setLoaded] = useState<LoadedRun>();
  const [error, setError] = useState("");
  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "error">("idle");
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    const urls: string[] = [];
    async function load() {
      const run = await getLocalRun(runId);
      if (!run?.baselineImage || !run.candidateImage) {
        setError("This local comparison has no captured images.");
        return;
      }
      const project = await getLocalProject(run.projectId);
      if (!project) {
        setError("The project for this comparison is no longer available.");
        return;
      }
      const allRuns = await listLocalRuns();
      const siblingRuns = run.batchId
        ? allRuns.filter((item) => item.batchId === run.batchId && item.status === "ready")
        : [run];
      const layers = siblingRuns
        .sort((a, b) => (a.batchIndex ?? 0) - (b.batchIndex ?? 0))
        .map((item) => ({
          id: item.id,
          routePath: item.routePath,
          viewport: viewportProfiles[item.viewport],
          regionCount: item.regions.length,
        }));
      const baselineSrc = URL.createObjectURL(new Blob([run.baselineImage], { type: "image/png" }));
      const candidateSrc = URL.createObjectURL(new Blob([run.candidateImage], { type: "image/png" }));
      urls.push(baselineSrc, candidateSrc);
      const diffSrc = run.diffImage ? URL.createObjectURL(new Blob([run.diffImage], { type: "image/png" })) : undefined;
      if (diffSrc) urls.push(diffSrc);
      setLoaded({ run, project, baselineSrc, candidateSrc, diffSrc, layers });
    }
    void load().catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to open comparison"));
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [runId]);

  if (error) return <div className="report-state"><p>{error}</p></div>;
  if (!loaded) return <div className="report-state"><p>Opening local comparison…</p></div>;

  async function analyzeWithAi() {
    if (!loaded) return;
    setAiStatus("loading");
    setAiError("");
    try {
      const toDataUrl = (value: ArrayBuffer) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error ?? new Error("Unable to prepare the screenshots"));
        reader.readAsDataURL(new Blob([value], { type: "image/png" }));
      });
      const [baselineImage, candidateImage] = await Promise.all([
        toDataUrl(loaded.run.baselineImage!),
        toDataUrl(loaded.run.candidateImage!),
      ]);
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baselineImage,
          candidateImage,
          routePath: loaded.run.routePath,
          baselineLabel: new URL(loaded.project.baselineUrl).host,
          candidateLabel: new URL(loaded.project.candidateUrl).host,
          deterministicSummary: loaded.run.semanticSummary,
          deterministicFindings: (loaded.run.semanticFindings ?? []).slice(0, 20),
        }),
      });
      const payload = await response.json() as { analysis?: LocalRun["aiAnalysis"]; error?: string };
      if (!response.ok || !payload.analysis) throw new Error(payload.error ?? "AI analysis failed");
      const run = await updateLocalRun(runId, { aiAnalysis: payload.analysis, aiAnalysisError: undefined });
      setLoaded((current) => current ? { ...current, run } : current);
      setAiStatus("idle");
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Unable to analyze this comparison";
      setAiError(message);
      setAiStatus("error");
      await updateLocalRun(runId, { aiAnalysisError: message }).catch(() => undefined);
    }
  }

  return (
    <ComparisonWorkspace
      runId={runId}
      baselineSrc={loaded.baselineSrc}
      candidateSrc={loaded.candidateSrc}
      diffSrc={loaded.diffSrc}
      regions={loaded.run.regions}
      changedPixels={loaded.run.changedPixels}
      changedRatio={loaded.run.changedRatio}
      initialDecision={loaded.run.decision}
      projectName={loaded.project.name}
      routePath={loaded.run.routePath}
      viewport={viewportProfiles[loaded.run.viewport]}
      baselineLabel={new URL(loaded.project.baselineUrl).host}
      candidateLabel={new URL(loaded.project.candidateUrl).host}
      layers={loaded.layers}
      semanticFindings={loaded.run.semanticFindings ?? []}
      semanticSummary={loaded.run.semanticSummary}
      aiAnalysis={loaded.run.aiAnalysis}
      aiStatus={aiStatus}
      aiError={aiError || loaded.run.aiAnalysisError}
      onAnalyze={() => void analyzeWithAi()}
      snapshotSummary={loaded.run.baselineSnapshot && loaded.run.candidateSnapshot ? {
        baselineElements: loaded.run.baselineSnapshot.elements.length,
        candidateElements: loaded.run.candidateSnapshot.elements.length,
        baselineDocumentHeight: loaded.run.baselineSnapshot.documentHeight,
        candidateDocumentHeight: loaded.run.candidateSnapshot.documentHeight,
      } : undefined}
      onDecision={async (decision) => {
        await updateLocalRun(runId, { decision });
      }}
    />
  );
}
