"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowDownLeft, Code2, Database, Folder, Hand, Layers3, MousePointer2, Play, ScanSearch, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";
import { useComparisonTools } from "@/lib/comparison-tools";
import { listLocalRuns, subscribeToWorkspace } from "@/lib/local-workspace";

const nav = [
  { label: "Projects", href: "/app/projects", icon: Folder },
  { label: "Runs", href: "/app/runs", icon: Play },
  { label: "Compare", href: "/app/runs", icon: ScanSearch },
  { label: "Settings", href: "/app/settings", icon: Settings },
] as const;

function isComparisonPath(pathname: string) {
  return /^\/app\/runs\/[^/]+$/.test(pathname);
}

function GlobalToolbar({ breadcrumb = "Local workspace" }: { breadcrumb?: string }) {
  const comparing = isComparisonPath(usePathname());
  const { tool, regionsVisible, setTool, toggleRegions } = useComparisonTools();
  return (
    <header className="global-toolbar">
      <Link href="/" className="wordmark" aria-label="UIRift home">UI<span>RIFT</span></Link>
      <div className="toolbar-divider" />
      <div className="breadcrumb">{breadcrumb}</div>
      {comparing && (
        <div className="canvas-tools" aria-label="Canvas tools">
          <IconButton icon={MousePointer2} label="Select regions" active={tool === "select"} onClick={() => setTool("select")} />
          <IconButton icon={Hand} label="Pan canvas (Space)" active={tool === "pan"} onClick={() => setTool("pan")} />
          <IconButton icon={Layers3} label={regionsVisible ? "Hide regions" : "Show regions"} active={regionsVisible} onClick={toggleRegions} />
          <IconButton icon={Code2} label="Inspect pixels" active={tool === "inspect"} onClick={() => setTool("inspect")} />
        </div>
      )}
      <div className="toolbar-meta">
        <span className="branch"><Database size={13} /> Local workspace</span>
        <span className="capture-state"><i /> Stored on this device</span>
        <div className="avatar-stack" aria-label="Local guest workspace"><span>LG</span></div>
      </div>
    </header>
  );
}

function useNavigation() {
  const [compareHref, setCompareHref] = useState("/app/runs");
  useEffect(() => {
    const refresh = () => void listLocalRuns().then((runs) => {
      const latest = runs.find((run) => run.status === "ready" && run.baselineImage && run.candidateImage);
      setCompareHref(latest ? `/app/runs/${latest.id}` : "/app/runs");
    });
    refresh();
    return subscribeToWorkspace(refresh);
  }, []);
  return nav.map((item) => item.label === "Compare" ? { ...item, href: compareHref } : item);
}

function navigationActive(label: string, pathname: string) {
  if (label === "Projects") return pathname.startsWith("/app/projects");
  if (label === "Compare") return isComparisonPath(pathname);
  if (label === "Runs") return pathname === "/app/runs" || pathname.endsWith("/capture");
  return pathname.startsWith("/app/settings");
}

function Navigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const items = useNavigation();
  if (mobile) {
    return <nav className="mobile-nav" aria-label="Mobile navigation">{items.map((item) => <Link key={item.label} href={item.href}><item.icon size={18} /><span>{item.label}</span></Link>)}</nav>;
  }
  return (
    <nav className="tool-rail" aria-label="Product navigation">
      {items.map((item) => <Link key={item.label} href={item.href} className={cn("rail-link", navigationActive(item.label, pathname) && "active")}><item.icon size={19} strokeWidth={1.55} aria-hidden="true" /><span>{item.label}</span></Link>)}
      <button type="button" className="rail-collapse" aria-label="Collapse navigation"><ArrowDownLeft size={15} /></button>
    </nav>
  );
}

export function AppShell({ children, breadcrumb }: { children: React.ReactNode; breadcrumb?: string; dock?: boolean }) {
  return (
    <div className="app-root">
      <GlobalToolbar breadcrumb={breadcrumb} />
      <Navigation />
      <main id="main-content" className="app-main without-dock">{children}</main>
      <Navigation mobile />
    </div>
  );
}
