import { getRequestUser } from "@/lib/auth";
import { getBindings } from "@/lib/cloudflare";
import { errorResponse, HttpError } from "@/lib/http";

export async function GET(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  try {
    const { runId } = await params;
    const user = await getRequestUser(request);
    if (!user) throw new HttpError(401, "UNAUTHORIZED", "Sign in to view this comparison");
    const env = await getBindings();
    const run = await env.DB.prepare("SELECT * FROM run WHERE id = ? AND user_id = ?").bind(runId, user.id).first();
    if (!run) throw new HttpError(404, "RUN_NOT_FOUND", "Run not found");
    const regions = await env.DB.prepare("SELECT * FROM region WHERE run_id = ? ORDER BY region_order").bind(runId).all();
    return Response.json({ run, regions: regions.results });
  } catch (error) { return errorResponse(error); }
}
