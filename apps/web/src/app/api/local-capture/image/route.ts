export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const response = await fetch("http://127.0.0.1:4317/capture-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
      signal: AbortSignal.timeout(90_000),
    });
    const headers = new Headers();
    for (const name of ["content-type", "content-length", "cache-control", "x-breakscope-final-url", "x-breakscope-status", "x-breakscope-duration-ms", "x-breakscope-document-height"]) {
      const value = response.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new Response(response.body, { status: response.status, headers });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    return Response.json(
      { error: timedOut ? "Local capture timed out while rendering this page." : "Local capture is offline. Start Breakscope with pnpm dev:local and try again." },
      { status: timedOut ? 504 : 503 },
    );
  }
}
