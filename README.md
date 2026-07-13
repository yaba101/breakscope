# UIRift

UIRift is a local-first visual-regression workspace for comparing two deployed interfaces in a precise, design-tool-style review environment. The current beta needs no account, remote database, tracking, or Cloudflare resources.

## Workspace

- `apps/web` — Next.js App Router interface, IndexedDB workspace, and client diff worker
- `apps/local-capture` — localhost-only Playwright capture companion
- `workers/capture` — private Cloudflare Queue consumer using Browser Run
- `packages/database` — D1/Drizzle schema
- `packages/shared` — contracts and seeded fixtures
- `packages/validation` — URL and payload validation
- `packages/comparison-engine` — client-side pixel analysis

## Local development

```bash
pnpm install
pnpm dev:local
```

Open `http://localhost:3000`, choose **Continue as guest**, and create a project. `dev:local` starts both the Next.js interface and the capture companion. No environment variables or external accounts are needed.

## Product routes

- `/` — landing page and engineering case study
- `/sign-in` — local guest entry
- `/app/projects` — two-project IndexedDB workspace
- `/app/projects/new` and `/app/projects/:id` — project and comparison setup
- `/app/runs/:id/capture` — local Playwright progress and client-side diff processing
- `/app/runs` — local comparison history
- `/app/runs/:id` — interactive comparison workspace
- `/report/:token` — future hosted read-only report shell
- `/demo` — seeded comparison that does not consume live capture quota

## Commands

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
pnpm preview
```

The repository currently passes TypeScript, ESLint, Vitest, Playwright desktop/mobile journeys, a production Next.js build, and React Doctor at 100/100.

## Local beta boundaries

The local beta allows two projects and one viewport per run. Projects, screenshots, diff PNGs, changed regions, history, and decisions remain in the browser's IndexedDB until the user clears site data. Approved HTTPS preview hosts and localhost are supported. Public sharing and cross-device sync are intentionally deferred because they require hosted storage.

## Deployment status

The Cloudflare, Better Auth, D1, R2, Queue, and Browser Run implementation remains in the repository as the future hosted adapter, but it is not used by the guest workflow. Follow [docs/deployment.md](docs/deployment.md) only when the local product loop is ready for hosting.

See [docs/architecture.md](docs/architecture.md) for the system design and security boundaries.
