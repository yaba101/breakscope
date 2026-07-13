"use client";

import { useEffect, useState } from "react";
import { ComparisonWorkspace } from "@/components/comparison-workspace";
import { getLocalRun, updateLocalRun, type LocalRun } from "@/lib/local-workspace";

interface LoadedRun {
  run: LocalRun;
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
      const baselineSrc = URL.createObjectURL(run.baselineImage);
      const candidateSrc = URL.createObjectURL(run.candidateImage);
      urls.push(baselineSrc, candidateSrc);
      const diffSrc = run.diffImage ? URL.createObjectURL(run.diffImage) : undefined;
      if (diffSrc) urls.push(diffSrc);
      setLoaded({ run, baselineSrc, candidateSrc, diffSrc });
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
      onDecision={async (decision) => {
        await updateLocalRun(runId, { decision });
      }}
    />
  );
}
