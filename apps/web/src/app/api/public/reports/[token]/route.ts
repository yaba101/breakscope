import { getBindings, sha256 } from "@/lib/cloudflare";
import { errorResponse, HttpError } from "@/lib/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const tokenHash = await sha256(token);
    const env = await getBindings();
    const now = Date.now();

    const share = await env.DB.prepare(
      "SELECT id, payload, created_at, expires_at FROM report_share WHERE token_hash = ? AND expires_at > ?",
    )
      .bind(tokenHash, now)
      .first<{ id: string; payload: string; created_at: number; expires_at: number }>();

    if (!share) {
      throw new HttpError(404, "REPORT_EXPIRED", "This shared report is unavailable or expired");
    }

    let payload: unknown;
    try {
      payload = JSON.parse(share.payload);
    } catch {
      throw new HttpError(500, "INVALID_REPORT", "Report data is corrupted");
    }

    return Response.json({ payload, createdAt: share.created_at, expiresAt: share.expires_at });
  } catch (error) {
    return errorResponse(error);
  }
}
