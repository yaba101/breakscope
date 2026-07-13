---
type: "query"
date: "2026-07-13T11:18:44.509600+00:00"
question: "Why can't custom HTTPS domains continue from the new project form?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["ProjectSetupForm()", "isApprovedPublicUrl()", "capture()", "URL Security Boundary"]
---

# Q: Why can't custom HTTPS domains continue from the new project form?

## Answer

Expanded from original query via graph vocab: capture, validation, url, project, form, public, security, worker. ProjectSetupForm calls isCaptureUrl; the prior implementation delegated to an approved preview-host whitelist, which disabled Continue for adavia.com. The local capture service reused the same validator. Updated isCaptureUrl to accept custom public HTTPS hostnames while the capture service performs DNS and request-level private-network blocking.

## Outcome

- Signal: useful

## Source Nodes

- ProjectSetupForm()
- isApprovedPublicUrl()
- capture()
- URL Security Boundary