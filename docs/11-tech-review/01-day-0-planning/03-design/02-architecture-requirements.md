---
layout: default
title: Architecture Requirements
description: Cadence architecture requirements across PoC, development, test, staging, and production environments.
keywords:
  - cadence architecture
  - cadence requirements
  - cadence deployment environments
---

This page outlines what Cadence requires to run and how those requirements change as you move from a proof of concept to production.

Related pages cover adjacent topics in more depth: [Service dependencies](/docs/tech-review/day-0-planning/design/service-dependencies) for the external services Cadence talks to, [Resource requirements](/docs/tech-review/day-0-planning/design/resource-requirements) and [Storage requirements](/docs/tech-review/day-0-planning/design/storage-requirements) for sizing, and [High availability](/docs/tech-review/day-0-planning/design/high-availability) for replication and failover.

## What stays the same in every environment

Cadence ships as a **single server binary** that hosts four service roles. The same binary, the same roles, and the same client API are used in a laptop deployment and in a large production cluster.

| Service role | Responsibility |
| --- | --- |
| Frontend | Stateless API gateway for SDK clients, workers, CLI, and the Web UI. Expects an external load balancer in production. |
| History | Owns workflow state machines and history shards. The core of orchestration. |
| Matching | Matches workflow and activity tasks to polling workers through task lists. |
| Worker | Runs Cadence's own internal workflows: archival, replication, scanners, and visibility indexing. |

You select roles per process with `--services=frontend,history,matching,worker` (or the `SERVICES` environment variable in Docker). Omitting the flag runs all four in one process, which is what the local Docker Compose setup does.

**All Cadence service instances are stateless.** Durable state lives in the database, so any instance can be replaced without losing workflow data, and capacity is added by running more instances.

