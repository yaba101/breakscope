# Graph Report - .  (2026-07-13)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 723 nodes · 1012 edges · 93 communities (48 shown, 45 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.63)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `85884ba9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- errorResponse
- devDependencies
- semantic.ts
- index.ts
- comparison-workspace.tsx
- compilerOptions
- package.json
- screens.tsx
- app-shell.tsx
- package.json
- UIRift
- package.json
- package.json
- package.json
- compilerOptions
- local-workspace.ts
- scripts
- package.json
- demo-site.tsx
- scripts
- index.ts
- tsconfig.json
- 0000_initial.sql
- listLocalRuns
- route.ts
- tsconfig.json
- dependencies
- page.tsx
- index.ts
- schema.ts
- Q: Why can't custom HTTPS domains continue from the new project form?
- Q: Where does the local UIRift flow still use fixture state instead of real project, capture, run, and comparison data?
- Q: How should UIRift stop guessing /pricing and discover real routes shared by baseline and candidate deployments?
- Q: How should UIRift make comparison tools functional and compare all discoverable top-level routes?
- Q: Why are the current reports not useful, how should the canvas interactions and one-screen layout be fixed, and what advanced or AI-driven comparison features should UIRift build next?
- tsconfig.json
- tsconfig.json
- tsconfig.json
- tsconfig.json
- github-sign-in.tsx
- AGENTS.md
- eslint.config.mjs
- next.config.ts
- @better-auth/infra
- class-variance-authority
- clsx
- cmdk
- @hookform/resolvers
- lucide-react
- motion
- next
- @opennextjs/cloudflare
- pixelmatch
- @radix-ui/react-dialog
- @radix-ui/react-tabs
- @radix-ui/react-tooltip
- react
- react-dom
- react-hook-form
- tailwind-merge
- @tanstack/react-query
- @uirift/comparison-engine
- @uirift/database
- @uirift/shared
- @uirift/validation
- zod
- zustand
- postcss.config.mjs
- cloudflare-env.d.ts
- ComparisonWorkspace
- GET
- POST
- Browser Diff Web Worker
- Capture Job Queue
- Cloudflare Browser Run
- Free-Tier Guardrails
- Hashed Share Token
- Private Capture Worker
- Public Next.js Worker
- R2 Screenshot Artifacts
- Same-Origin Route Handlers
- URL Security Boundary
- Queue Consumer Before Producer
- Production Smoke Test

## God Nodes (most connected - your core abstractions)
1. `errorResponse()` - 28 edges
2. `getBindings()` - 27 edges
3. `getRequestUser()` - 22 edges
4. `compilerOptions` - 16 edges
5. `compilerOptions` - 14 edges
6. `HttpError` - 13 edges
7. `LocalRun` - 12 edges
8. `scripts` - 11 edges
9. `PageSnapshot` - 11 edges
10. `scripts` - 10 edges

## Surprising Connections (you probably didn't know these)
- `pnpm Workspace Configuration` --conceptually_related_to--> `UIRift`  [INFERRED]
  pnpm-workspace.yaml → README.md
- `CaptureRequest` --references--> `ViewportId`  [EXTRACTED]
  apps/local-capture/src/index.ts → packages/shared/src/index.ts
- `CapturePageRequest` --references--> `ViewportId`  [EXTRACTED]
  apps/local-capture/src/index.ts → packages/shared/src/index.ts
- `AccessibilityFinding` --references--> `ElementSnapshot`  [EXTRACTED]
  apps/web/src/lib/accessibility-analysis.ts → packages/shared/src/index.ts
- `CaptureInput` --references--> `ViewportId`  [EXTRACTED]
  apps/web/src/lib/local-capture.ts → packages/shared/src/index.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Capture and Client-Side Processing Pipeline** — docs_architecture_same_origin_route_handlers, docs_architecture_capture_queue, docs_architecture_private_capture_worker, docs_architecture_cloudflare_browser_run, docs_architecture_r2_screenshots, docs_architecture_browser_diff_worker [EXTRACTED 1.00]
- **Deployment Dependency Chain** — docs_deployment_cloudflare_deployment, docs_deployment_dependency_order, docs_deployment_production_smoke_test [EXTRACTED 1.00]

## Communities (93 total, 45 thin omitted)

### Community 0 - "errorResponse"
Cohesion: 0.17
Nodes (27): handler(), DELETE(), GET(), ownedProject(), PATCH(), POST(), GET(), POST() (+19 more)

