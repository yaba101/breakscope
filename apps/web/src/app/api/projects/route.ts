import { projectInputSchema } from "@uirift/validation";
import { getRequestUser } from "@/lib/auth";
import { getBindings } from "@/lib/cloudflare";
import { errorResponse, HttpError } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user) throw new HttpError(401, "UNAUTHORIZED", "Sign in to view projects");
    const env = await getBindings();
    const result = await env.DB.prepare("SELECT * FROM project WHERE user_id = ? ORDER BY updated_at DESC LIMIT 2").bind(user.id).all();
    return Response.json({ projects: result.results });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user) throw new HttpError(401, "UNAUTHORIZED", "Sign in to create a project");
    const input = projectInputSchema.parse(await request.json());
    const env = await getBindings();
    const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM project WHERE user_id = ?").bind(user.id).first<{ count: number }>();
    if ((count?.count ?? 0) >= 2) throw new HttpError(409, "PROJECT_LIMIT", "The portfolio plan allows two projects");
    const id = crypto.randomUUID();
    const now = Date.now();
    await env.DB.prepare("INSERT INTO project (id, user_id, name, baseline_origin, candidate_origin, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(id, user.id, input.name, input.baselineUrl, input.candidateUrl, now, now).run();
    return Response.json({ project: { id, ...input, createdAt: now } }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