Membership and shard ownership are in transition. Cluster membership still uses a **ringpop gossip ring** seeded from bootstrap addresses. Shard assignment is moving to [Shard Manager](https://github.com/cadence-workflow/shard-manager), a dedicated service that assigns shards to hosts and rebalances as hosts come and go.

Shard Manager currently requires **etcd**. That etcd dependency is planned to be removed in early 2027, when Shard Manager is generally available.

Because the API surface does not change between tiers, workflow and activity code written against a local deployment runs unchanged against a production cluster. What changes is how many instances of each role you run, which optional dependencies you enable, and how the datastore is provisioned.

See [Deployment topology](/docs/concepts/topology) for the full component picture.

## Required and optional components

| Component | Status | Notes |
| --- | --- | --- |
| Persistence datastore | **Required** | Cassandra, MySQL, or PostgreSQL for real deployments. SQLite is supported for local development only. |
| Metrics backend | **Required for production** | Prometheus, StatsD, or M3. Cadence is not practically operable without it. |
| Advanced visibility store | Optional | Elasticsearch, OpenSearch, or Pinot. Needed for custom search attributes and rich list queries. |
| Kafka | Required **with** advanced visibility | History writes visibility records to Kafka; the worker service indexes them into the search store. |
| Blobstore | Optional | Filestore, S3, or GCS, used by [archival](/docs/concepts/archival). |
| Web UI | Optional, recommended | Deployed separately; connects outbound to Frontend over gRPC. |
| CLI | Optional, recommended | Primary operator and support tool. |
| etcd | Not default, needed with Shard Manager | Required today when using [Shard Manager](https://github.com/cadence-workflow/shard-manager). Planned to be removed in early 2027 when Shard Manager is generally available. |

Cadence's minimum dependency is a single database. **Basic visibility** is backed by that same database and is enough to list and filter workflows. [Advanced visibility](/docs/concepts/search-workflows) is what adds custom search attributes and SQL-like queries, and enabling it is what pulls Kafka and a search store into your dependency set. A Matching deployment on Shard Manager currently adds etcd as well.

## Requirements by environment

| Concern | Proof of concept | Development | Test/Staging | Production |
| --- | --- | --- | --- | --- |
| Server processes | One, all four roles | One, all four roles | Separated by role, small counts | Separated by role, 4+ nodes each for Frontend, History, and Matching |
| Persistence | SQLite or single-node Cassandra | Single-node datastore | Same engine as production | Replicated, quorum-configured, operated datastore |
| Visibility | Basic | Basic, or advanced if the code uses search attributes | Same mode as production | Chosen mode, sized for query load |
| Schema management | Auto-setup image | Auto-setup image | Managed with schema tools | Managed with schema tools, applied before binaries |
| Metrics | Bundled Prometheus and Grafana | Optional | Production monitoring stack | Monitoring plus alerting on SLOs |
| Data durability | Not a goal | Not a goal | Expected to survive restarts | Backed up and, if needed, archived |

### Proof of concept

The goal is to run a workflow end to end and see it in the UI. A single process running all four roles against SQLite or a single-node Cassandra is enough. The Docker Compose setups in the server repository bring up Cadence, the Web UI, Prometheus, and Grafana together, which is the fastest path to a working cluster. Skip Kafka, advanced visibility, and archival at this stage.

Start with [Get started](/docs/get-started/) or [Server installation](/docs/get-started/server-installation), and see [Deployment options](/docs/concepts/open-source-workflow-engine#deployment-options) for the range of local setups.

### Development

Development has the same architectural shape as a proof of concept, so the useful decisions are about isolation rather than topology. Cadence is multitenant, so a shared development cluster should give each team its own [domain](/docs/concepts/topology) rather than its own cluster.

Add advanced visibility locally only if your workflows use search attributes, since it requires Kafka and a search store alongside the datastore. The local Elasticsearch setup needs Docker memory raised above 6 GB.

### Test/Staging

Test/Staging environments should match the **shape** of production rather than its size. Use the same persistence engine, the same visibility mode, and separate deployments per service role, so that load balancing, ringpop bootstrap configuration, and per-service scaling are exercised the way production will exercise them. Manage schemas with `cadence-sql-tool` or `cadence-cassandra-tool` rather than the auto-setup images, which are intended for initial development setup only.

This is also the tier where two things are cheapest to validate:

- **Capacity.** The server repository ships a [bench suite](https://github.com/cadence-workflow/cadence/tree/master/bench), and cluster configuration recommends running it against your own setup whenever the setup changes. Cadence does not publish per-node throughput numbers, so a bench run against your hardware and datastore is the authoritative answer for your deployment.
- **Upgrades and rollback.** Schema changes are applied before server binaries and are generally backward compatible, which is what makes rolling upgrades possible. Rehearse that ordering here.

### Production

Production adds operational structure rather than new architecture:

- Run each service role as its own deployment. Cluster configuration recommends **at least 4 nodes for each of Frontend, History, and Matching** to maintain availability while leaving room to grow.
- Put a load balancer in front of Frontend, and point `ringpop` bootstrap and `publicClient` at the Frontend DNS name so requests spread across all Frontend nodes.
- Use an operated, replicated datastore. If you use database-backed visibility, give it a separate database from the execution store: the execution store requires strong consistency and cannot read from replicas, while the visibility store is eventually consistent and can.
- Enable metrics and alerting. Cadence publishes [SLO recommendations](/docs/operation-guide/monitoring#cadence-service-slo-recommendation) of 99.9% core API availability, core API latency under 1 second, and overall task dispatch latency under 2 seconds.
- Spread nodes across availability zones. Cadence supports a zone-specific configuration layer (`base.yaml`, then the environment file, then the zone file) selected with `$CADENCE_AVAILABILITY_ZONE`.
- For multi-region deployments, use global domains and [cross-DC replication](/docs/concepts/cross-dc-replication). A global domain is active in exactly one cluster at a time and fails over between them.

[Cluster configuration](/docs/operation-guide/setup) and [Cluster maintenance](/docs/operation-guide/maintain) are the primary references for this tier. [Deploy Cadence with Helm on GKE](/docs/codelabs/helm-deploy-postgres-opensearch) is a worked reference deployment using PostgreSQL, Kafka, and OpenSearch.

## Decisions to make before the first production cluster

Most Cadence configuration can be changed later. A few choices are effectively permanent for the life of a cluster or domain, which makes them the real architecture requirements.

| Decision | Why it is hard to change |
| --- | --- |
| `numHistoryShards` | Fixed for the life of the cluster. Changing it requires migrating to a new cluster. |
| Global domains enabled | Local domains aren't recommended. Use Global domains with 1 replica instead. This gives you the freedom of replicating to another cluster if you change your mind in the future |
| Persistence engine | Switching engines is a cluster migration, not a configuration change. |
| Per-domain archival URI | Changing URI later will lead to losing any archived workflows with the old URI |

:::warning[Check numHistoryShards before you create a cluster]
The shipped Docker and Helm defaults set `numHistoryShards` to `4`, which is a development value. Because the number is fixed at provisioning time, a cluster created with 4 shards can never distribute work across more than 4 History nodes, and the only remedy is a migration to a new cluster.

[Cluster configuration](/docs/operation-guide/setup#static-configuration) recommends **1K to 16K** depending on the cluster size you expect, typically **2K for SQL-based persistence and 8K for Cassandra**. Too low caps your maximum cluster size; too high forces a larger initial cluster, since History nodes that own no shards waste resources.
:::

Enabling global domains deserves the same forethought. Even if you run a single cluster and need no replication today, enabling cross-DC replication from the start (using the same name for `masterClusterName` and `currentClusterName`) is what keeps a future datastore or cluster migration straightforward. Converting later is manual, painful and error-prone for domains that were created as local.

## Worker and client requirements

Workflow and activity code runs in **your** processes, not inside the Cadence cluster, so worker requirements are separate from cluster requirements:

- Outbound network access to Frontend over gRPC (default port `7833`) or TChannel (default port `7933`), the service name `cadence-frontend`, a domain, and a task list.
- **No inbound ports.** Workers long poll the Frontend for tasks, and Cadence never dials back into a worker. Workers can run in private subnets or behind NAT.
- Client-side metrics through tally, to Prometheus, M3, or StatsD.
- Optional TLS on the gRPC connection, including [mutual TLS](/docs/concepts/mutual-tls).

Workers scale independently of the cluster, so worker capacity is an application concern rather than a cluster provisioning one. Client SDKs are available for [Go](/docs/go-client/), [Java](/docs/java-client/), and [Python](/docs/python-client/index), with additional clients in the wider ecosystem.

## Related documentation

- [Deployment topology](/docs/concepts/topology)
- [Cluster configuration](/docs/operation-guide/setup)
- [Cluster maintenance](/docs/operation-guide/maintain)
- [Cluster monitoring](/docs/operation-guide/monitoring)
- [Cluster migration](/docs/operation-guide/migration)
- [Deploy Cadence with Helm on GKE](/docs/codelabs/helm-deploy-postgres-opensearch)
- [Search workflows](/docs/concepts/search-workflows)
- [Archival](/docs/concepts/archival)
- [Cross-DC replication](/docs/concepts/cross-dc-replication)
- [Shard Manager](https://github.com/cadence-workflow/shard-manager)
