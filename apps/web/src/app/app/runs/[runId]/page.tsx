import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ComparisonWorkspace } from "@/components/comparison-workspace";
export const metadata: Metadata = { title: "Comparison" };
export default async function RunPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  return (
    <AppShell breadcrumb={`Run #${runId.slice(0, 8)} / Comparison`}>
      <ComparisonWorkspace
        runId={runId}
        baselineSrc={`/api/runs/${runId}/artifacts/baseline`}
        candidateSrc={`/api/runs/${runId}/artifacts/candidate`}
      />
    </AppShell>
  );
}
