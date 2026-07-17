import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="breakscope-shell bk-workspace-page">
      <div className="bk-workspace-empty">
        <h2>Page not found</h2>
        <p>The page you are looking for does not exist or has been moved.</p>
        <Link href="/">Go to Breakscope</Link>
      </div>
    </main>
  );
}
