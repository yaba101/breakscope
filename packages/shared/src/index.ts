export type ViewportId = "desktop" | "mobile";
export type RunStatus =
  | "queued"
  | "navigating"
  | "stabilizing"
  | "capturing"
  | "processing"
  | "ready"
  | "failed"
  | "cancelled";
export type Decision = "pending" | "accepted" | "rejected";

export interface ViewportProfile {
  id: ViewportId;
  label: string;
  width: number;
  height: number;
}

export interface ProjectSummary {
  id: string;
  name: string;
  origin: string;
  baselineUrl: string;
  candidateUrl: string;
  lastRunId: string;
  changedRegions: number;
  status: "approved" | "review" | "failed";
  health: number[];
  updatedAt: string;
}

export interface ChangedRegion {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  pixelCount: number;
  label: string;
  severity: "high" | "medium" | "low";
}

export interface ElementRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ElementSnapshot {
  key: string;
  order: number;
  tag: string;
  role: string;
  name: string;
  text: string;
  selector: string;
  visible: boolean;
  inViewport: boolean;
  rect: ElementRect;
  attributes: {
    id: string;
    testId: string;
    href: string;
    type: string;
    alt: string;
    placeholder: string;
    ariaLabel: string;
  };
  styles: {
    display: string;
    position: string;
    color: string;
    backgroundColor: string;
    fontSize: string;
    fontWeight: string;
    borderRadius: string;
  };
}

export interface PageSnapshot {
  url: string;
  title: string;
  language: string;
  viewportWidth: number;
  viewportHeight: number;
  documentWidth: number;
  documentHeight: number;
  capturedAt: number;
  elements: ElementSnapshot[];
}

export interface RunSummary {
  id: string;
  projectId: string;
  projectName: string;
  routePath: string;
  viewport: ViewportProfile;
  status: RunStatus;
  decision: Decision;
  changedPixels: number;
  changedRatio: number;
  changedRegions: number;
  createdAt: string;
  duration: string;
}

export interface CaptureRunV1 {
  version: 1;
  runId: string;
  userId: string;
  projectId: string;
  baselineUrl: string;
  candidateUrl: string;
  routePath: string;
  viewport: ViewportProfile;
}

export const viewportProfiles: Record<ViewportId, ViewportProfile> = {
  desktop: { id: "desktop", label: "Desktop", width: 1440, height: 900 },
  mobile: { id: "mobile", label: "Mobile", width: 390, height: 844 },
};

export const projects: ProjectSummary[] = [
  {
    id: "acme-cloud",
    name: "Acme Cloud",
    origin: "https://acme-demo.pages.dev",
    baselineUrl: "https://acme-demo.pages.dev",
    candidateUrl: "https://acme-preview.vercel.app",
    lastRunId: "1247",
    changedRegions: 3,
    status: "review",
    health: [4, 8, 11, 7, 12, 9, 6, 10],
    updatedAt: "2m ago",
  },
  {
    id: "atlas-docs",
    name: "Atlas Docs",
    origin: "https://atlas-docs.pages.dev",
    baselineUrl: "https://atlas-docs.pages.dev",
    candidateUrl: "https://atlas-preview.netlify.app",
    lastRunId: "1246",
    changedRegions: 0,
    status: "approved",
    health: [10, 8, 11, 12, 10, 9, 11, 12],
    updatedAt: "Yesterday",
  },
];

export const runs: RunSummary[] = [
  {
    id: "1247",
    projectId: "acme-cloud",
    projectName: "Acme Cloud",
    routePath: "/pricing",
    viewport: viewportProfiles.desktop,
    status: "ready",
    decision: "pending",
    changedPixels: 1256,
    changedRatio: 0.42,
    changedRegions: 3,
    createdAt: "10:14 AM",
    duration: "18s",
  },
  {
    id: "1246",
    projectId: "atlas-docs",
    projectName: "Atlas Docs",
    routePath: "/components",
    viewport: viewportProfiles.desktop,
    status: "ready",
    decision: "accepted",
    changedPixels: 0,
    changedRatio: 0,
    changedRegions: 0,
    createdAt: "Yesterday, 9:41 AM",
    duration: "15s",
  },
  {
    id: "1245",
    projectId: "acme-cloud",
    projectName: "Acme Cloud",
    routePath: "/checkout",
    viewport: viewportProfiles.mobile,
    status: "failed",
    decision: "pending",
    changedPixels: 0,
    changedRatio: 0,
    changedRegions: 0,
    createdAt: "Yesterday, 8:02 AM",
    duration: "60s",
  },
];

export const changedRegions: ChangedRegion[] = [
  { id: 1, x: 47, y: 31, width: 22, height: 47, pixelCount: 798, label: "Pricing card spacing", severity: "high" },
  { id: 2, x: 70, y: 38, width: 17, height: 18, pixelCount: 287, label: "Button alignment", severity: "medium" },
  { id: 3, x: 82, y: 68, width: 10, height: 12, pixelCount: 171, label: "Footer icon shift", severity: "low" },
];
