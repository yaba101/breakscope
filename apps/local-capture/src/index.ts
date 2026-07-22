import { createServer, type ServerResponse } from "node:http";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { chromium, devices, firefox, webkit, type Browser, type BrowserContext, type BrowserContextOptions, type BrowserType, type Page, type Response as PlaywrightResponse } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { viewportProfiles, type BrowserEngine, type CaptureProfile, type PageSnapshot, type TestProfile, type ViewportId, type ViewportSample } from "@breakscope/shared";
import { isCaptureUrl, isLocalPreviewUrl } from "@breakscope/validation";

const port = Number(process.env.BREAKSCOPE_CAPTURE_PORT ?? 4317);
const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3100",
  "http://127.0.0.1:3100",
]);
let activeCaptures = 0;
let completedCaptures = 0;
let browserLaunches = 0;
let peakActiveCaptures = 0;
const browserIdleMs = Number(process.env.BREAKSCOPE_BROWSER_IDLE_MS ?? 30_000);
const browserPool = new Map<BrowserEngine, { browser: Promise<Browser>; idleTimer?: NodeJS.Timeout }>();
const captureWaiters: Array<() => void> = [];
const maxConcurrentCaptures = 2;

async function acquireCaptureSlot() {
  if (activeCaptures >= maxConcurrentCaptures) await new Promise<void>((resolve) => captureWaiters.push(resolve));
  activeCaptures += 1;
  peakActiveCaptures = Math.max(peakActiveCaptures, activeCaptures);
}

function releaseCaptureSlot() {
  activeCaptures = Math.max(0, activeCaptures - 1);
  captureWaiters.shift()?.();
}

async function pooledBrowser(engine: BrowserEngine) {
  const existing = browserPool.get(engine);
  if (existing) {
    if (existing.idleTimer) clearTimeout(existing.idleTimer);
    return existing.browser;
  }
  browserLaunches += 1;
  const browser = browserType(engine).launch({ headless: true });
  const entry: { browser: Promise<Browser>; idleTimer?: NodeJS.Timeout } = { browser };
  browserPool.set(engine, entry);
  void browser.then((instance) => instance.on("disconnected", () => {
    if (browserPool.get(engine)?.browser === browser) browserPool.delete(engine);
  })).catch(() => browserPool.delete(engine));
  return browser;
}

function releasePooledBrowser(engine: BrowserEngine) {
  const entry = browserPool.get(engine);
  if (!entry) return;
  entry.idleTimer = setTimeout(() => {
    if (browserPool.get(engine) !== entry) return;
    browserPool.delete(engine);
    void entry.browser.then((browser) => browser.close()).catch(() => undefined);
  }, browserIdleMs);
  entry.idleTimer.unref?.();
}

async function withPooledBrowser<T>(engine: BrowserEngine, task: (browser: Browser) => Promise<T>) {
  await acquireCaptureSlot();
  try {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const browser = await pooledBrowser(engine);
      try {
        return await task(browser);
      } catch (error) {
        const disconnected = !browser.isConnected() || /Target page, context or browser has been closed|browser has disconnected/i.test(error instanceof Error ? error.message : String(error));
        if (!disconnected || attempt === 1) throw error;
        browserPool.delete(engine);
      }
    }
    throw new Error("Browser capture could not be restarted");
  } finally {
    releasePooledBrowser(engine);
    releaseCaptureSlot();
    completedCaptures += 1;
  }
}

function runtimeStats() {
  const memory = process.memoryUsage();
  return { activeCaptures, completedCaptures, browserLaunches, peakActiveCaptures, pooledEngines: browserPool.size, rssBytes: memory.rss, heapUsedBytes: memory.heapUsed, externalBytes: memory.external };
}

interface CapturePageRequest {
  url: string;
  routePath: string;
  viewport: ViewportId;
  width?: number;
  height?: number;
  profile?: CaptureProfile;
  testProfile?: TestProfile;
}

interface ScanRouteRequest {
  url: string;
  routePath: string;
  widths: number[];
  height?: number;
  profile?: CaptureProfile;
  testProfile?: TestProfile;
  auditWidths?: number[];
}

interface RouteDiscoveryRequest {
  url: string;
}

interface ScanRouteResponse {
  routePath?: string;
  samples?: ViewportSample[];
  error?: string;
}

interface RouteDiscoveryResponse {
  routes?: string[];
  error?: string;
}

