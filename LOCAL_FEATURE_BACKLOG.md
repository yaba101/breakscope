# Local-only feature backlog

Breakscope is a local responsive-testing lab. This backlog deliberately excludes deployment, accounts, cloud sync, sharing, and collaboration features.

## Next branch

Create `feat/local-review-workflow` from `main` for the next implementation cycle.

## Priority scope

1. **Project profiles**
   - Save named local test configurations: URL, selected routes, checkpoints, devices, and browsers.
   - Let a user duplicate, rename, select, and delete profiles from the local workspace.

2. **Local scan history**
   - Persist recent runs locally with their timestamp, configuration summary, issue count, and captured evidence metadata.
   - Reopen a run without running a new scan, or compare it with the current scan.

3. **Retest selected checkpoint**
   - Rerun only the current route, browser, and checkpoint from an issue or passed viewport.
   - Keep the existing run visible until the targeted retest completes, then show the result change.

## Follow-up scope

- Issue lifecycle: mark fixed locally, ignore/suppress with a reason, then restore suppressed findings.
- Element inspection: focus the exact affected element, show nearby DOM context, and copy a stable selector.
- Local export: copy or save a Markdown/JSON report with screenshots and selected findings.
- Capture controls: choose exact browser/device/checkpoint combinations and quickly test the current checkpoint only.
- Runtime diagnostics: retain memory and capture metrics across scans, warn on excessive evidence, and clear all local data.
- Review ergonomics: keyboard shortcuts for issues/checkpoints, overlay visibility, and canvas zoom reset.

## Definition of done for the next branch

- Everything persists only on the local machine.
- A user can save a profile, run it, reopen a prior run, and retest one selected checkpoint.
- Partial or failed local captures remain understandable and retryable.
- Tests cover persistence, reopening history, and targeted retest behavior.