### Community 1 - "devDependencies"
Cohesion: 0.06
Nodes (37): devDependencies, @axe-core/playwright, @cloudflare/workers-types, eslint, eslint-config-next, jsdom, @playwright/test, tailwindcss (+29 more)

### Community 2 - "semantic.ts"
Cohesion: 0.11
Nodes (27): DiffInspector(), findSnapshotElement(), AccessibilityFinding, analyzeSnapshotAccessibility(), interactiveRoles, additionOrRemoval(), categoryFor(), comparePageSnapshots() (+19 more)

### Community 3 - "index.ts"
Cohesion: 0.10
Nodes (29): allowedOrigins, assertPublicHostname(), capture(), CapturePageRequest, CaptureRequest, discoveredPath(), discoverRoutes(), isPrivateAddress() (+21 more)

### Community 4 - "comparison-workspace.tsx"
Cohesion: 0.11
Nodes (24): CompareMode, ComparisonLayer, formatSpec(), GeometryInspector(), PixelInspection, severityOrder, SnapshotSummary, LocalRun (+16 more)

### Community 5 - "compilerOptions"
Cohesion: 0.06
Nodes (30): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+22 more)

### Community 6 - "package.json"
Cohesion: 0.07
Nodes (27): dependencies, @playwright/test, @uirift/shared, @uirift/validation, devDependencies, tsx, @types/node, typescript (+19 more)

### Community 7 - "screens.tsx"
Cohesion: 0.10
Nodes (11): metadata, metadata, metadata, metadata, CaptureScreen(), captureStageOrder, LandingScreen(), SettingsScreen() (+3 more)

### Community 8 - "app-shell.tsx"
Cohesion: 0.11
Nodes (17): metadata, metadata, geistMono, geistSans, metadata, AppShell(), GlobalToolbar(), isComparisonPath() (+9 more)

### Community 9 - "package.json"
Cohesion: 0.08
Nodes (25): @cloudflare/playwright, dependencies, @cloudflare/playwright, @uirift/shared, devDependencies, @cloudflare/workers-types, typescript, vitest (+17 more)

### Community 10 - "UIRift"
Cohesion: 0.08
Nodes (21): Current local runtime, Data and artifacts, Future hosted runtime, Guardrails, Security boundary, UIRift architecture, Workspace packages, 1. Authenticate and provision (+13 more)

### Community 11 - "package.json"
Cohesion: 0.09
Nodes (22): dependencies, pixelmatch, @uirift/shared, devDependencies, @types/pixelmatch, typescript, vitest, exports (+14 more)

### Community 12 - "package.json"
Cohesion: 0.11
Nodes (18): dependencies, drizzle-orm, devDependencies, typescript, vitest, exports, drizzle-orm, typescript (+10 more)

### Community 13 - "package.json"
Cohesion: 0.11
Nodes (18): dependencies, zod, devDependencies, typescript, vitest, exports, typescript, vitest (+10 more)

### Community 14 - "compilerOptions"
Cohesion: 0.11
Nodes (18): WebWorker, compilerOptions, esModuleInterop, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module (+10 more)

### Community 15 - "local-workspace.ts"
Cohesion: 0.24
Nodes (15): LoadedRun, LocalRunComparison(), CaptureEvent, createLocalProject(), createLocalRun(), getLocalProject(), getLocalRun(), listLocalProjects() (+7 more)

### Community 16 - "scripts"
Cohesion: 0.12
Nodes (15): name, packageManager, private, scripts, build, db:migrate:local, deploy, dev (+7 more)

### Community 17 - "package.json"
Cohesion: 0.12
Nodes (15): devDependencies, typescript, vitest, exports, typescript, vitest, name, private (+7 more)

### Community 18 - "demo-site.tsx"
Cohesion: 0.19
Nodes (6): DemoSite(), plans, Button, ButtonProps, buttonVariants, cn()

### Community 19 - "scripts"
Cohesion: 0.14
Nodes (13): name, private, scripts, build, deploy, dev, lint, preview (+5 more)

### Community 20 - "index.ts"
Cohesion: 0.21
Nodes (9): createVisualDiff(), createVisualDiffFromBlobs(), WorkerFailure, WorkerSuccess, DiffRequest, compareRgba(), ComparisonResult, groupRegions() (+1 more)

### Community 21 - "tsconfig.json"
Cohesion: 0.17
Nodes (11): compilerOptions, lib, noEmit, types, extends, include, DOM, ES2022 (+3 more)

