---
type: "query"
date: "2026-07-13T12:17:31.481656+00:00"
question: "How should UIRift make comparison tools functional and compare all discoverable top-level routes?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["AppShell", "ComparisonWorkspace", "ProjectSetupForm", "CaptureScreen", "LocalRunComparison", "LocalRun"]
---

# Q: How should UIRift make comparison tools functional and compare all discoverable top-level routes?

## Answer

AppShell owns real Select, Pan, Regions, and Inspect tool state. ComparisonWorkspace implements draggable slider, overlay opacity, diff rendering, pixel sampling, panning, zoom, findings selection, and route-aware layers. ProjectSetupForm discovers same-origin routes from the home page navigation and sitemap, lets the user select multiple routes, and creates a local run batch. CaptureScreen processes that batch sequentially, while LocalRunComparison exposes every ready route as a selectable comparison layer. Public unlinked or dynamic routes remain available through manual Add route.

## Outcome

- Signal: useful

## Source Nodes

- AppShell
- ComparisonWorkspace
- ProjectSetupForm
- CaptureScreen
- LocalRunComparison
- LocalRun