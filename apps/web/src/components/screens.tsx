"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Code2,
  ExternalLink,
  Eye,
  Folder,
  Gauge,
  Github,
  Globe2,
  LoaderCircle,
  LockKeyhole,
  Monitor,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  Smartphone,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  viewportProfiles,
} from "@uirift/shared";
import { comparePageSnapshots } from "@uirift/comparison-engine";
import { isCaptureUrl } from "@uirift/validation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { DemoSite } from "@/components/demo-site";
import { ComparisonWorkspace } from "@/components/comparison-workspace";
import { cn } from "@/lib/cn";
import { createVisualDiffFromBlobs } from "@/lib/diff-client";
import { capturePageLocally, discoverRoutesLocally } from "@/lib/local-capture";
import {
  createLocalProject,
  createLocalRun,
  clearLocalWorkspace,
  getLocalProject,
  getLocalRun,
  listLocalProjects,
  listLocalRuns,
  updateLocalRun,
  type CaptureEvent,
  type LocalRun,
} from "@/lib/local-workspace";

function AppPreview() {
  return (
    <div
      className="landing-preview"
      aria-label="UIRift comparison workspace preview"
    >
      <div className="preview-toolbar">
        <b>UIRIFT</b>
        <span>Seeded example / Pricing</span>
        <i />
        <i />
        <i />
        <em>Capture complete</em>
      </div>
      <div className="preview-rail">
        <Folder />
        <CircleDot />
        <Eye />
      </div>
      <div className="preview-layers">
        <strong>TEST LAYERS</strong>
        <span>▾ Pricing</span>
        <b>
          Desktop <i>3</i>
        </b>
        <span>Mobile</span>
        <span>▾ Checkout</span>
        <span>Desktop</span>
      </div>
      <div className="preview-canvas">
        <div>
          <small>BASELINE · main@a1b2c3d</small>
          <DemoSite compact />
        </div>
        <div>
          <small>CANDIDATE · d4e5f6g</small>
          <DemoSite compact candidate />
          <i className="preview-region" />
        </div>
      </div>
      <div className="preview-inspector">
        <strong>DIFF</strong>
        <span>Changed pixels</span>
        <b>1,256</b>
        <div className="mini-heatmap" />
        <span>FINDINGS</span>
        <p>
          Spacing regression <em>High</em>
        </p>
        <p>
          Button moved <em>Low</em>
        </p>
      </div>
    </div>
  );
}

