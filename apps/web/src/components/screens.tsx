"use client";

import Link from "next/link";
import {
  AlertCircle,
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
  KeyRound,
  Link2,
  LoaderCircle,
  LockKeyhole,
  Monitor,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { projects, runs } from "@uirift/shared";
import { isApprovedPublicUrl } from "@uirift/validation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { DemoSite } from "@/components/demo-site";
import { ComparisonWorkspace } from "@/components/comparison-workspace";
import { cn } from "@/lib/cn";

function AppPreview() {
  return (
    <div className="landing-preview" aria-label="UIRift comparison workspace preview">
      <div className="preview-toolbar"><b>UIRIFT</b><span>Acme Cloud / Run #1247 / Pricing</span><i /><i /><i /><em>Capture complete</em></div>
      <div className="preview-rail"><Folder /><CircleDot /><Eye /></div>
      <div className="preview-layers"><strong>TEST LAYERS</strong><span>▾ Pricing</span><b>Desktop <i>3</i></b><span>Mobile</span><span>▾ Checkout</span><span>Desktop</span></div>
      <div className="preview-canvas"><div><small>BASELINE · main@a1b2c3d</small><DemoSite compact /></div><div><small>CANDIDATE · d4e5f6g</small><DemoSite compact candidate /><i className="preview-region" /></div></div>
      <div className="preview-inspector"><strong>DIFF</strong><span>Changed pixels</span><b>1,256</b><div className="mini-heatmap" /><span>FINDINGS</span><p>Spacing regression <em>High</em></p><p>Button moved <em>Low</em></p></div>
    </div>
  );
}

export function LandingScreen() {
  return (
    <main className="landing-page">
      <header className="landing-nav"><Link className="wordmark" href="/">UI<span>RIFT</span></Link><nav><a href="#product">Product</a><a href="#workflow">How it works</a><a href="#architecture">Architecture</a></nav><div><Link href="/sign-in">Sign in</Link><Link className="button-link secondary" href="https://github.com/your-name/uirift">View source</Link></div></header>
      <section className="landing-hero" id="product">
        <div className="hero-copy"><span className="status-pill"><i /> Open portfolio build</span><h1>Visual testing that feels like reviewing a Figma file.</h1><p>Compare two deployed interfaces, pinpoint every changed pixel, and review the evidence in a workspace designed for frontend engineers.</p><div className="hero-points"><span><Code2 /> Pixel-accurate diffs<small>Processed on your device</small></span><span><LockKeyhole /> Zero-dollar architecture<small>Built on Cloudflare free tiers</small></span></div><div className="hero-actions"><Link className="button-link primary" href="/demo">Try live demo <ArrowRight size={14} /></Link><Link href="#workflow">See how it works <ArrowRight size={13} /></Link></div></div>
        <AppPreview />
      </section>
      <section className="workflow-section" id="workflow">
        <div className="workflow-heading"><span>HOW IT WORKS</span><h2>One focused loop. No dashboard theatre.</h2></div>
        <div className="workflow-grid">
          {[
            ["01", "Capture", "Give UIRift two public deployment URLs and a route.", Globe2],
            ["02", "Compare", "Browser Run captures both pages under the same deterministic viewport.", Gauge],
            ["03", "Review", "Move through regions, switch modes, and record a decision.", Eye],
          ].map(([number, title, text, Icon]) => <article key={title as string}><span>{number as string}</span><Icon /><h3>{title as string}</h3><p>{text as string}</p><div className="workflow-graphic"><i /><i /><i /></div></article>)}
        </div>
      </section>
      <section className="architecture-section" id="architecture"><div><span>ENGINEERING CASE STUDY</span><h2>Designed around the limits, not despite them.</h2></div><p>Cloudflare captures and stores the screenshots. A Web Worker performs the CPU-heavy image comparison in the browser, keeping the public demo inside a strict no-bill architecture.</p><div className="architecture-flow"><b>Next.js</b><ArrowRight /><b>Queue</b><ArrowRight /><b>Browser Run</b><ArrowRight /><b>R2</b><ArrowRight /><b>Web Worker</b></div></section>
      <footer className="landing-footer"><span>UIRIFT · VISUAL REGRESSION WORKSPACE</span><Link href="/demo">Open the seeded demo <ArrowRight size={13} /></Link></footer>
    </main>
  );
}

export function SignInScreen() {
  return (
    <main className="auth-page">
      <header><Link className="wordmark" href="/">UI<span>RIFT</span></Link><span>Visual regression workspace</span><Link href="/">Back to home</Link></header>
      <section className="auth-panel">
        <div className="auth-context"><span className="eyebrow">PORTFOLIO DEMO</span><h1>Sign in to create your workspace</h1><p>Use GitHub to save projects and run live visual comparisons.</p><div className="auth-heatmap"><i /><i /><i /><i /><i /></div><ul><li><Folder />Projects <b>2 maximum</b></li><li><Gauge />Live comparisons <b>3 per day</b></li><li><Clock3 />Artifact retention <b>7 days</b></li></ul></div>
        <div className="auth-action"><h2>Continue to UIRift</h2><p>GitHub is used only for identity in this portfolio release.</p><Link href="/app/projects" className="github-button"><Github /> Continue with GitHub</Link><div className="auth-separator"><span>or</span></div><Link className="demo-link" href="/demo"><Eye /> Open the seeded demo without signing in <ArrowRight /></Link><div className="auth-security"><ShieldCheck /><span><b>Managed with Better Auth</b><small>Sessions remain in UIRift&apos;s Cloudflare D1 database.</small></span></div><small className="auth-terms">By continuing, you agree to the demonstration&apos;s acceptable-use and retention limits.</small></div>
      </section>
    </main>
  );
}

function HealthBars({ values }: { values: number[] }) {
  return <div className="health-bars" aria-label="Recent capture health">{values.map((value, index) => <i key={`${value}-${index}`} style={{ height: `${value + 4}px` }} />)}</div>;
}

export function ProjectsScreen() {
  return (
    <AppShell breadcrumb="Projects">
      <div className="projects-layout">
        <section className="projects-content"><header className="page-header"><div><span>WORKSPACE</span><h1>Projects</h1><p>Two projects available on the portfolio plan.</p></div><div className="page-actions"><label><Search /><input placeholder="Search projects…" /></label><Link className="button-link primary" href="/app/projects/new"><Plus /> New project</Link></div></header><div className="filter-tabs"><button className="active">All <span>2</span></button><button>Needs review <i /></button><button>Approved</button></div><div className="project-table"><div className="project-table-head"><span>PROJECT</span><span>BASELINE / CANDIDATE</span><span>LAST RUN</span><span>PREVIEW</span><span>CHANGES</span><span>HEALTH</span><span>STATUS</span></div>{projects.map((project) => <Link href={`/app/projects/${project.id}`} className="project-row" key={project.id}><div className="project-name"><span className="project-icon"><Globe2 /></span><p><b>{project.name}</b><small>{project.origin}</small></p></div><div className="environment-pair"><small>BASELINE</small><b>main@a1b2c3d</b><small>CANDIDATE</small><b>d4e5f6g</b></div><div><b>#{project.lastRunId}</b><small>{project.updatedAt}</small></div><div className="thumb-pair"><span><DemoSite compact /></span><ArrowRight /><span><DemoSite compact candidate /></span></div><div className={project.changedRegions ? "change-count changed" : "change-count"}><b>{project.changedRegions}</b><small>changed</small></div><HealthBars values={project.health} /><div className={cn("project-status", project.status)}>{project.status === "approved" ? <CheckCircle2 /> : <CircleDot />}{project.status === "review" ? "Needs review" : "Approved"}<ChevronRight /></div></Link>)}</div></section>
        <aside className="activity-panel"><div className="panel-heading"><b>RECENT ACTIVITY</b><MoreHorizontal /></div>{runs.map((run) => <div className="activity-item" key={run.id}><span className={cn("activity-icon", run.status)}>{run.status === "failed" ? <XCircle /> : <Check />}</span><div><small>{run.createdAt}</small><b>Run #{run.id} {run.status === "failed" ? "failed" : "completed"}</b><p>{run.projectName}</p><small>{run.changedRegions} changes · {run.duration}</small></div></div>)}<Link href="/app/runs">View all activity</Link></aside>
      </div>
    </AppShell>
  );
}

export function ProjectSetupScreen({ existing = false }: { existing?: boolean }) {
  const [baseline, setBaseline] = useState(existing ? "https://acme-demo.pages.dev" : "");
  const [candidate, setCandidate] = useState(existing ? "https://acme-preview.vercel.app" : "");
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const baselineValid = isApprovedPublicUrl(baseline);
  const candidateValid = isApprovedPublicUrl(candidate);
  return (
    <AppShell breadcrumb={existing ? "Acme Cloud / New comparison" : "Projects / New project"} dock={false}>
      <div className="setup-layout">
        <aside className="setup-steps"><span>{existing ? "NEW COMPARISON" : "NEW PROJECT SETUP"}</span>{[["1", "Project", "Name and deployed URLs"], ["2", "Route & viewport", "Choose what to capture"], ["3", "Review", "Confirm and run"]].map(([number, title, detail], index) => <div className={cn("setup-step", index === (existing ? 1 : 0) && "active")} key={number}><i>{number}</i><p><b>{title}</b><small>{detail}</small></p></div>)}</aside>
        <section className="setup-form"><header><span>{existing ? "STEP 2 OF 3" : "STEP 1 OF 3"}</span><h1>{existing ? "Configure comparison" : "Create project"}</h1><p>{existing ? "Choose one route and viewport for this run." : "Add your project and two public deployment URLs."}</p></header>{!existing && <FormField label="Project name"><input defaultValue="Acme Cloud" /></FormField>}<FormField label="Baseline URL"><input value={baseline} onChange={(event) => setBaseline(event.target.value)} placeholder="https://baseline.pages.dev" /><ValidationLine valid={baselineValid} /></FormField><FormField label="Candidate URL"><input value={candidate} onChange={(event) => setCandidate(event.target.value)} placeholder="https://preview.vercel.app" /><ValidationLine valid={candidateValid} /></FormField>{existing && <><FormField label="Route path"><input defaultValue="/pricing" /></FormField><div className="viewport-choice"><span>Viewport</span><p>One viewport per run protects the daily live-capture allowance.</p><div><button onClick={() => setViewport("desktop")} className={viewport === "desktop" ? "active" : ""}><Monitor />Desktop<b>1440 × 900</b></button><button onClick={() => setViewport("mobile")} className={viewport === "mobile" ? "active" : ""}><Smartphone />Mobile<b>390 × 844</b></button></div></div></>}<div className="setup-note"><ShieldCheck /><p><b>Public HTTPS only</b><small>Localhost, IP literals, credentials, private networks and unsupported hosts are blocked.</small></p></div></section>
        <aside className="url-preview"><div className="panel-heading"><b>URL PREVIEW</b><CircleDot /></div><span>Baseline</span><b>{baseline || "Waiting for URL…"}</b><div className="url-preview-frame">{baselineValid ? <DemoSite compact /> : <Globe2 />}</div><span>Candidate</span><b>{candidate || "Waiting for URL…"}</b><div className="url-preview-frame">{candidateValid ? <DemoSite compact candidate /> : <Globe2 />}</div><dl><div><dt>Viewport</dt><dd>{viewport === "desktop" ? "1440×900" : "390×844"}</dd></div><div><dt>Connection</dt><dd>Cable</dd></div><div><dt>Timezone</dt><dd>UTC</dd></div></dl></aside>
        <footer className="setup-footer"><Link href="/app/projects">Cancel</Link><div><Button>Save draft</Button>{existing ? <Link className="button-link primary" href="/app/runs/1247/capture">Save and run</Link> : <Link className={cn("button-link primary", (!baselineValid || !candidateValid) && "disabled")} href={baselineValid && candidateValid ? "/app/projects/acme-cloud" : "#"}>Continue</Link>}</div></footer>
      </div>
    </AppShell>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) { return <label className="form-field"><span>{label}</span>{children}</label>; }
function ValidationLine({ valid }: { valid: boolean }) { return <span className={cn("validation-line", valid && "valid")}>{valid ? <CheckCircle2 /> : <CircleDot />}{valid ? "Verified · public HTTPS" : "Enter an approved pages.dev, vercel.app, netlify.app or workers.dev URL"}</span>; }

export function CaptureScreen() {
  const stages = [{ name: "Baseline", state: "Captured", detail: "acme-demo.pages.dev", status: "done" }, { name: "Candidate", state: "Capturing", detail: "acme-preview.vercel.app", status: "running" }, { name: "Visual diff", state: "Queued", detail: "Runs in your browser", status: "queued" }];
  return <AppShell breadcrumb="Acme Cloud / Run #1247" dock={false}><div className="capture-screen"><aside className="capture-context"><span>RUN #1247</span><h2>Pricing</h2><p>/pricing · Desktop 1440</p><div><b>Baseline</b><small>main@a1b2c3d</small></div><div><b>Candidate</b><small>d4e5f6g</small></div></aside><section className="capture-progress"><header><div><span>RUN PROGRESS</span><h1>Capture in progress</h1><p>2 of 3 stages complete</p></div><b>ETA 00:18</b></header><div className="progress-track"><i /></div><div className="capture-stage-list">{stages.map((stage, index) => <article className={stage.status} key={stage.name}><span>{stage.status === "done" ? <Check /> : stage.status === "running" ? <LoaderCircle /> : <Clock3 />}</span><div><small>0{index + 1}</small><h3>{stage.name}</h3><p>{stage.detail}</p></div><b>{stage.state}</b>{stage.status !== "queued" && <div className="stage-preview"><DemoSite compact candidate={index === 1} /></div>}</article>)}</div></section><aside className="run-details"><div className="panel-heading"><b>RUN DETAILS</b><MoreHorizontal /></div><section><span>CURRENT JOB</span><p><LoaderCircle /> Capturing candidate</p><small>Attempt 1 of 3 · Worker 1</small></section><section><span>ENVIRONMENT</span><dl><div><dt>Browser</dt><dd>Chromium</dd></div><div><dt>Viewport</dt><dd>1440×900</dd></div><div><dt>Region</dt><dd>Automatic</dd></div></dl></section><section><span>DAILY ALLOWANCE</span><b>3 / 3 remaining</b><div className="quota-track"><i /></div></section><Button variant="danger">Cancel run</Button></aside><section className="live-log"><header><b>CAPTURE LOG</b><span>Live</span></header>{[["10:14:02", "Run started", "Run #1247 created"], ["10:14:05", "Navigated", "Baseline /pricing"], ["10:14:08", "Captured", "Baseline 1440×900"], ["10:14:12", "Navigated", "Candidate /pricing"], ["10:14:15", "Capturing", "Waiting for fonts"]].map(([time, event, detail]) => <div key={time}><small>{time}</small><CheckCircle2 /><b>{event}</b><span>{detail}</span></div>)}</section></div></AppShell>;
}

export function RunsScreen() {
  return <AppShell breadcrumb="Runs"><div className="runs-screen"><section><header className="page-header"><div><span>RUN HISTORY</span><h1>Comparisons</h1><p>Ten retained runs per project.</p></div><div className="page-actions"><label><Search /><input placeholder="Search runs…" /></label><Link className="button-link primary" href="/app/projects/acme-cloud">New comparison</Link></div></header><div className="run-summary-strip"><div><small>Runs today</small><b>2</b></div><div><small>Changed</small><b className="pink">3</b></div><div><small>Accepted</small><b className="green">1</b></div><div><small>Daily attempts</small><b>2 / 3</b></div></div><div className="runs-table"><div className="runs-table-head"><span>RUN</span><span>PROJECT / ROUTE</span><span>BASELINE</span><span>CANDIDATE</span><span>DIFF</span><span>DECISION</span><span /></div>{runs.map((run) => <Link href={run.status === "failed" ? "/app/projects/acme-cloud" : `/app/runs/${run.id}`} className="run-row" key={run.id}><b>#{run.id}</b><div><strong>{run.projectName}</strong><small>{run.routePath} · {run.viewport.label} {run.viewport.width}</small></div><span className="run-thumb"><DemoSite compact /></span><span className="run-thumb"><DemoSite compact candidate /></span><div className={run.changedRegions ? "run-diff changed" : "run-diff"}><b>{run.changedRatio}%</b><small>{run.changedRegions} regions</small></div><span className={cn("decision", run.decision, run.status === "failed" && "failed")}>{run.status === "failed" ? "Failed" : run.decision}</span><ChevronRight /></Link>)}</div></section><aside className="runs-side"><span>FREE-TIER STATUS</span><h2>Live capture available</h2><div className="quota-orbit"><b>2</b><small>attempts left</small></div><dl><div><dt>Projects</dt><dd>2 / 2</dd></div><div><dt>Stored runs</dt><dd>3 / 20</dd></div><div><dt>Artifacts expire</dt><dd>6 days</dd></div></dl><p><ShieldCheck /> The seeded demo remains available after the live allowance is reached.</p></aside></div></AppShell>;
}

export function SharedReportScreen() {
  return <main className="shared-page"><header><Link className="wordmark" href="/">UI<span>RIFT</span></Link><span>Shared visual review</span><b>Acme Cloud · Run #1247</b><em><i /> Changes requested</em><small>Link expires in 6 days</small><Link className="button-link primary" href="/sign-in">Open UIRift</Link></header><div className="shared-grid"><aside className="report-details"><span>RUN DETAILS</span><dl><div><dt>Baseline</dt><dd>main@a1b2c3d</dd></div><div><dt>Candidate</dt><dd>d4e5f6g</dd></div><div><dt>Captured</dt><dd>Jul 13, 2026</dd></div><div><dt>Viewport</dt><dd>1440×900</dd></div></dl><span>SUMMARY</span><div className="report-metrics"><b>1<small>Comparison</small></b><b>3<small>Regions</small></b><b>0.42%<small>Diff</small></b></div><span>CHANGED REGIONS</span>{["Pricing card spacing", "Button alignment", "Footer icon shift"].map((item, index) => <button className={index === 0 ? "active" : ""} key={item}><i>{index + 1}</i><span>{item}<small>{index === 0 ? "High" : index === 1 ? "Medium" : "Low"}</small></span></button>)}</aside><ComparisonWorkspace publicMode reportMode /><aside className="report-evidence"><span>EVIDENCE</span><article><small>PIXEL CHANGE</small><b>1,256 pixels</b><p>0.42% of the captured viewport changed.</p></article><article><small>REVIEWER DECISION</small><b className="rejected">Rejected</b><p>The Pro card moved 24px and no longer aligns with the pricing row.</p></article><article><small>RETENTION</small><b>6 days remaining</b><p>Images and this report are deleted automatically.</p></article><Link href="/demo">Open interactive demo <ExternalLink /></Link></aside></div><footer><span><LockKeyhole /> This is a read-only shared report.</span><Link href="https://github.com/your-name/uirift">View source <Github /></Link></footer></main>;
}

export function SettingsScreen() {
  return <AppShell breadcrumb="Settings"><div className="settings-screen"><section><span>SETTINGS</span><h1>Workspace preferences</h1><article><div><h2>Account</h2><p>Identity is managed through GitHub and Better Auth.</p></div><button><span className="settings-avatar">YM</span><b>Yeabsira Mekuria</b><small>GitHub connected</small><ChevronRight /></button></article><article><div><h2>Usage limits</h2><p>Hard limits keep the portfolio deployment at $0.</p></div><dl><div><dt>Projects</dt><dd>2 maximum</dd></div><div><dt>Runs</dt><dd>10 / project</dd></div><div><dt>Attempts</dt><dd>3 / day</dd></div></dl></article><article><div><h2>Retention</h2><p>Screenshot artifacts are removed after seven days.</p></div><button className="danger-row"><Trash2 /> Delete expired artifacts now</button></article><article><div><h2>Keyboard shortcuts</h2><p>Comparison controls remain available without a pointer.</p></div><div className="shortcut-list"><span><kbd>1–4</kbd> Comparison modes</span><span><kbd>[ ]</kbd> Changed regions</span><span><kbd>+ −</kbd> Zoom</span><span><kbd>0</kbd> Fit canvas</span></div></article></section></div></AppShell>;
}
