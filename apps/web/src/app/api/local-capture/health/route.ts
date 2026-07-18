export const runtime = "nodejs";

export async function GET() {
  try {
    const response = await fetch("http://127.0.0.1:4317/health", { signal: AbortSignal.timeout(1_500) });
    if (!response.ok) return Response.json({ online: false }, { status: 503 });
    const health = await response.json();
    return Response.json({ online: true, health });
  } catch {
    return Response.json({ online: false }, { status: 503 });
  }
}
