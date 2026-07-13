# Cloudflare deployment

The deploy requires access to the Cloudflare account and the GitHub OAuth application. No credentials belong in Git.

## 1. Authenticate and provision

Run from the repository root:

```bash
pnpm --filter @uirift/web exec wrangler login
pnpm --filter @uirift/web exec wrangler d1 create uirift-db
pnpm --filter @uirift/web exec wrangler r2 bucket create uirift-images
pnpm --filter @uirift/web exec wrangler queues create uirift-capture-jobs
```

Copy the returned D1 database ID into both `apps/web/wrangler.jsonc` and `workers/capture/wrangler.jsonc`, replacing `REPLACE_AFTER_PROVISIONING`.

Apply the migration:

```bash
pnpm --filter @uirift/web exec wrangler d1 migrations apply uirift-db --remote
```

Browser Run is declared through the `BROWSER` binding in the capture worker. The Queue producer, consumer, D1, and R2 bindings are already declared in the Wrangler files.

## 2. Configure GitHub and Better Auth

Create a GitHub OAuth app with this callback after the first web deploy:

```text
https://uirift-web.<account-subdomain>.workers.dev/api/auth/callback/github
```

Set the Worker secrets:

```bash
pnpm --filter @uirift/web exec wrangler secret put GITHUB_CLIENT_ID
pnpm --filter @uirift/web exec wrangler secret put GITHUB_CLIENT_SECRET
pnpm --filter @uirift/web exec wrangler secret put BETTER_AUTH_SECRET
pnpm --filter @uirift/web exec wrangler secret put BETTER_AUTH_API_KEY
```

`BETTER_AUTH_API_KEY` is optional; add it only when connecting the Better Auth Infrastructure dashboard. Before production, update the web Worker's `BETTER_AUTH_URL` to its final HTTPS origin, set `APP_ENV` to `production`, and expose `NEXT_PUBLIC_AUTH_ENABLED=true` during the Next.js build.

## 3. Verify before deploy

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm --filter @uirift/web build
```

## 4. Deploy in dependency order

The Queue consumer must exist before the web app starts publishing jobs:

```bash
pnpm --filter @uirift/capture deploy
pnpm --filter @uirift/web deploy
```

The initial web address follows the Worker resource name: `uirift-web.<account-subdomain>.workers.dev`. A custom domain can later point both the landing page and application to the same origin.

## 5. Production smoke test

1. Open `/demo` and switch through modes 1–4.
2. Complete GitHub sign-in.
3. Create one project using two approved HTTPS preview origins.
4. Run `/pricing` at one viewport.
5. Confirm Queue status, two R2 source images, the client-generated diff, and D1 regions.
6. Accept or reject the comparison.
7. Create a share link in the comparison footer and open it in a private browser.
8. Confirm an invalid, expired, or revoked token cannot open the report.

Do not run live Browser Run tests on every CI build. CI should use fixtures; keep the live path as an on-demand production smoke test.
