---
title: "Your Workflow History Is Storing More Than You Think"
description: "Cadence writes every workflow input, activity parameter, signal, and query response into history as JSON. Learn how a custom DataConverter adds compression, encryption, or claim-check offload without changing your workflow code."
keywords:
  - cadence data converter
  - workflow history payload
  - cadence payload compression
  - cadence payload encryption
  - cadence claim check pattern
  - cadence workflow history size
  - cadence PII history
date: 2026-06-03T09:00
authors: kevinb
tags:
  - announcement
  - deep-dive
---

That customer order you passed into your fulfillment activity (the one with the email address, the shipping details, and the internal pricing fields) is sitting in your workflow history as plaintext JSON right now. Anyone with read access to Cadence history can see it. So can anyone with access to your history storage backend.

This is not a bug. It is how Cadence works by design, and it is the right default for most workloads. But three problems follow from it in production, and most teams hit at least one of them before they know the solution exists.

<!-- truncate -->

## Does this apply to you?

| If you are seeing this... | The pattern to look at |
|---------------------------|------------------------|
| Payloads rejected at the ~2 MB limit with no useful error message | **Claim-check** |
| PII, PHI, credentials, or internal data visible in workflow history or the Cadence UI | **Encryption** |
| Storage or bandwidth costs climbing as workflows handle large, repetitive JSON | **Compression** |

If none of those rows match your situation, the default JSON converter is probably fine.

## How the fix works

Cadence serializes every workflow input, activity parameter, signal payload, and query response through a `DataConverter` before writing it to history. The default implementation is a plain JSON converter. Swapping it for a custom one lets you intercept every payload in both directions, with no changes to workflow or activity code required.

Three patterns cover the three problems above.

**Compression** runs gzip on the JSON output before it reaches history. For repetitive JSON payloads, the typical reduction is 60–80%. This lowers storage cost and bandwidth, and it buys headroom before you hit the size cap. It does not remove the cap entirely.

**Encryption** wraps the JSON payload with AES-256-GCM before it is written to history. Without your key, every payload stored by the Cadence server is opaque bytes. Operators browsing workflow history see nothing readable. This covers workflow and activity data, but it does not cover everything (more on that in week 3 of this series).

**Claim-check** offloads payloads above a configurable threshold to an external blob store. Only a small reference travels through Cadence history. This is the only pattern that fully removes the per-payload size constraint rather than just reducing or delaying it.

All three patterns are wired in the same way: set the same converter on both the `WorkflowClient` and every `Worker` polling the same task list. The [concept doc](/docs/concepts/data-converter) covers the interface, the wiring, and the production considerations for each pattern.

## What DataConverter does not see

The converter intercepts payloads crossing the history boundary. It does not touch:

- **Search attributes:** indexed and queryable, but outside the converter path
- **Memo:** uses the default JSON converter unless you wrap that path separately
- **Application logs and metrics:** separate disclosure surfaces entirely

Encrypting your payloads does not encrypt these. If any of them carry sensitive data, that is a separate data-governance problem. Week 3 of this series maps out the full picture.

## What's next in this series

**Week 2: Bypass the 2 MB Limit Without Shrinking Your Workflow**

A deep dive into the claim-check pattern: how to keep only a reference in history, why blob keys must be deterministic (SHA-256, not UUID), and how to run the Go and Java samples against a live cluster with local-FS, S3, GCS, or MinIO as the backing store.

**Week 3: Encrypt Cadence History Payloads (And Know What You Didn't Encrypt)**

Key management, the `CADENCE_ENCRYPTION_KEY` environment variable, and a practical map of what AES-256-GCM encryption protects in Cadence versus what it leaves exposed. If you handle regulated data, this is the post to bookmark.

## Get started

- **Read the concept doc:** [Data Converters, Encryption, Compression, and Claim-Check](/docs/concepts/data-converter) (interface signatures, wiring examples, and production footguns for all three patterns)
- **Go samples:** [cadence-samples / new_samples / data](https://github.com/cadence-workflow/cadence-samples/tree/master/new_samples/data)
- **Java samples:** [cadence-java-samples](https://github.com/cadence-workflow/cadence-java-samples) (compression, encryption, and claim-check packages)
- **Community:** [#cadence](https://slack.cncf.io/) on CNCF Slack or [GitHub Discussions](https://github.com/cadence-workflow/cadence/discussions)
