"use client";

import { ArrowRight, Clock3, Info, LoaderCircle, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import type { BrowserEngine } from "@breakscope/shared";
import { isCaptureUrl } from "@breakscope/validation";
import { discoverRoutesLocally } from "@/lib/local-capture";
import { breakscopeQueryKeys } from "@/lib/breakscope-queries";
import { loadBreakscopeState, saveBreakscopeState, type BreakscopeState } from "@/lib/breakscope-workspace";
import { BreakscopeLogo } from "./breakscope-brand";

const defaultDeviceWidths = [375, 768, 1280, 1440];

export function BreakscopeLanding() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");
  const [recentTargets, setRecentTargets] = useState<Array<{ url: string; lastUsedAt: number }>>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [error, setError] = useState("");
  const matchingTargets = useMemo(() => {
    const query = url.trim().toLowerCase();
    return query ? recentTargets.filter((target) => target.url.toLowerCase().includes(query)) : recentTargets;
  }, [recentTargets, url]);

  useEffect(() => {
    let active = true;
    void loadBreakscopeState().then((state) => {
      if (!active) return;
      const restored = state.recentTargets ?? (state.target?.url ? [{ url: state.target.url, lastUsedAt: state.target.updatedAt }] : []);
      setRecentTargets(restored.slice(0, 6));
    }).catch(() => undefined).finally(() => { if (active) setHydrated(true); });
    return () => { active = false; };
  }, []);

  async function updateHistory(nextTargets: Array<{ url: string; lastUsedAt: number }>) {
    setRecentTargets(nextTargets);
    const previous = queryClient.getQueryData<BreakscopeState>(breakscopeQueryKeys.workspace()) ?? await loadBreakscopeState();
    const nextState = { ...previous, recentTargets: nextTargets, updatedAt: Date.now() };
    queryClient.setQueryData(breakscopeQueryKeys.workspace(), nextState);
    await saveBreakscopeState(nextState);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = url.trim();
    if (!isCaptureUrl(value)) {
      setError("Enter a localhost URL or a public HTTPS preview URL.");
      return;
    }
    setDiscovering(true);
    setError("");
    try {
      const response = await discoverRoutesLocally({ url: value });
      const routes = response.routes.slice(0, 10);
      if (!routes.length) throw new Error("No same-origin HTML routes were found on this page.");
      const previous = await loadBreakscopeState();
      const now = Date.now();
      const nextRecentTargets = [{ url: value, lastUsedAt: now }, ...(previous.recentTargets ?? []).filter((target) => target.url !== value)].slice(0, 6);
      const nextState = {
        ...previous,
        availableRoutes: routes,
        recentTargets: nextRecentTargets,
        draft: { url: value, routes, deviceWidths: defaultDeviceWidths, browserEngines: ["chromium", "firefox", "webkit"] as BrowserEngine[], profile: "responsive" as const, discoveredAt: now },
        updatedAt: now,
      };
      await saveBreakscopeState(nextState);
      queryClient.setQueryData(breakscopeQueryKeys.workspace(), nextState);
      router.push("/setup");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not discover routes.");
    } finally {
      setDiscovering(false);
    }
  }

  return (
    <main id="main-content" className="bk-home">
      <header className="bk-home-header"><BreakscopeLogo /><nav aria-label="Main navigation"><Link href="/about"><Info size={16} /> About</Link><Link href="/history"><Clock3 size={16} /> Scan history</Link></nav></header>
      <section className="bk-home-hero" aria-labelledby="bk-home-title">
        <div className="bk-home-art" aria-hidden="true"><span /></div>
        <div className="bk-home-copy">
          <h1 id="bk-home-title" aria-label="Find exactly where your interface breaks."><span>Find exactly where</span><span>your interface <em>breaks.</em></span></h1>
          <p>Paste a URL. Breakscope sweeps every width and returns the responsive failures worth fixing.</p>
          <form className="bk-home-form" onSubmit={(event) => void submit(event)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setSuggestionsOpen(false); }} noValidate>
            <div className="bk-home-search">
              <Search size={18} aria-hidden="true" />
              <label className="sr-only" htmlFor="breakscope-url">Page URL</label>
              <input
                id="breakscope-url"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={suggestionsOpen && matchingTargets.length > 0}
                aria-controls="breakscope-url-suggestions"
                value={url}
                disabled={!hydrated || discovering}
                onFocus={() => setSuggestionsOpen(true)}
                onChange={(event) => { setUrl(event.target.value); setError(""); setSuggestionsOpen(true); }}
                placeholder="Paste a localhost or HTTPS URL"
                inputMode="url"
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />
              {url && <button type="button" className="bk-home-clear-input" aria-label="Clear URL" onClick={() => { setUrl(""); setError(""); setSuggestionsOpen(true); }}><X size={17} /></button>}
              {suggestionsOpen && matchingTargets.length > 0 && <div id="breakscope-url-suggestions" className="bk-home-suggestions" role="listbox" aria-label="Previously tested URLs">
                <header><span>Previously tested</span><button type="button" onClick={() => void updateHistory([])}><Trash2 size={14} /> Clear history</button></header>
                <div>{matchingTargets.map((target) => <div key={target.url} className="bk-home-suggestion">
                  <button type="button" role="option" aria-selected={url === target.url} onClick={() => { setUrl(target.url); setError(""); setSuggestionsOpen(false); }}><Clock3 size={16} /><span><b>{new URL(target.url).host}</b><small>{target.url}</small></span></button>
                  <button type="button" aria-label={`Remove ${target.url} from history`} onClick={() => void updateHistory(recentTargets.filter((item) => item.url !== target.url))}><X size={15} /></button>
                </div>)}</div>
              </div>}
            </div>
            <button type="submit" disabled={!hydrated || discovering}>
              {discovering ? <LoaderCircle className="spin" size={18} /> : <ArrowRight size={18} />}
              <span>{discovering ? "Finding routes..." : "Find breaking points"}</span>
            </button>
          </form>
          <div className="bk-home-error" aria-live="polite">{error && <p role="alert">{error}</p>}</div>
        </div>
      </section>
    </main>
  );
}
