import { createServer, type ServerResponse } from "node:http";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { chromium } from "@playwright/test";
import { viewportProfiles, type ViewportId } from "@uirift/shared";
import { isCaptureUrl, isLocalPreviewUrl } from "@uirift/validation";

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

interface CapturePageRequest {
  url: string;
  routePath: string;
  viewport: ViewportId;
}

interface RouteDiscoveryRequest {
  baselineUrl: string;
  candidateUrl: string;
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

function isPrivateAddress(address: string) {
  const normalized = address.toLowerCase();
  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (/^fe[89ab]/.test(normalized)) return true;
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  const ipv4 = mapped ?? (isIP(normalized) === 4 ? normalized : "");
  if (!ipv4) return false;
  const [a = 0, b = 0] = ipv4.split(".").map(Number);
  return (
    a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19))
  );
}

async function assertPublicHostname(hostname: string, allowLocal: boolean) {
  if (allowLocal && (hostname === "localhost" || hostname === "127.0.0.1")) return;
  if (isIP(hostname)) {
    if (isPrivateAddress(hostname)) throw new Error("Private network addresses are not allowed");
    return;
  }
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("The URL resolves to a private or unavailable network address");
  }
}

async function capture(url: string, viewport: ViewportId) {
  const startedAt = Date.now();
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
    const allowLocal = isLocalPreviewUrl(url);
    const checkedHosts = new Set<string>();
    await context.route("**/*", async (route) => {
      try {
        const requested = new URL(route.request().url());
        if (!["http:", "https:"].includes(requested.protocol)) return route.continue();
        if (!checkedHosts.has(requested.hostname)) {
          await assertPublicHostname(requested.hostname, allowLocal);
          checkedHosts.add(requested.hostname);
        }
        return route.continue();
      } catch {
        return route.abort("blockedbyclient");
      }
    });
    const page = await context.newPage();
    const navigation = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    if (!navigation?.ok()) throw new Error(`Page returned ${navigation?.status() ?? "no response"} for ${url}`);
    const contentType = navigation.headers()["content-type"] ?? "";
    if (!contentType.includes("text/html")) throw new Error("URL did not return an HTML page");
    await page.waitForLoadState("load", { timeout: 15_000 }).catch(() => undefined);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    const png = await page.screenshot({ fullPage: false, animations: "disabled", type: "png" });
    await context.close();
    return {
      image: `data:image/png;base64,${png.toString("base64")}`,
      finalUrl: page.url(),
      statusCode: navigation.status(),
      durationMs: Date.now() - startedAt,
    };
  } finally {
    await browser.close();
  }
}

const assetPath = /\.(?:avif|css|gif|ico|jpe?g|js|json|map|mp4|pdf|png|svg|webm|webp|woff2?|xml|zip)$/i;

function discoveredPath(value: string, origin: string) {
  try {
    const url = new URL(value, origin);
    if (url.origin !== new URL(origin).origin || !["http:", "https:"].includes(url.protocol)) return undefined;
    if (assetPath.test(url.pathname) || url.pathname.startsWith("/api/")) return undefined;
    return url.pathname || "/";
  } catch {
    return undefined;
  }
}

