import { z } from "zod";
import { getRequestUser } from "@/lib/auth";
import { getBindings } from "@/lib/cloudflare";
import { errorResponse, HttpError } from "@/lib/http";

const metricsSchema = z.object({
  changedPixels: z.number().int().nonnegative(),
  changedRatio: z.number().min(0).max(1),
  regions: z.array(z.object({ x: z.number().int().nonnegative(), y: z.number().int().nonnegative(), width: z.number().int().positive(), height: z.number().int().positive(), pixelCount: z.number().int().positive() })).max(20),
});

export async function POST(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  try {
    const { runId } = await params;
    const user = await getRequestUser(request);
    if (!user) throw new HttpError(401, "UNAUTHORIZED", "Sign in to save a diff");
    const env = await getBindings();
    const run = await env.DB.prepare("SELECT project_id FROM run WHERE id = ? AND user_id = ? AND status = 'processing'").bind(runId, user.id).first<{ project_id: string }>();
    if (!run) throw new HttpError(409, "RUN_NOT_PROCESSING", "Run is not ready for a diff result");
    const form = await request.formData();
    const file = form.get("diff");
    const metricsValue = form.get("metrics");
    if (!(file instanceof File) || typeof metricsValue !== "string") throw new HttpError(400, "INVALID_DIFF", "Diff image and metrics are required");
    if (file.type !== "image/png" || file.size > 8_000_000) throw new HttpError(400, "INVALID_DIFF", "Diff must be a PNG smaller than 8 MB");
    const metrics = metricsSchema.parse(JSON.parse(metricsValue));
    const key = `users/${user.id}/projects/${run.project_id}/runs/${runId}/diff.png`;
    await env.IMAGES.put(key, file.stream(), { httpMetadata: { contentType: "image/png" } });
    const regionStatements = metrics.regions.map((region, index) => env.DB.prepare("INSERT INTO region (id, run_id, region_order, x, y, width, height, pixel_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), runId, index + 1, region.x, region.y, region.width, region.height, region.pixelCount));
    await env.DB.batch([
      env.DB.prepare("DELETE FROM region WHERE run_id = ?").bind(runId),
      ...regionStatements,
      env.DB.prepare("UPDATE run SET status = 'ready', diff_key = ?, changed_pixels = ?, changed_ratio = ?, completed_at = ? WHERE id = ?").bind(key, metrics.changedPixels, metrics.changedRatio, Date.now(), runId),
    ]);
    return Response.json({ run: { id: runId, status: "ready", ...metrics } });
  } catch (error) { return errorResponse(error); }
}
