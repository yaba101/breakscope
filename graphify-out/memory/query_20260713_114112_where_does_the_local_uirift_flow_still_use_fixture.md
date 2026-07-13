---
type: "architecture"
date: "2026-07-13T11:41:12.219033+00:00"
question: "Where does the local UIRift flow still use fixture state instead of real project, capture, run, and comparison data?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["AppShell()", "CaptureScreen()", "ProjectsScreen()", "RunsScreen()", "ComparisonWorkspace()", "LocalRunComparison()"]
---

# Q: Where does the local UIRift flow still use fixture state instead of real project, capture, run, and comparison data?

## Answer

AppShell, CaptureScreen, RunsScreen, ProjectsScreen, ComparisonWorkspace, and LocalRunComparison were the fixture boundaries. The local shell now shows only device state; capture runs baseline and candidate sequentially with real persisted events, durations, previews, errors, and IDs; comparison labels, layers, heatmap, metrics, and findings come from the stored run and project; workspace queries refresh from IndexedDB changes. Seeded Acme fixtures remain limited to the explicitly labeled demo and marketing preview.

## Outcome

- Signal: useful

## Source Nodes

- AppShell()
- CaptureScreen()
- ProjectsScreen()
- RunsScreen()
- ComparisonWorkspace()
- LocalRunComparison()