---
type: "query"
date: "2026-07-13T18:09:10.483781+00:00"
question: "Why are the current reports not useful, how should the canvas interactions and one-screen layout be fixed, and what advanced or AI-driven comparison features should UIRift build next?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["ComparisonWorkspace", "DiffInspector", "compareRgba", "PixelRegion", "groupRegions", "createVisualDiff", "CaptureScreen"]
---

# Q: Why are the current reports not useful, how should the canvas interactions and one-screen layout be fixed, and what advanced or AI-driven comparison features should UIRift build next?

## Answer

Expanded from original query via graph vocabulary: comparison, diff, inspector, region, changed, pixel, workspace, capture, visual, layer, mode, run, report, viewport, frame. The current engine uses pixelmatch and connected pixel components, so the inspector can only produce generic regions and percentages. The next product phase should first make the workspace a fixed viewport with computed fit, cursor-centered wheel zoom, reliable space or middle-button panning, sticky mode controls, minimap, and internal inspector scrolling. It should then capture DOM and accessibility snapshots, match elements across baseline and candidate, classify added, removed, moved, resized, text, style, and visibility changes, and aggregate them into meaningful page-level findings with severity, confidence, evidence crops, and before-after descriptions. An optional multimodal AI adapter should consume screenshots plus the deterministic structured diff to explain page purpose and user impact; AI should not replace detection. Multi-page runs should produce a route matrix and executive summary.

## Outcome

- Signal: useful

## Source Nodes

- ComparisonWorkspace
- DiffInspector
- compareRgba
- PixelRegion
- groupRegions
- createVisualDiff
- CaptureScreen