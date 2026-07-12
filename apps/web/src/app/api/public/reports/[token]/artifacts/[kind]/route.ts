import { getBindings, sha256 } from "@/lib/cloudflare";
import { errorResponse, HttpError } from "@/lib/http";

const columns = { baseline: "baseline_key", candidate: "candidate_key", diff: "diff_key" } as const;

export async function GET(_request: Request, { params }: { params: Promise<{ token: string; kind: string }> }) {
  try {
    const { token, kind } = await params;
    if (!(kind in columns)) throw new HttpError(404, "ARTIFACT_NOT_FOUND", "Artifact not found");
    const env = await getBindings();
    const column = columns[kind as keyof typeof columns];
    const row = await env.DB.prepare(`SELECT run.${column} AS object_key FROM share JOIN run ON run.id = share.run_id WHERE share.token_hash = ? AND share.expires_at > ? AND share.revoked_at IS NULL`).bind(await sha256(token), Date.now()).first<{ object_key: string | null }>();
    if (!row?.object_key) throw new HttpError(404, "REPORT_EXPIRED", "Shared report is unavailable or expired");
    const object = await env.IMAGES.get(row.object_key);
    if (!object) throw new HttpError(404, "ARTIFACT_NOT_FOUND", "Artifact not found");
    return new Response(object.body, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=300", ETag: object.httpEtag } });
  } catch (error) { return errorResponse(error); }
}