### Community 22 - "0000_initial.sql"
Cohesion: 0.24
Nodes (9): "account", "project", "region", "run", "session", "share", "usage_day", "user" (+1 more)

### Community 23 - "listLocalRuns"
Cohesion: 0.20
Nodes (6): metadata, metadata, batchDestination(), ProjectsScreen(), RunsScreen(), listLocalRuns()

### Community 24 - "route.ts"
Cohesion: 0.36
Nodes (5): POST(), requestSchema, aiResultSchema, parseAiJson(), valid

### Community 25 - "tsconfig.json"
Cohesion: 0.25
Nodes (7): @cloudflare/workers-types, compilerOptions, types, extends, include, src/**/*.ts, ../../tsconfig.base.json

### Community 26 - "dependencies"
Cohesion: 0.29
Nodes (7): dependencies, better-auth, drizzle-orm, sonner, drizzle-orm, better-auth, sonner

### Community 27 - "page.tsx"
Cohesion: 0.29
Nodes (3): metadata, metadata, ProjectSetupScreen()

### Community 28 - "index.ts"
Cohesion: 0.38
Nodes (5): CaptureRunV1, capture(), Env, queue(), updateStatus()

### Community 29 - "schema.ts"
Cohesion: 0.33
Nodes (5): projectsTable, regionsTable, runsTable, sharesTable, usageDayTable

### Community 30 - "Q: Why can't custom HTTPS domains continue from the new project form?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Why can't custom HTTPS domains continue from the new project form?, Source Nodes

### Community 31 - "Q: Where does the local UIRift flow still use fixture state instead of real project, capture, run, and comparison data?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Where does the local UIRift flow still use fixture state instead of real project, capture, run, and comparison data?, Source Nodes

### Community 32 - "Q: How should UIRift stop guessing /pricing and discover real routes shared by baseline and candidate deployments?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should UIRift stop guessing /pricing and discover real routes shared by baseline and candidate deployments?, Source Nodes

### Community 33 - "Q: How should UIRift make comparison tools functional and compare all discoverable top-level routes?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should UIRift make comparison tools functional and compare all discoverable top-level routes?, Source Nodes

### Community 34 - "Q: Why are the current reports not useful, how should the canvas interactions and one-screen layout be fixed, and what advanced or AI-driven comparison features should UIRift build next?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Why are the current reports not useful, how should the canvas interactions and one-screen layout be fixed, and what advanced or AI-driven comparison features should UIRift build next?, Source Nodes

### Community 35 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): extends, include, src/**/*.ts, ../../tsconfig.base.json

### Community 36 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): extends, include, src/**/*.ts, ../../tsconfig.base.json

### Community 37 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): extends, include, src/**/*.ts, ../../tsconfig.base.json

### Community 38 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): extends, include, src/**/*.ts, ../../tsconfig.base.json

## Knowledge Gaps
- **325 isolated node(s):** `eslintConfig`, `"verification"`, `"project"`, `"run"`, `"region"` (+320 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **45 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Work-memory lessons

**Preferred sources** — corroborated by past sessions; start here.
- `ComparisonWorkspace()` (2× useful, score=1.992811279) _(code changed — re-verify)_
- `RunsScreen()` (2× useful, score=1.992811279) _(code changed — re-verify)_
- `ProjectSetupForm()` (2× useful, score=1.985420587) _(code changed — re-verify)_

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `scripts`, `@better-auth/infra`, `class-variance-authority`, `clsx`, `cmdk`, `@hookform/resolvers`, `lucide-react`, `motion`, `next`, `@opennextjs/cloudflare`, `pixelmatch`, `@radix-ui/react-dialog`, `@radix-ui/react-tabs`, `@radix-ui/react-tooltip`, `react`, `react-dom`, `react-hook-form`, `tailwind-merge`, `@tanstack/react-query`, `@uirift/comparison-engine`, `@uirift/database`, `@uirift/shared`, `@uirift/validation`, `zod`, `zustand`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `scripts`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `"verification"`, `"project"` to the rest of the system?**
  _325 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.057057057057057055 - nodes in this community are weakly interconnected._
- **Should `semantic.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10756302521008404 - nodes in this community are weakly interconnected._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10160427807486631 - nodes in this community are weakly interconnected._
- **Should `comparison-workspace.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1053763440860215 - nodes in this community are weakly interconnected._