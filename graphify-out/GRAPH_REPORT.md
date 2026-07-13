# Graph Report - uirift  (2026-07-13)

## Corpus Check
- 98 files · ~25,010 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 714 nodes · 1013 edges · 96 communities (50 shown, 46 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c4e1cf07`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- API Route Handlers
- Web Development Tooling
- Comparison Experience Pages
- Web TypeScript Configuration
- Capture Worker Package
- Comparison Engine Package
- Database Package
- Validation Package
- Shared TypeScript Foundation
- Core Application Pages
- Architecture and Deployment
- Shared Domain Package
- Workspace Scripts
- Web Application Scripts
- Client Diff Pipeline
- Shared Domain Models
- D1 Database Schema
- Worker Type Configuration
- UI Component Dependencies
- Project Setup Routes
- Application Layout Providers
- URL Validation Flow
- Capture Queue Worker
- Drizzle Data Schema
- Comparison TypeScript Config
- Database TypeScript Config
- Shared TypeScript Config
- Validation TypeScript Config
- Projects Page
- Runs Page
- Shared Report Page
- Sign In Page
- GitHub Authentication
- ESLint Configuration
- Next.js Configuration
- Better Auth Infrastructure
- Variant Styling
- Class Name Utilities
- Drizzle ORM Dependency
- Form Resolver Dependency
- Icon System
- Motion Library
- Next.js Runtime
- Cloudflare OpenNext
- Pixel Diff Library
- Dialog Primitives
- Tabs Primitives
- React Runtime
- React DOM Runtime
- React Form Handling
- Toast Notifications
- Tailwind Merge Utility
- Query State Management
- Comparison Engine Link
- Database Package Link
- Shared Package Link
- Validation Package Link
- Zod Validation Library
- Zustand State Store
- PostCSS Configuration
- Cloudflare Environment Types
- Public Artifact Endpoint
- Diff Upload Endpoint
- tsconfig.json
- route.ts
- button.tsx
- page.tsx
- Q: Why can't custom HTTPS domains continue from the new project form?
- Q: Where does the local UIRift flow still use fixture state instead of real project, capture, run, and comparison data?
- Q: How should UIRift stop guessing /pricing and discover real routes shared by baseline and candidate deployments?
- Q: How should UIRift make comparison tools functional and compare all discoverable top-level routes?
- Q: Why are the current reports not useful, how should the canvas interactions and one-screen layout be fixed, and what advanced or AI-driven comparison features should UIRift build next?
- AGENTS.md
- better-auth
- @radix-ui/react-tooltip
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
5. `cn()` - 15 edges
6. `compilerOptions` - 14 edges
7. `HttpError` - 13 edges
8. `LocalRun` - 12 edges
9. `scripts` - 11 edges
10. `comparePageSnapshots()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `capture()` --indirect_call--> `element()`  [INFERRED]
  apps/local-capture/src/index.ts → packages/comparison-engine/src/semantic.test.ts
- `pnpm Workspace Configuration` --conceptually_related_to--> `UIRift`  [INFERRED]
  pnpm-workspace.yaml → README.md
- `CaptureRequest` --references--> `ViewportId`  [EXTRACTED]
  apps/local-capture/src/index.ts → packages/shared/src/index.ts
- `CapturePageRequest` --references--> `ViewportId`  [EXTRACTED]
  apps/local-capture/src/index.ts → packages/shared/src/index.ts
- `ProjectSetupForm()` --calls--> `isCaptureUrl()`  [EXTRACTED]
  apps/web/src/components/screens.tsx → packages/validation/src/index.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Capture and Client-Side Processing Pipeline** — docs_architecture_same_origin_route_handlers, docs_architecture_capture_queue, docs_architecture_private_capture_worker, docs_architecture_cloudflare_browser_run, docs_architecture_r2_screenshots, docs_architecture_browser_diff_worker [EXTRACTED 1.00]
- **Deployment Dependency Chain** — docs_deployment_cloudflare_deployment, docs_deployment_dependency_order, docs_deployment_production_smoke_test [EXTRACTED 1.00]

## Communities (96 total, 46 thin omitted)

### Community 0 - "API Route Handlers"
Cohesion: 0.17
Nodes (27): handler(), DELETE(), GET(), ownedProject(), PATCH(), POST(), GET(), POST() (+19 more)

### Community 1 - "Web Development Tooling"
Cohesion: 0.05
Nodes (39): devDependencies, @axe-core/playwright, @cloudflare/workers-types, eslint, eslint-config-next, jsdom, @playwright/test, tailwindcss (+31 more)

### Community 2 - "Comparison Experience Pages"
Cohesion: 0.23
Nodes (6): DiffInspector(), LayerPanel(), DemoSite(), plans, ValidationLine(), cn()

### Community 3 - "Web TypeScript Configuration"
Cohesion: 0.06
Nodes (30): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+22 more)