export function LandingScreen() {
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <Link className="wordmark" href="/">
          UI<span>RIFT</span>
        </Link>
        <nav>
          <a href="#product">Product</a>
          <a href="#workflow">How it works</a>
          <a href="#architecture">Architecture</a>
        </nav>
        <div>
          <Link href="/sign-in">Open workspace</Link>
          <Link
            className="button-link secondary"
            href="https://github.com/your-name/uirift"
          >
            View source
          </Link>
        </div>
      </header>
      <section className="landing-hero" id="product">
        <div className="hero-copy">
          <span className="status-pill">
            <i /> Open portfolio build
          </span>
          <h1>Visual testing that feels like reviewing a Figma file.</h1>
          <p>
            Compare two deployed interfaces, pinpoint every changed pixel, and
            review the evidence in a workspace designed for frontend engineers.
          </p>
          <div className="hero-points">
            <span>
              <Code2 /> Pixel-accurate diffs
              <small>Processed on your device</small>
            </span>
            <span>
              <LockKeyhole /> Local-first architecture
              <small>No account, database, or tracking</small>
            </span>
          </div>
          <div className="hero-actions">
            <Link className="button-link primary" href="/sign-in">
              Start local workspace <ArrowRight size={14} />
            </Link>
            <Link href="#workflow">
              See how it works <ArrowRight size={13} />
            </Link>
          </div>
        </div>
        <AppPreview />
      </section>
      <section className="workflow-section" id="workflow">
        <div className="workflow-heading">
          <span>HOW IT WORKS</span>
          <h2>One focused loop. No dashboard theatre.</h2>
        </div>
        <div className="workflow-grid">
          {[
            [
              "01",
              "Capture",
              "Give UIRift two public deployment URLs and a route.",
              Globe2,
            ],
            [
              "02",
              "Compare",
              "Browser Run captures both pages under the same deterministic viewport.",
              Gauge,
            ],
            [
              "03",
              "Review",
              "Move through regions, switch modes, and record a decision.",
              Eye,
            ],
          ].map(([number, title, text, Icon]) => (
            <article key={title as string}>
              <span>{number as string}</span>
              <Icon />
              <h3>{title as string}</h3>
              <p>{text as string}</p>
              <div className="workflow-graphic">
                <i />
                <i />
                <i />
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="architecture-section" id="architecture">
        <div>
          <span>ENGINEERING CASE STUDY</span>
          <h2>Designed around the limits, not despite them.</h2>
        </div>
        <p>
          A localhost Playwright companion captures both pages. IndexedDB stores
          the artifacts, while a Web Worker performs the pixel comparison in
          your browser. Nothing is uploaded.
        </p>
        <div className="architecture-flow">
          <b>Next.js</b>
          <ArrowRight />
          <b>Local capture</b>
          <ArrowRight />
          <b>Playwright</b>
          <ArrowRight />
          <b>IndexedDB</b>
          <ArrowRight />
          <b>Web Worker</b>
        </div>
      </section>
      <footer className="landing-footer">
        <span>UIRIFT · VISUAL REGRESSION WORKSPACE</span>
        <Link href="/demo">
          Open the seeded demo <ArrowRight size={13} />
        </Link>
      </footer>
    </main>
  );
}

export function SignInScreen() {
  return (
    <main className="auth-page">
      <header>
        <Link className="wordmark" href="/">
          UI<span>RIFT</span>
        </Link>
        <span>Visual regression workspace</span>
        <Link href="/">Back to home</Link>
      </header>
      <section className="auth-panel">
        <div className="auth-context">
          <span className="eyebrow">LOCAL-FIRST BETA</span>
          <h1>Build your workspace on this device</h1>
          <p>Create projects and run real visual comparisons without an account.</p>
          <div className="auth-heatmap">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <ul>
            <li>
              <Folder />
              Projects <b>2 maximum</b>
            </li>
            <li>
              <Gauge />
              Live comparisons <b>Unlimited locally</b>
            </li>
            <li>
              <Clock3 />
              Artifact retention <b>Until you clear it</b>
            </li>
          </ul>
        </div>
        <div className="auth-action">
          <h2>Open a local workspace</h2>
          <p>No sign-in, remote database, or tracking. Your work stays in this browser.</p>
          <Link className="demo-link guest-link" href="/app/projects">
            <Folder /> Continue as guest <ArrowRight />
          </Link>
          <div className="auth-security">
            <LockKeyhole />
            <span>
              <b>Stored only on this device</b>
              <small>Projects, captures, diffs, and decisions use IndexedDB.</small>
            </span>
          </div>
          <small className="auth-terms">
            GitHub authentication and cloud sync will be added after the local workflow is proven.
          </small>
        </div>
      </section>
    </main>
  );
}

function HealthBars({ values }: { values: number[] }) {
  return (
    <div className="health-bars" aria-label="Recent capture health">
      {values.map((value, index) => (
        <i key={`${value}-${index}`} style={{ height: `${value + 4}px` }} />
      ))}
    </div>
  );
}

export function ProjectsScreen() {
  const [projectFilter, setProjectFilter] = useState<"all" | "review" | "approved">("all");
  const [projectSearch, setProjectSearch] = useState("");
  const workspaceQuery = useQuery({
    queryKey: ["local-workspace"],
    queryFn: async () => {
      const [localProjects, localRuns] = await Promise.all([listLocalProjects(), listLocalRuns()]);
      const projectRows = localProjects.map((project) => {
        const projectRuns = localRuns.filter((run) => run.projectId === project.id);
        const lastRun = projectRuns[0];
        return {
          ...project,
          origin: new URL(project.baselineUrl).hostname,
          lastRunId: lastRun?.id.slice(0, 8) ?? "—",
          updatedAt: new Date(project.updatedAt).toLocaleDateString(),
          changedRegions: lastRun?.regions.length ?? 0,
          health: projectRuns.slice(0, 8).map((run) => run.status === "ready" ? 10 : 3),
          status: lastRun?.decision === "accepted" ? "approved" as const : "review" as const,
        };
      });
      return { projects: projectRows, runs: localRuns };
    },
  });
  const projectRows = workspaceQuery.data?.projects ?? [];
  const recentRuns = workspaceQuery.data?.runs.slice(0, 3) ?? [];
  const visibleProjects = projectRows.filter((project) => {
    const matchesFilter = projectFilter === "all" || project.status === projectFilter;
    const matchesSearch = project.name.toLowerCase().includes(projectSearch.trim().toLowerCase());
    return matchesFilter && matchesSearch;
  });
  const reviewCount = projectRows.filter((project) => project.status === "review").length;
  const approvedCount = projectRows.filter((project) => project.status === "approved").length;

  return (
    <AppShell breadcrumb="Projects">
      <div className="projects-layout">
        <section className="projects-content">
          <header className="page-header">
            <div>
              <span>WORKSPACE</span>
              <h1>Projects</h1>
              <p>{projectRows.length} of 2 projects stored privately in this browser.</p>
            </div>
            <div className="page-actions">
              <label>
                <Search />
                <input placeholder="Search projects…" value={projectSearch} onChange={(event) => setProjectSearch(event.target.value)} />
              </label>
              <Link className={cn("button-link primary", projectRows.length >= 2 && "disabled")} href="/app/projects/new" aria-disabled={projectRows.length >= 2}>
                <Plus /> New project
              </Link>
            </div>
          </header>
          <div className="filter-tabs">
            <button type="button" className={projectFilter === "all" ? "active" : ""} onClick={() => setProjectFilter("all")}>
              All <span>{projectRows.length}</span>
            </button>
            <button type="button" className={projectFilter === "review" ? "active" : ""} onClick={() => setProjectFilter("review")}>
              Needs review <span>{reviewCount}</span>
            </button>
            <button type="button" className={projectFilter === "approved" ? "active" : ""} onClick={() => setProjectFilter("approved")}>Approved <span>{approvedCount}</span></button>
          </div>
          <div className="project-table">
            <div className="project-table-head">
              <span>PROJECT</span>
              <span>BASELINE / CANDIDATE</span>
              <span>LAST RUN</span>
              <span>PREVIEW</span>
              <span>CHANGES</span>
              <span>HEALTH</span>
              <span>STATUS</span>
            </div>
            {visibleProjects.map((project) => (
              <Link
                href={`/app/projects/${project.id}`}
                className="project-row"
                key={project.id}
              >
                <div className="project-name">
                  <span className="project-icon">
                    <Globe2 />
                  </span>
                  <p>
                    <b>{project.name}</b>
                    <small>{project.origin}</small>
                  </p>
                </div>
                <div className="environment-pair">
                  <small>BASELINE</small>
                  <b>{new URL(project.baselineUrl).hostname}</b>
                  <small>CANDIDATE</small>
                  <b>{new URL(project.candidateUrl).hostname}</b>
                </div>
                <div>
                  <b>#{project.lastRunId}</b>
                  <small>{project.updatedAt}</small>
                </div>
                <div className="thumb-pair">
                  <span>
                    <Globe2 />
                  </span>
                  <ArrowRight />
                  <span>
                    <Globe2 />
                  </span>
                </div>
                <div
                  className={
                    project.changedRegions
                      ? "change-count changed"
                      : "change-count"
                  }
                >
                  <b>{project.changedRegions}</b>
                  <small>changed</small>
                </div>
                <HealthBars values={project.health} />
                <div className={cn("project-status", project.status)}>
                  {project.status === "approved" ? (
                    <CheckCircle2 />
                  ) : (
                    <CircleDot />
                  )}
                  {project.status === "review" ? "Needs review" : "Approved"}
                  <ChevronRight />
                </div>
              </Link>
            ))}
          </div>
        </section>
        <aside className="activity-panel">
          <div className="panel-heading">
            <b>RECENT ACTIVITY</b>
            <MoreHorizontal />
          </div>
          {recentRuns.map((run) => (
            <div className="activity-item" key={run.id}>
              <span className={cn("activity-icon", run.status)}>
                {run.status === "failed" ? <XCircle /> : <Check />}
              </span>
              <div>
                <small>{new Date(run.createdAt).toLocaleString("en-US", { timeZone: "UTC" })}</small>
                <b>
                  Run #{run.id.slice(0, 8)}{" "}
                  {run.status === "failed" ? "failed" : "completed"}
                </b>
                <p>{run.projectName}</p>
                <small>{run.regions.length} changes · local capture</small>
              </div>
            </div>
          ))}
          <Link href="/app/runs">View all activity</Link>
        </aside>
      </div>
    </AppShell>
  );
}

export function ProjectSetupScreen({
  existing = false,
  projectId,
}: {
  existing?: boolean;
  projectId?: string;
}) {
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const project = await getLocalProject(projectId!);
      if (!project) throw new Error("This project was not found on this device");
      return project;
    },
    enabled: existing && Boolean(projectId),
    retry: false,
  });
  if (!hydrated || (existing && projectQuery.isPending)) {
    return (
      <AppShell breadcrumb="Loading project…" dock={false}>
        <div className="report-state">
          <LoaderCircle />
          <p>{hydrated ? "Loading comparison settings…" : "Preparing local workspace…"}</p>
        </div>
      </AppShell>
    );
  }
  return (
    <ProjectSetupForm
      key={projectId ?? "new"}
      existing={existing}
      projectId={projectId}
      initialName={projectQuery.data?.name}
      initialBaseline={projectQuery.data?.baselineUrl}
      initialCandidate={projectQuery.data?.candidateUrl}
      initialError={
        projectQuery.error instanceof Error ? projectQuery.error.message : ""
      }
    />
  );
}

