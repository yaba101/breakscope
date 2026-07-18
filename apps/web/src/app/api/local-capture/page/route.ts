export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const response = await fetch("http://127.0.0.1:4317/capture-page", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
      signal: AbortSignal.timeout(90_000),
    });
    return new Response(response.body, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    return Response.json(
      { error: timedOut ? "Local capture timed out while rendering this page. The agent is still reachable; retry this capture or inspect the target page for stalled resources." : "Local capture is offline. Start Breakscope with pnpm dev:local and try again." },
      { status: timedOut ? 504 : 503 },
    );
  }
}
