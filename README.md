# UIRift

UIRift is a visual-regression workspace for comparing two deployed interfaces in a precise, design-tool-style review environment. It ships a seeded public demo and a real authenticated capture path built for Cloudflare's free tiers.

## Workspace

- `apps/web` — Next.js App Router application and same-origin API
- `workers/capture` — private Cloudflare Queue consumer using Browser Run
- `packages/database` — D1/Drizzle schema
- `packages/shared` — contracts and seeded fixtures
- `packages/validation` — URL and payload validation
- `packages/comparison-engine` — client-side pixel analysis

## Local development

```bash
pnpm install
pnpm db:migrate:local
pnpm dev
```

Open `http://localhost:3000`. The public seeded demo works without Cloudflare credentials. Copy `.env.example` to `.env.local` only when connecting GitHub OAuth and Better Auth Infrastructure.

## Product routes

- `/` — landing page and engineering case study
- `/sign-in` — GitHub OAuth entry
- `/app/projects` — two-project workspace
- `/app/projects/new` and `/app/projects/:id` — project and comparison setup
- `/app/runs/:id/capture` — Queue/Browser Run progress and client-side diff processing
- `/app/runs` — retained comparison history
- `/app/runs/:id` — interactive comparison workspace
- `/report/:token` — hashed, seven-day read-only report
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

## Zero-dollar guardrails

The portfolio release allows two projects per user, ten retained runs per project, three live attempts per day, one active run, and one viewport per run. Live capture stops before the daily Browser Run free allowance is exhausted; `/demo` remains available from seeded artifacts.

## Deployment status

The application, bindings, migrations, capture worker, and deployment commands are ready. Cloudflare resources and GitHub OAuth credentials are intentionally not provisioned from this local repository yet. Follow [docs/deployment.md](docs/deployment.md) after authorizing the target accounts.

See [docs/architecture.md](docs/architecture.md) for the system design and security boundaries.
