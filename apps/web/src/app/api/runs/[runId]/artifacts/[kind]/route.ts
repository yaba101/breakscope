import { getRequestUser } from "@/lib/auth";
import { getBindings } from "@/lib/cloudflare";
import { errorResponse, HttpError } from "@/lib/http";

const columns = { baseline: "baseline_key", candidate: "candidate_key", diff: "diff_key" } as const;

export async function GET(request: Request, { params }: { params: Promise<{ runId: string; kind: string }> }) {
  try {
    const { runId, kind } = await params;
    if (!(kind in columns)) throw new HttpError(404, "ARTIFACT_NOT_FOUND", "Artifact not found");
    const user = await getRequestUser(request);
    if (!user) throw new HttpError(401, "UNAUTHORIZED", "Sign in to view artifacts");
    const env = await getBindings();
    const column = columns[kind as keyof typeof columns];
    const row = await env.DB.prepare(`SELECT ${column} AS object_key, expires_at FROM run WHERE id = ? AND user_id = ?`).bind(runId, user.id).first<{ object_key: string | null; expires_at: number }>();
    if (!row?.object_key || row.expires_at < Date.now()) throw new HttpError(404, "ARTIFACT_EXPIRED", "This artifact has expired");
    const object = await env.IMAGES.get(row.object_key);
    if (!object) throw new HttpError(404, "ARTIFACT_NOT_FOUND", "Artifact not found");
    return new Response(object.body, { headers: { "Content-Type": "image/png", "Cache-Control": "private, max-age=300", ETag: object.httpEtag } });
  } catch (error) { return errorResponse(error); }
}
