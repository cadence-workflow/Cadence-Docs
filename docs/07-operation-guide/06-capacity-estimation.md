---
layout: default
title: Capacity Estimation
description: Estimate workflow action/update volume and data footprint for Cadence capacity planning. Covers workflow shape, activities, signals, timers, child workflows, payload sizes, retention, and persistence assumptions.
keywords:
  - cadence capacity planning
  - cadence capacity estimation
  - cadence data footprint
  - cadence workflow history size
  - cadence persistence sizing
  - cadence operational footprint
  - cadence workflow volume
permalink: /docs/operation-guide/capacity-estimation
---

Cadence capacity depends on workflow volume, workflow history size, payload size, retention, timers, activities, signals, child workflows, search attributes, heartbeats, and persistence backend configuration. This page provides a practical reference for estimating the approximate action/update count and data footprint of a workload before deploying or scaling Cadence.

:::note
This estimator is not a billing quote. It is intended to help reason about workflow history growth, persistence footprint, and capacity planning. Actual infrastructure usage depends on deployment topology, persistence backend, traffic patterns, worker behavior, archival, visibility, and operational configuration.
:::

## Inputs

### Workflow shape

| Input | Description | Default |
|---|---|---|
| `workflowsAtPeak` | Number of concurrently open workflows at peak | 1 |
| `workflowsPerDay` | New workflows started per day | 1 |
| `avgWorkflowRuntimeDays` | Average duration of a workflow, in days | 1 |
| `retentionDaysAfterCompletion` | Days to retain closed workflow history (default includes 2-day Cassandra GC grace period) | 2 |

### Workflow behavior

| Input | Description | Default |
|---|---|---|
| `activitiesPerWorkflow` | Activities scheduled per workflow | 1 |
| `signalsPerWorkflow` | Signals received per workflow | 1 |
| `timersPerWorkflow` | Timers fired per workflow | 1 |
| `childWorkflowsPerWorkflow` | Child workflows started per workflow | 1 |
| `searchAttributeUpsertsPerWorkflow` | Search attribute upserts per workflow | 1 |
| `heartbeatsPerWorkflow` | Activity heartbeats per workflow | 1 |

### Payload sizes

| Input | Description | Default |
|---|---|---|
| `avgWorkflowPayloadSize` | Average workflow input payload | 1 MB |
| `avgWorkflowResponseSize` | Average workflow result payload | 1 KB |
| `avgActivityPayloadSize` | Average activity input payload | 1 MB |
| `avgActivityResponseSize` | Average activity result payload | 1 KB |
| `avgChildWorkflowPayloadSize` | Average child workflow input payload | 1 MB |
| `avgSignalInputSize` | Average signal input payload | 1 KB |

### Persistence assumptions

| Input | Description | Default |
|---|---|---|
| `executionsAvgRowSize` | Average size of one row in the executions table. The default of 7 KB is a conservative planning estimate; observed averages in production can reach 100 KB or more depending on pending activities, child workflows, and binary checksums. | 7 KB |
| `executionsMaxRowSize` | Maximum row size in the executions table | 1 MB |
| `historyNodeAvgRowSize` | Average history node row size | 600 KB |
| `historyNodeMaxRowSize` | Maximum history node row size | 15 MB |
| `needArchival` | Whether workflow history is archived after close | false |

## Action and update model

Each event type carries a cost in terms of action/update units. These units represent the number of state transitions Cadence processes for a given workflow execution.

| Event type | Cost (actions/updates) |
|---|---|
| Workflow start/close | 5 |
| Activity (schedule + start + complete) | 6 |
| Signal | 4 |
| Timer (fire + cancel) | 5 |
| Child workflow | 6 |
| Search attribute upsert | 4 |
| Heartbeat | 1 |

### Total actions formula

```
totalActions =
    workflowsAtPeak * 5
  + activitiesPerWorkflow * 6
  + signalsPerWorkflow * 4
  + timersPerWorkflow * 5
  + childWorkflowsPerWorkflow * 6
  + searchAttributeUpsertsPerWorkflow * 4
  + heartbeatsPerWorkflow * 1
```

With all defaults set to 1, `totalActions = 31`.

## Data footprint model

### Workflow payload size

```
workflowPayloadDataSize =
    avgWorkflowPayloadSize
  + avgWorkflowResponseSize
  + activitiesPerWorkflow * (avgActivityPayloadSize + avgActivityResponseSize)
  + childWorkflowsPerWorkflow * avgChildWorkflowPayloadSize
  + signalsPerWorkflow * avgSignalInputSize
```

With defaults: `workflowPayloadDataSize ≈ 3.00 MB`

### Unit data size

```
unitDataSize =
    historyNodeAvgRowSize * (activitiesPerWorkflow + workflowsAtPeak)
  + 1 KB * totalActions
  + executionsAvgRowSize * workflowsAtPeak * 2
```

The `* 2` accounts for two executions table reads per workflow: one for the workflow record and one for timer/transfer records.

With defaults: `unitDataSize ≈ 1.22 MB`

### Total retained data size

```
totalRetainedDataSize =
  unitDataSize * workflowsPerDay * (avgWorkflowRuntimeDays + retentionDaysAfterCompletion)
```

The default `retentionDaysAfterCompletion = 2` includes the 2-day Cassandra GC grace period. For deployments with a different GC grace period configuration, adjust this value accordingly.

With defaults: `totalRetainedDataSize ≈ 3.65 MB`

## Example output (all defaults)

| Output | Value |
|---|---|
| Estimated actions/updates per workflow | 31 |
| Estimated workflow payload/data size | 3.00 MB |
| Estimated unit data size | 1.22 MB |
| Estimated total retained data footprint | 3.65 MB |

## Retention and archival notes

- The `retentionDaysAfterCompletion` input controls how long closed workflow history is kept in the primary persistence store before deletion. The default of 2 days is set to match the Cassandra GC grace period — adjust if your cluster uses a different grace period.
- If `needArchival` is true, closed workflow history is moved to a blob store (S3, GCS, or similar) rather than deleted. Archival does not reduce primary persistence footprint during the retention window — it affects long-term storage costs and audit access.
- Actual retention behavior depends on the Cadence server `archival` configuration, the domain-level archival settings, and the blob store backend. See the [cluster configuration guide](/docs/operation-guide/setup) for details.

## Operational caveats

- These estimates assume uniform payload and history sizes. Real workloads vary; use p95 or p99 sizes from production metrics when available.
- Worker autoscaling, tasklist partitioning, and visibility index writes are not modeled here. They add additional I/O and storage beyond the estimates above.
- Persistence row sizes depend on how Cadence serializes workflow state. Cassandra and SQL backends have different row layouts; consult your DBA or persistence admin when sizing for production.
- For multi-cluster or global domain setups, multiply the retained data footprint by the number of replication targets.
- This page reflects planning estimates. For production sizing, validate against observed metrics from a staging or canary deployment.