async function discoverRoutes(origin: string) {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      colorScheme: "dark",
      reducedMotion: "reduce",
      timezoneId: "UTC",
      locale: "en-US",
    });
    const allowLocal = isLocalPreviewUrl(origin);
    const checkedHosts = new Set<string>();
    await context.route("**/*", async (route) => {
      try {
        const requested = new URL(route.request().url());
        if (!["http:", "https:"].includes(requested.protocol)) return route.continue();
        if (!checkedHosts.has(requested.hostname)) {
          await assertPublicHostname(requested.hostname, allowLocal);
          checkedHosts.add(requested.hostname);
        }
        return route.continue();
      } catch {
        return route.abort("blockedbyclient");
      }
    });
    const page = await context.newPage();
    const queue = ["/"];
    const queued = new Set(queue);
    const available = new Set<string>();
    let inspected = 0;

    try {
      const sitemap = await page.goto(new URL("/sitemap.xml", origin).toString(), { waitUntil: "domcontentloaded", timeout: 8_000 });
      if (sitemap?.ok()) {
        const markup = await page.content();
        for (const match of markup.matchAll(/<loc[^>]*>\s*([^<]+)\s*<\/loc>/gi)) {
          const path = discoveredPath(match[1] ?? "", origin);
          if (path && !queued.has(path)) {
            queued.add(path);
            queue.push(path);
          }
        }
      }
    } catch {
      // Sitemaps are optional; navigation discovery below remains available.
    }

    while (queue.length && inspected < 10 && available.size < 10) {
      const routePath = queue.shift()!;
      inspected += 1;
      try {
        const navigation = await page.goto(targetUrl(origin, routePath), {
          waitUntil: routePath === "/" ? "domcontentloaded" : "commit",
          timeout: 5_000,
        });
        const contentType = navigation?.headers()["content-type"] ?? "";
        if (!navigation?.ok() || !contentType.includes("text/html")) continue;
        available.add(routePath);
        if (routePath === "/") {
          const hrefs = await page.evaluate(() => Array.from(document.querySelectorAll("a[href]"), (anchor) => anchor.getAttribute("href") ?? ""));
          for (const href of hrefs) {
            const path = discoveredPath(href, origin);
            if (path && !queued.has(path) && queued.size < 40) {
              queued.add(path);
              queue.push(path);
            }
          }
        }
      } catch {
        // A single unavailable route should not stop discovery for the site.
      }
    }
    await context.close();
    return [...available].sort((a, b) => a === "/" ? -1 : b === "/" ? 1 : a.localeCompare(b));
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
  if (request.method !== "POST" || !["/capture", "/capture-page", "/discover-routes"].includes(request.url ?? "")) {
    return send(response, 404, { error: "Not found" });
  }
  if (origin && !allowedOrigins.has(origin)) return send(response, 403, { error: "Origin is not allowed" });

  let raw = "";
  request.on("data", (chunk) => {
    raw += chunk;
    if (raw.length > 100_000) request.destroy();
  });
  request.on("end", async () => {
    try {
      if (request.url === "/capture-page") {
        const input = JSON.parse(raw) as CapturePageRequest;
        if (!isCaptureUrl(input.url)) {
          return send(response, 400, { error: "Use a public HTTPS URL or localhost" });
        }
        if (!(input.viewport in viewportProfiles) || !input.routePath?.startsWith("/")) {
          return send(response, 400, { error: "Invalid route or viewport" });
        }
        return send(response, 200, await capture(targetUrl(input.url, input.routePath), input.viewport));
      }

      if (request.url === "/discover-routes") {
        const input = JSON.parse(raw) as RouteDiscoveryRequest;
        if (!isCaptureUrl(input.baselineUrl) || !isCaptureUrl(input.candidateUrl)) {
          return send(response, 400, { error: "Use public HTTPS URLs or localhost" });
        }
        const [baselineRoutes, candidateRoutes] = await Promise.all([
          discoverRoutes(input.baselineUrl),
          discoverRoutes(input.candidateUrl),
        ]);
        const candidateSet = new Set(candidateRoutes);
        const routes = baselineRoutes.filter((routePath) => candidateSet.has(routePath));
        return send(response, 200, { routes, baselineRoutes, candidateRoutes });
      }

      const input = JSON.parse(raw) as CaptureRequest;
      if (!isCaptureUrl(input.baselineUrl) || !isCaptureUrl(input.candidateUrl)) {
        return send(response, 400, { error: "Use a public HTTPS URL or localhost" });
      }
      if (!(input.viewport in viewportProfiles) || !input.routePath?.startsWith("/")) {
        return send(response, 400, { error: "Invalid route or viewport" });
      }
      const startedAt = Date.now();
      const baseline = await capture(targetUrl(input.baselineUrl, input.routePath), input.viewport);
      const candidate = await capture(targetUrl(input.candidateUrl, input.routePath), input.viewport);
      return send(response, 200, {
        baseline: baseline.image,
        candidate: candidate.image,
        durationMs: Date.now() - startedAt,
      });
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
