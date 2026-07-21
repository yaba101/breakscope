import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, HardDrive, LockKeyhole } from "lucide-react";
import { BreakscopeLogo } from "@/components/breakscope-brand";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "About",
  description: "Why Breakscope exists, how the local-only version works, and what is coming next.",
};

export default function AboutPage() {
  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.header}>
        <BreakscopeLogo />
        <nav aria-label="About navigation">
          <Link href="/"><ArrowLeft size={15} /> Back to Breakscope</Link>
        </nav>
      </header>

      <article className={styles.shell}>
        <header className={styles.intro}>
          <p>Why I built Breakscope</p>
          <h1>Responsive bugs should be easier to find than they are to miss.</h1>
          <div>
            <p>Breakscope started from a familiar frustration: a page can look finished at the widths you check and still break somewhere in between. Finding that exact point usually means resizing a browser by hand, repeating the same checks, and hoping you notice the failure.</p>
            <p>I built Breakscope to make that work more deliberate. It scans a page across viewport widths, keeps the evidence together, and helps you focus on the responsive failures that are actually worth fixing.</p>
          </div>
        </header>

        <section className={styles.storySection} aria-labelledby="local-title">
          <div className={styles.sectionHeading}>
            <span><HardDrive size={18} /> This version</span>
            <h2 id="local-title">Local by design, for now.</h2>
          </div>
          <div className={styles.sectionCopy}>
            <p>The current version runs locally on your machine. Your scan history and workspace state stay in your browser, and the local capture service does the work needed to inspect your pages.</p>
            <p>That makes this release useful for testing localhost projects and private work without first creating an account or sending a project into a hosted workspace.</p>
            <ul>
              <li><Check size={15} /> No account required</li>
              <li><Check size={15} /> Local scan history</li>
              <li><Check size={15} /> Built for localhost and preview URLs</li>
            </ul>
            <aside><LockKeyhole size={19} /><p><strong>A clear boundary:</strong> “Local-only” describes this version of the product. If a feature needs an external service, the interface should make that clear before anything leaves your machine.</p></aside>
          </div>
        </section>

        <section className={styles.storySection} aria-labelledby="next-title">
          <div className={styles.sectionHeading}>
            <span>What I’m working toward</span>
            <h2 id="next-title">A full workspace for ongoing responsive quality.</h2>
          </div>
          <div className={styles.sectionCopy}>
            <p>I’m working on a fully deployed version with accounts and persistent projects. The goal is to make Breakscope useful beyond a single local scan: save work across devices, collaborate on findings, track changes over time, and share reliable evidence with a team.</p>
            <p>Those features are still in development. The local version is the working product today, and it is helping shape what the hosted version needs to become.</p>
          </div>
        </section>

        <footer className={styles.cta}>
          <div><span>Available now</span><h2>Run a local scan and see where your interface breaks.</h2></div>
          <Link href="/">Try Breakscope <ArrowRight size={16} /></Link>
        </footer>
      </article>
    </main>
  );
}
