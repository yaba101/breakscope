# Local-only feature roadmap

Breakscope is a local responsive-testing lab. This roadmap excludes deployment, accounts, cloud sync, sharing, and collaboration.

## Current branch

Implementation continues on `codex/local-review-workflow`. Every feature is verified, committed, and pushed independently.

## Completed foundation

- Named local test presets with rename, duplicate, and delete.
- Dedicated local scan history with reopen and delete.
- Targeted checkpoint retesting.
- Full-page checkpoint evidence and device-shell scrolling.
- Stable selector and DOM-context inspection.
- Markdown, JSON, and self-contained HTML exports.
- Persistent local runtime diagnostics.
- Keyboard navigation and a shortcut reference.

## Detection expansion sequence

1. **Complete issue inventory**
   - Present every deterministic finding instead of limiting the review UI to the top three.
   - Add issue-family counts and severity/type filtering without losing prioritized ordering.

2. **Axe-powered accessibility audit**
   - Run axe-core in each captured route/browser/checkpoint.
   - Preserve rule, impact, WCAG tags, help URL, affected nodes, selectors, and remediation summary.
   - Merge identical violations across checkpoints and highlight individual affected elements.

3. **Interaction-state coverage**
   - Discover safe, reversible controls such as native details, tabs, and menu/dialog triggers.
   - Capture named interaction states without submitting forms or following navigation.
   - Label findings with the state required to reproduce them.

4. **Visual run comparison**
   - Compare matching screenshots from two local runs.
   - Report changed-pixel ratio and provide current/previous/difference evidence.
   - Keep this analysis on the dedicated History page.

5. **Performance diagnostics**
   - Record navigation timing, layout shifts, resource counts/bytes, and large-resource evidence.
   - Distinguish actionable warnings from informational metrics.

6. **Source-location hints**
   - Collect framework/debug source metadata when the inspected page exposes it.
   - Fall back to stable DOM selectors when source metadata is unavailable.
   - Never claim an exact source file without direct runtime evidence.

## Definition of done

- All data remains on the local machine.
- New detectors expose deterministic evidence and clear limitations.
- Findings remain traceable to route, browser, checkpoint, state, and target element.
- Existing responsive scans continue working when optional audit metadata is unavailable.
- Typecheck, tests, and production build pass before the sequence is merged.
