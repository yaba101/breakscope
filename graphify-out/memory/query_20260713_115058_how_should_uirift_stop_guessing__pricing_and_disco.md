---
type: "architecture"
date: "2026-07-13T11:50:58.747067+00:00"
question: "How should UIRift stop guessing /pricing and discover real routes shared by baseline and candidate deployments?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["ProjectSetupForm()", "capture()", "isCaptureUrl()"]
---

# Q: How should UIRift stop guessing /pricing and discover real routes shared by baseline and candidate deployments?

## Answer

Project setup now defaults every new comparison to /. The local Playwright companion exposes a bounded discover-routes endpoint that starts at home, reads sitemap URLs when available, follows same-origin HTML links, rejects assets and API paths, and checks availability separately on baseline and candidate. The UI displays the route intersection, keeps home selected, supports rescanning, and retains manual route entry for dynamic or unlinked pages.

## Outcome

- Signal: useful

## Source Nodes

- ProjectSetupForm()
- capture()
- isCaptureUrl()