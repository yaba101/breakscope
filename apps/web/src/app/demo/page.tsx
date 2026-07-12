import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ComparisonWorkspace } from "@/components/comparison-workspace";
export const metadata: Metadata = { title: "Seeded demo" };
export default function DemoPage() { return <AppShell breadcrumb="Seeded demo / Acme Cloud / Pricing"><ComparisonWorkspace publicMode /></AppShell>; }
