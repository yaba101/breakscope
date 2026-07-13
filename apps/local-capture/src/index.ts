import { createServer, type ServerResponse } from "node:http";
import { chromium } from "@playwright/test";
import { viewportProfiles, type ViewportId } from "@uirift/shared";
import { isCaptureUrl } from "@uirift/validation";

const port = Number(process.env.UIRIFT_CAPTURE_PORT ?? 4317);
const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3100",
  "http://127.0.0.1:3100",
]);

interface CaptureRequest {
  baselineUrl: string;
  candidateUrl: string;
  routePath: string;
  viewport: ViewportId;
}

function send(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

function targetUrl(origin: string, routePath: string) {
  const target = new URL(routePath, origin);
  const expected = new URL(origin);
  if (target.origin !== expected.origin) throw new Error("Route must stay on the supplied origin");
  return target.toString();
}

async function capture(url: string, viewport: ViewportId) {
  const browser = await chromium.launch({ headless: true });
  try {
    const profile = viewportProfiles[viewport];
    const context = await browser.newContext({
      viewport: { width: profile.width, height: profile.height },
      colorScheme: "dark",
      reducedMotion: "reduce",
      timezoneId: "UTC",
      locale: "en-US",
    });
    const page = await context.newPage();
    const navigation = await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
    if (!navigation?.ok()) throw new Error(`Page returned ${navigation?.status() ?? "no response"}`);
    const contentType = navigation.headers()["content-type"] ?? "";
    if (!contentType.includes("text/html")) throw new Error("URL did not return an HTML page");
    await page.evaluate(() => document.fonts.ready);
    const png = await page.screenshot({ fullPage: false, animations: "disabled", type: "png" });
    await context.close();
    return `data:image/png;base64,${png.toString("base64")}`;
  } finally {
    await browser.close();
  }
}

const server = createServer((request, response) => {
  const origin = request.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (request.method === "OPTIONS") return response.writeHead(204).end();
  if (request.method === "GET" && request.url === "/health") return send(response, 200, { ok: true });
  if (request.method !== "POST" || request.url !== "/capture") return send(response, 404, { error: "Not found" });
  if (origin && !allowedOrigins.has(origin)) return send(response, 403, { error: "Origin is not allowed" });

  let raw = "";
  request.on("data", (chunk) => {
    raw += chunk;
    if (raw.length > 100_000) request.destroy();
  });
  request.on("end", async () => {
    try {
      const input = JSON.parse(raw) as CaptureRequest;
      if (!isCaptureUrl(input.baselineUrl) || !isCaptureUrl(input.candidateUrl)) {
        return send(response, 400, { error: "Use an approved HTTPS preview URL or localhost" });
      }
      if (!(input.viewport in viewportProfiles) || !input.routePath?.startsWith("/")) {
        return send(response, 400, { error: "Invalid route or viewport" });
      }
      const startedAt = Date.now();
      const baseline = await capture(targetUrl(input.baselineUrl, input.routePath), input.viewport);
      const candidate = await capture(targetUrl(input.candidateUrl, input.routePath), input.viewport);
      return send(response, 200, { baseline, candidate, durationMs: Date.now() - startedAt });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Local capture failed:", error);
      return send(response, 500, { error: message || "Capture failed" });
    }
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`UIRift local capture ready at http://127.0.0.1:${port}`);
});
