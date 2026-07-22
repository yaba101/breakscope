import type { BrowserEngine, ResponsiveIssue, ScanStrategy, TestProfile, TestTarget, ViewportSample } from "@breakscope/shared";

const databaseName = "breakscope-local-workspace";
const storeName = "workspace";
const artifactStoreName = "artifacts";
const stateKey = "current";
const artifactMarker = "__breakscopeArtifact";
const artifactHashCache = new WeakMap<ArrayBuffer, string>();

export interface PersistedViewportPreview {
  width: number;
  label: string;
  image: ArrayBuffer;
  routePath: string;
  browserEngine?: BrowserEngine;
  deviceModelId?: string;
}

export interface PersistedScanJob {
  id: string;
  status: "queued" | "running" | "paused" | "cancelled" | "failed" | "completed";
  url: string;
  routes: string[];
  widths: number[];
  browserEngines: BrowserEngine[];
  testProfile?: TestProfile;
  scanStrategy?: ScanStrategy;
  completedCheckpoints: string[];
  completedRouteScans: string[];
  samples: ViewportSample[];
  errors: string[];
  createdAt: number;
  updatedAt: number;
}

export interface TestPreset {
  id: string;
  name: string;
  url: string;
  routes: string[];
  deviceWidths: number[];
  browserEngines: BrowserEngine[];
  profile?: TestProfile;
  updatedAt: number;
}

export type { TestProfile } from "@breakscope/shared";

export interface LocalScanRun {
  id: string;
  createdAt: number;
  target: TestTarget;
  issues: ResponsiveIssue[];
  previews: PersistedViewportPreview[];
  suppressedCount: number;
  profile?: TestProfile;
}

export interface RuntimeDiagnosticSample {
  id: string;
  capturedAt: number;
  retainedBytes: number;
  appHeapBytes: number;
  appRssBytes: number;
  captureHeapBytes: number;
  captureRssBytes: number;
  completedCaptures: number;
  browserLaunches?: number;
  peakActiveCaptures?: number;
}

export interface BreakscopeState {
  testProfile?: TestProfile;
  scanStrategy?: ScanStrategy;
  diagnosticsHistory?: RuntimeDiagnosticSample[];
  scanHistory?: LocalScanRun[];
  baselineRunId?: string;
  testPresets?: TestPreset[];
  recentTargets?: Array<{
    url: string;
    lastUsedAt: number;
  }>;
  scanRequest?: {
    id: string;
    requestedAt: number;
    source: "setup";
  };
  scanJob?: PersistedScanJob;
  availableRoutes?: string[];
  draft?: {
    url: string;
    routes: string[];
    deviceWidths: number[];
    browserEngines?: BrowserEngine[];
    profile?: TestProfile;
    scanStrategy?: ScanStrategy;
    discoveredAt: number;
  };
  target?: TestTarget;
  latestIssues: ResponsiveIssue[];
  latestManifest?: ResponsiveIssue[];
  latestPreviews?: PersistedViewportPreview[];
  ui?: {
    selectedDeviceModelId?: string;
    deviceOrientation?: "portrait" | "landscape";
    recentDeviceIds?: string[];
    pinnedDeviceIds?: string[];
    previewScaleMode?: "fit-device" | "fit-screen" | "actual" | "custom";
    previewZoom?: number;
    activeBrowserEngine?: BrowserEngine;
  };
  updatedAt: number;
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, 3);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) request.result.createObjectStore(storeName);
      if (!request.result.objectStoreNames.contains(artifactStoreName)) request.result.createObjectStore(artifactStoreName);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

interface ArtifactReference { [artifactMarker]: string }

function isArtifactReference(value: unknown): value is ArtifactReference {
  return Boolean(value && typeof value === "object" && artifactMarker in value && typeof (value as ArtifactReference)[artifactMarker] === "string");
}

async function artifactId(buffer: ArrayBuffer) {
  const cached = artifactHashCache.get(buffer);
  if (cached) return cached;
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", buffer));
  const id = Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
  artifactHashCache.set(buffer, id);
  return id;
}

