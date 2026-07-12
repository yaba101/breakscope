import { projectInputSchema } from "@uirift/validation";
import { getRequestUser } from "@/lib/auth";
import { getBindings } from "@/lib/cloudflare";
import { errorResponse, HttpError } from "@/lib/http";

async function ownedProject(request: Request, projectId: string) {
  const user = await getRequestUser(request);
  if (!user) throw new HttpError(401, "UNAUTHORIZED", "Sign in to continue");
  const env = await getBindings();
  const project = await env.DB.prepare("SELECT * FROM project WHERE id = ? AND user_id = ?").bind(projectId, user.id).first();
  if (!project) throw new HttpError(404, "PROJECT_NOT_FOUND", "Project not found");
  return { user, env, project };
}

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try { const { projectId } = await params; return Response.json({ project: (await ownedProject(request, projectId)).project }); }
  catch (error) { return errorResponse(error); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const { env } = await ownedProject(request, projectId);
    const input = projectInputSchema.parse(await request.json());
    await env.DB.prepare("UPDATE project SET name = ?, baseline_origin = ?, candidate_origin = ?, updated_at = ? WHERE id = ?")
      .bind(input.name, input.baselineUrl, input.candidateUrl, Date.now(), projectId).run();
    return Response.json({ project: { id: projectId, ...input } });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const { env } = await ownedProject(request, projectId);
    await env.DB.batch([
      env.DB.prepare("DELETE FROM region WHERE run_id IN (SELECT id FROM run WHERE project_id = ?)").bind(projectId),
      env.DB.prepare("DELETE FROM share WHERE run_id IN (SELECT id FROM run WHERE project_id = ?)").bind(projectId),
      env.DB.prepare("DELETE FROM run WHERE project_id = ?").bind(projectId),
      env.DB.prepare("DELETE FROM project WHERE id = ?").bind(projectId),
    ]);
    return new Response(null, { status: 204 });
  } catch (error) { return errorResponse(error); }
}
