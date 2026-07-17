export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const response = await fetch("http://127.0.0.1:4317/scan-route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
      signal: AbortSignal.timeout(180_000),
    });
    return new Response(response.body, { status: response.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return Response.json({ error: "Responsive scanner is offline. Start Breakscope with pnpm dev:local and try again." }, { status: 503 });
  }
}
