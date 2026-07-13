import type { ViewportId } from "@uirift/shared";

interface CaptureInput {
  baselineUrl: string;
  candidateUrl: string;
  routePath: string;
  viewport: ViewportId;
}

interface CaptureResponse {
  baseline?: string;
  candidate?: string;
  durationMs?: number;
  error?: string;
}

export async function captureLocally(input: CaptureInput) {
  let response: Response;
  try {
    response = await fetch("/api/local-capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch (error) {
    const detail = error instanceof Error ? ` (${error.message})` : "";
    throw new Error(`Local capture is offline. Start UIRift with pnpm dev:local and try again.${detail}`);
  }
  const payload = (await response.json()) as CaptureResponse;
  if (!response.ok || !payload.baseline || !payload.candidate) {
    throw new Error(payload.error ?? "Local browser capture failed");
  }
  return {
    baseline: dataUrlToBlob(payload.baseline),
    candidate: dataUrlToBlob(payload.candidate),
    durationMs: payload.durationMs ?? 0,
  };
}

function dataUrlToBlob(value: string) {
  const [header, encoded] = value.split(",");
  if (!header || !encoded) throw new Error("Capture returned an invalid image");
  const type = header.match(/data:(.*?);/)?.[1] ?? "image/png";
  const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
  return new Blob([bytes], { type });
}
