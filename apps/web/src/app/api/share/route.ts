import { getBindings, sha256 } from "@/lib/cloudflare";
import { errorResponse, HttpError } from "@/lib/http";

const MAX_PAYLOAD_BYTES = 10 * 1024 * 1024; // 10MB
const EXPIRY_MS = 7 * 86_400_000; // 7 days

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_PAYLOAD_BYTES) {
      throw new HttpError(413, "PAYLOAD_TOO_LARGE", "Report payload exceeds 10MB limit");
    }

    const body = await request.json() as { payload?: unknown };
    if (!body.payload || typeof body.payload !== "object") {
      throw new HttpError(400, "INVALID_PAYLOAD", "A payload object is required");
    }

    const payloadString = JSON.stringify(body.payload);
    if (new TextEncoder().encode(payloadString).length > MAX_PAYLOAD_BYTES) {
      throw new HttpError(413, "PAYLOAD_TOO_LARGE", "Report payload exceeds 10MB limit");
    }

    const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll("-", "");
    const tokenHash = await sha256(token);
    const now = Date.now();
    const env = await getBindings();

    await env.DB.prepare(
      "INSERT INTO report_share (id, token_hash, payload, created_at, expires_at) VALUES (?, ?, ?, ?, ?)",
    )
      .bind(crypto.randomUUID(), tokenHash, payloadString, now, now + EXPIRY_MS)
      .run();

    return Response.json({
      url: new URL(`/report/${token}`, request.url).toString(),
      expiresAt: now + EXPIRY_MS,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
