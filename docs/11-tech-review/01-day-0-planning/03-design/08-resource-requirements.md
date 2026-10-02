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

:::warning[These numbers are a reference]
The sizes and tables on this page come from three reference environments and are meant for rough capacity estimates. Your workflow shapes, payload sizes, datastore, and hardware will move the numbers. Run the [bench suite](/docs/operation-guide/setup#stressbench-test-a-cluster) against your own setup before provisioning, and again whenever the setup changes.
:::

The tables show the p50 and max load for three reference environment sizes.

All three environments use Cassandra for persistence with 8K to 16K [history shards](/docs/operation-guide/setup#static-configuration) (16,384 on L, 8,192 on S and M) and OpenSearch for advanced visibility. SQL-backed clusters may need different sizing, so confirm with bench. Each runs as two clusters. The numbers cover both clusters together, including cross-cluster replication traffic.

### Cadence

| Size | External events/sec (p50 / max) | Activities/sec (p50 / max) | Decisions/sec (p50 / max) |
|---|---|---|---|
| S | ~100 / ~250 | ~900 / ~1,780 | ~2,080 / ~3,520 |
| M | ~300 / ~800 | ~2,380 / ~3,830 | ~3,340 / ~5,780 |
| L | ~600 / ~1,200 | ~10,100 / ~14,800 | ~12,500 / ~16,400 |

- **External events/sec**: requests from outside Cadence that start or change a workflow (`StartWorkflowExecution`, `SignalWorkflowExecution`, and `SignalWithStartWorkflowExecution`).
- **Activities/sec**: activity task calls between workers and the server, counting both picking up a task (`RecordActivityTaskStarted`) and reporting its result (`RespondActivityTask*`).
- **Decisions/sec**: decision task calls, counted the same way (`RecordDecisionTaskStarted` and `RespondDecisionTask*`). A decision is each time a worker runs workflow code to decide what happens next.

[Cluster monitoring](/docs/operation-guide/monitoring) shows how to chart StartWorkflow, activity, and decision rates for your own cluster.

The estimates in the next two sections cover Cadence services only. Cores are vCPUs, and the tables show allocated capacity at the target utilization, which on Kubernetes means the CPU and memory requests. The Cadence Helm chart sets no resource requests by default. Worker is Cadence's internal Worker service. Your workflow and activity workers run outside the cluster (see [Worker and client requirements](/docs/tech-review/day-0-planning/design/architecture-requirements#worker-and-client-requirements)).

### Persistence

Cadence doesn't publish node counts for its datastores, since they depend on your hardware, data size, and retention. The tables below show the load the reference environments put on their datastores. Use them to size your own with your datastore's tooling.

Cadence keeps data in two stores: the execution store holds workflow state, history, and task lists, and the visibility store holds the records used to list and search workflows.

#### Execution

| Size | Reads/sec (p50 / max) | Writes/sec (p50 / max) | Conditional updates/sec (p50 / max) | Deletes/sec (p50 / max) |
|---|---|---|---|---|
| S | ~6,100 / ~9,400 | ~3,700 / ~5,800 | ~4,100 / ~6,200 | ~2,700 / ~3,600 |
| M | ~10,300 / ~15,400 | ~10,600 / ~19,000 | ~14,400 / ~23,100 | ~4,500 / ~5,300 |
| L | ~18,800 / ~27,000 | ~27,700 / ~38,700 | ~32,700 / ~45,800 | ~6,300 / ~7,700 |

- **Reads**: loading workflow state and history, and reading pending tasks (`GetWorkflowExecution`, `ReadHistoryBranch`, `GetTasks`, `GetHistoryTasks`).
- **Writes**: appending history events and adding tasks to task lists (`AppendHistoryNodes`, `CreateTask`).
- **Conditional updates**: writes that apply only if the stored state hasn't changed (`UpdateWorkflowExecution`, `CreateWorkflowExecution`, `UpdateTaskList`, `UpdateShard`). Cassandra runs these as lightweight transactions, which take about four round trips compared with one for a plain write.
- **Deletes**: completing tasks and removing workflows after retention (`RangeCompleteHistoryTask`, `CompleteTask`, `DeleteHistoryBranch`, `DeleteWorkflowExecution`).

Every decision and every activity adds one history append and one conditional update. The tasks it schedules are written in the same batch as that update and deleted later, once processed. Your own rates are on the [persistence dashboards](/docs/operation-guide/monitoring#cadence-default-persistence-monitoring).

#### Visibility

With basic visibility, visibility records live in a database of the same type as the execution store. [Architecture requirements](/docs/tech-review/day-0-planning/design/architecture-requirements#production) recommends a separate database for it in production. [Advanced visibility](/docs/concepts/search-workflows) is optional. It adds a search store, such as Elasticsearch, OpenSearch, or Pinot, fed through Kafka. History publishes each record to Kafka, and Worker indexes it into the search store.

| Size | Writes/sec (p50 / max) | Deletes/sec (p50 / max) | Reads/sec (p50 / max) | Average record size |
|---|---|---|---|---|
| S | ~1,200 / ~1,700 | ~420 / ~630 | <1 / ~2 | ~660 B |
| M | ~1,700 / ~3,700 | ~530 / ~570 | ~1 / ~5 | ~710 B |
| L | ~2,900 / ~5,400 | ~760 / ~850 | ~15 / ~60 | ~740 B |

- **Writes**: visibility records. Cadence writes one when a workflow starts, one when it closes, and one each time it updates search attributes (`RecordWorkflowExecutionStarted`, `RecordWorkflowExecutionClosed`, `UpsertWorkflowExecution`).
- **Deletes**: removing records of workflows past retention (`DeleteWorkflowExecution`).
- **Reads**: List, Count, and Scan queries from your applications, the CLI, and the Web UI.
- **Average record size**: depends on your workflows, mostly on how many search attributes and how large a memo they carry. Use it as a reference only.

Each operation counts once, before any replication inside your visibility store.

With advanced visibility, every visibility write and delete passes through Kafka first, so the writes and deletes columns also show how much traffic Kafka carries.

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

Treat these rules as starting points:

- Give each instance at least 2 cores.
- Run at least 4 instances each of History, Frontend, and Matching, and at least 2 of Worker. Load spreads more evenly across more instances, and losing one hurts less. See [High availability](/docs/tech-review/day-0-planning/design/high-availability).
- Keep each instance at or below 64 GiB of memory. If a service needs more, add instances instead of making them bigger.
- Before provisioning, run the [bench suite](/docs/operation-guide/setup#stressbench-test-a-cluster) against your hardware and datastore. It's the only way to get real throughput numbers.

## Network

### In-cluster

All Cadence components (Frontend, History, Matching, and Worker) must be able to reach each other inside a cluster. Every component also needs access to the execution and visibility stores. With advanced visibility, all Cadence services also need access to Kafka. History publishes visibility records and Worker indexes them, but every service opens a Kafka client at startup when advanced visibility is enabled. See [Service dependencies](/docs/tech-review/day-0-planning/design/service-dependencies) for the full list.

### Cross-cluster

History and Worker in cluster A must be able to reach Frontend in cluster B, and the other way round. History pulls workflow replication tasks, and Worker pulls domain replication messages. Frontend can also forward API calls to the Frontend of the cluster where a domain is active, depending on the cluster redirection policy. Frontend can sit behind a proxy or load balancer. Nothing else crosses clusters. Each cluster keeps its own execution and visibility stores, and Cadence replicates workflow data itself, so the datastores never talk to each other.

Replication is asynchronous. Latency between regions doesn't block running workflows, but it increases replication lag, which is how much recent progress can be lost on failover. Replication traffic grows with the event rate. See [cross-DC replication](/docs/concepts/cross-dc-replication) for how replication and failover work.

## Related documentation

- [Architecture requirements](/docs/tech-review/day-0-planning/design/architecture-requirements)
- [Service dependencies](/docs/tech-review/day-0-planning/design/service-dependencies)
- [High availability](/docs/tech-review/day-0-planning/design/high-availability)
- [Storage requirements](/docs/tech-review/day-0-planning/design/storage-requirements)
- [Cluster configuration](/docs/operation-guide/setup)
- [Cluster monitoring](/docs/operation-guide/monitoring)
- [Cross-DC replication](/docs/concepts/cross-dc-replication)
- [Search workflows](/docs/concepts/search-workflows)
- [Cadence bench suite](https://github.com/cadence-workflow/cadence/tree/master/bench)
