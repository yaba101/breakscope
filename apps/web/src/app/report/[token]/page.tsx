import type { Metadata } from "next";
import { SharedReportScreen } from "@/components/screens";
export const metadata: Metadata = { title: "Shared visual review" };
export default async function SharedReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <SharedReportScreen token={token} />;
}
