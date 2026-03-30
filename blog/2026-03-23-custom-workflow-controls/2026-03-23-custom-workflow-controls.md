---
title: "Custom Workflow Controls: Turn Queries Into Dashboards"
description: Workflow queries can now return interactive markdown with signal and start buttons, rendered natively in Cadence Web. Build ops dashboards without leaving the UI.
authors: kevinb
tags:
  - announcement
  - cadence-web
date: 2026-03-23T10:00
---

What if your workflow could tell operators exactly what's happening, and let them take action, right from the Cadence Web UI?

With **Custom Workflow Controls**, now it can.

<!-- truncate -->

## The Idea

Cadence workflows already have [queries](/docs/concepts/queries), a way to peek at internal state. But until now, query results were raw JSON. Useful for debugging, not great for operators who need to make decisions quickly.

Custom Workflow Controls change that. Your query handler returns **markdown**, and Cadence Web renders it with tables, formatted text, images, and **interactive buttons** that can signal a running workflow or start a new one.

No separate admin panel. No CLI copy-paste. Just your workflow's state, live and actionable. And it's secure by design: Cadence Web uses [Markdoc](https://markdoc.dev/) to parse responses, so raw HTML is stripped and only markdown plus the defined extension tags are rendered.

## See It in Action

<iframe width="560" height="315" src="https://www.youtube.com/embed/SLlOk_BbtKo?si=YPL9F4ZM8ZlHlxh5" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## Three MarkDoc Tags, Endless Possibilities

Cadence Web uses [Markdoc](https://markdoc.dev/) (by Stripe) to safely render your markdown. We've added three custom tags:

| Tag | What It Does |
|-----|--------------|
| `{% signal %}` | Renders a button that sends a signal to a running workflow |
| `{% start %}` | Renders a button that starts a new workflow execution |
| `{% image %}` | Renders an image with optional width/height control |

Mix these with standard markdown (headers, tables, lists, links) and your query response becomes a full control panel.

## What You Can Build

The samples include three progressively richer examples:

**MarkdownQueryWorkflow** - The basics. A query returns markdown with Complete, Continue, and Start Another buttons.

**LunchVoteWorkflow** - Interactive voting. Signal buttons cast votes, and the query renders the live tally.

**OrderFulfillmentWorkflow** - A full ops dashboard. The order moves through a state machine (pending, approved, shipped, delivered), and the dashboard shows only the actions valid for the current state. Approve payments, ship orders, issue refunds, all from the Queries tab.

## Get Started

**Read the docs:** [Custom Workflow Controls](/docs/concepts/workflow-queries-formatted-data) covers the response format, all three tags, and code examples in Go and Java.

**Run the samples:**

| Language | Samples |
|----------|---------|
| Go | [cadence-samples/new_samples/query](https://github.com/cadence-workflow/cadence-samples/tree/master/new_samples/query) |
| Java | [cadence-java-samples/.../query](https://github.com/cadence-workflow/cadence-java-samples/tree/master/src/main/java/com/uber/cadence/samples/query) |

All you need is **Cadence Web v4.0.14+** and a running Cadence cluster.

## What's Next

This is just the beginning. Custom Workflow Controls are currently supported in workflow queries, and we plan to extend them to other areas of Cadence Web. We'd love your feedback on what you build with them.

- **Suggest a tag extension** - [Open an issue on cadence-web](https://github.com/cadence-workflow/cadence-web/issues)
- **Ask a question** - [#cadence on CNCF Slack](https://communityinviter.com/apps/cloud-native/cncf)
- **Discuss use cases** - [GitHub Discussions](https://github.com/cadence-workflow/cadence/discussions)