function send(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

function sendImage(response: ServerResponse, result: { image?: Buffer; finalUrl: string; statusCode: number; durationMs: number; documentHeight: number }) {
  if (!result.image) return send(response, 500, { error: "Capture did not produce an image" });
  response.writeHead(200, {
    "Content-Type": "image/jpeg",
    "Content-Length": result.image.byteLength,
    "Cache-Control": "no-store",
    "X-Breakscope-Final-Url": encodeURIComponent(result.finalUrl),
    "X-Breakscope-Status": String(result.statusCode),
    "X-Breakscope-Duration-Ms": String(result.durationMs),
    "X-Breakscope-Document-Height": String(result.documentHeight),
  });
  response.end(result.image);
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

function captureViewport(viewport: ViewportId, width?: number, height?: number) {
  const profile = viewportProfiles[viewport];
  const requested = { width: width ?? profile.width, height: height ?? profile.height };
  if (!Number.isInteger(requested.width) || requested.width < 320 || requested.width > 2560 || !Number.isInteger(requested.height) || requested.height < 240 || requested.height > 2160) {
    throw new Error("Viewport must be between 320×240 and 2560×2160");
  }
  return requested;
}

function browserType(engine: BrowserEngine = "chromium"): BrowserType {
  return engine === "firefox" ? firefox : engine === "webkit" ? webkit : chromium;
}

function validProfile(profile?: CaptureProfile) {
  return !profile || ["chromium", "firefox", "webkit"].includes(profile.browserEngine);
}

function publicCaptureError(error: unknown, engine: BrowserEngine = "chromium") {
  const message = error instanceof Error ? error.message : String(error);
  if (/Executable doesn't exist|playwright was just installed or updated|playwright install/i.test(message)) {
    const label = engine === "webkit" ? "WebKit" : engine === "firefox" ? "Firefox" : "Chromium";
    return `${label} capture runtime is not installed. Run pnpm --filter @breakscope/local-capture exec playwright install ${engine}.`;
  }
  if (/page\.goto: Timeout .* exceeded/i.test(message)) {
    return "The page did not finish loading after two attempts. Check the target server logs, then retry the capture.";
  }
  return message.split("\n")[0]?.trim().slice(0, 240) || "Capture failed";
}

async function navigateForCapture(page: Page, url: string): Promise<PlaywrightResponse | null> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    } catch (error) {
      lastError = error;
      const transient = /Timeout .* exceeded|ERR_CONNECTION_RESET|ERR_CONNECTION_CLOSED|ERR_FAILED/i.test(error instanceof Error ? error.message : String(error));
      if (!transient || attempt === 1) throw error;
      await page.goto("about:blank", { waitUntil: "commit", timeout: 5_000 }).catch(() => undefined);
      await page.waitForTimeout(600);
    }
  }
  throw lastError;
}

