---
layout: default
title: Installation & Initialization
description: How Cadence is installed and initialized, from minimal setups to complex integrations.
keywords:
  - cadence installation
  - cadence initialization
  - cadence setup
---

Cadence offers several installation paths, from a single binary with zero external dependencies to production-grade Kubernetes deployments. The right path depends on the adopter's stage: local evaluation, development and testing, or production.

## Server installation methods

| Method | Best for |
| --- | --- |
| **Local binary** | Fastest evaluation, local development |
| **Docker Compose** | Trying the full stack locally (server + persistence + UI + metrics) |
| **Kubernetes / Helm** | Staging and production deployments |

### Local binary (minimal install)

For quick evaluation, Cadence can be built and run directly from source:

```bash
git clone https://github.com/cadence-workflow/cadence.git
cd cadence
make bins
make install-schema-sqlite
./cadence-server --zone sqlite start
```

The server starts all four services (frontend, history, matching, worker) on their [default ports](https://github.com/cadence-workflow/cadence/blob/master/config/development.yaml). This is a single-node setup with an embedded database suitable for local development and evaluation.

The [Web UI](https://github.com/cadence-workflow/cadence-web) is a separate project and is not included in the local binary build. Use Docker Compose or Helm for a setup that includes the UI. See the [server README](https://github.com/cadence-workflow/cadence/blob/master/README.md) and [Get Started](/docs/get-started/) for full details.

### Docker Compose

Docker Compose runs the Cadence server, a persistence backend (Cassandra by default), the Web UI, and an observability stack (Prometheus + Grafana) with a single command:

```bash
git clone https://github.com/cadence-workflow/cadence.git
cd cadence/docker && docker compose up
```

The [`docker/`](https://github.com/cadence-workflow/cadence/tree/master/docker) directory includes alternate Compose files for different persistence backends, advanced visibility, metrics, multi-cluster replication, and operational testing. For production Docker usage, use the `auto-setup` image tag for initial schema creation and a release-tagged image for steady-state operation. See the [server README](https://github.com/cadence-workflow/cadence/blob/master/README.md) and the [Docker README](https://github.com/cadence-workflow/cadence/blob/master/docker/README.md) for the full reference.

### Kubernetes / Helm

Cadence publishes a Helm chart that deploys the server (frontend, history, matching, and worker services), schema setup jobs, and optional subcharts for Cassandra, MySQL, PostgreSQL, Elasticsearch, OpenSearch, and Kafka:

```bash
helm repo add cadence https://cadence-workflow.github.io/cadence-charts
helm repo update
helm install cadence-release cadence/cadence -n cadence --create-namespace
```

The chart defaults to Cassandra with automatic schema initialization. Switching to PostgreSQL or MySQL requires setting the appropriate subchart and persistence driver values. Example values files are provided for common configurations (Cassandra with PVCs, MySQL, PostgreSQL, PostgreSQL + Elasticsearch/OpenSearch, Cloud SQL, TLS, and metrics). See the [Helm chart README](https://github.com/cadence-workflow/cadence-charts/blob/main/charts/cadence/README.md) for the full `values.yaml` reference and the [Helm deployment codelab](/docs/codelabs/helm-deploy-postgres-opensearch) for a step-by-step walkthrough on GKE. [Production integrations](/docs/tech-review/day-0-planning/usability/production-integrations) covers the subchart inventory and what each backing service connects to.

## CLI installation

The Cadence CLI (`cadence`) is the primary tool for domain, workflow, tasklist, and cluster operations. It can be installed independently of the server:

| Method | Command |
| --- | --- |
| **Homebrew** | `brew install cadence-workflow` |
| **Docker** | `docker run --rm ubercadence/cli:<version>` |
| **From source** | [`make cadence`](https://github.com/cadence-workflow/cadence/blob/master/Makefile) in the server repository |

## Initialization

After installation, the main initialization step is **domain registration**. A domain is the unit of isolation and configuration in Cadence (analogous to a namespace):

```bash
cadence --domain my-domain domain register --retention 7
```

For Helm deployments where the CLI is not installed locally, use `kubectl exec` against the frontend pod:

```bash
kubectl exec -it deployment/cadence-release-frontend -- \
  cadence --domain my-domain domain register --retention 7
```

No additional configuration is required for a minimal working setup. For production, adopters configure persistence backends, `numHistoryShards` (set once at cluster creation and immutable afterward), cluster metadata for multi-region replication, archival, advanced visibility, and dynamic configuration. See [Cluster Configuration](/docs/operation-guide/setup) for the full production configuration reference.

## Deployment components

The Cadence server runs four logical services (frontend, history, matching, and worker) which can run as a single combined process or be split across dedicated processes for production scale.

Beyond the server, a complete deployment includes:

| Component | Role | Required |
| --- | --- | --- |
| **Persistence database** | Durable storage for workflow execution state. Supports Cassandra, MySQL, PostgreSQL, or SQLite (local development only). | Yes |
| **Application workers** | User-provided services that host workflow and activity implementations via Cadence SDKs (Go, Java, Python). | Yes (to run workflows) |
| **Advanced visibility store** | Elasticsearch or OpenSearch, with Kafka for event streaming. Enables rich workflow search queries beyond basic listing. | No |
| **Web UI** | Browser-based interface for inspecting and managing workflows, domains, and tasklists. Bundled in Docker Compose and Helm deployments. | No |
| **Metrics stack** | Prometheus + Grafana (default in Docker Compose), Statsd + Graphite, or M3. | No (recommended for production) |

## Related documentation

- **[Get Started](/docs/get-started/)**: 5-minute quickstart
- **[Server Installation](/docs/get-started/server-installation)**: Docker Compose setup with domain registration and troubleshooting
- **[Helm deployment codelab](/docs/codelabs/helm-deploy-postgres-opensearch)**: step-by-step Kubernetes walkthrough
- **[Production integrations](/docs/tech-review/day-0-planning/usability/production-integrations)**: subchart inventory, observability, security, and client support tiers
- **[Cluster Configuration](/docs/operation-guide/setup)**: production configuration (static config, dynamic config, persistence, replication)
- **[Docker README](https://github.com/cadence-workflow/cadence/blob/master/docker/README.md)**: Docker Compose variants and production `docker run` reference
- **[Helm chart README](https://github.com/cadence-workflow/cadence-charts/blob/main/charts/cadence/README.md)**: full `values.yaml` reference and chart dependencies
