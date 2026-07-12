"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowDownLeft,
  Check,
  ChevronDown,
  Code2,
  Folder,
  GitBranch,
  Hand,
  History,
  Layers3,
  MousePointer2,
  Play,
  ScanSearch,
  Settings,
  Share2,
} from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";

const nav = [
  { label: "Projects", href: "/app/projects", icon: Folder },
  { label: "Runs", href: "/app/runs", icon: Play },
  { label: "Compare", href: "/app/runs/1247", icon: ScanSearch },
  { label: "Settings", href: "/app/settings", icon: Settings },
] as const;

function GlobalToolbar({
  breadcrumb = "Acme Cloud / Run #1247 / Pricing",
}: {
  breadcrumb?: string;
}) {
  return (
    <header className="global-toolbar">
      <Link href="/" className="wordmark" aria-label="UIRift home">
        UI<span>RIFT</span>
      </Link>
      <div className="toolbar-divider" />
      <div className="breadcrumb">{breadcrumb}</div>
      <div className="canvas-tools" aria-label="Canvas tools">
        <IconButton icon={MousePointer2} label="Select" active />
        <IconButton icon={Hand} label="Pan (Space)" />
        <IconButton icon={Layers3} label="Regions" />
        <IconButton icon={Code2} label="Inspect source" />
      </div>
      <div className="toolbar-meta">
        <span className="branch">
          <GitBranch size={13} /> feat/pricing-refresh <ChevronDown size={12} />
        </span>
        <span className="capture-state">
          <i /> Capture complete
        </span>
        <button type="button" className="share-control">
          <Share2 size={13} /> Share
        </button>
        <div className="avatar-stack" aria-label="Signed in as Yeabsira">
          <span>YM</span>
        </div>
      </div>
    </header>
  );
}

function ToolRail() {
  const pathname = usePathname();
  return (
    <nav className="tool-rail" aria-label="Product navigation">
      {nav.map((item) => {
        const Icon = item.icon;
        const active = pathname.startsWith(
          item.href.split("/1247")[0] ?? item.href,
        );
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn("rail-link", active && "active")}
          >
            <Icon size={19} strokeWidth={1.55} aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        className="rail-collapse"
        aria-label="Collapse navigation"
      >
        <ArrowDownLeft size={15} />
      </button>
    </nav>
  );
}

export function CaptureDock({ compact = true }: { compact?: boolean }) {
  return (
    <section
      className={cn("capture-dock", !compact && "expanded")}
      aria-label="Capture log"
    >
      <div className="capture-title">
        <History size={14} /> CAPTURE LOG <ChevronDown size={13} />
      </div>
      <div className="capture-steps">
        {[
          ["10:14:02", "Navigate", "/pricing"],
          ["10:14:05", "Fonts ready", "12 fonts loaded"],
          ["10:14:07", "Captured", "1440×900"],
          ["10:14:10", "Compared", "3 regions"],
        ].map(([time, label, detail], index) => (
          <div className="capture-step" key={label}>
            <span className="step-check">
              <Check size={11} />
            </span>
            <span>
              <small>{time}</small>
              <b>{label}</b>
              <small>{detail}</small>
            </span>
            {index < 3 && <i />}
          </div>
        ))}
      </div>
    </section>
  );
}

export function AppShell({
  children,
  breadcrumb,
  dock = true,
}: {
  children: React.ReactNode;
  breadcrumb?: string;
  dock?: boolean;
}) {
  return (
    <div className="app-root">
      <GlobalToolbar breadcrumb={breadcrumb} />
      <ToolRail />
      <main
        id="main-content"
        className={cn("app-main", !dock && "without-dock")}
      >
        {children}
      </main>
      {dock && <CaptureDock />}
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {nav.map((item) => (
          <Link key={item.label} href={item.href}>
            <item.icon size={18} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
