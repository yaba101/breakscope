import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { LocalRunComparison } from "@/components/local-run-comparison";
export const metadata: Metadata = { title: "Comparison" };
export default async function RunPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  return (
    <AppShell breadcrumb={`Run #${runId.slice(0, 8)} / Comparison`}>
      <LocalRunComparison runId={runId} />
    </AppShell>
  );
}