### Community 4 - "Capture Worker Package"
Cohesion: 0.08
Nodes (25): @cloudflare/playwright, dependencies, @cloudflare/playwright, @uirift/shared, devDependencies, @cloudflare/workers-types, typescript, vitest (+17 more)

### Community 5 - "Comparison Engine Package"
Cohesion: 0.09
Nodes (22): dependencies, pixelmatch, @uirift/shared, devDependencies, @types/pixelmatch, typescript, vitest, exports (+14 more)

### Community 6 - "Database Package"
Cohesion: 0.11
Nodes (18): dependencies, drizzle-orm, devDependencies, typescript, vitest, exports, drizzle-orm, typescript (+10 more)

### Community 7 - "Validation Package"
Cohesion: 0.11
Nodes (18): dependencies, zod, devDependencies, typescript, vitest, exports, typescript, vitest (+10 more)

### Community 8 - "Shared TypeScript Foundation"
Cohesion: 0.11
Nodes (18): WebWorker, compilerOptions, esModuleInterop, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module (+10 more)

### Community 9 - "Core Application Pages"
Cohesion: 0.10
Nodes (13): metadata, metadata, metadata, CaptureScreen(), captureStageOrder, LandingScreen(), ProjectSetupForm(), ProjectsScreen() (+5 more)

### Community 10 - "Architecture and Deployment"
Cohesion: 0.08
Nodes (21): Current local runtime, Data and artifacts, Future hosted runtime, Guardrails, Security boundary, UIRift architecture, Workspace packages, 1. Authenticate and provision (+13 more)

### Community 11 - "Shared Domain Package"
Cohesion: 0.12
Nodes (15): devDependencies, typescript, vitest, exports, typescript, vitest, name, private (+7 more)

### Community 12 - "Workspace Scripts"
Cohesion: 0.12
Nodes (15): name, packageManager, private, scripts, build, db:migrate:local, deploy, dev (+7 more)

### Community 13 - "Web Application Scripts"
Cohesion: 0.14
Nodes (13): name, private, scripts, build, deploy, dev, lint, preview (+5 more)

### Community 14 - "Client Diff Pipeline"
Cohesion: 0.21
Nodes (9): createVisualDiff(), createVisualDiffFromBlobs(), WorkerFailure, WorkerSuccess, DiffRequest, compareRgba(), ComparisonResult, groupRegions() (+1 more)

### Community 15 - "Shared Domain Models"
Cohesion: 0.10
Nodes (38): CapturePageRequest, CaptureRequest, ComparisonLayer, LoadedRun, LocalRunComparison(), CaptureInput, captureLocally(), capturePageLocally() (+30 more)

### Community 16 - "D1 Database Schema"
Cohesion: 0.24
Nodes (9): "account", "project", "region", "run", "session", "share", "usage_day", "user" (+1 more)

### Community 17 - "Worker Type Configuration"
Cohesion: 0.25
Nodes (7): @cloudflare/workers-types, compilerOptions, types, extends, include, src/**/*.ts, ../../tsconfig.base.json

### Community 18 - "UI Component Dependencies"
Cohesion: 0.29
Nodes (7): dependencies, cmdk, drizzle-orm, sonner, drizzle-orm, cmdk, sonner

### Community 19 - "Project Setup Routes"
Cohesion: 0.25
Nodes (4): metadata, metadata, ProjectSetupScreen(), getLocalProject()

### Community 20 - "Application Layout Providers"
Cohesion: 0.32
Nodes (5): geistMono, geistSans, metadata, Providers(), subscribeToWorkspace()

### Community 21 - "URL Validation Flow"
Cohesion: 0.16
Nodes (18): allowedOrigins, assertPublicHostname(), capture(), discoveredPath(), discoverRoutes(), isPrivateAddress(), port, RouteDiscoveryRequest (+10 more)

### Community 22 - "Capture Queue Worker"
Cohesion: 0.38
Nodes (5): CaptureRunV1, capture(), Env, queue(), updateStatus()

### Community 23 - "Drizzle Data Schema"
Cohesion: 0.33
Nodes (5): projectsTable, regionsTable, runsTable, sharesTable, usageDayTable

