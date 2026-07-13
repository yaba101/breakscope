import { getRequestUser } from "@/lib/auth";
import { getBindings } from "@/lib/cloudflare";
import { errorResponse, HttpError } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user) throw new HttpError(401, "UNAUTHORIZED", "Sign in to view runs");
    const env = await getBindings();
    const result = await env.DB.prepare(
      "SELECT run.*, project.name AS project_name, (SELECT COUNT(*) FROM region WHERE region.run_id = run.id) AS changed_regions FROM run JOIN project ON project.id = run.project_id WHERE run.user_id = ? ORDER BY run.created_at DESC LIMIT 20",
    )
      .bind(user.id)
      .all();
    return Response.json({ runs: result.results });
  } catch (error) {
    return errorResponse(error);
  }
}
