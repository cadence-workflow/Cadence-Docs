---
layout: default
title: Design Principles
description: Design principles and best practices followed by the Cadence project.
keywords:
  - cadence design principles
  - cadence best practices
  - cadence architecture principles
---

Cadence is a **durable execution engine** for long-running, distributed application logic.

Building distributed systems comes with a common set of overheads: retries, durable state, failure recovery, timers, coordination across services, and visibility into work in flight. Most teams reimplement these concerns in every new service, or wire them together from databases, queues, and cron. Worse, application developers are often forced to reason about the underlying infrastructure instead of the business problem.

Cadence aims to handle this. Users express what should happen in workflow code; the platform makes it durable, recoverable, and observable.

This page summarizes the **principles that guide Cadence's programming model, server architecture, and operational design**. For strategic direction, see [Vision & Goals](/docs/tech-review/day-0-planning/scope/vision-goals). For deployment and environment requirements, see [Architecture requirements](/docs/tech-review/day-0-planning/design/architecture-requirements).

## Programming model

These principles shape how teams author and run workflows.

### 1. Meet the user where they are

One of Cadence's core design goals is that **writing a workflow should feel as close to writing regular, local code as possible**.

Users should not have to learn a parallel universe of orchestration concepts before they can ship. Cadence implements **distributed versions of well-known programming primitives** (sequential logic, branching, loops, waiting, concurrency) and connects them to **strong infrastructure** underneath: durable persistence, task dispatch, retries, and recovery. The platform does the distributed-systems work; the author stays in familiar mental models.

Workflows are authored with **language SDKs** (Go, Java, Python, and community clients).

### 2. Absorb distributed systems overhead

Cadence takes responsibility for concerns that every long-running distributed process needs:

- **Retries** against transient failures, downstream outages, and activity timeouts (distinct from recovery after worker crashes or service restarts)
- **Durability** that preserves workflow state for seconds or years without custom checkpoint tables
- **Failure recovery** after worker, network, or Cadence service outages
- **Regional and zonal failovers** that move running workflows to a healthy location for outage mitigation, capacity rebalancing, or planned maintenance, without application code coordinating the move
- **Durable timers and schedules** without polling databases or per-entity cron
- **State machine transitions** expressed as ordinary code branches rather than scattered status columns
- Correlating progress across steps without ad hoc message chains

Application code focuses on **business logic**. Cadence focuses on **making that logic durable**.

### 3. Fault-oblivious workflows

Workflow code should be **immune to infrastructure failures**. Developers do not write special handling for worker restarts, Cadence service outages, or process crashes.

When a worker or service recovers, Cadence **replays the workflow event history** and restores in-memory state so execution continues from the last durable point. The only expected workflow failure mode from the platform's perspective is **business logic throwing an error**, not a downstream host going away.

### 4. Deterministic workflows, non-deterministic activities

Workflows and activities have **different reliability contracts**:

| Layer | Responsibility | Failure model |
| --- | --- | --- |
| **Workflow** | Orchestration, branching, timers, signals | Event-sourced replay; must be deterministic |
| **Activity** | External I/O (APIs, databases, files, human steps) | Retried independently; may contain any code |

Workflow code must produce the same decisions on every replay. That means no direct external calls, no `time.Now()` or uncontrolled randomness, and no hidden side effects inside the workflow function. Use Cadence workflow APIs for time, sleep, and concurrency. Put all external interaction in [activities](/docs/concepts/activities).

This split is intentional: orchestration stays simple and recoverable; the messy real world stays in activities with retries, heartbeats, and timeouts.

### 5. Event-sourced execution history

Cadence stores an **append-only history of workflow events** (decisions, activity completions, timers, signals). Workflow state is **derived from that history**, not from ad hoc rows updated by each step.

Benefits:

- Complete audit trail of what happened and when
- Reliable recovery by **replaying** history on any worker
- **Execution resets** and controlled remediations when operators need to move a run to a safe point
- [Search and inspection](/docs/concepts/search-workflows) of running and closed executions through the API, CLI, and Web UI

Tradeoff: workflow code changes must respect [logic versioning and replay rules](/docs/go-client/workflow-versioning). Teams should use replay tests before deploying incompatible workflow changes.

