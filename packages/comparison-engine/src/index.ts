import pixelmatch from "pixelmatch";

export interface PixelRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  pixelCount: number;
}

export interface ComparisonResult {
  changedPixels: number;
  changedRatio: number;
  diff: Uint8ClampedArray;
  regions: PixelRegion[];
}

function groupRegions(mask: Uint8Array, width: number, height: number): PixelRegion[] {
  const visited = new Uint8Array(mask.length);
  const regions: PixelRegion[] = [];
  const stack: number[] = [];

  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || visited[start]) continue;
    stack.push(start);
    visited[start] = 1;
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;
    let pixelCount = 0;

    while (stack.length) {
      const current = stack.pop();
      if (current === undefined) break;
      const x = current % width;
      const y = Math.floor(current / width);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      pixelCount += 1;
      const neighbors = [current - 1, current + 1, current - width, current + width];
      for (const next of neighbors) {
        if (next < 0 || next >= mask.length || visited[next] || !mask[next]) continue;
        const nextX = next % width;
        if (Math.abs(nextX - x) > 1) continue;
        visited[next] = 1;
        stack.push(next);
      }
    }

    if (pixelCount >= 9) {
      regions.push({ x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1, pixelCount });
    }
  }

  return regions.sort((a, b) => b.pixelCount - a.pixelCount).slice(0, 20);
}

export function compareRgba(
  baseline: Uint8ClampedArray,
  candidate: Uint8ClampedArray,
  width: number,
  height: number,
  threshold = 0.2,
): ComparisonResult {
  if (baseline.length !== candidate.length || baseline.length !== width * height * 4) {
    throw new Error("Images must have identical RGBA dimensions");
  }
  const diff = new Uint8ClampedArray(baseline.length);
  const changedPixels = pixelmatch(baseline, candidate, diff, width, height, { threshold, includeAA: false });
  const mask = new Uint8Array(width * height);
  for (let pixel = 0; pixel < mask.length; pixel += 1) {
    const offset = pixel * 4;
    if ((diff[offset] ?? 0) > 200 && (diff[offset + 1] ?? 0) < 100) mask[pixel] = 1;
  }
  return {
    changedPixels,
    changedRatio: changedPixels / (width * height),
    diff,
    regions: groupRegions(mask, width, height),
  };
}
