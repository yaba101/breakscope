# UIRift

UIRift is a visual-regression workspace for comparing two deployed interfaces in a precise, design-tool-style review environment.

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
pnpm dev
```

Open `http://localhost:3000`. The public seeded demo works without Cloudflare credentials. Copy `.env.example` to `.env.local` only when connecting GitHub OAuth and Better Auth Infrastructure.

## Commands

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm preview
```

## Zero-dollar guardrails

The portfolio release allows two projects per user, ten retained runs per project, three live attempts per day, one active run, and one viewport per run. Live capture stops before the daily Browser Run free allowance is exhausted; `/demo` remains available from seeded artifacts.
