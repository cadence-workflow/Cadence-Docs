---
layout: default
title: Service Dependencies
description: Specific service dependencies Cadence relies on in the cluster.
keywords:
  - cadence dependencies
  - cadence cassandra
  - cadence kafka
  - cadence elasticsearch
  - cadence infrastructure
---

Cadence is a **self-contained distributed service**, not a cluster add-on. It defines no custom resources, requires no access to a Kubernetes API server, and installs no controller or operator into the environment that hosts it. It runs on Kubernetes, VMs, bare metal, or a laptop.

The question this page answers is therefore not "what does Cadence install into your cluster" but **"what else has to be running for a Cadence cluster to work."** The short answer is: **one database, and nothing else.** Everything beyond that is opted into by enabling a feature.

For the server components themselves and how they are laid out, see [Architecture requirements](/docs/tech-review/day-0-planning/design/architecture-requirements) and [Deployment topology](/docs/concepts/topology).

## Required dependencies

### A persistence datastore

A Cadence cluster requires exactly one external service: a database. It holds workflow mutable state, event histories, task lists, domain metadata, and cluster configuration.

| Backend | Status | Notes |
| --- | --- | --- |
| **Cassandra** | Production | CI covers 4.1 |
| **MySQL** | Production | CI covers 8.0 |
| **PostgreSQL** | Production | CI covers 17.4 |
| **SQLite** | Development only | Single node, cannot be clustered; SQLite's exclusive write locks mean one shared connection pool per process |
| MongoDB, DynamoDB | In progress | Plugins exist but are [not yet complete](https://github.com/cadence-workflow/cadence/blob/master/docs/persistence.md) |

Persistence sits behind a plugin interface, so the backend is a configuration choice rather than a build-time one. Versioned schemas and the `cadence-cassandra-tool` and `cadence-sql-tool` utilities ship with the [server repository](https://github.com/cadence-workflow/cadence/tree/master/schema).

By default the same datastore also serves **basic visibility** — listing and filtering workflows by workflow ID, workflow type, status, and time range. A separate visibility backend is only needed for search on custom attributes, described below.

## What Cadence does not require

The absence of these dependencies is a deliberate design choice, and it shapes what an adopter has to operate.

| Not required | Why |
| --- | --- |
| **etcd, ZooKeeper, or Consul** | Cluster membership uses [Ringpop](https://github.com/uber/ringpop-go), a gossip protocol compiled into the server binary. There is no external coordination service to run, secure, or upgrade. |
| **An external message broker for core orchestration** | Workflow and activity task dispatch runs through internal task lists owned by the Matching service. See [Built-in task dispatch](/docs/tech-review/day-0-planning/design/design-principles#3-built-in-task-dispatch). |
| **A Kubernetes API server, CRDs, or an operator** | Cadence is not a cluster extension. The server has no Kubernetes client dependency and makes no Kubernetes API calls. |
| **A hosted control plane or vendor account** | Cadence is Apache 2.0 and fully self-hosted. It emits no telemetry and phones no service home. See [Sovereignty](/docs/tech-review/day-0-planning/design/sovereignty). |
| **A separate service for cross-region replication** | Cross-cluster replication moves data between Cadence clusters using a database-backed replication queue. It adds no third-party infrastructure. |

Peers discover each other through one of five Ringpop bootstrap modes — a static host list, a JSON file, DNS A records, DNS SRV records, or a custom provider — so the only network requirement is that server nodes can reach one another and resolve a seed address.

## Optional dependencies

Each of the following is introduced by turning on a specific feature. A cluster that uses none of them runs completely on its single datastore.

| Feature | Dependency | Required when |
| --- | --- | --- |
| [Advanced visibility](/docs/concepts/search-workflows) | OpenSearch, Elasticsearch, or Pinot — **and a message bus (Kafka)** | Searching or filtering workflows by custom search attributes |
| [Archival](/docs/concepts/archival) | Amazon S3, Google Cloud Storage, or a shared filesystem | Retaining closed workflow history beyond the domain retention period |
| [Async workflow APIs](https://github.com/cadence-workflow/cadence/blob/master/docs/howtos/async-api.md) | Kafka | Accepting workflow starts through a queue rather than a synchronous call |
| Metrics | Prometheus, StatsD, or M3 | Collecting server metrics |
| Authentication | An OIDC or OAuth provider | Enforcing caller identity at the Frontend |
| [Web UI](https://github.com/cadence-workflow/cadence-web) | The `cadence-web` service | Browsing workflows through a browser rather than the CLI |

### Advanced visibility requires a message bus

This is the dependency adopters most often miss, so it is worth stating plainly: **enabling advanced visibility adds two services, not one.**

The write path is asynchronous by design. When a workflow starts, closes, or is updated, the visibility record is published to a message topic rather than written to the index inline. The internal Worker service consumes that topic and bulk-writes batches into the search backend. This keeps index latency and availability off the critical path of starting a workflow, at the cost of a second piece of infrastructure and eventual consistency in search results.

In the open-source build that message bus is **Kafka**, and the same applies to Elasticsearch, OpenSearch, and Pinot alike. The producer sits behind a `messaging.Producer` interface, so organizations running a custom build can substitute their own transport without changing the visibility code.

Adopters who do not need custom search attributes should leave advanced visibility off and use basic visibility on the core datastore, which requires nothing extra.

### Archival

[Archival](/docs/concepts/archival) copies closed workflow histories and visibility records to cheaper long-term storage before retention deletes them. Providers are pluggable: Amazon S3, Google Cloud Storage, or a filesystem path. The filesystem provider writes to local disk, so the archive path must be writable from **every host that can perform an archival, which includes the History service and not only the Worker**. Visibility records are archived inline from History; history archival runs in a Worker system workflow by default but also falls back to an inline write from History when the history is small enough. The object-store providers need only credentials and network reachability. Archival is disabled by default.

### Metrics

Metrics are emitted through a pluggable interface with implementations for Prometheus, StatsD, and M3. Prometheus scrapes the server; StatsD and M3 push to a collector. No metrics backend is needed for Cadence to function — only to observe it. See [Monitoring](/docs/operation-guide/monitoring).

### Authentication

Cadence does not run an identity provider. The OAuth authorizer validates JWTs signed by an external OIDC or OAuth provider against a public key you configure, which is the path for normal callers.

There is one exception worth knowing: the CLI can sign **admin JWTs** itself using a configured private key, and the server recognizes these as internally issued. A deployment that only needs operator access can therefore enforce identity without standing up an external provider. See [Identity and access management](/docs/tech-review/day-0-planning/design/iam).

## Internal components

These are parts of Cadence rather than dependencies on other systems. All four roles are built from the same binary and can run as one process for development or as four independently scaled deployments in production.

| Component | Role | Default ports |
| --- | --- | --- |
| **Frontend** | Public API surface; authentication, rate limiting, routing | 7933 Thrift, 7833 gRPC |
| **History** | Owns workflow execution state and history shards | 7934 Thrift, 7834 gRPC |
| **Matching** | Task list management and task dispatch to workers | 7935 Thrift, 7835 gRPC |
| **Worker** | Internal system workflows, replication, visibility indexing, archival | 7939, membership only — the Worker serves no RPC API |

They communicate over YARPC (gRPC and Thrift) and locate each other through Ringpop. Two further components sit outside the server but are also Cadence rather than third-party infrastructure:

- **Application workers** — your processes, running your workflow and activity code, polling task lists. Cadence never executes user code inside the server.
- **[cadence-web](https://github.com/cadence-workflow/cadence-web)** — the optional browser UI, deployed separately and talking to the Frontend over the normal API.

## Dependency summary

| Dependency | Required | Introduced by |
| --- | --- | --- |
| Datastore (Cassandra, MySQL, PostgreSQL) | **Yes** | The cluster itself |
| Search backend (OpenSearch, Elasticsearch, Pinot) | No | Advanced visibility |
| Kafka | No | Advanced visibility, async workflow APIs |
| Object store or shared filesystem | No | Archival |
| Metrics backend | No | Observability |
| OIDC / OAuth provider | No | Authentication |
| `cadence-web` | No | Browser UI |
| Coordination service (etcd, ZooKeeper, Consul) | **Never** | — |
| Kubernetes API access, CRDs, operator | **Never** | — |

A minimal production cluster is therefore Cadence plus one database. A full-featured one adds a search backend, Kafka, an object store, a metrics backend, an identity provider, and the Web UI — each independently, and each only when the corresponding feature is wanted.

Worked configuration examples for every combination live in [`config/`](https://github.com/cadence-workflow/cadence/tree/master/config), with matching Docker Compose files in [`docker/`](https://github.com/cadence-workflow/cadence/tree/master/docker).

## Related documentation

- [Architecture requirements](/docs/tech-review/day-0-planning/design/architecture-requirements)
- [Storage requirements](/docs/tech-review/day-0-planning/design/storage-requirements)
- [Design principles](/docs/tech-review/day-0-planning/design/design-principles)
- [Deployment topology](/docs/concepts/topology)
- [Search workflows](/docs/concepts/search-workflows)
- [Archival](/docs/concepts/archival)
- [Cadence server persistence docs](https://github.com/cadence-workflow/cadence/blob/master/docs/persistence.md)
- [Cadence server configuration samples](https://github.com/cadence-workflow/cadence/tree/master/config)
