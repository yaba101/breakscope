# UIRift architecture

## Runtime shape

UIRift uses one public Next.js Worker and one private Queue consumer:

```mermaid
flowchart LR
  U["Next.js UI"] --> A["Same-origin route handlers"]
  A --> D["D1 metadata"]
  A --> Q["uirift-capture-jobs"]
  Q --> C["uirift-capture Worker"]
  C --> B["Cloudflare Browser Run"]
  C --> R["R2 screenshots"]
  R --> W["Browser Web Worker"]
  W --> A
  A --> S["Hashed share token"]
```

The capture Worker opens both approved public HTTPS URLs with the same viewport, color scheme, reduced motion, font-settle rule, and animation override. It stores baseline and candidate PNGs in R2, then changes the run to `processing`. The user's browser downloads both authenticated artifacts and runs pixelmatch inside an OffscreenCanvas Web Worker. The generated diff PNG and grouped changed regions are uploaded back to the same-origin API.

## Workspace packages

- `apps/web`: Next.js App Router UI, Better Auth, APIs, D1 migration, client diff worker.
- `workers/capture`: Browser Run Queue consumer and scheduled retention cleanup.
- `packages/database`: Drizzle schema for product data.
- `packages/validation`: approved-host URL and request validation.
- `packages/comparison-engine`: pixel comparison and changed-region grouping.
- `packages/shared`: versioned Queue message, viewports, and seeded demo fixtures.

## Data and artifacts

D1 stores users, sessions, projects, runs, regions, token hashes, and daily usage. R2 objects use:

```text
users/{userId}/projects/{projectId}/runs/{runId}/{baseline|candidate|diff}.png
```

Artifacts and share links expire after seven days. The scheduled capture Worker deletes expired R2 objects and their D1 run, region, and share records. Deleting a project also removes its R2 objects before deleting metadata.

## Guardrails

- Two projects per user.
- Three live attempts per user per UTC day.
- One active comparison per user.
- Ten retained runs per project.
- One viewport per run.
- Global browser cutoff at eight minutes of recorded daily use, leaving headroom under the configured free allowance.
- Queue retries recoverable failures twice.
- The seeded `/demo` remains available when live capture is paused.

## Security boundary

The first release accepts only HTTPS origins on explicitly approved preview hosts. URL validation rejects credentials, IP literals, localhost, private networks, non-root origins, and unsupported hosts. The capture worker is private and can be reached only through the Queue. User APIs check the Better Auth session and resource ownership. Public artifacts require a SHA-256 token match, an unexpired share, and a non-revoked record.

This MVP does not support authenticated target websites, arbitrary public domains, private repositories, or PR installations.