async function settlePageForCapture(page: Page) {
  await page.waitForLoadState("load", { timeout: 20_000 }).catch(() => undefined);
  await page.waitForLoadState("networkidle", { timeout: 4_000 }).catch(() => undefined);
  await page.evaluate(async () => {
    const delay = (duration: number) => new Promise<void>((resolve) => window.setTimeout(resolve, duration));
    await Promise.race([document.fonts.ready.then(() => undefined), delay(8_000)]);

    const root = document.scrollingElement ?? document.documentElement;
    const initialHeight = Math.min(root.scrollHeight, 30_000);
    const step = Math.max(window.innerHeight * 0.8, 480);
    for (let position = 0, passes = 0; position < initialHeight && passes < 24; position += step, passes += 1) {
      window.scrollTo({ top: position, behavior: "instant" });
      await delay(45);
    }
    window.scrollTo({ top: 0, behavior: "instant" });

    const images = Array.from(document.images);
    await Promise.race([
      Promise.allSettled(images.map(async (image) => {
        if (!image.complete) await new Promise<void>((resolve) => {
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        });
        await image.decode().catch(() => undefined);
      })),
      delay(10_000),
    ]);

    const finiteAnimations = document.getAnimations().filter((animation) => {
      const timing = animation.effect?.getTiming();
      return animation.playState === "running" && timing?.iterations !== Infinity;
    });
    await Promise.race([Promise.allSettled(finiteAnimations.map((animation) => animation.finished)), delay(3_000)]);
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
}

async function settleResizedPage(page: Page) {
  const quiet = await page.evaluate(async () => {
    const delay = (duration: number) => new Promise<void>((resolve) => window.setTimeout(resolve, duration));
    const root = document.documentElement;
    let lastHeight = root.scrollHeight;
    let lastWidth = root.scrollWidth;
    let stablePasses = 0;
    let mutations = 0;
    const observer = new MutationObserver(() => { mutations += 1; });
    observer.observe(document, { attributes: true, childList: true, subtree: true, characterData: true });
    try {
      for (let pass = 0; pass < 8; pass += 1) {
        const beforeMutations = mutations;
        await delay(100);
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        const stable = root.scrollHeight === lastHeight && root.scrollWidth === lastWidth && mutations === beforeMutations;
        stablePasses = stable ? stablePasses + 1 : 0;
        lastHeight = root.scrollHeight;
        lastWidth = root.scrollWidth;
        if (stablePasses >= 2) return true;
      }
      return false;
    } finally {
      observer.disconnect();
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }).catch(() => false);
  await page.waitForLoadState("networkidle", { timeout: 800 }).catch(() => undefined);
  if (!quiet) await settlePageForCapture(page);
}

function contextOptions(profile: { width: number; height: number }, captureProfile?: CaptureProfile): BrowserContextOptions {
  const descriptor = captureProfile?.deviceName ? devices[captureProfile.deviceName] : undefined;
  return {
    ...(descriptor ?? {}),
    viewport: { width: profile.width, height: profile.height },
    colorScheme: captureProfile?.colorScheme ?? "light",
    reducedMotion: "reduce",
    timezoneId: "UTC",
    locale: "en-US",
    ...(captureProfile?.userAgent ? { userAgent: captureProfile.userAgent } : {}),
    ...(captureProfile?.deviceScaleFactor ? { deviceScaleFactor: captureProfile.deviceScaleFactor } : {}),
    ...(captureProfile?.isMobile !== undefined ? { isMobile: captureProfile.isMobile } : {}),
    ...(captureProfile?.hasTouch !== undefined ? { hasTouch: captureProfile.hasTouch } : {}),
  };
}

interface CaptureSession {
  context: BrowserContext;
  page: Page;
  navigation?: PlaywrightResponse | null;
  initialized: boolean;
}

interface CaptureResult {
  image?: Buffer;
  finalUrl: string;
  statusCode: number;
  durationMs: number;
  documentHeight: number;
  snapshot?: PageSnapshot;
}

async function captureWithBrowser(
  browser: Browser,
  url: string,
  viewport: ViewportId,
  width?: number,
  height?: number,
  includeImage = true,
  captureProfile?: CaptureProfile,
  interactionState?: "expanded",
  testProfile: TestProfile = "responsive",
  session?: CaptureSession,
  includeSnapshot = true,
): Promise<CaptureResult> {
  const startedAt = Date.now();
  const profile = captureViewport(viewport, width, height);
  const ownsContext = !session;
  const context = session?.context ?? await browser.newContext(contextOptions(profile, captureProfile));
  try {
  const allowLocal = isLocalPreviewUrl(url);
  const checkedHosts = new Set<string>();
  if (!session?.initialized) {
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
  }
  const page = session?.page ?? await context.newPage();
  if (session?.initialized) {
    await page.setViewportSize(profile);
    await settleResizedPage(page);
  }
  const navigation = session?.initialized ? session.navigation ?? null : await navigateForCapture(page, url);
  if (!navigation?.ok()) throw new Error(`Page returned ${navigation?.status() ?? "no response"} for ${url}`);
  const contentType = navigation.headers()["content-type"] ?? "";
  if (!contentType.includes("text/html")) throw new Error("URL did not return an HTML page");
  if (!session?.initialized) {
    await page.evaluate("globalThis.__name = (target) => target");
    await settlePageForCapture(page);
    if (session) {
      session.navigation = navigation;
      session.initialized = true;
    }
  }
  const interactionCandidates = includeSnapshot ? await page.locator("details:not([open]), button[aria-expanded='false'][aria-controls]:not([type='submit']), [role='button'][aria-expanded='false'][aria-controls]").count() : 0;
  if (interactionState === "expanded" && interactionCandidates) {
    await page.evaluate(() => {
      document.querySelectorAll("details:not([open])").forEach((element) => element.setAttribute("open", ""));
      document.querySelectorAll<HTMLElement>("button[aria-expanded='false'][aria-controls]:not([type='submit']), [role='button'][aria-expanded='false'][aria-controls]").forEach((element) => element.click());
    });
    await settlePageForCapture(page);
  }
  if (!includeSnapshot) {
    const documentHeight = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0));
    const image = includeImage ? await page.screenshot({ fullPage: true, animations: "disabled", type: "jpeg", quality: 84 }) : undefined;
    const result: CaptureResult = { ...(image ? { image } : {}), finalUrl: page.url(), statusCode: navigation.status(), durationMs: Date.now() - startedAt, documentHeight };
    return result;
  }
  let snapshotData: Omit<PageSnapshot, "url" | "capturedAt"> | undefined;
  for (let attempt = 0; attempt < 3 && !snapshotData; attempt += 1) {
    try {
      await page.waitForLoadState("domcontentloaded", { timeout: 10_000 }).catch(() => undefined);
      snapshotData = await page.evaluate(({ viewportWidth, viewportHeight }) => {
        const normalized = (value: string | null | undefined, limit = 240) =>
          (value ?? "").replace(/\s+/g, " ").trim().slice(0, limit);
        const implicitRole = (element: Element) => {
          const tag = element.tagName.toLowerCase();
          if (tag === "a" && element.hasAttribute("href")) return "link";
          if (tag === "button") return "button";
          if (tag === "nav") return "navigation";
          if (tag === "main") return "main";
          if (tag === "header") return "banner";
          if (tag === "footer") return "contentinfo";
          if (tag === "aside") return "complementary";
          if (/^h[1-6]$/.test(tag)) return "heading";
          if (tag === "img") return "img";
          if (tag === "select") return "combobox";
          if (tag === "textarea") return "textbox";
          if (tag === "input") {
            const type = (element.getAttribute("type") ?? "text").toLowerCase();
            if (["button", "submit", "reset"].includes(type)) return "button";
            if (type === "checkbox") return "checkbox";
            if (type === "radio") return "radio";
            if (type === "range") return "slider";
            return "textbox";
          }
          return "";
        };
        const selectorFor = (element: Element) => {
          const testId = element.getAttribute("data-testid");
          if (testId) return `[data-testid="${normalized(testId, 80)}"]`;
          if (element.id) return `#${normalized(element.id, 80)}`;
          const parts: string[] = [];
          let current: Element | null = element;
          while (current && current !== document.documentElement && parts.length < 6) {
            const tag = current.tagName.toLowerCase();
            const siblings = current.parentElement ? Array.from(current.parentElement.children).filter((item) => item.tagName === current?.tagName) : [];
            const position = siblings.length > 1 ? `:nth-of-type(${siblings.indexOf(current) + 1})` : "";
            parts.unshift(`${tag}${position}`);
            current = current.parentElement;
          }
          return parts.join(" > ");
        };
        const accessibleName = (element: Element) => {
          const labelledBy = element.getAttribute("aria-labelledby");
          const labelledText = labelledBy?.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" ") ?? "";
          const labels = element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement
            ? Array.from(element.labels ?? []).map((label) => label.textContent ?? "").join(" ")
            : "";
          return normalized(
            element.getAttribute("aria-label") || labelledText || labels || element.getAttribute("alt") ||
            element.getAttribute("placeholder") || element.getAttribute("title") ||
            (element instanceof HTMLElement ? element.innerText : element.textContent),
            160,
          );
        };
        const sourceHintFor = (element: Element) => {
          const file = normalized(element.getAttribute("data-source-file") || element.getAttribute("data-source"), 300);
          const component = normalized(element.getAttribute("data-component-name") || element.getAttribute("data-component"), 120);
          const line = Number.parseInt(element.getAttribute("data-source-line") ?? "", 10);
          const column = Number.parseInt(element.getAttribute("data-source-column") ?? "", 10);
          if (file || component) return { ...(file ? { file } : {}), ...(component ? { component } : {}), ...(Number.isFinite(line) ? { line } : {}), ...(Number.isFinite(column) ? { column } : {}), origin: "runtime-attribute" as const };
          const fiberKey = Object.keys(element).find((key) => key.startsWith("__reactFiber$"));
          let fiber = fiberKey ? (element as unknown as Record<string, unknown>)[fiberKey] as { _debugSource?: { fileName?: string; lineNumber?: number; columnNumber?: number }; return?: unknown; type?: unknown } | undefined : undefined;
          for (let depth = 0; fiber && depth < 12; depth += 1) {
            const source = fiber._debugSource;
            const type = fiber.type as { displayName?: string; name?: string } | string | undefined;
            const componentName = typeof type === "string" ? "" : normalized(type?.displayName || type?.name, 120);
            if (source?.fileName || componentName) return { ...(source?.fileName ? { file: normalized(source.fileName, 300) } : {}), ...(source?.lineNumber ? { line: source.lineNumber } : {}), ...(source?.columnNumber ? { column: source.columnNumber } : {}), ...(componentName ? { component: componentName } : {}), origin: "react-debug" as const };
            fiber = fiber.return as typeof fiber;
          }
          return undefined;
        };
        const candidates = Array.from(document.querySelectorAll(
          "h1,h2,h3,h4,h5,h6,p,li,label,a,button,input,select,textarea,img,nav,main,header,footer,aside,section,article,[role],[data-testid]",
        )).slice(0, 500);
        const keyCounts = new Map<string, number>();
        const keyedElements = new Map<Element, string>();
        const elements = candidates.map((element, order) => {
          const style = getComputedStyle(element);
          const bounds = element.getBoundingClientRect();
          const tag = element.tagName.toLowerCase();
          const role = normalized(element.getAttribute("role") || implicitRole(element), 60);
          const name = accessibleName(element);
          const selector = selectorFor(element);
          const sourceHint = sourceHintFor(element);
          const testId = normalized(element.getAttribute("data-testid"), 100);
          const id = normalized(element.id, 100);
          const href = element instanceof HTMLAnchorElement ? normalized(element.pathname || element.href, 240) : "";
          const baseKey = testId ? `testid:${testId}` : id ? `id:${id}` : role && name ? `${role}:${name.toLowerCase()}` : selector;
          const occurrence = (keyCounts.get(baseKey) ?? 0) + 1;
          keyCounts.set(baseKey, occurrence);
          const visible = style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0 && bounds.width > 0 && bounds.height > 0;
          const key = occurrence === 1 ? baseKey : `${baseKey}#${occurrence}`;
          keyedElements.set(element, key);
          return {
            key,
            order,
            tag,
            role,
            name,
            text: normalized(element instanceof HTMLElement ? element.innerText : element.textContent),
            selector,
            ...(sourceHint ? { sourceHint } : {}),
            parentKey: element.parentElement ? keyedElements.get(element.parentElement) ?? selectorFor(element.parentElement) : "",
            visible,
            inViewport: visible && bounds.bottom > 0 && bounds.right > 0 && bounds.top < viewportHeight && bounds.left < viewportWidth,
            rect: {
              x: Math.round((bounds.left + window.scrollX) * 10) / 10,
              y: Math.round((bounds.top + window.scrollY) * 10) / 10,
              width: Math.round(bounds.width * 10) / 10,
              height: Math.round(bounds.height * 10) / 10,
            },
            attributes: {
              id,
              testId,
              href,
              type: normalized(element.getAttribute("type"), 60),
              alt: normalized(element.getAttribute("alt"), 160),
              placeholder: normalized(element.getAttribute("placeholder"), 160),
              ariaLabel: normalized(element.getAttribute("aria-label"), 160),
            },
            styles: {
              display: style.display,
              position: style.position,
              color: style.color,
              backgroundColor: style.backgroundColor,
              fontSize: style.fontSize,
              fontWeight: style.fontWeight,
              borderRadius: style.borderRadius,
              overflowX: style.overflowX,
              overflowY: style.overflowY,
              zIndex: style.zIndex,
              lineClamp: style.getPropertyValue("-webkit-line-clamp"),
            },
            geometry: {
              clientWidth: element instanceof HTMLElement ? element.clientWidth : Math.round(bounds.width),
              clientHeight: element instanceof HTMLElement ? element.clientHeight : Math.round(bounds.height),
              scrollWidth: element instanceof HTMLElement ? element.scrollWidth : Math.round(bounds.width),
              scrollHeight: element instanceof HTMLElement ? element.scrollHeight : Math.round(bounds.height),
            },
          };
        });
        const root = document.documentElement;
        return {
          title: document.title,
          language: document.documentElement.lang || navigator.language,
          viewportWidth,
          viewportHeight,
          documentWidth: Math.max(root.scrollWidth, document.body?.scrollWidth ?? 0),
          documentHeight: Math.max(root.scrollHeight, document.body?.scrollHeight ?? 0),
          elements,
        };
      }, { viewportWidth: profile.width, viewportHeight: profile.height });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/Execution context was destroyed|navigation/i.test(message) || attempt === 2) throw error;
      await page.waitForTimeout(250);
    }
  }
  if (!snapshotData) throw new Error("Unable to read the settled page snapshot");
  const accessibilityViolations = testProfile === "accessibility" || testProfile === "full" ? await new AxeBuilder({ page }).analyze().then((result) => result.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact ?? null,
    help: violation.help,
    helpUrl: violation.helpUrl,
    tags: violation.tags,
    nodes: violation.nodes.map((node) => ({ selector: node.target.map(String).join(" "), html: node.html.slice(0, 500), failureSummary: node.failureSummary ?? violation.description })),
  }))).catch(() => []) : undefined;
  const performanceSnapshot = testProfile === "performance" || testProfile === "full" ? await page.evaluate(() => {
    const navigation = window.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const resources = window.performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    const largest = [...resources].sort((left, right) => (right.transferSize || right.encodedBodySize) - (left.transferSize || left.encodedBodySize))[0];
    const shifts = window.performance.getEntriesByType("layout-shift") as Array<PerformanceEntry & { value?: number; hadRecentInput?: boolean }>;
    return {
      domContentLoadedMs: Math.round(navigation?.domContentLoadedEventEnd ?? 0), loadMs: Math.round(navigation?.loadEventEnd ?? 0), resourceCount: resources.length,
      transferBytes: resources.reduce((total, resource) => total + (resource.transferSize || resource.encodedBodySize), 0),
      largestResourceBytes: largest ? largest.transferSize || largest.encodedBodySize : 0, largestResourceUrl: largest?.name ?? "",
      cumulativeLayoutShift: Math.round(shifts.filter((shift) => !shift.hadRecentInput).reduce((total, shift) => total + (shift.value ?? 0), 0) * 1000) / 1000,
    };
  }) : undefined;
  // Raw full-page PNGs can exceed the evidence budget and evict whole checkpoints
  // from History. JPEG retains the full page at a practical size for every viewport.
  const image = includeImage ? await page.screenshot({ fullPage: true, animations: "disabled", type: "jpeg", quality: 84 }) : undefined;
  const finalUrl = page.url();
  const snapshot: PageSnapshot = {
    ...snapshotData,
    ...(accessibilityViolations ? { accessibilityViolations } : {}),
    interactionCandidates,
    ...(performanceSnapshot ? { performance: performanceSnapshot } : {}),
    ...(interactionState ? { interactionState } : {}),
    url: finalUrl,
    capturedAt: Date.now(),
  };
  return {
    ...(image ? { image } : {}),
    finalUrl,
    statusCode: navigation.status(),
    durationMs: Date.now() - startedAt,
    documentHeight: snapshot.documentHeight,
    snapshot,
  };
  } finally {
    if (ownsContext) await context.close().catch(() => undefined);
  }
}

