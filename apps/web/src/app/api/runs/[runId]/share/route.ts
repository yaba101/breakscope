import { getRequestUser } from "@/lib/auth";
import { getBindings, sha256 } from "@/lib/cloudflare";
import { errorResponse, HttpError } from "@/lib/http";

export async function POST(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  try {
    const { runId } = await params;
    const user = await getRequestUser(request);
    if (!user) throw new HttpError(401, "UNAUTHORIZED", "Sign in to share a comparison");
    const env = await getBindings();
    const run = await env.DB.prepare("SELECT id FROM run WHERE id = ? AND user_id = ? AND status = 'ready'").bind(runId, user.id).first();
    if (!run) throw new HttpError(404, "RUN_NOT_FOUND", "Ready run not found");
    const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll("-", "");
    const expiresAt = Date.now() + 7 * 86_400_000;
    await env.DB.prepare("INSERT INTO share (id, run_id, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?)").bind(crypto.randomUUID(), runId, await sha256(token), Date.now(), expiresAt).run();
    return Response.json({ url: new URL(`/report/${token}`, request.url).toString(), expiresAt });
  } catch (error) { return errorResponse(error); }
}
