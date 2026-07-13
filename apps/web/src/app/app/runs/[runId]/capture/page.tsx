import type { Metadata } from "next";
import { CaptureScreen } from "@/components/screens";
export const metadata: Metadata = { title: "Live capture" };
export default async function CapturePage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  return <CaptureScreen runId={runId} />;
}
