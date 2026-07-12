import type { Metadata } from "next";
import { ProjectSetupScreen } from "@/components/screens";
export const metadata: Metadata = { title: "New project" };
export default function NewProjectPage() { return <ProjectSetupScreen />; }
