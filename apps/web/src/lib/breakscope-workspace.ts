import type { BrowserEngine, ResponsiveIssue, TestTarget, ViewportSample } from "@breakscope/shared";

const databaseName = "breakscope-local-workspace";
const storeName = "workspace";
const stateKey = "current";

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
  updatedAt: number;
}

export interface BreakscopeState {
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
    const request = indexedDB.open(databaseName, 2);
    request.onupgradeneeded = () => {
      if (request.result.objectStoreNames.contains(storeName)) request.result.deleteObjectStore(storeName);
      request.result.createObjectStore(storeName);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadBreakscopeState(): Promise<BreakscopeState> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).get(stateKey);
    request.onsuccess = () => resolve(request.result ?? { latestIssues: [], updatedAt: 0 });
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

export async function saveBreakscopeState(state: BreakscopeState) {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(state, stateKey);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export async function clearBreakscopeState() {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).delete(stateKey);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}