async function externalizeArtifacts(value: unknown, artifacts: Map<string, ArrayBuffer>): Promise<unknown> {
  if (value instanceof ArrayBuffer) {
    const id = await artifactId(value);
    artifacts.set(id, value);
    return { [artifactMarker]: id };
  }
  if (isArtifactReference(value)) return value;
  if (Array.isArray(value)) return Promise.all(value.map((item) => externalizeArtifacts(item, artifacts)));
  if (value && typeof value === "object") {
    const entries = await Promise.all(Object.entries(value).map(async ([key, item]) => [key, await externalizeArtifacts(item, artifacts)] as const));
    return Object.fromEntries(entries);
  }
  return value;
}

function referencedArtifactIds(value: unknown, result = new Set<string>()) {
  if (isArtifactReference(value)) result.add(value[artifactMarker]);
  else if (Array.isArray(value)) value.forEach((item) => referencedArtifactIds(item, result));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => referencedArtifactIds(item, result));
  return result;
}

async function hydrateArtifacts(value: unknown, artifacts: Map<string, ArrayBuffer>): Promise<unknown> {
  if (isArtifactReference(value)) return artifacts.get(value[artifactMarker])?.slice(0) ?? new ArrayBuffer(0);
  if (Array.isArray(value)) return Promise.all(value.map((item) => hydrateArtifacts(item, artifacts)));
  if (value && typeof value === "object") {
    const entries = await Promise.all(Object.entries(value).map(async ([key, item]) => [key, await hydrateArtifacts(item, artifacts)] as const));
    return Object.fromEntries(entries);
  }
  return value;
}

async function readPersistedWorkspace(database: IDBDatabase) {
  return new Promise<unknown>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).get(stateKey);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readArtifacts(database: IDBDatabase) {
  if (!database.objectStoreNames.contains(artifactStoreName)) return new Map<string, ArrayBuffer>();
  return new Promise<Map<string, ArrayBuffer>>((resolve, reject) => {
    const transaction = database.transaction(artifactStoreName, "readonly");
    const store = transaction.objectStore(artifactStoreName);
    const keys = store.getAllKeys();
    const values = store.getAll();
    transaction.oncomplete = () => resolve(new Map(keys.result.map((key, index) => [String(key), values.result[index] as ArrayBuffer])));
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function loadBreakscopeState(): Promise<BreakscopeState> {
  const database = await openDatabase();
  const raw = await readPersistedWorkspace(database) as BreakscopeState | undefined;
  if (!raw) { database.close(); return { latestIssues: [], updatedAt: 0 }; }
  const artifacts = await readArtifacts(database);
  database.close();
  const { scanHistory, ...activeState } = raw;
  return { ...await hydrateArtifacts(activeState, artifacts) as Omit<BreakscopeState, "scanHistory">, scanHistory };
}

export async function loadScanRunArtifacts(runId: string): Promise<LocalScanRun | undefined> {
  const database = await openDatabase();
  const raw = await readPersistedWorkspace(database) as BreakscopeState | undefined;
  const run = raw?.scanHistory?.find((candidate) => candidate.id === runId);
  if (!run) { database.close(); return undefined; }
  const artifacts = await readArtifacts(database);
  database.close();
  return hydrateArtifacts(run, artifacts) as Promise<LocalScanRun>;
}

export async function saveBreakscopeState(state: BreakscopeState) {
  const artifacts = new Map<string, ArrayBuffer>();
  const persisted = await externalizeArtifacts(state, artifacts);
  const referenced = referencedArtifactIds(persisted);
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction([storeName, artifactStoreName], "readwrite");
    transaction.objectStore(storeName).put(persisted, stateKey);
    const artifactStore = transaction.objectStore(artifactStoreName);
    artifacts.forEach((buffer, id) => artifactStore.put(buffer, id));
    const keys = artifactStore.getAllKeys();
    keys.onsuccess = () => keys.result.forEach((key) => { if (!referenced.has(String(key))) artifactStore.delete(key); });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export async function clearBreakscopeState() {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction([storeName, artifactStoreName], "readwrite");
    transaction.objectStore(storeName).delete(stateKey);
    transaction.objectStore(artifactStoreName).clear();
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}
