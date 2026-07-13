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
import { useEffect, useRef, useState } from "react";
import {
  viewportProfiles,
  type RunSummary,
  type RunStatus,
} from "@uirift/shared";
import { isCaptureUrl } from "@uirift/validation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { DemoSite } from "@/components/demo-site";
import { ComparisonWorkspace } from "@/components/comparison-workspace";
import { cn } from "@/lib/cn";
import { createVisualDiffFromBlobs } from "@/lib/diff-client";
import { captureLocally } from "@/lib/local-capture";
import {
  createLocalProject,
  createLocalRun,
  clearLocalWorkspace,
  getLocalProject,
  getLocalRun,
  listLocalProjects,
  listLocalRuns,
  updateLocalRun,
} from "@/lib/local-workspace";

const captureStages = [
  {
    name: "Baseline",
    state: "Captured",
    detail: "acme-demo.pages.dev",
    status: "done",
  },
  {
    name: "Candidate",
    state: "Capturing",
    detail: "acme-preview.vercel.app",
    status: "running",
  },
  {
    name: "Visual diff",
    state: "Queued",
    detail: "Runs in your browser",
    status: "queued",
  },
];

function AppPreview() {
  return (
    <div
      className="landing-preview"
      aria-label="UIRift comparison workspace preview"
    >
      <div className="preview-toolbar">
        <b>UIRIFT</b>
        <span>Acme Cloud / Run #1247 / Pricing</span>
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

  return (
    <AppShell breadcrumb="Projects">
      <div className="projects-layout">
        <section className="projects-content">
          <header className="page-header">
            <div>
              <span>WORKSPACE</span>
              <h1>Projects</h1>
              <p>Two projects stored privately in this browser.</p>
            </div>
            <div className="page-actions">
              <label>
                <Search />
                <input placeholder="Search projects…" />
              </label>
              <Link className={cn("button-link primary", projectRows.length >= 2 && "disabled")} href="/app/projects/new" aria-disabled={projectRows.length >= 2}>
                <Plus /> New project
              </Link>
            </div>
          </header>
          <div className="filter-tabs">
            <button type="button" className="active">
              All <span>{projectRows.length}</span>
            </button>
            <button type="button">
              Needs review <i />
            </button>
            <button type="button">Approved</button>
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
            {projectRows.map((project) => (
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
                  Run #{run.id}{" "}
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
  if (existing && projectQuery.isPending) {
    return (
      <AppShell breadcrumb="Loading project…" dock={false}>
        <div className="report-state">
          <LoaderCircle />
          <p>Loading comparison settings…</p>
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
  const [routePath, setRoutePath] = useState("/pricing");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(initialError);
  const baselineValid = isCaptureUrl(baseline);
  const candidateValid = isCaptureUrl(candidate);

  async function submit() {
    if (!name.trim() || !baselineValid || !candidateValid || !routePath.startsWith("/") || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      if (existing && projectId) {
        const project = await getLocalProject(projectId);
        if (!project) throw new Error("This project was not found on this device");
        const run = await createLocalRun(project, routePath, viewport);
        router.push(`/app/runs/${run.id}/capture`);
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
        existing ? "Acme Cloud / New comparison" : "Projects / New project"
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
              <FormField label="Route path">
                <input
                  value={routePath}
                  onChange={(event) => setRoutePath(event.target.value)}
                />
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
          <div className="setup-note">
            <ShieldCheck />
            <p>
              <b>Preview-safe URLs</b>
              <small>
                Approved HTTPS preview hosts are supported. Localhost is allowed for local development.
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
              disabled={!name.trim() || !baselineValid || !candidateValid || !routePath.startsWith("/") || submitting}
              onClick={submit}
            >
              {submitting ? "Saving…" : existing ? "Save and run" : "Continue"}
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
        : "Use localhost or an approved pages.dev, vercel.app, netlify.app or workers.dev URL"}
    </span>
  );
}

export function CaptureScreen({ runId }: { runId: string }) {
  const router = useRouter();
  const started = useRef(false);
  const [liveStatus, setLiveStatus] = useState<RunStatus>("queued");
  const [captureError, setCaptureError] = useState("");
  const [context, setContext] = useState({ projectName: "Local project", routePath: "/", viewport: viewportProfiles.desktop });

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    async function executeCapture() {
      try {
        const run = await getLocalRun(runId);
        if (!run) throw new Error("This comparison was not found on this device");
        const project = await getLocalProject(run.projectId);
        if (!project) throw new Error("The project for this comparison was not found");
        setContext({ projectName: project.name, routePath: run.routePath, viewport: viewportProfiles[run.viewport] });
        if (run.status === "ready") return router.replace(`/app/runs/${runId}`);
        setLiveStatus("capturing");
        await updateLocalRun(runId, { status: "capturing", error: undefined });
        const images = await captureLocally({
          baselineUrl: project.baselineUrl,
          candidateUrl: project.candidateUrl,
          routePath: run.routePath,
          viewport: run.viewport,
        });
        setLiveStatus("processing");
        const [baselineImage, candidateImage] = await Promise.all([
          images.baseline.arrayBuffer(),
          images.candidate.arrayBuffer(),
        ]);
        try {
          await updateLocalRun(runId, { status: "processing", baselineImage, candidateImage });
        } catch (error) {
          throw new Error(`Unable to store captured images: ${String(error)}`);
        }
        let result;
        try {
          result = await createVisualDiffFromBlobs(images.baseline, images.candidate);
        } catch (error) {
          throw new Error(`Unable to calculate the visual diff: ${String(error)}`);
        }
        const profile = viewportProfiles[run.viewport];
        const regions = result.regions.map((region, index) => ({
          id: index + 1,
          x: (region.x / profile.width) * 100,
          y: (region.y / profile.height) * 100,
          width: (region.width / profile.width) * 100,
          height: (region.height / profile.height) * 100,
          pixelCount: region.pixelCount,
          label: `Changed region ${index + 1}`,
          severity: (region.pixelCount > 500 ? "high" : region.pixelCount > 100 ? "medium" : "low") as "high" | "medium" | "low",
        }));
        try {
          await updateLocalRun(runId, {
          status: "ready",
          baselineImage,
          candidateImage,
          diffImage: result.diff,
          changedPixels: result.changedPixels,
          changedRatio: result.changedRatio,
          regions,
          completedAt: Date.now(),
          });
        } catch (error) {
          throw new Error(`Unable to store the comparison result: ${String(error)}`);
        }
        setLiveStatus("ready");
        router.replace(`/app/runs/${runId}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error) || "Local capture failed";
        setCaptureError(message);
        setLiveStatus("failed");
        await updateLocalRun(runId, { status: "failed", error: message }).catch(() => undefined);
      }
    }
    void executeCapture();
  }, [router, runId]);

  const localStages = captureStages.map((stage, index) => ({
    ...stage,
    status: liveStatus === "failed" && index > 0 ? "queued" : liveStatus === "processing" || liveStatus === "ready" ? "done" : index === 0 ? "done" : index === 1 ? "running" : "queued",
    state: liveStatus === "processing" && index === 2 ? "Processing" : liveStatus === "ready" ? "Complete" : stage.state,
    detail: index === 2 ? "Runs in this browser" : "Local Playwright",
  }));

  return (
    <AppShell breadcrumb={`${context.projectName} / Run #${runId.slice(0, 8)}`} dock={false}>
      <div className="capture-screen">
        <aside className="capture-context">
          <span>RUN #{runId.slice(0, 8)}</span>
          <h2>{context.projectName}</h2>
          <p>{context.routePath} · {context.viewport.label} {context.viewport.width}</p>
          <div>
            <b>Baseline</b>
            <small>main@a1b2c3d</small>
          </div>
          <div>
            <b>Candidate</b>
            <small>d4e5f6g</small>
          </div>
        </aside>
        <section className="capture-progress">
          <header>
            <div>
              <span>RUN PROGRESS</span>
              <h1>
                {liveStatus === "processing"
                  ? "Calculating visual diff"
                  : liveStatus === "failed" ? "Capture stopped" : "Capture in progress"}
              </h1>
              <p>
                {liveStatus === "processing"
                  ? "Screenshots ready · processing on this device"
                  : "Local Playwright is capturing both pages"}
              </p>
            </div>
            <b>ETA 00:18</b>
          </header>
          <div className="progress-track">
            <i />
          </div>
          {captureError && <p className="validation-line">{captureError}</p>}
          <div className="capture-stage-list">
            {localStages.map((stage, index) => (
              <article className={stage.status} key={stage.name}>
                <span>
                  {stage.status === "done" ? (
                    <Check />
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
                {stage.status !== "queued" && (
                  <div className="stage-preview">
                    <Globe2 aria-label={index === 0 ? "Baseline page" : "Candidate page"} />
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
              <LoaderCircle /> Capturing candidate
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
                <dd>1440×900</dd>
              </div>
              <div>
                <dt>Region</dt>
                <dd>Automatic</dd>
              </div>
            </dl>
          </section>
          <section>
            <span>LOCAL MODE</span>
            <b>No daily allowance</b>
            <div className="quota-track">
              <i />
            </div>
          </section>
          <Button disabled>Local capture active</Button>
        </aside>
        <section className="live-log">
          <header>
            <b>CAPTURE LOG</b>
            <span>Live</span>
          </header>
          {[
            ["10:14:02", "Run started", "Run #1247 created"],
            ["10:14:05", "Navigated", "Baseline /pricing"],
            ["10:14:08", "Captured", "Baseline 1440×900"],
            ["10:14:12", "Navigated", "Candidate /pricing"],
            ["10:14:15", "Capturing", "Waiting for fonts"],
          ].map(([time, event, detail]) => (
            <div key={time}>
              <small>{time}</small>
              <CheckCircle2 />
              <b>{event}</b>
              <span>{detail}</span>
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
    queryFn: async (): Promise<RunSummary[]> => {
      const localRuns = await listLocalRuns();
      return localRuns.map((run) => ({
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
        createdAt: new Date(run.createdAt).toLocaleString(),
        duration: run.completedAt
          ? `${Math.max(1, Math.round((run.completedAt - run.createdAt) / 1_000))}s`
          : "—",
      }));
    },
  });
  const runRows = runsQuery.data ?? [];

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
              <b>2</b>
            </div>
            <div>
              <small>Changed</small>
              <b className="pink">3</b>
            </div>
            <div>
              <small>Accepted</small>
              <b className="green">1</b>
            </div>
            <div>
              <small>Daily attempts</small>
              <b>2 / 3</b>
            </div>
          </div>
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
                <b>#{run.id}</b>
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
              <span className="settings-avatar">YM</span>
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
