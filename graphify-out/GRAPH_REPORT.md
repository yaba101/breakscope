# Graph Report - .  (2026-07-13)

## Corpus Check
- Corpus is ~12,986 words - fits in a single context window. You may not need a graph.

## Summary
- 519 nodes · 692 edges · 68 communities (33 shown, 35 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.77)
- Token cost: 2,218 input · 8,346 output

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

## God Nodes (most connected - your core abstractions)
1. `errorResponse()` - 28 edges
2. `getBindings()` - 27 edges
3. `getRequestUser()` - 22 edges
4. `cn()` - 17 edges
5. `compilerOptions` - 16 edges
6. `compilerOptions` - 14 edges
7. `HttpError` - 13 edges
8. `scripts` - 10 edges
9. `scripts` - 10 edges
10. `sha256()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `pnpm Workspace Configuration` --conceptually_related_to--> `UIRift`  [INFERRED]
  pnpm-workspace.yaml → README.md
- `ProjectSetupForm()` --calls--> `isApprovedPublicUrl()`  [EXTRACTED]
  apps/web/src/components/screens.tsx → packages/validation/src/index.ts
- `WorkerSuccess` --references--> `PixelRegion`  [EXTRACTED]
  apps/web/src/lib/diff-client.ts → packages/comparison-engine/src/index.ts
- `UIRift` --references--> `UIRift Architecture`  [EXTRACTED]
  README.md → docs/architecture.md
- `UIRift` --references--> `Cloudflare Deployment`  [EXTRACTED]
  README.md → docs/deployment.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Capture and Client-Side Processing Pipeline** — docs_architecture_same_origin_route_handlers, docs_architecture_capture_queue, docs_architecture_private_capture_worker, docs_architecture_cloudflare_browser_run, docs_architecture_r2_screenshots, docs_architecture_browser_diff_worker [EXTRACTED 1.00]
- **Deployment Dependency Chain** — docs_deployment_cloudflare_deployment, docs_deployment_dependency_order, docs_deployment_production_smoke_test [EXTRACTED 1.00]

## Communities (68 total, 35 thin omitted)

### Community 0 - "API Route Handlers"
Cohesion: 0.17
Nodes (27): handler(), DELETE(), GET(), ownedProject(), PATCH(), POST(), GET(), POST() (+19 more)

### Community 1 - "Web Development Tooling"
Cohesion: 0.05
Nodes (39): devDependencies, @axe-core/playwright, @cloudflare/workers-types, eslint, eslint-config-next, jsdom, @playwright/test, tailwindcss (+31 more)

### Community 2 - "Comparison Experience Pages"
Cohesion: 0.09
Nodes (20): metadata, metadata, AppShell(), CaptureDock(), nav, ToolRail(), CompareMode, ComparisonWorkspace() (+12 more)

### Community 3 - "Web TypeScript Configuration"
Cohesion: 0.06
Nodes (30): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+22 more)

### Community 4 - "Capture Worker Package"
Cohesion: 0.08
Nodes (25): @cloudflare/playwright, dependencies, @cloudflare/playwright, @uirift/shared, devDependencies, @cloudflare/workers-types, typescript, vitest (+17 more)

### Community 5 - "Comparison Engine Package"
Cohesion: 0.10
Nodes (20): dependencies, pixelmatch, devDependencies, @types/pixelmatch, typescript, vitest, exports, pixelmatch (+12 more)

### Community 6 - "Database Package"
Cohesion: 0.11
Nodes (18): dependencies, drizzle-orm, devDependencies, typescript, vitest, exports, drizzle-orm, typescript (+10 more)

### Community 7 - "Validation Package"
Cohesion: 0.11
Nodes (18): dependencies, zod, devDependencies, typescript, vitest, exports, typescript, vitest (+10 more)

### Community 8 - "Shared TypeScript Foundation"
Cohesion: 0.11
Nodes (18): ES2022, WebWorker, compilerOptions, esModuleInterop, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib (+10 more)

### Community 9 - "Core Application Pages"
Cohesion: 0.14
Nodes (8): metadata, metadata, CaptureScreen(), captureStages, LandingScreen(), SettingsScreen(), createVisualDiff(), uploadVisualDiff()

### Community 10 - "Architecture and Deployment"
Cohesion: 0.13
Nodes (16): Browser Diff Web Worker, Capture Job Queue, Cloudflare Browser Run, Free-Tier Guardrails, Hashed Share Token, Private Capture Worker, Public Next.js Worker, R2 Screenshot Artifacts (+8 more)

### Community 11 - "Shared Domain Package"
Cohesion: 0.12
Nodes (15): devDependencies, typescript, vitest, exports, typescript, vitest, name, private (+7 more)

### Community 12 - "Workspace Scripts"
Cohesion: 0.13
Nodes (14): name, packageManager, private, scripts, build, db:migrate:local, deploy, dev (+6 more)

### Community 13 - "Web Application Scripts"
Cohesion: 0.14
Nodes (13): name, private, scripts, build, deploy, dev, lint, preview (+5 more)

### Community 14 - "Client Diff Pipeline"
Cohesion: 0.27
Nodes (7): WorkerFailure, WorkerSuccess, DiffRequest, compareRgba(), ComparisonResult, groupRegions(), PixelRegion

### Community 15 - "Shared Domain Models"
Cohesion: 0.18
Nodes (10): ChangedRegion, Decision, projects, ProjectSummary, runs, RunStatus, RunSummary, ViewportId (+2 more)

### Community 16 - "D1 Database Schema"
Cohesion: 0.24
Nodes (9): "account", "project", "region", "run", "session", "share", "usage_day", "user" (+1 more)

### Community 17 - "Worker Type Configuration"
Cohesion: 0.25
Nodes (7): @cloudflare/workers-types, compilerOptions, types, extends, include, src/**/*.ts, ../../tsconfig.base.json

### Community 18 - "UI Component Dependencies"
Cohesion: 0.29
Nodes (7): dependencies, better-auth, cmdk, @radix-ui/react-tooltip, better-auth, cmdk, @radix-ui/react-tooltip

### Community 19 - "Project Setup Routes"
Cohesion: 0.29
Nodes (3): metadata, metadata, ProjectSetupScreen()

### Community 20 - "Application Layout Providers"
Cohesion: 0.33
Nodes (4): geistMono, geistSans, metadata, Providers()

### Community 21 - "URL Validation Flow"
Cohesion: 0.38
Nodes (5): ProjectSetupForm(), approvedSuffixes, isApprovedPublicUrl(), isIpLiteral(), runInputSchema

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

## Knowledge Gaps
- **245 isolated node(s):** `eslintConfig`, `"verification"`, `"project"`, `"run"`, `"region"` (+240 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **35 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `UI Component Dependencies` to `Web Application Scripts`, `Better Auth Infrastructure`, `Variant Styling`, `Class Name Utilities`, `Drizzle ORM Dependency`, `Form Resolver Dependency`, `Icon System`, `Motion Library`, `Next.js Runtime`, `Cloudflare OpenNext`, `Pixel Diff Library`, `Dialog Primitives`, `Tabs Primitives`, `React Runtime`, `React DOM Runtime`, `React Form Handling`, `Toast Notifications`, `Tailwind Merge Utility`, `Query State Management`, `Comparison Engine Link`, `Database Package Link`, `Shared Package Link`, `Validation Package Link`, `Zod Validation Library`, `Zustand State Store`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Web Development Tooling` to `Web Application Scripts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `"verification"`, `"project"` to the rest of the system?**
  _245 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Web Development Tooling` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Comparison Experience Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.08771929824561403 - nodes in this community are weakly interconnected._
- **Should `Web TypeScript Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
- **Should `Capture Worker Package` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._