### Community 24 - "Comparison TypeScript Config"
Cohesion: 0.40
Nodes (4): extends, include, src/**/*.ts, ../../tsconfig.base.json

### Community 25 - "Database TypeScript Config"
Cohesion: 0.40
Nodes (4): extends, include, src/**/*.ts, ../../tsconfig.base.json

### Community 26 - "Shared TypeScript Config"
Cohesion: 0.40
Nodes (4): extends, include, src/**/*.ts, ../../tsconfig.base.json

### Community 27 - "Validation TypeScript Config"
Cohesion: 0.40
Nodes (4): extends, include, src/**/*.ts, ../../tsconfig.base.json

### Community 28 - "Projects Page"
Cohesion: 0.07
Nodes (27): dependencies, @playwright/test, @uirift/shared, @uirift/validation, devDependencies, tsx, @types/node, typescript (+19 more)

### Community 30 - "Shared Report Page"
Cohesion: 0.18
Nodes (21): additionOrRemoval(), categoryFor(), comparePageSnapshots(), elementLabel(), ElementMatch, evidence(), FindingDraft, impactFor() (+13 more)

### Community 38 - "Drizzle ORM Dependency"
Cohesion: 0.18
Nodes (13): metadata, AppShell(), GlobalToolbar(), isComparisonPath(), nav, Navigation(), navigationActive(), useNavigation() (+5 more)

### Community 50 - "Toast Notifications"
Cohesion: 0.15
Nodes (7): metadata, CompareMode, ComparisonWorkspace(), PixelInspection, SnapshotSummary, demoSemanticFindings, demoSemanticSummary

### Community 68 - "tsconfig.json"
Cohesion: 0.17
Nodes (11): compilerOptions, lib, noEmit, types, extends, include, DOM, ES2022 (+3 more)

### Community 69 - "route.ts"
Cohesion: 0.36
Nodes (5): POST(), requestSchema, aiResultSchema, parseAiJson(), valid

### Community 70 - "button.tsx"
Cohesion: 0.40
Nodes (4): Button, ButtonProps, buttonVariants, IconButton()

### Community 71 - "page.tsx"
Cohesion: 0.40
Nodes (3): metadata, SettingsScreen(), clearLocalWorkspace()

### Community 72 - "Q: Why can't custom HTTPS domains continue from the new project form?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Why can't custom HTTPS domains continue from the new project form?, Source Nodes

### Community 73 - "Q: Where does the local UIRift flow still use fixture state instead of real project, capture, run, and comparison data?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Where does the local UIRift flow still use fixture state instead of real project, capture, run, and comparison data?, Source Nodes

### Community 74 - "Q: How should UIRift stop guessing /pricing and discover real routes shared by baseline and candidate deployments?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should UIRift stop guessing /pricing and discover real routes shared by baseline and candidate deployments?, Source Nodes

### Community 75 - "Q: How should UIRift make comparison tools functional and compare all discoverable top-level routes?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should UIRift make comparison tools functional and compare all discoverable top-level routes?, Source Nodes

### Community 76 - "Q: Why are the current reports not useful, how should the canvas interactions and one-screen layout be fixed, and what advanced or AI-driven comparison features should UIRift build next?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Why are the current reports not useful, how should the canvas interactions and one-screen layout be fixed, and what advanced or AI-driven comparison features should UIRift build next?, Source Nodes

## Knowledge Gaps
- **326 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+321 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **46 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Work-memory lessons

**Preferred sources** — corroborated by past sessions; start here.
- `ProjectSetupForm()` (2× useful, score=1.986953618) _(code changed — re-verify)_
- `capture()` (2× useful, score=1.986953618)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `UI Component Dependencies` to `Web Application Scripts`, `Better Auth Infrastructure`, `Variant Styling`, `Class Name Utilities`, `Form Resolver Dependency`, `Icon System`, `Motion Library`, `Next.js Runtime`, `Cloudflare OpenNext`, `Pixel Diff Library`, `Dialog Primitives`, `Tabs Primitives`, `React Runtime`, `React DOM Runtime`, `React Form Handling`, `Tailwind Merge Utility`, `Query State Management`, `Comparison Engine Link`, `Database Package Link`, `Shared Package Link`, `Validation Package Link`, `Zod Validation Library`, `Zustand State Store`, `better-auth`, `@radix-ui/react-tooltip`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Web Development Tooling` to `Web Application Scripts`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _326 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Web Development Tooling` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Web TypeScript Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
- **Should `Capture Worker Package` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `Comparison Engine Package` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._