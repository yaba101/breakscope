# Breakscope product direction

Breakscope is a local responsive debugging workbench. It should help one developer understand a page across widths and browsers without requiring deployment, accounts, collaboration, or hosted infrastructure.

## Primary workflow

The product is divided into three explicit modes:

1. **Explore** — inspect captured viewports together, keep their scroll positions synchronized, and focus any viewport for closer inspection.
2. **Audit** — run deterministic responsive, accessibility, and performance checks, then inspect evidence for each finding.
3. **Compare** — compare the current run with a user-approved local baseline and decide whether the change is expected.

Explore is the default review surface once checkpoint captures exist. An audit is an intentional action, not a loading gate before the user can see the page.

## Current implementation sequence

- [ ] Explicit Explore, Audit, and Compare navigation in the workspace.
- [ ] Multi-viewport Explore overview using the selected browser's captured checkpoints.
- [ ] Optional proportional scroll synchronization across Explore viewports.
- [ ] Focus action from the overview into the existing device evidence view.
- [ ] User-selected local baseline in scan history.
- [ ] Current-versus-baseline visual comparison rather than implicit adjacent-run comparison.

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