function ProjectSetupForm({
  existing,
  projectId,
  initialName,
  initialBaseline,
  initialCandidate,
  initialError,
}: {
  existing: boolean;
  projectId?: string;
  initialName?: string;
  initialBaseline?: string;
  initialCandidate?: string;
  initialError: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName ?? "");
  const [baseline, setBaseline] = useState(
    initialBaseline ?? "",
  );
  const [candidate, setCandidate] = useState(
    initialCandidate ?? "",
  );
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [routePath, setRoutePath] = useState("/");
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>(["/"]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(initialError);
  const baselineValid = isCaptureUrl(baseline);
  const candidateValid = isCaptureUrl(candidate);

  const routeQuery = useQuery({
    queryKey: ["route-discovery", baseline, candidate],
    queryFn: () => discoverRoutesLocally({ baselineUrl: baseline, candidateUrl: candidate }),
    enabled: existing && baselineValid && candidateValid,
    retry: false,
    staleTime: 5 * 60_000,
  });
  const discoveredRoutes = routeQuery.data?.routes ?? [];
  const routeOptions = discoveredRoutes.includes("/") ? discoveredRoutes : ["/", ...discoveredRoutes];
  const selectedRouteSet = new Set(selectedRoutes);

  function toggleRoute(route: string) {
    setSelectedRoutes((current) => current.includes(route) ? current.filter((item) => item !== route) : [...current, route]);
  }

  function addCustomRoute() {
    const normalized = routePath.trim();
    if (!normalized.startsWith("/")) return;
    setSelectedRoutes((current) => current.includes(normalized) ? current : [...current, normalized]);
  }

  async function submit() {
    if (!name.trim() || !baselineValid || !candidateValid || (existing && !selectedRoutes.length) || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      if (existing && projectId) {
        const project = await getLocalProject(projectId);
        if (!project) throw new Error("This project was not found on this device");
        const batchId = selectedRoutes.length > 1 ? crypto.randomUUID() : undefined;
        const runs = await Promise.all(selectedRoutes.map((selectedRoute, index) =>
          createLocalRun(
            project,
            selectedRoute,
            viewport,
            batchId ? { id: batchId, index, total: selectedRoutes.length } : undefined,
          ),
        ));
        const firstRun = runs[0];
        if (!firstRun) throw new Error("Select at least one route to compare");
        router.push(`/app/runs/${firstRun.id}/capture`);
      } else {
        const project = await createLocalProject({ name, baselineUrl: baseline, candidateUrl: candidate });
        router.push(`/app/projects/${project.id}`);
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to save your changes",
      );
      setSubmitting(false);
    }
  }
  return (
    <AppShell
      breadcrumb={
        existing ? `${initialName ?? "Project"} / New comparison` : "Projects / New project"
      }
      dock={false}
    >
      <div className="setup-layout">
        <aside className="setup-steps">
          <span>{existing ? "NEW COMPARISON" : "NEW PROJECT SETUP"}</span>
          {[
            ["1", "Project", "Name and deployed URLs"],
            ["2", "Route & viewport", "Choose what to capture"],
            ["3", "Review", "Confirm and run"],
          ].map(([number, title, detail], index) => (
            <div
              className={cn(
                "setup-step",
                index === (existing ? 1 : 0) && "active",
              )}
              key={number}
            >
              <i>{number}</i>
              <p>
                <b>{title}</b>
                <small>{detail}</small>
              </p>
            </div>
          ))}
        </aside>
        <section className="setup-form">
          <header>
            <span>{existing ? "STEP 2 OF 3" : "STEP 1 OF 3"}</span>
            <h1>{existing ? "Configure comparison" : "Create project"}</h1>
            <p>
              {existing
                ? "Choose one route and viewport for this run."
                : "Add your project and two public deployment URLs."}
            </p>
          </header>
          {!existing && (
            <FormField label="Project name">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </FormField>
          )}
          <FormField label="Baseline URL">
            <input
              value={baseline}
              onChange={(event) => setBaseline(event.target.value)}
              placeholder="https://baseline.pages.dev"
            />
            <ValidationLine valid={baselineValid} />
          </FormField>
          <FormField label="Candidate URL">
            <input
              value={candidate}
              onChange={(event) => setCandidate(event.target.value)}
              placeholder="https://preview.vercel.app"
            />
            <ValidationLine valid={candidateValid} />
          </FormField>
          {existing && (
            <>
              <div className="route-discovery">
                <div>
                  <span>Available on both deployments</span>
                  <span className="route-actions">
                    <button type="button" onClick={() => setSelectedRoutes(routeOptions)} disabled={routeQuery.isFetching}>Select all routes</button>
                    <button type="button" onClick={() => void routeQuery.refetch()} disabled={routeQuery.isFetching}>
                      {routeQuery.isFetching && <LoaderCircle />} {routeQuery.isFetching ? "Scanning…" : "Scan again"}
                    </button>
                  </span>
                </div>
                <p>
                  {routeQuery.isFetching
                    ? "Starting at the home page and checking internal navigation links…"
                    : routeQuery.isSuccess
                      ? `${routeOptions.length} common route${routeOptions.length === 1 ? "" : "s"} found · ${selectedRoutes.length} selected.`
                      : routeQuery.isError
                        ? `${routeQuery.error instanceof Error ? routeQuery.error.message : "Unable to discover routes."} Home is still available as the safe default.`
                        : "Home is selected by default."}
                </p>
                <div className="route-options" aria-label="Discovered routes">
                  {routeOptions.map((route) => (
                    <button type="button" aria-pressed={selectedRouteSet.has(route)} className={selectedRouteSet.has(route) ? "active" : ""} onClick={() => toggleRoute(route)} key={route}>
                      {route === "/" ? "Home /" : route}
                    </button>
                  ))}
                </div>
              </div>
              <FormField label="Custom route path">
                <div className="custom-route-entry">
                  <input value={routePath} onChange={(event) => setRoutePath(event.target.value)} />
                  <Button onClick={addCustomRoute} disabled={!routePath.startsWith("/")}>Add route</Button>
                </div>
                <small>Enter a route manually if it is dynamic or not linked from the public site.</small>
              </FormField>
              <div className="viewport-choice">
                <span>Viewport</span>
                <p>
                One viewport keeps each local comparison focused and fast.
                </p>
                <div>
                  <button
                    type="button"
                    onClick={() => setViewport("desktop")}
                    className={viewport === "desktop" ? "active" : ""}
                  >
                    <Monitor />
                    Desktop<b>1440 × 900</b>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewport("mobile")}
                    className={viewport === "mobile" ? "active" : ""}
                  >
                    <Smartphone />
                    Mobile<b>390 × 844</b>
                  </button>
                </div>
              </div>
            </>
          )}
          <div className={cn("setup-note", (!baselineValid || !candidateValid) && "invalid")}>
            {baselineValid && candidateValid ? <ShieldCheck /> : <CircleDot />}
            <p>
              <b>{baselineValid && candidateValid ? "Ready for local capture" : "Check both URLs"}</b>
              <small>
                Any public HTTPS domain is supported. Localhost is allowed for local development.
              </small>
            </p>
          </div>
          {submitError && <p className="validation-line">{submitError}</p>}
        </section>
        <aside className="url-preview">
          <div className="panel-heading">
            <b>URL PREVIEW</b>
            <CircleDot />
          </div>
          <span>Baseline</span>
          <b>{baseline || "Waiting for URL…"}</b>
          <div className="url-preview-frame">
            <Globe2 />
          </div>
          <span>Candidate</span>
          <b>{candidate || "Waiting for URL…"}</b>
          <div className="url-preview-frame">
            <Globe2 />
          </div>
          <dl>
            <div>
              <dt>Viewport</dt>
              <dd>{viewport === "desktop" ? "1440×900" : "390×844"}</dd>
            </div>
            <div>
              <dt>Connection</dt>
              <dd>Cable</dd>
            </div>
            <div>
              <dt>Timezone</dt>
              <dd>UTC</dd>
            </div>
          </dl>
        </aside>
        <footer className="setup-footer">
          <Link href="/app/projects">Cancel</Link>
          <div>
            <Button
              variant="primary"
              disabled={!name.trim() || !baselineValid || !candidateValid || (existing && (!selectedRoutes.length || routeQuery.isFetching)) || submitting}
              onClick={submit}
            >
              {submitting ? "Saving…" : existing ? `Run ${selectedRoutes.length} route${selectedRoutes.length === 1 ? "" : "s"}` : "Continue"}
            </Button>
          </div>
        </footer>
      </div>
    </AppShell>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function ValidationLine({ valid }: { valid: boolean }) {
  return (
    <span className={cn("validation-line", valid && "valid")}>
      {valid ? <CheckCircle2 /> : <CircleDot />}
      {valid
        ? "Verified · ready for local capture"
        : "Use a public HTTPS URL or localhost"}
    </span>
  );
}

async function batchDestination(run: LocalRun) {
  if (!run.batchId) return `/app/runs/${run.id}`;
  const batchRuns = (await listLocalRuns())
    .filter((item) => item.batchId === run.batchId)
    .sort((a, b) => (a.batchIndex ?? 0) - (b.batchIndex ?? 0));
  const next = batchRuns.find((item) => item.status === "queued");
  if (next) return `/app/runs/${next.id}/capture`;
  const firstReady = batchRuns.find((item) => item.status === "ready");
  return `/app/runs/${firstReady?.id ?? run.id}`;
}

const captureStageOrder = ["baseline", "candidate", "diff"] as const;

export function CaptureScreen({ runId }: { runId: string }) {
  const router = useRouter();
  const started = useRef(false);
  const [phase, setPhase] = useState<"starting" | "baseline" | "candidate" | "diff" | "ready" | "failed">("starting");
  const [failedStage, setFailedStage] = useState<"baseline" | "candidate" | "diff">();
  const [captureError, setCaptureError] = useState("");
  const [events, setEvents] = useState<CaptureEvent[]>([]);
  const [retryKey, setRetryKey] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [preview, setPreview] = useState<{ baseline?: string; candidate?: string }>({});
  const [context, setContext] = useState({
    projectId: "",
    projectName: "Local project",
    routePath: "/",
    viewport: viewportProfiles.desktop,
    baselineHost: "Loading…",
    candidateHost: "Loading…",
    batchIndex: 0,
    batchTotal: 1,
  });

  useEffect(() => {
    if (phase === "ready" || phase === "failed") return;
    const startedAt = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [phase, retryKey]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const objectUrls: string[] = [];
    async function executeCapture() {
      let currentEvents: CaptureEvent[] = [];
      let currentStage: "baseline" | "candidate" | "diff" = "baseline";
      const appendEvent = (event: Omit<CaptureEvent, "id" | "time">) => {
        const next: CaptureEvent = { ...event, id: crypto.randomUUID(), time: Date.now() };
        currentEvents = [...currentEvents, next];
        setEvents(currentEvents);
        return next;
      };
      try {
        const run = await getLocalRun(runId);
        if (!run) throw new Error("This comparison was not found on this device");
        const project = await getLocalProject(run.projectId);
        if (!project) throw new Error("The project for this comparison was not found");
        const profile = viewportProfiles[run.viewport];
        setContext({
          projectId: project.id,
          projectName: project.name,
          routePath: run.routePath,
          viewport: profile,
          baselineHost: new URL(project.baselineUrl).host,
          candidateHost: new URL(project.candidateUrl).host,
          batchIndex: (run.batchIndex ?? 0) + 1,
          batchTotal: run.batchTotal ?? 1,
        });
        if (run.status === "ready") {
          started.current = false;
          return router.replace(await batchDestination(run));
        }
        setCaptureError("");
        setElapsed(0);
        setEvents([]);
        setPreview({});
        appendEvent({ stage: "system", status: "success", label: "Run started", detail: `Run #${runId.slice(0, 8)} created locally` });
        setPhase("baseline");
        appendEvent({ stage: "baseline", status: "running", label: "Navigating", detail: new URL(run.routePath, project.baselineUrl).toString() });
        await updateLocalRun(runId, { status: "capturing", error: undefined, events: currentEvents });

        const baseline = await capturePageLocally({
          url: project.baselineUrl,
          routePath: run.routePath,
          viewport: run.viewport,
        });
        const baselineUrl = URL.createObjectURL(baseline.image);
        objectUrls.push(baselineUrl);
        setPreview({ baseline: baselineUrl });
        const baselineImage = await baseline.image.arrayBuffer();
        appendEvent({ stage: "baseline", status: "success", label: "Baseline captured", detail: `${baseline.statusCode} · ${profile.width}×${profile.height} · ${baseline.snapshot.elements.length} semantic elements · ${(baseline.durationMs / 1000).toFixed(1)}s` });
        await updateLocalRun(runId, { baselineImage, baselineSnapshot: baseline.snapshot, baselineDurationMs: baseline.durationMs, events: currentEvents });

        currentStage = "candidate";
        setPhase("candidate");
        appendEvent({ stage: "candidate", status: "running", label: "Navigating", detail: new URL(run.routePath, project.candidateUrl).toString() });
        await updateLocalRun(runId, { events: currentEvents });
        const candidate = await capturePageLocally({
          url: project.candidateUrl,
          routePath: run.routePath,
          viewport: run.viewport,
        });
        const candidateUrl = URL.createObjectURL(candidate.image);
        objectUrls.push(candidateUrl);
        setPreview({ baseline: baselineUrl, candidate: candidateUrl });
        const candidateImage = await candidate.image.arrayBuffer();
        appendEvent({ stage: "candidate", status: "success", label: "Candidate captured", detail: `${candidate.statusCode} · ${profile.width}×${profile.height} · ${candidate.snapshot.elements.length} semantic elements · ${(candidate.durationMs / 1000).toFixed(1)}s` });
        await updateLocalRun(runId, { candidateImage, candidateSnapshot: candidate.snapshot, candidateDurationMs: candidate.durationMs, events: currentEvents });

        currentStage = "diff";
        setPhase("diff");
        appendEvent({ stage: "diff", status: "running", label: "Calculating diff", detail: "Pixel comparison is running in this browser" });
        await updateLocalRun(runId, { status: "processing", events: currentEvents });
        let result;
        try {
          result = await createVisualDiffFromBlobs(baseline.image, candidate.image);
        } catch (error) {
          throw new Error(`Unable to calculate the visual diff: ${String(error)}`);
        }
        const regions = result.regions.map((region, index) => ({
          id: index + 1,
          x: (region.x / result.width) * 100,
          y: (region.y / result.height) * 100,
          width: (region.width / result.width) * 100,
          height: (region.height / result.height) * 100,
          pixelCount: region.pixelCount,
          label: `Changed region ${index + 1}`,
          severity: (region.pixelCount > 500 ? "high" : region.pixelCount > 100 ? "medium" : "low") as "high" | "medium" | "low",
        }));
        const semantic = comparePageSnapshots(baseline.snapshot, candidate.snapshot, { changedRatio: result.changedRatio });
        appendEvent({ stage: "diff", status: "success", label: "Comparison complete", detail: `${semantic.summary.title} · ${semantic.findings.length} meaningful findings · ${result.changedPixels.toLocaleString()} changed pixels` });
        await updateLocalRun(runId, {
          status: "ready",
          baselineImage,
          candidateImage,
          baselineSnapshot: baseline.snapshot,
          candidateSnapshot: candidate.snapshot,
          diffImage: result.diff,
          changedPixels: result.changedPixels,
          changedRatio: result.changedRatio,
          captureWidth: result.width,
          captureHeight: result.height,
          regions,
          semanticFindings: semantic.findings,
          semanticSummary: semantic.summary,
          completedAt: Date.now(),
          events: currentEvents,
        });
        setPhase("ready");
        started.current = false;
        router.replace(await batchDestination(run));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error) || "Local capture failed";
        appendEvent({ stage: currentStage, status: "error", label: `${currentStage[0]?.toUpperCase()}${currentStage.slice(1)} failed`, detail: message });
        setCaptureError(message);
        setFailedStage(currentStage);
        setPhase("failed");
        await updateLocalRun(runId, { status: "failed", error: message, events: currentEvents }).catch(() => undefined);
      }
    }
    void executeCapture();
    return () => objectUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [router, runId, retryKey]);

  const currentIndex = captureStageOrder.indexOf(phase === "starting" || phase === "ready" || phase === "failed" ? "baseline" : phase);
  const localStages = captureStageOrder.map((stage, index) => {
    const isFailed = phase === "failed" && failedStage === stage;
    const done = phase === "ready" || (!isFailed && (currentIndex > index || (phase === "failed" && captureStageOrder.indexOf(failedStage ?? "baseline") > index)));
    const running = phase === stage;
    return {
      name: stage === "diff" ? "Visual diff" : `${stage[0]?.toUpperCase()}${stage.slice(1)}`,
      detail: stage === "baseline" ? context.baselineHost : stage === "candidate" ? context.candidateHost : "Runs in this browser",
      status: isFailed ? "failed" : done ? "done" : running ? "running" : "queued",
      state: isFailed ? "Failed" : done ? "Complete" : running ? (stage === "diff" ? "Processing" : "Capturing") : "Queued",
      preview: stage === "baseline" ? preview.baseline : stage === "candidate" ? preview.candidate : undefined,
    };
  });
  const activeJob = phase === "baseline" ? "Capturing baseline" : phase === "candidate" ? "Capturing candidate" : phase === "diff" ? "Calculating visual diff" : phase === "failed" ? "Capture failed" : "Preparing capture";
  const progress = phase === "baseline" ? 20 : phase === "candidate" ? 55 : phase === "diff" ? 85 : phase === "ready" ? 100 : failedStage === "baseline" ? 20 : failedStage === "candidate" ? 55 : 85;

  return (
    <AppShell breadcrumb={`${context.projectName} / Run #${runId.slice(0, 8)}`} dock={false}>
      <div className="capture-screen">
        <aside className="capture-context">
          <span>{context.batchTotal > 1 ? `ROUTE ${context.batchIndex} OF ${context.batchTotal}` : `RUN #${runId.slice(0, 8)}`}</span>
          <h2>{context.projectName}</h2>
          <p>{context.routePath} · {context.viewport.label} {context.viewport.width}</p>
          <div>
            <b>Baseline</b>
            <small>{context.baselineHost}</small>
          </div>
          <div>
            <b>Candidate</b>
            <small>{context.candidateHost}</small>
          </div>
        </aside>
        <section className="capture-progress">
          <header>
            <div>
              <span>RUN PROGRESS</span>
              <h1>
                {phase === "diff"
                  ? "Calculating visual diff"
                  : phase === "failed" ? "Capture failed" : "Capture in progress"}
              </h1>
              <p>
                {phase === "diff"
                  ? "Screenshots ready · processing on this device"
                  : phase === "failed" ? "The run stopped at the failed step below" : "Local Playwright is capturing each page in sequence"}
              </p>
            </div>
            <b>{phase === "failed" ? `Stopped after ${elapsed}s` : `Elapsed ${elapsed}s`}</b>
          </header>
          <div className="progress-track">
            <i style={{ width: `${progress}%` }} />
          </div>
          {captureError && (
            <div className="capture-error-actions">
              <p className="validation-line"><XCircle /> {captureError}</p>
              <Button onClick={() => { started.current = false; setRetryKey((value) => value + 1); }}>Retry capture</Button>
              {context.projectId && <Link href={`/app/projects/${context.projectId}`}>Edit route or URLs</Link>}
            </div>
          )}
          <div className="capture-stage-list">
            {localStages.map((stage, index) => (
              <article className={stage.status} key={stage.name}>
                <span>
                  {stage.status === "done" ? (
                    <Check />
                  ) : stage.status === "failed" ? (
                    <XCircle />
                  ) : stage.status === "running" ? (
                    <LoaderCircle />
                  ) : (
                    <Clock3 />
                  )}
                </span>
                <div>
                  <small>0{index + 1}</small>
                  <h3>{stage.name}</h3>
                  <p>{stage.detail}</p>
                </div>
                <b>{stage.state}</b>
                {stage.preview && (
                  <div className="stage-preview">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={stage.preview} alt={`${stage.name} capture preview`} />
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
        <aside className="run-details">
          <div className="panel-heading">
            <b>RUN DETAILS</b>
            <MoreHorizontal />
          </div>
          <section>
            <span>CURRENT JOB</span>
            <p>
              {phase === "failed" ? <XCircle /> : <LoaderCircle />} {activeJob}
            </p>
            <small>Local process · no cloud usage</small>
          </section>
          <section>
            <span>ENVIRONMENT</span>
            <dl>
              <div>
                <dt>Browser</dt>
                <dd>Chromium</dd>
              </div>
              <div>
                <dt>Viewport</dt>
                <dd>{context.viewport.width}×{context.viewport.height}</dd>
              </div>
              <div>
                <dt>Region</dt>
                <dd>Local device</dd>
              </div>
            </dl>
          </section>
          <section><span>STORAGE</span><p>IndexedDB on this device</p><small>No account or cloud database</small></section>
        </aside>
        <section className="live-log">
          <header>
            <b>CAPTURE LOG</b>
            <span>Live</span>
          </header>
          {events.map((event) => (
            <div key={event.id}>
              <small>{new Date(event.time).toLocaleTimeString("en-GB", { hour12: false, timeZone: "UTC" })}</small>
              {event.status === "error" ? <XCircle /> : event.status === "running" ? <LoaderCircle /> : <CheckCircle2 />}
              <b>{event.label}</b>
              <span>{event.detail}</span>
            </div>
          ))}
        </section>
      </div>
    </AppShell>
  );
}

export function RunsScreen() {
  const runsQuery = useQuery({
    queryKey: ["local-runs"],
    queryFn: listLocalRuns,
  });
  const localRuns = runsQuery.data ?? [];
  const runRows = localRuns.map((run) => ({
        id: run.id,
        projectId: run.projectId,
        projectName: run.projectName,
        routePath: run.routePath,
        viewport: viewportProfiles[run.viewport],
        status: run.status,
        decision: run.decision,
        changedPixels: run.changedPixels,
        changedRatio: run.changedRatio * 100,
        changedRegions: run.regions.length,
        createdAt: new Date(run.createdAt).toLocaleString("en-US", { timeZone: "UTC" }),
        duration: run.completedAt
          ? `${Math.max(1, Math.round((run.completedAt - run.createdAt) / 1_000))}s`
          : "—",
      }));
  const batches = Array.from(localRuns.reduce((groups, run) => {
    const id = run.batchId ?? run.id;
    const group = groups.get(id) ?? [];
    group.push(run);
    groups.set(id, group);
    return groups;
  }, new Map<string, LocalRun[]>()).entries())
    .map(([id, items]) => ({ id, items: items.sort((a, b) => (a.batchIndex ?? 0) - (b.batchIndex ?? 0)) }))
    .sort((a, b) => (b.items[0]?.createdAt ?? 0) - (a.items[0]?.createdAt ?? 0));
  const latestBatch = batches[0];
  const latestRoutes = latestBatch?.items ?? [];
  const changedRouteCount = latestRoutes.filter((run) => run.changedPixels > 0 || (run.semanticFindings?.length ?? 0) > 0).length;
  const failedRouteCount = latestRoutes.filter((run) => run.status === "failed").length;
  const highestRisk = Math.max(0, ...latestRoutes.map((run) => run.aiAnalysis?.riskScore ?? run.semanticSummary?.riskScore ?? 0));
  const releaseVerdict = latestRoutes.some((run) => run.aiAnalysis?.verdict === "block" || run.semanticSummary?.level === "major")
    ? "block"
    : changedRouteCount > 0 || failedRouteCount > 0
      ? "review"
      : "safe";
  const today = new Date().toDateString();
  const runsToday = runRows.filter((run) => new Date(run.createdAt).toDateString() === today).length;
  const changedRuns = runRows.filter((run) => run.changedRegions > 0).length;
  const acceptedRuns = runRows.filter((run) => run.decision === "accepted").length;
  const failedRuns = runRows.filter((run) => run.status === "failed").length;

  return (
    <AppShell breadcrumb="Runs">
      <div className="runs-screen">
        <section>
          <header className="page-header">
            <div>
              <span>RUN HISTORY</span>
              <h1>Comparisons</h1>
              <p>Comparison history stored on this device.</p>
            </div>
            <div className="page-actions">
              <label>
                <Search />
                <input placeholder="Search runs…" />
              </label>
              <Link className="button-link primary" href="/app/projects">
                New comparison
              </Link>
            </div>
          </header>
          <div className="run-summary-strip">
            <div>
              <small>Runs today</small>
              <b>{runsToday}</b>
            </div>
            <div>
              <small>Changed</small>
              <b className="pink">{changedRuns}</b>
            </div>
            <div>
              <small>Accepted</small>
              <b className="green">{acceptedRuns}</b>
            </div>
            <div>
              <small>Failed</small>
              <b>{failedRuns}</b>
            </div>
          </div>
          {latestBatch && (
            <section className={cn("batch-report", `verdict-${releaseVerdict}`)} aria-labelledby="latest-route-report">
              <header>
                <div><span>LATEST ROUTE REPORT</span><h2 id="latest-route-report">{latestRoutes[0]?.projectName}</h2></div>
                <b>{releaseVerdict}</b>
              </header>
              <p>{releaseVerdict === "block"
                ? `${changedRouteCount} of ${latestRoutes.length} routes changed, including a major or AI-blocking regression. Do not promote this candidate without review.`
                : releaseVerdict === "review"
                  ? `${changedRouteCount} of ${latestRoutes.length} routes changed. Review the affected journeys before accepting this candidate.`
                  : `All ${latestRoutes.length} captured routes match closely enough to continue.`}</p>
              <div className="batch-metrics">
                <div><small>Routes checked</small><strong>{latestRoutes.length}</strong></div>
                <div><small>Changed</small><strong>{changedRouteCount}</strong></div>
                <div><small>Highest risk</small><strong>{highestRisk}/100</strong></div>
                <div><small>Failed</small><strong>{failedRouteCount}</strong></div>
              </div>
              <ul className="route-matrix" aria-label="Route comparison results">
                {latestRoutes.map((run) => {
                  const risk = run.aiAnalysis?.riskScore ?? run.semanticSummary?.riskScore ?? 0;
                  const state = run.status === "failed" ? "failed" : run.aiAnalysis?.verdict ?? run.semanticSummary?.level ?? "unchanged";
                  return <li key={run.id}><Link href={run.status === "failed" ? `/app/projects/${run.projectId}` : `/app/runs/${run.id}`}>
                      <span><b>{run.routePath}</b><small>{viewportProfiles[run.viewport].label} · {run.semanticFindings?.length ?? run.regions.length} findings</small></span>
                      <em className={state}>{state}</em>
                      <strong>{risk}</strong>
                      <ChevronRight size={14} />
                    </Link></li>;
                })}
              </ul>
            </section>
          )}
          <div className="runs-table">
            <div className="runs-table-head">
              <span>RUN</span>
              <span>PROJECT / ROUTE</span>
              <span>BASELINE</span>
              <span>CANDIDATE</span>
              <span>DIFF</span>
              <span>DECISION</span>
              <span />
            </div>
            {runRows.map((run) => (
              <Link
                href={
                  run.status === "failed"
                    ? `/app/projects/${run.projectId}`
                    : `/app/runs/${run.id}`
                }
                className="run-row"
                key={run.id}
              >
                <b>#{run.id.slice(0, 8)}</b>
                <div>
                  <strong>{run.projectName}</strong>
                  <small>
                    {run.routePath} · {run.viewport.label} {run.viewport.width}
                  </small>
                </div>
                <span className="run-thumb">
                  <Globe2 />
                </span>
                <span className="run-thumb">
                  <Globe2 />
                </span>
                <div
                  className={
                    run.changedRegions ? "run-diff changed" : "run-diff"
                  }
                >
                  <b>{run.changedRatio}%</b>
                  <small>{run.changedRegions} regions</small>
                </div>
                <span
                  className={cn(
                    "decision",
                    run.decision,
                    run.status === "failed" && "failed",
                  )}
                >
                  {run.status === "failed" ? "Failed" : run.decision}
                </span>
                <ChevronRight />
              </Link>
            ))}
          </div>
        </section>
        <aside className="runs-side">
          <span>LOCAL WORKSPACE</span>
          <h2>Capture service available</h2>
          <div className="quota-orbit">
            <b>∞</b>
            <small>local attempts</small>
          </div>
          <dl>
            <div>
              <dt>Projects</dt>
              <dd>Up to 2</dd>
            </div>
            <div>
              <dt>Stored runs</dt>
              <dd>{runRows.length}</dd>
            </div>
            <div>
              <dt>Artifacts</dt>
              <dd>Stay local</dd>
            </div>
          </dl>
          <p>
            <ShieldCheck /> Nothing is uploaded to UIRift or Cloudflare in local mode.
          </p>
        </aside>
      </div>
    </AppShell>
  );
}

export function SharedReportScreen({ token }: { token: string }) {
  const reportQuery = useQuery({
    queryKey: ["shared-report", token],
    queryFn: async ({ signal }) => {
      const response = await fetch(`/api/public/reports/${token}`, {
        cache: "no-store",
        signal,
      });
      if (!response.ok) throw new Error("expired");
      return response.json();
    },
    retry: false,
  });
  const reportState = reportQuery.isPending
    ? "loading"
    : reportQuery.isError
      ? "expired"
      : "ready";

  if (reportState !== "ready") {
    return (
      <main className="report-state">
        <Link className="wordmark" href="/">
          UI<span>RIFT</span>
        </Link>
        <div>
          <LockKeyhole />
          <h1>
            {reportState === "loading"
              ? "Opening shared report…"
              : "This shared report has expired"}
          </h1>
          <p>
            {reportState === "loading"
              ? "Verifying the read-only link."
              : "Ask the owner to create a new seven-day link."}
          </p>
          {reportState === "expired" && (
            <Link className="button-link primary" href="/demo">
              Open the seeded demo
            </Link>
          )}
        </div>
      </main>
    );
  }
  return (
    <main className="shared-page">
      <header>
        <Link className="wordmark" href="/">
          UI<span>RIFT</span>
        </Link>
        <span>Shared visual review</span>
        <b>Acme Cloud · Run #1247</b>
        <em>
          <i /> Changes requested
        </em>
        <small>Link expires in 6 days</small>
        <Link className="button-link primary" href="/sign-in">
          Open UIRift
        </Link>
      </header>
      <div className="shared-grid">
        <aside className="report-details">
          <span>RUN DETAILS</span>
          <dl>
            <div>
              <dt>Baseline</dt>
              <dd>main@a1b2c3d</dd>
            </div>
            <div>
              <dt>Candidate</dt>
              <dd>d4e5f6g</dd>
            </div>
            <div>
              <dt>Captured</dt>
              <dd>Jul 13, 2026</dd>
            </div>
            <div>
              <dt>Viewport</dt>
              <dd>1440×900</dd>
            </div>
          </dl>
          <span>SUMMARY</span>
          <div className="report-metrics">
            <b>
              1<small>Comparison</small>
            </b>
            <b>
              3<small>Regions</small>
            </b>
            <b>
              0.42%<small>Diff</small>
            </b>
          </div>
          <span>CHANGED REGIONS</span>
          {[
            "Pricing card spacing",
            "Button alignment",
            "Footer icon shift",
          ].map((item, index) => (
            <button
              type="button"
              className={index === 0 ? "active" : ""}
              key={item}
            >
              <i>{index + 1}</i>
              <span>
                {item}
                <small>
                  {index === 0 ? "High" : index === 1 ? "Medium" : "Low"}
                </small>
              </span>
            </button>
          ))}
        </aside>
        <ComparisonWorkspace
          publicMode
          reportMode
          baselineSrc={`/api/public/reports/${token}/artifacts/baseline`}
          candidateSrc={`/api/public/reports/${token}/artifacts/candidate`}
        />
        <aside className="report-evidence">
          <span>EVIDENCE</span>
          <article>
            <small>PIXEL CHANGE</small>
            <b>1,256 pixels</b>
            <p>0.42% of the captured viewport changed.</p>
          </article>
          <article>
            <small>REVIEWER DECISION</small>
            <b className="rejected">Rejected</b>
            <p>
              The Pro card moved 24px and no longer aligns with the pricing row.
            </p>
          </article>
          <article>
            <small>RETENTION</small>
            <b>6 days remaining</b>
            <p>Images and this report are deleted automatically.</p>
          </article>
          <Link href="/demo">
            Open interactive demo <ExternalLink />
          </Link>
        </aside>
      </div>
      <footer>
        <span>
          <LockKeyhole /> This is a read-only shared report.
        </span>
        <Link href="https://github.com/your-name/uirift">
          View source <Github />
        </Link>
      </footer>
    </main>
  );
}

export function SettingsScreen() {
  return (
    <AppShell breadcrumb="Settings">
      <div className="settings-screen">
        <section>
          <span>SETTINGS</span>
          <h1>Workspace preferences</h1>
          <article>
            <div>
              <h2>Account</h2>
              <p>This beta runs as a private guest workspace in your browser.</p>
            </div>
            <button type="button">
              <span className="settings-avatar">LG</span>
              <b>Local guest</b>
              <small>No account connected</small>
              <ChevronRight />
            </button>
          </article>
          <article>
            <div>
              <h2>Usage limits</h2>
              <p>Local guardrails keep the workspace fast and focused.</p>
            </div>
            <dl>
              <div>
                <dt>Projects</dt>
                <dd>2 maximum</dd>
              </div>
              <div>
                <dt>Runs</dt>
                <dd>Stored locally</dd>
              </div>
              <div>
                <dt>Attempts</dt>
                <dd>Unlimited</dd>
              </div>
            </dl>
          </article>
          <article>
            <div>
              <h2>Retention</h2>
              <p>Screenshot artifacts remain until browser data is cleared.</p>
            </div>
            <button type="button" className="danger-row" onClick={async () => {
              await clearLocalWorkspace();
              window.location.href = "/app/projects";
            }}>
              <Trash2 /> Clear local workspace data
            </button>
          </article>
          <article>
            <div>
              <h2>Keyboard shortcuts</h2>
              <p>Comparison controls remain available without a pointer.</p>
            </div>
            <div className="shortcut-list">
              <span>
                <kbd>1–4</kbd> Comparison modes
              </span>
              <span>
                <kbd>[ ]</kbd> Changed regions
              </span>
              <span>
                <kbd>+ −</kbd> Zoom
              </span>
              <span>
                <kbd>0</kbd> Fit canvas
              </span>
            </div>
          </article>
        </section>
      </div>
    </AppShell>
  );
}
