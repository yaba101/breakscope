import type { CaptureRunV1, ViewportId } from "@uirift/shared";
import { runInputSchema } from "@uirift/validation";
import { getRequestUser } from "@/lib/auth";
import { getBindings } from "@/lib/cloudflare";
import { errorResponse, HttpError } from "@/lib/http";
import { viewportProfiles } from "@uirift/shared";

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const user = await getRequestUser(request);
    if (!user) throw new HttpError(401, "UNAUTHORIZED", "Sign in to start a comparison");
    const input = runInputSchema.parse(await request.json());
    const env = await getBindings();
    const project = await env.DB.prepare("SELECT * FROM project WHERE id = ? AND user_id = ?").bind(projectId, user.id).first<{ baseline_origin: string; candidate_origin: string }>();
    if (!project) throw new HttpError(404, "PROJECT_NOT_FOUND", "Project not found");
    const dayStart = new Date(); dayStart.setUTCHours(0, 0, 0, 0);
    const attempts = await env.DB.prepare("SELECT COUNT(*) AS count FROM run WHERE user_id = ? AND created_at >= ?").bind(user.id, dayStart.getTime()).first<{ count: number }>();
    if ((attempts?.count ?? 0) >= 3) throw new HttpError(429, "DAILY_LIMIT", "Daily live comparison limit reached");
    const active = await env.DB.prepare("SELECT id FROM run WHERE user_id = ? AND status IN ('queued','navigating','stabilizing','capturing','processing') LIMIT 1").bind(user.id).first();
    if (active) throw new HttpError(409, "ACTIVE_RUN", "Finish the active comparison before starting another");
    const stored = await env.DB.prepare("SELECT COUNT(*) AS count FROM run WHERE project_id = ?").bind(projectId).first<{ count: number }>();
    if ((stored?.count ?? 0) >= 10) throw new HttpError(409, "RUN_LIMIT", "Delete an older run before starting another");
    const globalUsage = await env.DB.prepare("SELECT COALESCE(SUM(browser_ms), 0) AS ms FROM usage_day WHERE day = ?").bind(new Date().toISOString().slice(0, 10)).first<{ ms: number }>();
    if ((globalUsage?.ms ?? 0) >= 480_000) throw new HttpError(429, "GLOBAL_CAPTURE_LIMIT", "Live capture is paused for today; the seeded demo remains available");
    const runId = crypto.randomUUID();
    const now = Date.now();
    await env.DB.prepare("INSERT INTO run (id, project_id, user_id, route_path, viewport_id, status, created_at, expires_at) VALUES (?, ?, ?, ?, ?, 'queued', ?, ?)")
      .bind(runId, projectId, user.id, input.routePath, input.viewport, now, now + 7 * 86_400_000).run();
    const message: CaptureRunV1 = { version: 1, runId, projectId, userId: user.id, baselineUrl: project.baseline_origin, candidateUrl: project.candidate_origin, routePath: input.routePath, viewport: viewportProfiles[input.viewport as ViewportId] };
    await env.CAPTURE_JOBS.send(message);
    return Response.json({ run: { id: runId, status: "queued" } }, { status: 202 });
  } catch (error) { return errorResponse(error); }
}
