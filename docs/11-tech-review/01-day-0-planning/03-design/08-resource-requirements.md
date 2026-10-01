---
layout: default
title: Resource Requirements
description: Cadence resource requirements including CPU, network, and memory.
keywords:
  - cadence resource requirements
  - cadence cpu
  - cadence memory
  - cadence network
---

This page describes what drives Cadence's CPU, memory, and network usage, and gives reference sizes for three environments. See [Architecture requirements](/docs/tech-review/day-0-planning/design/architecture-requirements) for the service roles and components themselves. For a proof of concept, one process can run all four roles against a single database (see [Proof of concept](/docs/tech-review/day-0-planning/design/architecture-requirements#proof-of-concept)).

## What drives resource usage

Cadence does its work per event. History writes every event to the workflow history, and Matching dispatches every task to a worker. CPU and memory therefore track the number of events and tasks in the system much more closely than the number of workflows. One workflow that fans out thousands of parallel activities costs about as much as thousands of workflows that run one activity each.

The main drivers are:

- Activities, timers, and signals per second
- Workflows running at the same time
- Workers polling, and the number of task lists they poll. Each waiting poller holds an open request on Frontend and Matching.
- Workflow history size and retention
- The number of [history shards](/docs/operation-guide/setup#static-configuration). Each shard costs History some CPU and memory for background processing.
- One cluster or two (see [cross-DC replication](/docs/concepts/cross-dc-replication))

## Reference environment sizes

:::warning[These numbers are a reference, not a sizing guarantee]
The sizes and tables on this page come from three reference environments and are meant for rough capacity estimates. Your workflow shapes, payload sizes, datastore, and hardware will move the numbers. Run the [bench suite](/docs/operation-guide/setup#stressbench-test-a-cluster) against your own setup before provisioning, and again whenever the setup changes.
:::

The table shows the p50 and max load for three reference environment sizes.

| Size | External events/sec (p50 / max) | Activities/sec (p50 / max) | Decisions/sec (p50 / max) |
|---|---|---|---|
| S | ~100 / ~250 | ~900 / ~1,780 | ~2,080 / ~3,520 |
| M | ~300 / ~800 | ~2,380 / ~3,830 | ~3,340 / ~5,780 |
| L | ~600 / ~1,200 | ~10,100 / ~14,800 | ~12,500 / ~16,400 |

- **External events/sec**: requests from outside Cadence that start or change a workflow (`StartWorkflowExecution`, `SignalWorkflowExecution`, and `SignalWithStartWorkflowExecution`).
- **Activities/sec**: activity task calls between workers and the server, counting both picking up a task (`RecordActivityTaskStarted`) and reporting its result (`RespondActivityTask*`).
- **Decisions/sec**: decision task calls, counted the same way (`RecordDecisionTaskStarted` and `RespondDecisionTask*`). A decision is each time a worker runs workflow code to decide what happens next.

All three environments use Cassandra for persistence with 8K to 16K [history shards](/docs/operation-guide/setup#static-configuration) (16,384 on L, 8,192 on S and M) and OpenSearch for advanced visibility. SQL-backed clusters may need different sizing, so confirm with bench. Each runs as two clusters, and the numbers cover both clusters together. They don't include cross-cluster replication traffic. [Cluster monitoring](/docs/operation-guide/monitor) shows how to chart StartWorkflow, activity, and decision rates for your own cluster.

The estimates in the next two sections cover Cadence services only. Size Cassandra, OpenSearch, and Kafka (which advanced visibility needs) with their own guidance. See [Storage requirements](/docs/tech-review/day-0-planning/design/storage-requirements). Cores are vCPUs, and the tables show allocated capacity at the target utilization, which on Kubernetes means the CPU and memory requests. The Cadence Helm chart sets no resource requests by default. Worker is Cadence's internal Worker service. Your workflow and activity workers run outside the cluster (see [Worker and client requirements](/docs/tech-review/day-0-planning/design/architecture-requirements#worker-and-client-requirements)).

## Single cluster estimates

With one cluster there's no second region to fail over to, so the target is 40% CPU and memory utilization. That leaves room for traffic spikes without paying for a standby copy.

### S

| Component | Nodes | Cores per node | RAM per node | Total cores | Total RAM |
|---|---|---|---|---|---|
| History | 16 | 2 | 12 GiB | 32 | 192 GiB |
| Frontend | 4 | 2 | 16 GiB | 8 | 64 GiB |
| Matching | 4 | 2 | 4 GiB | 8 | 16 GiB |
| Worker | 4 | 2 | 4 GiB | 8 | 16 GiB |
| **Total** | **28** | | | **56** | **288 GiB** |

### M

| Component | Nodes | Cores per node | RAM per node | Total cores | Total RAM |
|---|---|---|---|---|---|
| History | 20 | 4 | 28 GiB | 80 | 560 GiB |
| Frontend | 6 | 4 | 28 GiB | 24 | 168 GiB |
| Matching | 4 | 4 | 8 GiB | 16 | 32 GiB |
| Worker | 4 | 4 | 4 GiB | 16 | 16 GiB |
| **Total** | **34** | | | **136** | **776 GiB** |

### L

| Component | Nodes | Cores per node | RAM per node | Total cores | Total RAM |
|---|---|---|---|---|---|
| History | 45 | 8 | 64 GiB | 360 | 2,880 GiB |
| Frontend | 10 | 8 | 60 GiB | 80 | 600 GiB |
| Matching | 5 | 8 | 20 GiB | 40 | 100 GiB |
| Worker | 4 | 8 | 8 GiB | 32 | 32 GiB |
| **Total** | **64** | | | **512** | **3,612 GiB** |

## Two cluster estimates

With two clusters, the target drops to 25% CPU and memory utilization. The lower target covers failover. If one cluster goes down, the other takes its traffic and runs at roughly 50%. Each cluster is sized for half the load. The tables show the node count per cluster and the totals across both.

### S

| Component | Nodes per cluster | Nodes total | Cores per node | RAM per node | Total cores | Total RAM |
|---|---|---|---|---|---|---|
| History | 13 | 26 | 2 | 12 GiB | 52 | 312 GiB |
| Frontend | 4 | 8 | 2 | 12 GiB | 16 | 96 GiB |
| Matching | 4 | 8 | 2 | 4 GiB | 16 | 32 GiB |
| Worker | 4 | 8 | 2 | 4 GiB | 16 | 32 GiB |
| **Total** | **25** | **50** | | | **100** | **472 GiB** |

### M

| Component | Nodes per cluster | Nodes total | Cores per node | RAM per node | Total cores | Total RAM |
|---|---|---|---|---|---|---|
| History | 16 | 32 | 4 | 28 GiB | 128 | 896 GiB |
| Frontend | 5 | 10 | 4 | 28 GiB | 40 | 280 GiB |
| Matching | 4 | 8 | 4 | 8 GiB | 32 | 64 GiB |
| Worker | 4 | 8 | 4 | 4 GiB | 32 | 32 GiB |
| **Total** | **29** | **58** | | | **232** | **1,272 GiB** |

### L

| Component | Nodes per cluster | Nodes total | Cores per node | RAM per node | Total cores | Total RAM |
|---|---|---|---|---|---|---|
| History | 36 | 72 | 8 | 64 GiB | 576 | 4,608 GiB |
| Frontend | 8 | 16 | 8 | 60 GiB | 128 | 960 GiB |
| Matching | 4 | 8 | 8 | 20 GiB | 64 | 160 GiB |
| Worker | 4 | 8 | 8 | 8 GiB | 64 | 64 GiB |
| **Total** | **52** | **104** | | | **832** | **5,792 GiB** |

## Sizing guidelines

These rules are starting points, not hard limits:

- Give each instance at least 2 cores.
- Run at least 4 instances each of History, Frontend, and Matching, and at least 2 of Worker. Load spreads more evenly across more instances, and losing one hurts less. See [High availability](/docs/tech-review/day-0-planning/design/high-availability).
- Keep each instance at or below 64 GiB of memory. If a service needs more, add instances instead of making them bigger.
- Before provisioning, run the [bench suite](/docs/operation-guide/setup#stressbench-test-a-cluster) against your hardware and datastore. It's the only way to get real throughput numbers.

## Network

### In-cluster

All Cadence components (Frontend, History, Matching, and Worker) must be able to reach each other inside a cluster. Every component also needs access to the database and, if you use advanced visibility, to the visibility store. With advanced visibility, all Cadence services also need access to Kafka. See [Service dependencies](/docs/tech-review/day-0-planning/design/service-dependencies) for the full list.

### Cross-cluster

History in cluster A must be able to reach Frontend in cluster B, and the other way round. Frontend can also forward API calls to the Frontend of the cluster where a domain is active, depending on the cluster redirection policy. Frontend can sit behind a proxy or load balancer. Nothing else crosses clusters. Each cluster keeps its own database and visibility store, and Cadence replicates workflow data itself, so the datastores never talk to each other.

Replication is asynchronous. Latency between regions doesn't block running workflows, but it increases replication lag, which is how much recent progress can be lost on failover. Replication traffic grows with the event rate. See [cross-DC replication](/docs/concepts/cross-dc-replication) for how replication and failover work.

## Related documentation

- [Architecture requirements](/docs/tech-review/day-0-planning/design/architecture-requirements)
- [Service dependencies](/docs/tech-review/day-0-planning/design/service-dependencies)
- [High availability](/docs/tech-review/day-0-planning/design/high-availability)
- [Storage requirements](/docs/tech-review/day-0-planning/design/storage-requirements)
- [Cluster configuration](/docs/operation-guide/setup)
- [Cluster monitoring](/docs/operation-guide/monitor)
- [Cross-DC replication](/docs/concepts/cross-dc-replication)
- [Search workflows](/docs/concepts/search-workflows)
- [Cadence bench suite](https://github.com/cadence-workflow/cadence/tree/master/bench)
