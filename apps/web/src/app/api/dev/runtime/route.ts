export const runtime = "nodejs";

export async function GET() {
  if (process.env.NODE_ENV !== "development") return Response.json({ error: "Not found" }, { status: 404 });
  const memory = process.memoryUsage();
  const app = { rssBytes: memory.rss, heapUsedBytes: memory.heapUsed, externalBytes: memory.external };
  try {
    const capture = await fetch("http://127.0.0.1:4317/health", { signal: AbortSignal.timeout(1_500) }).then((response) => response.json());
    return Response.json({ app, capture });
  } catch {
    return Response.json({ app, capture: { ok: false } });
  }
}
