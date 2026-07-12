import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ComparisonWorkspace } from "@/components/comparison-workspace";
export const metadata: Metadata = { title: "Comparison" };
export default async function RunPage({ params }: { params: Promise<{ runId: string }> }) { const { runId } = await params; return <AppShell breadcrumb={`Acme Cloud / Run #${runId} / Pricing`}><ComparisonWorkspace /></AppShell>; }
