import type { CaptureProfile, PageSnapshot, ViewportId } from "@breakscope/shared";

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
}, signal?: AbortSignal) {
  let response: Response;
  try {
    response = await fetch("/api/local-capture/page", {
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
  const payload = (await response.json()) as CapturePageResponse;
  if (!response.ok || !payload.image || !payload.snapshot) {
    throw new Error(payload.error ?? "Local browser capture failed");
  }
  return {
    image: dataUrlToBlob(payload.image),
    finalUrl: payload.finalUrl ?? new URL(input.routePath, input.url).toString(),
    statusCode: payload.statusCode ?? 200,
    durationMs: payload.durationMs ?? 0,
    snapshot: payload.snapshot,
  };
}

export async function scanRouteLocally(input: { url: string; routePath: string; widths: number[]; height?: number; profile?: CaptureProfile }, signal?: AbortSignal) {
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

function dataUrlToBlob(value: string) {
  const [header, encoded] = value.split(",");
  if (!header || !encoded) throw new Error("Capture returned an invalid image");
  const type = header.match(/data:(.*?);/)?.[1] ?? "image/png";
  const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
  return new Blob([bytes], { type });
}
