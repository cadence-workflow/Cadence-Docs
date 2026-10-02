---
layout: default
title: Dashboards
description: Dashboards used or implemented by Cadence and dashboard requirements.
keywords:
  - cadence dashboards
  - cadence grafana
  - cadence monitoring dashboards
---

Cadence provides Grafana dashboards for metrics across the cluster, and Cadence Web for inspecting individual workflows.

## Grafana dashboards

The main [Cadence repository](https://github.com/cadence-workflow/cadence/tree/master/docker/grafana/provisioning/dashboards) includes an overview dashboard, one dashboard for each server service, and one for SDK workers. One way to use them is to start with Cadence-Server for overall cluster health, then open the service dashboard for the area that looks wrong. Each dashboard can be filtered by domain, and most also let you choose the latency percentile.

| Dashboard | Shows |
| --- | --- |
| Cadence-Server | Frontend requests by domain, API latency by operation, service restarts, shard movement, running server versions, and timer and transfer task processing |
| Cadence-Frontend | Requests, errors, and latency for each Frontend API |
| Cadence-History | API latency, decisions, caches, shard movement, task lag, and timer processing |
| Cadence Matching | API latency, task matching, and backlog per task list |
| Cadence-Persistence | Database requests by operation, domain, and shard, and errors and latency by operation |
| Cadence-Archival | Archival requests and workflow cleanup |
| Cadence-Client | Workflow, activity, and poller metrics from SDK workers, plus a few related server metrics |

The dashboards do not include alerts. [Cluster monitoring](/docs/operation-guide/monitoring) suggests monitors and thresholds for the key panels.

The local [Docker Compose setups](https://github.com/cadence-workflow/cadence/tree/master/docker) start Prometheus and Grafana with these dashboards loaded. For Kubernetes, see the [Grafana Helm setup guide](/docs/get-started/grafana-helm-setup).

### Requirements

The dashboards need:

- Cadence services exposing Prometheus metrics. See the setup steps in [Cluster monitoring](/docs/operation-guide/monitoring#instructions).
- Prometheus scraping every Cadence service. On Kubernetes, the [Grafana Helm setup guide](/docs/get-started/grafana-helm-setup) configures this with the chart's `serviceMonitor`.
- SDK workers also exporting metrics, for the Cadence-Client dashboard. [Cluster monitoring](/docs/operation-guide/monitoring#instructions) covers the Go and Java SDKs.

## Cadence Web

[Cadence Web](https://github.com/cadence-workflow/cadence-web) is the project's browser UI for domains, workflows, and task lists. When a Grafana dashboard shows a problem in a domain, Cadence Web can be used to find the affected workflows.

In Cadence Web you can:

- Search workflows in a domain, including query-based search when [advanced visibility](/docs/concepts/search-workflows) is enabled.
- Open a workflow to see its event history, pending activities, and payloads.
- Check which workers are polling a task list.
- Use Workflow Diagnostics, an opt-in feature, to list common problems found in a workflow's history.

Docker Compose includes Cadence Web, and the Helm chart can deploy it. See [UX and UI](/docs/tech-review/day-0-planning/usability/ux-ui) for a list of its other features and the [cadence-web README](https://github.com/cadence-workflow/cadence-web/blob/master/README.md#feature-flags) for opt-in features.

## Related documentation

- [Cluster monitoring](/docs/operation-guide/monitoring)
- [Grafana Helm setup](/docs/get-started/grafana-helm-setup)
- [Rollback metrics](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/rollback-metrics)
- [UX and UI](/docs/tech-review/day-0-planning/usability/ux-ui)
