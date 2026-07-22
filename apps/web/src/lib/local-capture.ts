import type { CaptureProfile, PageSnapshot, TestProfile, ViewportId } from "@breakscope/shared";

interface CapturePageResponse {
  image?: string;
  finalUrl?: string;
  statusCode?: number;
  durationMs?: number;
  snapshot?: PageSnapshot;
  error?: string;
}

export async function getLocalCaptureHealth() {
  const response = await fetch("/api/local-capture/health", { cache: "no-store" });
  const payload = await response.json() as { online?: boolean; health?: { activeCaptures?: number; completedCaptures?: number } };
  return { online: response.ok && payload.online === true, activeCaptures: payload.health?.activeCaptures ?? 0, completedCaptures: payload.health?.completedCaptures ?? 0 };
}

export async function discoverRoutesLocally(input: { url: string }) {
  const response = await fetch("/api/local-capture/routes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = (await response.json()) as {
    routes?: string[];
    error?: string;
  };
  if (!response.ok || !payload.routes) throw new Error(payload.error ?? "Unable to discover routes");
  return { routes: payload.routes };
}

export async function capturePageLocally(input: {
  url: string;
  routePath: string;
  viewport: ViewportId;
  width?: number;
  height?: number;
  profile?: CaptureProfile;
  testProfile?: TestProfile;
}, signal?: AbortSignal) {
  let response: Response;
  try {
    response = await fetch("/api/local-capture/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    const detail = error instanceof Error ? ` (${error.message})` : "";
    throw new Error(`The capture request could not reach the Breakscope web API.${detail}`);
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as CapturePageResponse;
    throw new Error(payload.error ?? "Local browser capture failed");
  }
  const image = await response.blob();
  const finalUrlHeader = response.headers.get("x-breakscope-final-url");
  const documentHeight = Number(response.headers.get("x-breakscope-document-height") ?? input.height ?? 900);
  return {
    image,
    finalUrl: finalUrlHeader ? decodeURIComponent(finalUrlHeader) : new URL(input.routePath, input.url).toString(),
    statusCode: Number(response.headers.get("x-breakscope-status") ?? 200),
    durationMs: Number(response.headers.get("x-breakscope-duration-ms") ?? 0),
    snapshot: { documentHeight } as PageSnapshot,
  };
}

export async function scanRouteLocally(input: { url: string; routePath: string; widths: number[]; height?: number; profile?: CaptureProfile; testProfile?: TestProfile; auditWidths?: number[] }, signal?: AbortSignal) {
  const response = await fetch("/api/local-capture/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  const payload = await response.json() as { routePath?: string; samples?: Array<{ width: number; height: number; snapshot: PageSnapshot; durationMs: number }>; error?: string };
  if (!response.ok || !payload.samples) throw new Error(payload.error ?? "Responsive scan failed");
  return payload.samples.map((sample) => ({ routePath: input.routePath, width: sample.width, height: sample.height, snapshot: sample.snapshot, browserEngine: input.profile?.browserEngine ?? "chromium", ...(sample.snapshot.interactionState ? { interactionState: sample.snapshot.interactionState } : {}) }));
}
