"use client";

import { useEffect, useState } from "react";
import { ComparisonWorkspace } from "@/components/comparison-workspace";
import { viewportProfiles } from "@uirift/shared";
import { getLocalProject, getLocalRun, updateLocalRun, type LocalProject, type LocalRun } from "@/lib/local-workspace";

interface LoadedRun {
  run: LocalRun;
  project: LocalProject;
  baselineSrc: string;
  candidateSrc: string;
  diffSrc?: string;
}

export function LocalRunComparison({ runId }: { runId: string }) {
  const [loaded, setLoaded] = useState<LoadedRun>();
  const [error, setError] = useState("");

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
      const baselineSrc = URL.createObjectURL(new Blob([run.baselineImage], { type: "image/png" }));
      const candidateSrc = URL.createObjectURL(new Blob([run.candidateImage], { type: "image/png" }));
      urls.push(baselineSrc, candidateSrc);
      const diffSrc = run.diffImage ? URL.createObjectURL(new Blob([run.diffImage], { type: "image/png" })) : undefined;
      if (diffSrc) urls.push(diffSrc);
      setLoaded({ run, project, baselineSrc, candidateSrc, diffSrc });
    }
    void load().catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to open comparison"));
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [runId]);

  if (error) return <div className="report-state"><p>{error}</p></div>;
  if (!loaded) return <div className="report-state"><p>Opening local comparison…</p></div>;

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
      onDecision={async (decision) => {
        await updateLocalRun(runId, { decision });
      }}
    />
  );
}
