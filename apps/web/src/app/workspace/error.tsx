"use client";

import { AlertTriangle } from "lucide-react";

export default function WorkspaceError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main id="main-content" className="breakscope-shell bk-workspace-page">
      <div className="bk-workspace-empty">
        <AlertTriangle size={36} />
        <h2>Something went wrong</h2>
        <p>{error.message || "An unexpected error occurred."}</p>
        <button type="button" onClick={reset}>Try again</button>
      </div>
    </main>
  );
}
