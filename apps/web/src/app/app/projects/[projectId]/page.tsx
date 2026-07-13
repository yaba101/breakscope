import type { Metadata } from "next";
import { ProjectSetupScreen } from "@/components/screens";
export const metadata: Metadata = { title: "Configure comparison" };
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <ProjectSetupScreen existing projectId={projectId} />;
}
