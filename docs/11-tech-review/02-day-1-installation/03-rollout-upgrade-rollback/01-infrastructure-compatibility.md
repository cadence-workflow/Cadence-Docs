---
layout: default
title: Infrastructure Compatibility
description: How Cadence maintains compatibility with infrastructure and orchestration management tools.
keywords:
  - cadence compatibility
  - cadence kubernetes
  - cadence infrastructure
---

Cadence is a standalone distributed service, not a Kubernetes extension. The server does not use the Kubernetes API, install custom resources, inject sidecars, replace networking, or require a specific cloud. The same release image runs under Kubernetes or another container scheduler, and application workers can run anywhere that can reach the Frontend service.

Compatibility has two boundaries:

- The **Cadence server** depends on its persistence, networking, and optional visibility or archival services.
- A **deployment package**, such as the official Helm chart, can add requirements that the server binary itself does not have.

This distinction matters when reading the tables below. A Helm chart Kubernetes requirement is not a requirement to run Cadence on a VM, and a version exercised in continuous integration is evidence of compatibility rather than the only version an adapter can accept.

## Deployment platforms

| Surface | Current compatibility | Source |
| --- | --- | --- |
| Published server and CLI images | Linux `amd64` and `arm64` | [Image build workflow](https://github.com/cadence-workflow/cadence/blob/master/.github/workflows/docker_publish.yml) |
| Server container | Alpine Linux, non-root user (UID/GID 1000) | [Server Dockerfile](https://github.com/cadence-workflow/cadence/blob/master/Dockerfile) |
| Kubernetes | Official chart currently declares Kubernetes `>=1.29.0-0` | [Chart metadata](https://github.com/cadence-workflow/cadence-charts/blob/main/charts/cadence/Chart.yaml) |
| Other schedulers or VMs | Supported by running release containers or the server binary; no Kubernetes API is required | [Server installation](/docs/get-started/server-installation) |
| Local evaluation | Docker Compose configurations maintained with the server | [Docker deployment files](https://github.com/cadence-workflow/cadence/tree/master/docker) |

The Kubernetes `>=1.29.0-0` minimum is a requirement of the Helm chart, not of the Cadence server. Helm checks the constraint before installation. The minimum reflects Kubernetes features the chart depends on, including the native sidecar form used by the optional database proxy. If Cadence is deployed with different manifests, the server itself does not inspect the Kubernetes version.

The official chart deploys Frontend, History, Matching, and Cadence's internal Worker service independently. It includes optional database, Kafka, Elasticsearch/OpenSearch, Web UI, metrics, RBAC, NetworkPolicy, autoscaling, and disruption-budget configuration. Each dependency can instead be operated outside the release and supplied through connection settings. See the [chart README](https://github.com/cadence-workflow/cadence-charts/tree/main/charts/cadence) and the [Helm deployment codelab](/docs/codelabs/helm-deploy-postgres-opensearch).

## Datastores and search infrastructure

Cadence needs one persistence datastore. Basic visibility uses that datastore as well. Other infrastructure is introduced only when its feature is enabled.

| Capability | Project adapter | Version exercised by current server CI or maintained examples |
| --- | --- | --- |
| Core persistence | Apache Cassandra | Cassandra 4.1 |
| Core persistence | MySQL | MySQL 8.0 |
| Core persistence | PostgreSQL | PostgreSQL 17.4 |
| Local persistence | SQLite | Development and tests only; not a clustered production backend |
| Advanced visibility | Elasticsearch | Elasticsearch 6.8 and 7.9 configurations |
| Advanced visibility | OpenSearch | OpenSearch 2.x |
| Advanced visibility | Apache Pinot | Pinot 1.x server integration; not packaged by the Helm chart |
| Visibility transport | Apache Kafka | Required with Elasticsearch, OpenSearch, or Pinot |

These versions describe current test and example coverage, not an exhaustive compatibility promise. The tested services are pinned in the server's [CI Docker Compose configuration](https://github.com/cadence-workflow/cadence/blob/master/docker/github_actions/docker-compose.yml). The persistence APIs and versioned schemas are the source of truth for an adapter. CockroachDB and TiDB may provide PostgreSQL or MySQL wire compatibility, but Cadence does not ship dedicated plugins or exercise them in project CI, so adopters must validate those combinations themselves.

Schema changes are applied before a new server binary. Operators should use the versioned `cadence-cassandra-tool` or `cadence-sql-tool` rather than relying on the auto-setup image in production. See [Persistence](https://github.com/cadence-workflow/cadence/blob/master/docs/persistence.md), [Cluster configuration](/docs/operation-guide/setup), and [Cluster maintenance](/docs/operation-guide/maintain).

## Network and protocol compatibility

Application clients and workers connect to Frontend. Cadence does not open connections to application workers, so workers need outbound connectivity but no inbound listener for Cadence.

| Endpoint | Default port | Use |
| --- | --- | --- |
| Frontend gRPC | `7833` | Go, Java 4.x, Java 3.x, and Python SDKs; Web and internal clients |
| Frontend TChannel/Thrift | `7933` | Go SDK, Java 3.x, and other TChannel clients. Java 4.x removed TChannel. |
| Frontend HTTP/JSON | `8800` when enabled | Allow-listed HTTP API procedures |
| History gRPC / TChannel | `7834` / `7934` | Internal service traffic |
| Matching gRPC / TChannel | `7835` / `7935` | Internal service traffic |
| Worker membership | `7939` | Ringpop membership; no public Worker API |

Frontend instances are stateless and normally sit behind a load balancer or stable service address. SDK workers use long polls, so load balancers and proxies must allow connections longer than the server's poll interval. Ringpop membership supports static hosts, a host file, DNS A records, DNS SRV records, or a custom bootstrap provider. Server nodes must be able to resolve the bootstrap address and reach one another.

TLS is configurable for clients, internal RPC, replication, Cassandra, MySQL, PostgreSQL, Elasticsearch, and Kafka. Mutual TLS for SDK clients uses the gRPC endpoint. Kafka also supports SASL, and Elasticsearch/OpenSearch supports AWS request signing. These are connection options, not requirements for a particular cloud provider.

## Optional infrastructure

| Feature | Compatible infrastructure |
| --- | --- |
| History and visibility archival | Amazon S3 or S3-compatible storage, Google Cloud Storage, shared filesystem |
| Server metrics | Prometheus, StatsD, or M3 |
| Profiling | Go `pprof` endpoint |
| SDK tracing | OpenTracing in Go and Java; Java also exposes OpenTelemetry context APIs |
| Caller authorization | Pluggable `Authorizer`; shipped no-op and OAuth/JWT implementations |
| Cross-cluster replication | Cadence clusters connected over Frontend RPC; no external replication bus |
| Optional Shard Manager | Currently requires etcd; default Ringpop ownership does not |

Cadence does not require a hosted control plane or project-operated cloud service. Provider-specific adapters, including Google Cloud SQL authentication, Google Cloud Storage, S3, and AWS-signed search requests, are optional ways to connect infrastructure an adopter already runs.

## SDK and worker environments

| SDK | Current runtime baseline | Transport |
| --- | --- | --- |
| Go | Current [`go.mod`](https://github.com/cadence-workflow/cadence-go-client/blob/master/go.mod) declares Go 1.23 | gRPC or TChannel |
| Java | [Supported runtimes](/docs/releases/cadence-java-client) are Java 11, 17, and 21 | gRPC in 3.x and 4.x; TChannel in 3.x only, removed in [4.x](https://github.com/cadence-workflow/cadence-java-client/releases/tag/v4.0.0) |
| Python | [`pyproject.toml`](https://github.com/cadence-workflow/cadence-python-client/blob/main/pyproject.toml) declares Python 3.11 through 3.13 | gRPC |

The SDK runtime and transport belong to the application worker, not the Cadence server host. Workers can run on Kubernetes, VMs, or developer machines. They can be upgraded independently as long as their API version is compatible with the server. For workflow-code upgrades, replay existing histories before rollout because infrastructure compatibility does not protect against nondeterministic workflow code changes.

## How compatibility is checked

Compatibility is re-evaluated through release artifacts and continuous-integration matrices rather than a separately maintained certification list.

| Check | When it runs |
| --- | --- |
| Server persistence, Kafka, and selected search integration suites | On every [push and pull request](https://github.com/cadence-workflow/cadence/blob/master/.github/workflows/ci-checks.yml) to the server repository. Other adapter rows are covered by maintained deployment examples, not by that matrix. |
| SDK language and runtime tests | On every push and pull request to the [Go](https://github.com/cadence-workflow/cadence-go-client/blob/master/.github/workflows/ci-checks.yml), [Java](https://github.com/cadence-workflow/cadence-java-client/blob/master/.github/workflows/ci-checks.yml), and [Python](https://github.com/cadence-workflow/cadence-python-client/blob/main/.github/workflows/ci_checks.yml) SDK repositories. |
| Linux `amd64` and `arm64` images | The [image workflow](https://github.com/cadence-workflow/cadence/blob/master/.github/workflows/docker_publish.yml) builds on pull requests, publishes `master` tags on every push to `master`, and publishes version tags on each GitHub Release. |
| Helm Kubernetes floor | Helm reads `kubeVersion` from `Chart.yaml` at install and upgrade time. |
| Schema compatibility | Operators apply versioned migrations before a new binary. Each server process then verifies that persistence is not older than the binary expects. |

Operators should pin release images and chart versions rather than deploy `master` or `latest`, test datastore and managed-service versions in staging, and recheck the chart's `kubeVersion` and release notes before each upgrade. Cadence server processes are stateless, so a scheduler restart does not discard workflows; durable state remains in persistence while clients and workers reconnect.

## Related documentation

- [Production integrations](/docs/tech-review/day-0-planning/usability/production-integrations)
- [Service dependencies](/docs/tech-review/day-0-planning/design/service-dependencies)
- [Architecture requirements](/docs/tech-review/day-0-planning/design/architecture-requirements)
- [Installation and initialization](/docs/tech-review/day-0-planning/installation/installation-initialization)
- [Cluster configuration](/docs/operation-guide/setup)
- [Cluster maintenance](/docs/operation-guide/maintain)
- [Mutual TLS](/docs/concepts/mutual-tls)
- [Advanced visibility](/docs/concepts/search-workflows)
- [Cross-cluster replication](/docs/concepts/cross-dc-replication)
