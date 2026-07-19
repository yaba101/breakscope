# Breakscope product direction

Breakscope is a local responsive debugging workbench. It should help one developer understand a page across widths and browsers without requiring deployment, accounts, collaboration, or hosted infrastructure.

## Primary workflow

The product is divided into three explicit modes:

1. **Explore** — inspect captured viewports together, keep their scroll positions synchronized, and focus any viewport for closer inspection.
2. **Audit** — run deterministic responsive, accessibility, and performance checks, then inspect evidence for each finding.
3. **Changes** — review the current run against a user-approved local baseline and understand what visually changed.

Explore is the default review surface once checkpoint captures exist. An audit is an intentional action, not a loading gate before the user can see the page.

## Current implementation sequence

- [x] Explicit Explore, Audit, and Changes navigation in the workspace.
- [x] Multi-viewport Explore overview using the selected browser's captured checkpoints.
- [x] Optional proportional scroll synchronization across Explore viewports.
- [x] Focus action from the overview into the existing device evidence view.
- [x] User-selected local baseline in scan history.
- [x] Current-versus-baseline visual comparison rather than implicit adjacent-run comparison.

## Signal quality

- [x] Viewport badges count responsive blocker families rather than every affected element.
- [x] Accessibility, usability, and performance checks are separated from responsive status.
- [x] Findings use explicit Responsive, Accessibility, Usability, and Performance views instead of one mixed inventory.
- [x] Accepted local baselines classify findings as new, regressed, existing, or fixed.
- [x] Priority review presents important finding families one at a time.
- [x] Test profiles keep Responsive Essentials focused while broader audits remain opt-in.
- [x] Site-quality findings are consolidated by rule and progressively disclosed.
- [x] Touch-target checks use the WCAG minimum target size and exclude inline text links.

## Next sequence

- Capture stabilization: wait for selector, delay, animation freezing, and hidden/masked selectors.
- Local authenticated capture through reusable Playwright storage state.
- Page diagnostics: console errors, failed requests, and slow resources by browser and viewport.
- Safe interaction recipes for menus, tabs, dialogs, and form state.
- Accessibility modes for orientation, 200% zoom, dark scheme, forced colors, and reduced motion.

## Deliberate exclusions

- Hosted real-device infrastructure.
- Accounts, teams, comments, or share links.
- Scheduled cloud scans and notification integrations.
- Pull-request approval workflows.
- Additional AI features before Explore, Audit, and Compare are coherent.

## Product constraint

Because Breakscope is a local web application rather than a custom Chromium shell, arbitrary third-party pages cannot be safely embedded as fully interactive cross-origin panes. Explore therefore uses real Playwright captures. Interaction synchronization will be added through explicit local capture recipes rather than unreliable iframe proxying.
