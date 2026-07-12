import type { PixelRegion } from "@uirift/comparison-engine";

interface WorkerSuccess {
  ok: true;
  diff: ArrayBuffer;
  changedPixels: number;
  changedRatio: number;
  regions: PixelRegion[];
}

interface WorkerFailure { ok: false; error: string }

export async function createVisualDiff(baselineUrl: string, candidateUrl: string, threshold = 0.2) {
  const [baselineResponse, candidateResponse] = await Promise.all([fetch(baselineUrl), fetch(candidateUrl)]);
  if (!baselineResponse.ok || !candidateResponse.ok) throw new Error("Unable to download captured images");
  const [baseline, candidate] = await Promise.all([baselineResponse.arrayBuffer(), candidateResponse.arrayBuffer()]);
  const worker = new Worker(new URL("../workers/diff.worker.ts", import.meta.url));
  return await new Promise<WorkerSuccess>((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<WorkerSuccess | WorkerFailure>) => {
      worker.terminate();
      if (event.data.ok) resolve(event.data);
      else reject(new Error(event.data.error));
    };
    worker.onerror = (event) => { worker.terminate(); reject(new Error(event.message)); };
    worker.postMessage({ baseline, candidate, threshold }, [baseline, candidate]);
  });
}

export async function uploadVisualDiff(runId: string, result: WorkerSuccess) {
  const form = new FormData();
  form.set("diff", new Blob([result.diff], { type: "image/png" }), "diff.png");
  form.set("metrics", JSON.stringify({ changedPixels: result.changedPixels, changedRatio: result.changedRatio, regions: result.regions }));
  const response = await fetch(`/api/runs/${runId}/diff`, { method: "POST", body: form });
  if (!response.ok) throw new Error("Unable to save comparison result");
  return response.json();
}