async function capture(url: string, viewport: ViewportId, width?: number, height?: number, profile?: CaptureProfile, testProfile: TestProfile = "responsive", includeSnapshot = true) {
  const engine = profile?.browserEngine ?? "chromium";
  return withPooledBrowser(engine, (browser) => captureWithBrowser(browser, url, viewport, width, height, true, profile, undefined, testProfile, undefined, includeSnapshot));
}

async function scanRoute(input: ScanRouteRequest) {
  const widths = [...new Set(input.widths)].sort((a, b) => a - b);
  if (!widths.length || widths.length > 32) throw new Error("Scan requires between 1 and 32 viewport widths");
  const engine = input.profile?.browserEngine ?? "chromium";
  return withPooledBrowser(engine, async (browser) => {
    const firstWidth = widths[0]!;
    const context = await browser.newContext(contextOptions({ width: firstWidth, height: input.height ?? 900 }, input.profile));
    const session: CaptureSession = { context, page: await context.newPage(), initialized: false };
    try {
    const samples = [];
    for (const width of widths) {
      const widthProfile = input.auditWidths?.includes(width) ? input.testProfile ?? "responsive" : "responsive";
      const captureResult = await captureWithBrowser(
        browser,
        targetUrl(input.url, input.routePath),
        width <= 600 ? "mobile" : "desktop",
        width,
        input.height ?? 900,
        false,
        input.profile,
        undefined,
        widthProfile,
        session,
      );
      if (!captureResult.snapshot) throw new Error("Responsive scan did not return a page snapshot");
      samples.push({
        width,
        height: input.height ?? 900,
        snapshot: captureResult.snapshot,
        durationMs: captureResult.durationMs,
        browserEngine: input.profile?.browserEngine ?? "chromium",
      });
      if (captureResult.snapshot.interactionCandidates) {
        const expanded = await captureWithBrowser(browser, targetUrl(input.url, input.routePath), width <= 600 ? "mobile" : "desktop", width, input.height ?? 900, false, input.profile, "expanded", widthProfile);
        if (!expanded.snapshot) throw new Error("Expanded responsive scan did not return a page snapshot");
        samples.push({ width, height: input.height ?? 900, snapshot: expanded.snapshot, durationMs: expanded.durationMs, browserEngine: input.profile?.browserEngine ?? "chromium", interactionState: "expanded" });
      }
    }
    return { routePath: input.routePath, samples };
    } finally {
      await context.close();
    }
  });
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

async function discoverRoutes(origin: string, captureProfile?: CaptureProfile) {
  const browser = await browserType(captureProfile?.browserEngine).launch({ headless: true });
  try {
    const deviceDescriptor = captureProfile?.deviceName ? devices[captureProfile.deviceName] : undefined;
    const context = await browser.newContext({
      viewport: deviceDescriptor?.viewport ?? { width: 1280, height: 800 },
      colorScheme: captureProfile?.colorScheme ?? "dark",
      reducedMotion: "reduce",
      timezoneId: "UTC",
      locale: "en-US",
      ...deviceDescriptor,
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
  if (request.method === "GET" && request.url === "/health") return send(response, 200, { ok: true, ...runtimeStats() });
  if (request.method !== "POST" || !["/capture-page", "/capture-image", "/discover-routes", "/scan-route"].includes(request.url ?? "")) {
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
      if (request.url === "/scan-route") {
        const input = JSON.parse(raw) as ScanRouteRequest;
        if (!isCaptureUrl(input.url)) return send(response, 400, { error: "Use a public HTTPS URL or localhost" });
        if (!validProfile(input.profile)) return send(response, 400, { error: "Invalid browser engine" });
        if (!input.routePath?.startsWith("/")) return send(response, 400, { error: "Invalid route" });
        return send(response, 200, await scanRoute(input));
      }

      if (request.url === "/capture-page" || request.url === "/capture-image") {
        const input = JSON.parse(raw) as CapturePageRequest;
        if (!isCaptureUrl(input.url)) {
          return send(response, 400, { error: "Use a public HTTPS URL or localhost" });
        }
        if (!(input.viewport in viewportProfiles) || !input.routePath?.startsWith("/")) {
          return send(response, 400, { error: "Invalid route or viewport" });
        }
        if (!validProfile(input.profile)) return send(response, 400, { error: "Invalid browser engine" });
        const result = await capture(targetUrl(input.url, input.routePath), input.viewport, input.width, input.height, input.profile, input.testProfile, request.url === "/capture-page");
        if (request.url === "/capture-image") return sendImage(response, result as { image?: Buffer; finalUrl: string; statusCode: number; durationMs: number; documentHeight: number });
        const legacy = result as { image?: Buffer; finalUrl: string; statusCode: number; durationMs: number; snapshot: PageSnapshot };
        return send(response, 200, { ...legacy, image: legacy.image ? `data:image/jpeg;base64,${legacy.image.toString("base64")}` : undefined });
      }

      if (request.url === "/discover-routes") {
        const input = JSON.parse(raw) as RouteDiscoveryRequest;
        if (!isCaptureUrl(input.url)) return send(response, 400, { error: "Use a public HTTPS URL or localhost" });
        const profile: CaptureProfile | undefined = undefined;
        return send(response, 200, { routes: await discoverRoutes(input.url, profile) });
      }

      return send(response, 404, { error: "Not found" });
    } catch (error) {
      console.error("Local capture failed:", error);
      let engine: BrowserEngine = "chromium";
      try {
        const parsed = JSON.parse(raw) as CapturePageRequest | ScanRouteRequest | RouteDiscoveryRequest;
        engine = (parsed as CapturePageRequest | ScanRouteRequest).profile?.browserEngine ?? "chromium";
      } catch {
      }
      return send(response, 500, { error: publicCaptureError(error, engine) });
    }
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Breakscope local browser ready at http://127.0.0.1:${port}`);
});