### 6. First-class external interaction

Long-running processes need more than fire-and-forget tasks. Cadence models external interaction explicitly:

- **[Signals](/docs/concepts/events)** for asynchronous events targeted at a workflow instance
- **[Queries](/docs/concepts/queries)** for read-only inspection without mutating history
- **Timers and [schedules](/docs/concepts/schedules)** for durable delays without polling databases or running cron per entity
- **Child workflows** for composition and isolation

These primitives let one workflow instance represent a customer, order, device, or job for minutes or years.

## Platform architecture

These principles shape the Cadence server and how it scales.

### 1. Stateless services, durable persistence

Cadence server components (Frontend, History, Matching, internal Worker) are **stateless at the process level**. Workflow state lives in the **persistence layer** (Cassandra, MySQL, PostgreSQL, SQLite for dev, and compatible stores).

Any service instance can be replaced without losing workflow data. Horizontal scaling adds capacity by running more service nodes and workers, not by sharding logic into application databases.

See [Deployment topology](/docs/concepts/topology) and the [processing flow](https://github.com/cadence-workflow/cadence/blob/master/docs/flow.md) in the server repository.

### 2. Separation of orchestration and worker execution

The Cadence service **does not execute user workflow code**. User workflows and activities run in **external worker processes** that poll [task lists](/docs/concepts/task-lists) and report results back.

This separation:

- Lets teams deploy and scale workers independently from the control plane
- Enables **load distribution and balancing** across worker pools via task lists and matching
- Allows workflow code in any language with a supported client
- Keeps failure domains clear: cluster health versus application worker health

Workers, workflow starters, and operators can even live in the same process for small deployments; the roles remain distinct.

### 3. Built-in task dispatch

Cadence routes workflow and activity tasks through **internal task lists** managed by the Matching service. Application teams do not need a separate message broker for the core orchestration loop.

External queues (Kafka, SQS, etc.) may still appear **inside activities** when integrating with other systems. Cadence coordinates the process; activities talk to the outside world.

### 4. Shard-based horizontal scale

Workflow executions are partitioned across **history shards** (by workflow ID). Each shard is an independent unit of processing with assigned ownership among History service instances, and within a shard, workflow creates and updates are serialized.

Throughput scales with shard count and service replicas. Shard count is fixed at cluster provisioning time and is sized for the **cluster size you expect to run** and your instance size, not for a target number of workflows, since each shard is owned by exactly one History node. Large deployments run billions of workflow executions per month.

See [Cluster configuration](/docs/operation-guide/setup#static-configuration) for shard sizing guidance.

### 5. Multitenancy through domains and task lists

Cadence is **multitenant by design**. A [domain](/docs/concepts/topology) is the isolation boundary for workflows, task lists, retention, and configuration. Many applications share one cluster; large platforms may host hundreds or thousands of domains on a single deployment.

Isolation works at two levels. A domain acts as a team's overall account, and [task lists](/docs/concepts/task-lists) within it carry their own priority and rate limits. A team can therefore map each use case to its own task list quota instead of maintaining a separate domain per use case.

Priority across task lists makes those quotas elastic rather than fixed. Low priority work automatically waits while higher priority tasks are pending, and expands to use the full quota once the high priority queue drains. Teams get isolation between workloads without stranding capacity.

Domains let platform teams offer Cadence as shared infrastructure while keeping teams logically separated.

### 6. Pluggable persistence and visibility

Cadence separates **execution storage** from **visibility/search**:

| Concern | Options | Role |
| --- | --- | --- |
| Workflow history and tasks | Cassandra, MySQL, PostgreSQL, SQLite (dev) | Source of truth for execution |
| Advanced visibility | OpenSearch, Elasticsearch, Pinot; or SQL/Cassandra predicates | Search, filters, operational dashboards |

Adopters choose backends that match their compliance, residency, and ops standards. Schema tooling (`cadence-sql-tool`, `cadence-cassandra-tool`) and versioned schemas ship with the [server repository](https://github.com/cadence-workflow/cadence/tree/master/schema).

Optional [data archival](/docs/concepts/archival) supports **retention management** by moving closed history to cheaper storage while preserving auditability.

### 7. High availability, low latency, and disaster recovery

Cadence is designed for **production clusters** that must stay available under load and survive regional failures:

- Stateless service tiers scale horizontally behind load balancers for **high availability** and **low-latency** request handling
- **History shard ownership** rebalances as nodes join or leave the cluster
- **[Cross-datacenter replication](/docs/concepts/cross-dc-replication)** and managed failover support **disaster recovery** and region-level continuity for critical domains
- **Dynamic configuration** lets operators tune limits, isolation, and behavior without redeploying binaries

See [Operation guide](/docs/operation-guide/) and [migration](/docs/operation-guide/migration) for multi-cluster operations.

## Operations and adoption

These principles shape how teams run Cadence in production and build on it.

### 1. Operability by default

Production Cadence deployments expose **observability** as a first-class concern: **metrics**, structured **logs**, workflow visibility, and health signals for platform and SRE teams. Dynamic configuration, CLI administration, and Web UI inspection are part of the product surface.

Cadence includes a **built-in Web UI** ([cadence-web](https://github.com/cadence-workflow/cadence-web)) for browsing histories, searching executions, and taking approved workflow actions, with room for deployment-specific customization and integration into org portals.

**Multi-actor operations** are supported out of the box: developers use SDKs, platform teams use APIs and Helm, operators use the Web UI and [CLI](/docs/cli/), and admins use domain and cluster tooling. See [Monitoring](/docs/operation-guide/monitoring) and [Troubleshooting](/docs/operation-guide/troubleshooting).

### 2. Self-hostable and portable

Cadence is **Apache 2.0 licensed** and designed to run **anywhere**: laptop (SQLite), Docker Compose, Kubernetes (Helm), or managed offerings from partners.

Workflow data and execution semantics stay under the adopter's control. There is no required per-execution SaaS pricing model and no dependency on a single vendor's hosted control plane. See [Open source workflow engine](/docs/concepts/open-source-workflow-engine).

### 3. Extension points for platform teams

Cadence exposes stable **APIs, SDKs, and CLI** so platform engineers can embed orchestration in internal developer platforms:

- gRPC/Thrift APIs and [HTTP API](/docs/concepts/http-api) for integration
- [Data converters](/docs/concepts/data-converter) for encryption, compression, and payload shaping
- Admin and workflow commands in the [CLI](/docs/cli/) for automation and operator tooling
- Visibility APIs and Web UI hooks for support and operational workflows

Managed-service wrappers and org-specific guardrails are expected to sit on these primitives.

### 4. Safe evolution of running workflows

Long-lived workflows outlive individual deploys. Cadence invests in **logic versioning**, replay testing, and [shadowing](/docs/codelabs/workflow-tests-go-replayer-shadower) so teams can change code without breaking in-flight executions.

Design docs for larger features (multi-cluster replication, synchronous request-reply patterns, task list scaling) live in the server repo under [`docs/design`](https://github.com/cadence-workflow/cadence/tree/master/docs/design).

## Platform capabilities

The principles above deliver concrete platform capabilities teams rely on in production:

| Capability | What Cadence provides |
| --- | --- |
| **State machine transitions** | Workflow code encodes states and transitions; history records every step |
| **Load distribution / balance** | Task lists and Matching route work across worker pools |
| **Retries** | Activity retry policies; workflow survives crashes and restarts without custom recovery code |
| **Execution resets / replays** | Reset APIs, history replay on workers, operator remediations via CLI and UI |
| **Durability** | Event-sourced state retained for arbitrarily long runtimes |
| **Multi-actor operations** | SDKs for developers, CLI and Web UI for operators, admin APIs for platform teams |
| **Data archival** | Retention policies and archival to long-term storage |
| **Logic versioning** | Safe workflow code changes alongside in-flight executions |
| **Disaster recovery** | Multi-cluster replication and failover for domain continuity |
| **High availability / low latency** | Horizontally scaled, stateless services with shard-based history |
| **Scalability** | Shard partitioning and worker scale-out for very large execution counts |
| **Adaptive operation** | Dynamic config, worker scaling, and tunable limits per domain |
| **Built-in UI** | Cadence Web UI with search, history, and workflow actions |
| **Observability** | Metrics through a pluggable emitter interface (Prometheus, StatsD, M3, and others), structured logging, visibility stores |

## Common workload patterns

Cadence is a general-purpose engine. Production adopters repeatedly apply the same **patterns** across industries. Each links to deeper guides in [Use cases](/docs/use-cases/) and [Primary use cases](/docs/tech-review/day-0-planning/scope/primary-use-cases).

| Pattern | Examples | Learn more |
| --- | --- | --- |
| **Microservices orchestration** | Coordinating calls across many services with sagas and compensation | [Orchestration](/docs/use-cases/orchestration) |
| **Long-running processes** | Provisioning, onboarding, background checks, subscription lifecycles | [Operational management](/docs/use-cases/operational-management), [Provisioning](/docs/use-cases/provisioning) |
| **Synchronous interactions** | Reservation flows, order handling, support routing | [Interactive applications](/docs/use-cases/interactive) |
| **Batch processing** | Monthly reports, data aggregation, large partitioned scans | [Batch job](/docs/use-cases/batch-job), [Storage scan](/docs/use-cases/partitioned-scan) |
| **Distributed cron** | Per-customer schedules, recurring business or infrastructure jobs | [Periodic execution](/docs/use-cases/periodic-execution) |
| **Singleton in distributed systems** | One active workflow per resource; mutex-style coordination | [Provisioning](/docs/use-cases/provisioning) |
| **Infrastructure operations** | Service deployments, region or zone bring-up | [Deployment](/docs/use-cases/deployment) |

Many applications combine several patterns on one shared Cadence cluster.

## Principles summary

**Programming model**

| # | Principle | Summary |
| --- | --- | --- |
| 1 | Meet the user where they are | Workflows feel like local code; familiar primitives, strong infra underneath |
| 2 | Absorb distributed systems overhead | Retries, durability, timers, and recovery are platform concerns |
| 3 | Fault-oblivious workflows | No custom recovery logic for worker or service failures |
| 4 | Deterministic workflows, non-deterministic activities | Replay-safe orchestration; side effects in activities |
| 5 | Event-sourced execution history | State derived from an append-only audit log |
| 6 | First-class external interaction | Signals, queries, timers, and child workflows as primitives |

**Platform architecture**

| # | Principle | Summary |
| --- | --- | --- |
| 1 | Stateless services, durable persistence | Scale server processes; store truth in the database |
| 2 | Separation of orchestration and workers | Server coordinates; user code runs in workers |
| 3 | Built-in task dispatch | Task lists replace mandatory external queues for core flow |
| 4 | Shard-based horizontal scale | Partition executions for throughput at very large cardinality |
| 5 | Multitenancy through domains and task lists | Shared clusters, isolated boundaries, priority-based elastic quotas |
| 6 | Pluggable persistence and visibility | Choose storage, search, and archival backends to fit the org |
| 7 | HA, low latency, and disaster recovery | Replicated, configurable production topologies |

**Operations and adoption**

| # | Principle | Summary |
| --- | --- | --- |
| 1 | Operability by default | Metrics, logs, CLI, built-in UI, multi-actor operations |
| 2 | Self-hostable and portable | Open source, deploy anywhere, no execution tax |
| 3 | Extension points for platform teams | APIs, SDKs, converters, and CLI for internal platforms |
| 4 | Safe evolution of running workflows | Logic versioning and replay tooling for long-lived executions |

## Related documentation

- [Vision & Goals](/docs/tech-review/day-0-planning/scope/vision-goals)
- [Primary use cases](/docs/tech-review/day-0-planning/scope/primary-use-cases)
- [Workflow engine concepts](/docs/concepts/workflow-engine)
- [Workflows](/docs/concepts/workflows)
- [Activities](/docs/concepts/activities)
- [Deployment topology](/docs/concepts/topology)
- [Architecture requirements](/docs/tech-review/day-0-planning/design/architecture-requirements)
- [Cadence server design docs](https://github.com/cadence-workflow/cadence/tree/master/docs/design)
