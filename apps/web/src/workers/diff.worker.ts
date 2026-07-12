/// <reference lib="webworker" />

import { compareRgba } from "@uirift/comparison-engine";

interface DiffRequest {
  baseline: ArrayBuffer;
  candidate: ArrayBuffer;
  threshold: number;
}

self.onmessage = async (event: MessageEvent<DiffRequest>) => {
  try {
    const [baselineBitmap, candidateBitmap] = await Promise.all([
      createImageBitmap(new Blob([event.data.baseline], { type: "image/png" })),
      createImageBitmap(new Blob([event.data.candidate], { type: "image/png" })),
    ]);
    if (baselineBitmap.width !== candidateBitmap.width || baselineBitmap.height !== candidateBitmap.height) {
      throw new Error("Captured images have different dimensions");
    }
    const { width, height } = baselineBitmap;
    const baselineCanvas = new OffscreenCanvas(width, height);
    const candidateCanvas = new OffscreenCanvas(width, height);
    const baselineContext = baselineCanvas.getContext("2d", { willReadFrequently: true });
    const candidateContext = candidateCanvas.getContext("2d", { willReadFrequently: true });
    if (!baselineContext || !candidateContext) throw new Error("Canvas is unavailable");
    baselineContext.drawImage(baselineBitmap, 0, 0);
    candidateContext.drawImage(candidateBitmap, 0, 0);
    const result = compareRgba(
      baselineContext.getImageData(0, 0, width, height).data,
      candidateContext.getImageData(0, 0, width, height).data,
      width,
      height,
      event.data.threshold,
    );
    const diffCanvas = new OffscreenCanvas(width, height);
    const diffContext = diffCanvas.getContext("2d");
    if (!diffContext) throw new Error("Canvas is unavailable");
    const diffPixels = new Uint8ClampedArray(result.diff.length);
    diffPixels.set(result.diff);
    diffContext.putImageData(new ImageData(diffPixels, width, height), 0, 0);
    const diffBlob = await diffCanvas.convertToBlob({ type: "image/png" });
    const diff = await diffBlob.arrayBuffer();
    self.postMessage({ ok: true, width, height, diff, changedPixels: result.changedPixels, changedRatio: result.changedRatio, regions: result.regions }, { transfer: [diff] });
  } catch (error) {
    self.postMessage({ ok: false, error: error instanceof Error ? error.message : "Comparison failed" });
  }
};

export {};
