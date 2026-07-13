import { getBindings, sha256 } from "@/lib/cloudflare";
import { errorResponse, HttpError } from "@/lib/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const env = await getBindings();
    const report = await env.DB.prepare(
      `SELECT run.id, run.route_path, run.viewport_id, run.changed_pixels, run.changed_ratio,
        run.decision, run.decision_note, run.completed_at, share.expires_at,
        project.name AS project_name
       FROM share
       JOIN run ON run.id = share.run_id
       JOIN project ON project.id = run.project_id
       WHERE share.token_hash = ? AND share.expires_at > ? AND share.revoked_at IS NULL`,
    )
      .bind(await sha256(token), Date.now())
      .first();
    if (!report)
      throw new HttpError(
        404,
        "REPORT_EXPIRED",
        "This shared report is unavailable or expired",
      );
    return Response.json({ report });
  } catch (error) {
    return errorResponse(error);
  }
}
