import { launch, type BrowserWorker } from "@cloudflare/playwright";
import type { CaptureRunV1 } from "@uirift/shared";

interface Env {
  BROWSER: BrowserWorker;
  DB: D1Database;
  IMAGES: R2Bucket;
}

async function capture(url: string, viewport: CaptureRunV1["viewport"], env: Env) {
  const browser = await launch(env.BROWSER);
  try {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
    await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}" });
    await page.evaluate(() => document.fonts.ready);
    return await page.screenshot({ type: "png", fullPage: false });
  } finally {
    await browser.close();
  }
}

async function updateStatus(env: Env, runId: string, status: string, errorCode?: string) {
  await env.DB.prepare("UPDATE run SET status = ?, error_code = ? WHERE id = ?")
    .bind(status, errorCode ?? null, runId)
    .run();
}

export default {
  async queue(batch: MessageBatch<CaptureRunV1>, env: Env) {
    for (const message of batch.messages) {
      const job = message.body;
      const baseKey = `users/${job.userId}/projects/${job.projectId}/runs/${job.runId}`;
      try {
        await updateStatus(env, job.runId, "navigating");
        const baselineUrl = new URL(job.routePath, job.baselineUrl).toString();
        const candidateUrl = new URL(job.routePath, job.candidateUrl).toString();
        const startedAt = Date.now();
        const baseline = await capture(baselineUrl, job.viewport, env);
        await updateStatus(env, job.runId, "capturing");
        const candidate = await capture(candidateUrl, job.viewport, env);
        await Promise.all([
          env.IMAGES.put(`${baseKey}/baseline.png`, baseline, { httpMetadata: { contentType: "image/png" } }),
          env.IMAGES.put(`${baseKey}/candidate.png`, candidate, { httpMetadata: { contentType: "image/png" } }),
        ]);
        await env.DB.prepare(
          "UPDATE run SET status = 'processing', baseline_key = ?, candidate_key = ?, completed_at = ? WHERE id = ?",
        ).bind(`${baseKey}/baseline.png`, `${baseKey}/candidate.png`, Date.now(), job.runId).run();
        await env.DB.prepare(
          "INSERT INTO usage_day (id, user_id, day, attempts, browser_ms) VALUES (?, ?, ?, 0, ?) ON CONFLICT(user_id, day) DO UPDATE SET browser_ms = browser_ms + excluded.browser_ms",
        ).bind(crypto.randomUUID(), job.userId, new Date().toISOString().slice(0, 10), Date.now() - startedAt).run();
        message.ack();
      } catch (error) {
        const code = error instanceof Error && error.name === "TimeoutError" ? "CAPTURE_TIMEOUT" : "CAPTURE_FAILED";
        await updateStatus(env, job.runId, "failed", code);
        message.retry({ delaySeconds: 10 });
      }
    }
  },

  async scheduled(_controller: ScheduledController, env: Env) {
    const now = Date.now();
    await env.DB.prepare("DELETE FROM share WHERE expires_at < ? OR revoked_at IS NOT NULL").bind(now).run();
    await env.DB.prepare("DELETE FROM region WHERE run_id IN (SELECT id FROM run WHERE expires_at < ?)").bind(now).run();
  },
};
