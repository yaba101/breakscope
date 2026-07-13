import type { AiAnalysis, ChangedRegion, Decision, PageSnapshot, RunStatus, SemanticFinding, SemanticSummary, ViewportId } from "@uirift/shared";

const databaseName = "uirift-local-workspace";
const databaseVersion = 1;
const changedEvent = "uirift:workspace-changed";

export interface LocalProject {
  id: string;
  name: string;
  baselineUrl: string;
  candidateUrl: string;
  createdAt: number;
  updatedAt: number;
}

export interface LocalRun {
  id: string;
  projectId: string;
  projectName: string;
  routePath: string;
  batchId?: string;
  batchIndex?: number;
  batchTotal?: number;
  viewport: ViewportId;
  status: RunStatus;
  decision: Decision;
  changedPixels: number;
  changedRatio: number;
  regions: ChangedRegion[];
  baselineImage?: ArrayBuffer;
  candidateImage?: ArrayBuffer;
  diffImage?: ArrayBuffer;
  baselineSnapshot?: PageSnapshot;
  candidateSnapshot?: PageSnapshot;
  semanticFindings?: SemanticFinding[];
  semanticSummary?: SemanticSummary;
  aiAnalysis?: AiAnalysis;
  aiAnalysisError?: string;
  events?: CaptureEvent[];
  baselineDurationMs?: number;
  candidateDurationMs?: number;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

export interface CaptureEvent {
  id: string;
  time: number;
  stage: "system" | "baseline" | "candidate" | "diff";
  status: "running" | "success" | "error";
  label: string;
  detail: string;
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("projects")) {
        database.createObjectStore("projects", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("runs")) {
        const runs = database.createObjectStore("runs", { keyPath: "id" });
        runs.createIndex("projectId", "projectId");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open local workspace"));
  });
}

async function readAll<T>(storeName: "projects" | "runs") {
  const database = await openDatabase();
  return new Promise<T[]>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

async function readOne<T>(storeName: "projects" | "runs", id: string) {
  const database = await openDatabase();
  return new Promise<T | undefined>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).get(id);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

async function writeOne<T>(storeName: "projects" | "runs", value: T) {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(value);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
  window.dispatchEvent(new Event(changedEvent));
}

export async function listLocalProjects() {
  const projects = await readAll<LocalProject>("projects");
  return projects.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getLocalProject(id: string) {
  return readOne<LocalProject>("projects", id);
}

export async function createLocalProject(input: Pick<LocalProject, "name" | "baselineUrl" | "candidateUrl">) {
  const projects = await listLocalProjects();
  if (projects.length >= 2) throw new Error("This local workspace supports up to two projects");
  const now = Date.now();
  const project: LocalProject = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  await writeOne("projects", project);
  return project;
}

export async function listLocalRuns() {
  const runs = await readAll<LocalRun>("runs");
  return runs.sort((a, b) => b.createdAt - a.createdAt);
}

export function getLocalRun(id: string) {
  return readOne<LocalRun>("runs", id);
}

export async function createLocalRun(
  project: LocalProject,
  routePath: string,
  viewport: ViewportId,
  batch?: { id: string; index: number; total: number },
) {
  const run: LocalRun = {
    id: crypto.randomUUID(),
    projectId: project.id,
    projectName: project.name,
    routePath,
    batchId: batch?.id,
    batchIndex: batch?.index,
    batchTotal: batch?.total,
    viewport,
    status: "queued",
    decision: "pending",
    changedPixels: 0,
    changedRatio: 0,
    regions: [],
    events: [],
    createdAt: Date.now(),
  };
  await writeOne("runs", run);
  return run;
}

export async function updateLocalRun(id: string, patch: Partial<LocalRun>) {
  const current = await getLocalRun(id);
  if (!current) throw new Error("Comparison run was not found on this device");
  const next = { ...current, ...patch, id: current.id };
  await writeOne("runs", next);
  return next;
}

export function subscribeToWorkspace(callback: () => void) {
  window.addEventListener(changedEvent, callback);
  return () => window.removeEventListener(changedEvent, callback);
}

export async function clearLocalWorkspace() {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(["projects", "runs"], "readwrite");
    transaction.objectStore("projects").clear();
    transaction.objectStore("runs").clear();
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
  window.dispatchEvent(new Event(changedEvent));
}
