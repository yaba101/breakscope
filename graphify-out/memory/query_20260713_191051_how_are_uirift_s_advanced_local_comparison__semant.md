---
type: "query"
date: "2026-07-13T19:10:51.121165+00:00"
question: "How are UIRift's advanced local comparison, semantic reporting, NVIDIA analysis, and multi-route release report implemented?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["screens.tsx", "comparison-workspace.tsx", "local-workspace.ts", "semantic.ts", "ai-analysis.ts", "AiAnalysis", "PageSnapshot", "RunsScreen()", "ComparisonWorkspace()"]
---

# Q: How are UIRift's advanced local comparison, semantic reporting, NVIDIA analysis, and multi-route release report implemented?

## Answer

Expanded from original query via vocab: [capture, comparison, diff, report, run, workspace, viewport, project, route, semantic, analysis, snapshot]. UIRift captures screenshots plus PageSnapshot element evidence in the local capture service, computes pixel output and deterministic SemanticFinding/SemanticSummary data in comparison-engine, stores the artifacts and optional AiAnalysis in IndexedDB LocalRun records, renders fixed-viewport comparison modes and evidence navigation in ComparisonWorkspace, sends screenshots to the server-only NVIDIA route only after an explicit user action, validates the structured response, and aggregates sibling batch runs into a route-level SAFE/REVIEW/BLOCK release report in RunsScreen. Verified by production build, unit tests, desktop/mobile journeys, real Adavia capture, and a live NVIDIA response.

## Outcome

- Signal: useful

## Source Nodes

- screens.tsx
- comparison-workspace.tsx
- local-workspace.ts
- semantic.ts
- ai-analysis.ts
- AiAnalysis
- PageSnapshot
- RunsScreen()
- ComparisonWorkspace()