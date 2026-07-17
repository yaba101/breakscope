import Link from "next/link";
import { ArrowUpRight, Github, Laptop, ScanLine, Tablet } from "lucide-react";

export const deviceChoices = [
  { width: 375, label: "Phone", detail: "375px", icon: ScanLine },
  { width: 768, label: "Tablet", detail: "768px", icon: Tablet },
  { width: 1280, label: "Laptop", detail: "1280px", icon: Laptop },
  { width: 1440, label: "Wide", detail: "1440px", icon: Laptop },
] as const;

export function BreakscopeLogo({ href = "/" }: { href?: string }) {
  return <Link className="bk-logo" href={href} aria-label="Breakscope home"><i aria-hidden="true"><span /></i><b>Breakscope</b></Link>;
}

export function ProductHeader({ workspace = false }: { workspace?: boolean }) {
  return <header className={workspace ? "bk-header workspace" : "bk-header"}>
    <BreakscopeLogo />
    {!workspace && <nav aria-label="Main navigation"><a href="#product">Product</a><a href="#workflow">How it works</a><a href="#local">Local runner</a></nav>}
    <div className="bk-header-actions">
      {workspace ? <><span className="bk-agent"><i /> Local agent connected</span><Link className="bk-header-link" href="/">New test</Link></> : <><a className="bk-github" href="https://github.com" target="_blank" rel="noreferrer"><Github size={16} /> GitHub</a><Link className="bk-header-cta" href="#start">Start testing <ArrowUpRight size={15} /></Link></>}
    </div>
  </header>;
}
