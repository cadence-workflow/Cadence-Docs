---
layout: default
title: Production Integrations
description: How Cadence integrates with other projects in a production environment.
keywords:
  - cadence integrations
  - cadence production
  - cadence ecosystem
  - cadence helm
  - cadence kubernetes
  - cadence prometheus
  - cadence opensearch
---

Cadence treats its connections to other software as replaceable interfaces. Persistence, visibility, archival, metrics, serialization, and transport each have more than one implementation, so a cluster runs against systems an organization already operates.

This page covers what Cadence composes with. What a cluster requires to start is in [Service dependencies](/docs/tech-review/day-0-planning/design/service-dependencies).

## Integration summary

**Deployment.** The project maintains a [Helm chart](https://github.com/cadence-workflow/cadence-charts) that deploys the four server services and, optionally, the Web UI. It needs Kubernetes 1.29 or later and declares six optional subcharts, so a cluster installs whole or points at external datastores. Autoscaling, disruption budget, network policy, and RBAC templates ship with it.

**Databases.** Workflow history lives in Apache Cassandra, MySQL, or PostgreSQL. CockroachDB and TiDB work through PostgreSQL and MySQL compatibility.

**Search and messaging.** Listing workflows by complex predicates uses Elasticsearch, OpenSearch, or Apache Pinot as a visibility store, with Apache Kafka carrying records to the search index.

**Observability.** Cadence emits Prometheus metrics by default, with StatsD and M3 as alternatives. The chart offers a ServiceMonitor for Prometheus Operator and a PodMonitoring resource for Google Cloud Managed Service for Prometheus. Reference [Grafana dashboards](/docs/get-started/grafana-helm-setup) are published, and the Go client carries OpenTracing instrumentation validated against Jaeger.

**Security and transport.** TLS is configurable on every connection Cadence opens, covering PostgreSQL, MySQL, Cassandra, Elasticsearch, and Kafka. Clients reach the frontend over [mutual TLS](/docs/concepts/mutual-tls). Kafka accepts SASL, managed search endpoints accept AWS request signing, and a proxy sidecar allows cloud IAM authentication instead of stored passwords.

**Long-term storage.** Closed histories archive to a local filesystem, Amazon S3, S3-compatible storage, or Google Cloud Storage. Large payloads can move to an external blob store through a custom [data converter](/docs/concepts/data-converter).

**Clients and protocols.** The gRPC API is primary, with Thrift over TChannel retained for older workers and an [HTTP API](/docs/concepts/http-api) for non-gRPC callers. Go, Java, and Python clients are maintained in the project organization, Ruby is community maintained, and .NET and TypeScript are in development.

**Documented gaps.** Cadence documents no OpenTelemetry integration, no Kubernetes operator for the server, and no guidance for running behind a service mesh. Tracing is documented for the Go client only.

## Integration details

### Deployment and orchestration

The chart is versioned separately from the server. At [chart `1.6.7`](https://github.com/cadence-workflow/cadence-charts/blob/cadence-1.6.7/charts/cadence/Chart.yaml) the packaged server is `v1.4.1` and the Web UI is `v4.0.11`. The `kubeVersion` floor of 1.29 comes from the native sidecar init container pattern the database proxy relies on.

Each backing service is declared as a conditional subchart and defaults to off except the primary database, which keeps a default install small while leaving the full stack one flag away. Defaults below come from [`values.yaml`](https://github.com/cadence-workflow/cadence-charts/blob/cadence-1.6.7/charts/cadence/values.yaml) at that tag.

| Subchart | Source | Default | Purpose |
| --- | --- | --- | --- |
| `cassandra` | Bitnami | Enabled | Primary persistence |
| `postgresql` | Bitnami | Disabled | Primary persistence |
| `mysql` | Bitnami | Disabled | Primary persistence |
| `elasticsearch` | Bitnami | Disabled | Advanced visibility |
| `opensearch` | OpenSearch project | Disabled | Advanced visibility |
| `kafka` | Bitnami | Disabled | Visibility record transport |

Setting `cassandra.enabled=false` and supplying connection details points the cluster at an externally managed database, which is the expected production arrangement. Schema initialization runs as a Kubernetes Job with version auto-detection and can be disabled where schemas are managed by a separate migration process.

Server and Web UI containers run as a non-root user with privilege escalation disabled and capabilities dropped. ServiceAccount creation is on by default, while RBAC and NetworkPolicy resources are off so that organizations managing those centrally are not overridden.

Outside Kubernetes, Cadence is distributed as container images on Docker Hub and runs under Docker Compose for local work. See [Server installation](/docs/get-started/server-installation) and the [Helm codelab](/docs/codelabs/helm-deploy-postgres-opensearch) for a worked deployment against PostgreSQL and OpenSearch.

### Persistence and visibility

Cadence separates execution storage from search. The [pluggable backends table](/docs/tech-review/day-0-planning/design/design-principles) in the design principles page lists the current options for each, and [Searching workflows](/docs/concepts/search-workflows) covers the difference between basic listing and advanced visibility.

Advanced visibility adds two components. On the write path the history service appends visibility records to a Kafka topic, and the internal worker service consumes that topic and batch-writes into the search index. Reads go from the frontend to the index directly. Both Elasticsearch v7 and OpenSearch 2 are wired in the chart. Pinot is supported by the server as a visibility store but is not part of the chart.

### Observability

| Integration | Mechanism | Support |
| --- | --- | --- |
| Prometheus | Metrics endpoint on port 9090, enabled by default | Project maintained |
| Prometheus Operator | `ServiceMonitor` resource, opt-in | Project maintained |
| Google Cloud Managed Service for Prometheus | `PodMonitoring` resource, opt-in | Project maintained |
| Grafana | Reference dashboards and Helm setup guide | Project maintained |
| StatsD, M3 | Alternative metrics emitters selected by config | Project maintained |
| OpenTracing, Jaeger | Go client tracing interceptor | Project maintained |
| Datadog | Dashboard templates, scraping the Prometheus endpoint | Third party |
| Go `pprof` | Profiling endpoint, opt-in per service | Project maintained |

Metric emission is chosen by configuration rather than compiled in, so an organization standardized on StatsD or M3 does not need a Prometheus deployment. [Monitoring](/docs/operation-guide/monitoring) covers the signals themselves and [Tracing](/docs/go-client/tracing) covers the Go interceptor.

### Security and transport

TLS configuration follows one shape across every backing service, taking a CA file, an optional client certificate and key for mutual authentication, hostname verification, and a server name override. Certificates mount from Kubernetes Secrets through the chart's shared volume definitions, which lets one bundle cover several services. The chart's [TLS guide](https://github.com/cadence-workflow/cadence-charts/blob/cadence-1.6.7/charts/cadence/docs/TLS.md) works through each service in turn.

Authentication to managed cloud services has three documented paths. Elasticsearch and OpenSearch endpoints fronted by AWS accept request signing. A database proxy sidecar handles Google Cloud SQL, including IAM database authentication that removes stored passwords. Kafka accepts SASL credentials.

Cloud provider coverage is uneven at present. Google Cloud has a [full deployment guide](https://github.com/cadence-workflow/cadence-charts/blob/cadence-1.6.7/charts/cadence/docs/gcp/deploying-with-cloud-sql.md) with four connection modes, while AWS and Azure appear as configuration options without equivalent walkthroughs. Operator-facing authorization is separate from all of this, and the [CLI](/docs/cli) accepts JWT credentials for administrative commands.

### Archival and payload storage

History and visibility archival are configured independently, and each selects its own provider. The filestore provider writes to a mounted volume. `s3store` covers Amazon S3 and any S3-compatible endpoint, taking an explicit endpoint and a path-style flag for the latter. `gstorage` targets Google Cloud Storage. See [Archival](/docs/concepts/archival).

Payload handling is a client concern rather than a server one. A custom [data converter](/docs/concepts/data-converter) can compress, encrypt, or replace large payloads with a claim check pointing at an external object store, which keeps workflow histories small without the server needing to know the storage system.

### Clients, protocols, and support tiers

| Integration | Notes | Support |
| --- | --- | --- |
| gRPC and Protobuf | Primary API, definitions in `cadence-idl` | Project maintained |
| Thrift over TChannel | Retained for older workers | Project maintained |
| HTTP API | Selected methods over HTTP and JSON, server v1.2.0 and later | Project maintained |
| Go, Java, Python clients | Include in-memory test environments and replay tooling | Project maintained |
| Ruby client | Community contributed | Community |
| .NET and TypeScript clients | In development | Community |
| iWF | State machine and DSL layer built on Cadence | Third party |

Every maintained client ships a test environment that runs workflows in process, and the Go and Java clients add replay and shadowing tools that verify code changes against recorded production histories. See the [replay and shadowing codelab](/docs/codelabs/workflow-tests-go-replayer-shadower).

Cadence runs as one cluster or several. [Cross-datacenter replication](/docs/concepts/cross-dc-replication) connects clusters for regional failover, and managed Cadence offerings from third parties build on the same open source server and APIs.

## Related documentation

- [Service dependencies](/docs/tech-review/day-0-planning/design/service-dependencies)
- [Target persona interactions](/docs/tech-review/day-0-planning/usability/persona-interactions)
- [Design principles](/docs/tech-review/day-0-planning/design/design-principles)
- [Cluster configuration](/docs/operation-guide/setup)
- [Topology](/docs/concepts/topology)
