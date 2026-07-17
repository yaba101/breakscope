"use client";

import { ArrowRight, Check, Globe2, LoaderCircle, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { BrowserEngine, TestTarget } from "@breakscope/shared";
import { isCaptureUrl } from "@breakscope/validation";
import { discoverRoutesLocally } from "@/lib/local-capture";
import { breakscopeQueryKeys } from "@/lib/breakscope-queries";
import { loadBreakscopeState, saveBreakscopeState } from "@/lib/breakscope-workspace";
import { BreakscopeLogo, deviceChoices } from "./breakscope-brand";

const allBrowserEngines: BrowserEngine[] = ["chromium", "firefox", "webkit"];

export function BreakscopeSetup() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [routes, setRoutes] = useState<string[]>([]);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  const [deviceWidths, setDeviceWidths] = useState<number[]>([]);
  const [browserEngines, setBrowserEngines] = useState<BrowserEngine[]>(allBrowserEngines);
  const [ready, setReady] = useState(false);
  const [opening, setOpening] = useState(false);
  const [rediscovering, setRediscovering] = useState(false);
  const [urlError, setUrlError] = useState("");
  const selectedSet = useMemo(() => new Set(selectedRoutes), [selectedRoutes]);

  useEffect(() => {
    let active = true;
    void loadBreakscopeState().then((state) => {
      if (!active) return;
      if (!state.draft) {
        router.replace("/");
        return;
      }
      setUrl(state.draft.url);
      setUrlInput(state.draft.url);
      setRoutes(state.draft.routes);
      setDeviceWidths(state.draft.deviceWidths);
      setBrowserEngines(state.draft.browserEngines?.length ? state.draft.browserEngines : state.target?.browserEngines?.length ? state.target.browserEngines : allBrowserEngines);
      setSelectedRoutes(state.draft.routes.includes("/") ? ["/"] : state.draft.routes.slice(0, 1));
      setReady(true);
    }).catch(() => router.replace("/"));
    return () => { active = false; };
  }, [router]);

  function toggleRoute(route: string) {
    setSelectedRoutes((current) => current.includes(route)
      ? current.length > 1 ? current.filter((item) => item !== route) : current
      : current.length < 5 ? [...current, route] : current);
  }

  function toggleDevice(width: number) {
    setDeviceWidths((current) => current.includes(width)
      ? current.length > 1 ? current.filter((item) => item !== width) : current
      : [...current, width].sort((a, b) => a - b));
  }

  function toggleBrowser(engine: BrowserEngine) {
    setBrowserEngines((current) => current.includes(engine)
      ? current.length > 1 ? current.filter((item) => item !== engine) : current
      : [...current, engine]);
  }

  async function updateTarget(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = urlInput.trim();
    if (!isCaptureUrl(value)) {
      setUrlError("Enter a localhost URL or a public HTTPS preview URL.");
      return;
    }
    setRediscovering(true);
    setUrlError("");
    try {
      const response = await discoverRoutesLocally({ url: value });
      const discoveredRoutes = response.routes.slice(0, 10);
      if (!discoveredRoutes.length) throw new Error("No same-origin HTML routes were found on this page.");
      const previous = await loadBreakscopeState();
      const now = Date.now();
      await saveBreakscopeState({
        ...previous,
        availableRoutes: discoveredRoutes,
        draft: { url: value, routes: discoveredRoutes, deviceWidths, browserEngines, discoveredAt: now },
        updatedAt: now,
      });
      setUrl(value);
      setUrlInput(value);
      setRoutes(discoveredRoutes);
      setSelectedRoutes((current) => {
        const available = current.filter((route) => discoveredRoutes.includes(route)).slice(0, 5);
        return available.length ? available : discoveredRoutes.includes("/") ? ["/"] : discoveredRoutes.slice(0, 1);
      });
    } catch (reason) {
      setUrlError(reason instanceof Error ? reason.message : "Could not discover routes.");
    } finally {
      setRediscovering(false);
    }
  }

  async function openWorkspace() {
    if (!selectedRoutes.length || !deviceWidths.length || !url) return;
    setOpening(true);
    const previous = await loadBreakscopeState();
    const now = Date.now();
    const target: TestTarget = {
      id: "current",
      name: new URL(url).host,
      url,
      selectedRoutes,
      minWidth: Math.min(320, ...deviceWidths),
      maxWidth: Math.max(...deviceWidths),
      executionMode: "local",
      deviceWidths,
      browserEngines,
      createdAt: previous.target?.url === url ? previous.target.createdAt : now,
      updatedAt: now,
    };
    const nextState = {
      ...previous,
      availableRoutes: routes,
      draft: undefined,
      target,
      scanRequest: { id: crypto.randomUUID(), requestedAt: now, source: "setup" },
      updatedAt: now,
    } as const;
    await saveBreakscopeState(nextState);
    queryClient.setQueryData(breakscopeQueryKeys.workspace(), nextState);
    router.push("/workspace");
  }

  if (!ready) return <main id="main-content" className="bk-setup-page"><div className="bk-setup-loading"><LoaderCircle className="spin" size={22} /><span>Preparing your test...</span></div></main>;

  return (
    <main id="main-content" className="bk-setup-page">
      <header className="bk-setup-header">
        <BreakscopeLogo />
        <form className="bk-setup-target" onSubmit={(event) => void updateTarget(event)} noValidate>
          <Globe2 size={16} aria-hidden="true" />
          <label className="sr-only" htmlFor="setup-target-url">Test target URL</label>
          <input id="setup-target-url" value={urlInput} onChange={(event) => setUrlInput(event.target.value)} disabled={rediscovering} aria-invalid={Boolean(urlError)} inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck="false" />
          <button type="submit" disabled={rediscovering || !urlInput.trim()}>{rediscovering ? <LoaderCircle className="spin" size={15} /> : <RefreshCw size={15} />}<span>{rediscovering ? "Finding routes" : "Refresh routes"}</span></button>
          {urlError && <span className="bk-setup-url-error" role="alert">{urlError}</span>}
        </form>
      </header>
      <section className="bk-setup-shell">
        <header className="bk-setup-intro">
          <div>
            <h1>Configure your test</h1>
            <p>Choose the pages and screen sizes Breakscope should inspect.</p>
          </div>
          <div className="bk-setup-selection-summary" aria-label="Current selection">
            <span><b>{selectedRoutes.length}</b> {selectedRoutes.length === 1 ? "route" : "routes"}</span>
            <i aria-hidden="true" />
            <span><b>{deviceWidths.length}</b> viewports</span>
            <i aria-hidden="true" />
            <span><b>{browserEngines.length}</b> browsers</span>
          </div>
        </header>

        <div className="bk-setup-options">
          <section className="bk-setup-panel bk-setup-routes-panel" aria-labelledby="setup-routes-title">
            <div className="bk-setup-section-heading">
              <div><h2 id="setup-routes-title">Pages to inspect</h2><p>Select up to five discovered routes.</p></div>
              <span>{selectedRoutes.length} / 5</span>
            </div>
            <div className="bk-setup-routes">{routes.map((route) => (
              <button type="button" key={route} aria-pressed={selectedSet.has(route)} onClick={() => toggleRoute(route)}>
                <i>{selectedSet.has(route) && <Check size={13} />}</i><span>{route}</span>
              </button>
            ))}</div>
          </section>

          <section className="bk-setup-panel bk-setup-viewports-panel" aria-labelledby="setup-viewports-title">
            <div className="bk-setup-section-heading">
              <div><h2 id="setup-viewports-title">Viewport checkpoints</h2><p>Compare the same page across key responsive widths.</p></div>
            </div>
            <div className="bk-setup-devices">{deviceChoices.map(({ width, label, detail, icon: Icon }) => {
              const selected = deviceWidths.includes(width);
              return <button type="button" key={width} aria-pressed={selected} onClick={() => toggleDevice(width)}><Icon size={18} /><span><b>{label}</b><small>{detail}</small></span><i>{selected && <Check size={12} />}</i></button>;
            })}</div>
          </section>

          <section className="bk-setup-panel bk-setup-browsers-panel" aria-labelledby="setup-browsers-title">
            <div className="bk-setup-section-heading"><div><h2 id="setup-browsers-title">Browsers to test</h2><p>Choose the rendering engines for this run.</p></div></div>
            <div className="bk-setup-browsers" role="group" aria-label="Browsers to test">{allBrowserEngines.map((engine) => {
              const selected = browserEngines.includes(engine);
              const label = engine === "chromium" ? "Chrome" : engine === "firefox" ? "Firefox" : "Safari";
              const icon = engine === "chromium" ? "/icons/browsers/chrome.svg" : engine === "firefox" ? "/icons/browsers/firefox.svg" : "/icons/browsers/safari.svg";
              return <button type="button" key={engine} aria-pressed={selected} onClick={() => toggleBrowser(engine)}><Image src={icon} width={24} height={24} alt="" /><span><b>{label}</b><small>{engine === "chromium" ? "Chromium" : engine === "webkit" ? "WebKit" : "Gecko"}</small></span><i aria-hidden="true">{selected && <Check size={12} />}</i></button>;
            })}</div>
          </section>

          <footer className="bk-setup-action">
            <div><strong>Ready to inspect</strong><span>{selectedRoutes.length} {selectedRoutes.length === 1 ? "page" : "pages"} · {deviceWidths.length} viewports · {browserEngines.length} browsers</span></div>
            <button type="button" disabled={opening} onClick={() => void openWorkspace()}>{opening ? <LoaderCircle className="spin" size={18} /> : <ArrowRight size={18} />}{opening ? "Opening canvas..." : "Open testing canvas"}</button>
          </footer>
        </div>
      </section>
    </main>
  );
}
