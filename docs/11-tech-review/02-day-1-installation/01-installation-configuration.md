---
layout: default
title: Installation & Configuration
description: What Cadence installation and configuration look like in practice.
keywords:
  - cadence installation configuration
  - cadence setup
  - cadence deployment configuration
---

Installation methods and validation are covered in the [Day 0 Installation](/docs/tech-review/day-0-planning/installation/installation-initialization) and [Validation](/docs/tech-review/day-0-planning/installation/validation) sections. This page describes the configuration and deployment setup that follows.

## Persistence

The persistence database (Cassandra, MySQL, or PostgreSQL) is selected at install time. See the [persistence documentation](https://github.com/cadence-workflow/cadence/blob/master/docs/persistence.md) for production configuration including multi-database sharding.

## Server configuration

Cadence configuration has two layers: static YAML loaded at startup and [dynamic configuration](/docs/operation-guide/setup#dynamic-configuration) that is hot-reloadable without restarts. See [Cluster Configuration](/docs/operation-guide/setup) for the full reference.

## Deployment configuration

For Helm deployments, the [`cadence-charts` examples directory](https://github.com/cadence-workflow/cadence-charts/tree/main/charts/cadence/examples) provides ready-made values files for Cassandra, MySQL, PostgreSQL, Elasticsearch/OpenSearch, Cloud SQL, TLS, and metrics. The [Helm deployment codelab](/docs/codelabs/helm-deploy-postgres-opensearch) walks through a complete Kubernetes setup. For Docker-based deployments, see the [Docker README](https://github.com/cadence-workflow/cadence/blob/master/docker/README.md).

## Post-install setup

After installation, the only required step is [domain registration](/docs/get-started/server-installation). For production, adopters also configure [monitoring](/docs/operation-guide/monitoring) and optionally enable [advanced visibility](/docs/concepts/search-workflows) and [archival](/docs/concepts/archival).

## Related documentation

- **[Cluster Configuration](/docs/operation-guide/setup)**: static and dynamic configuration reference
- **[Cluster Maintenance](/docs/operation-guide/maintain)**: schema upgrades, scaling, and server upgrades
- **[Helm chart README](https://github.com/cadence-workflow/cadence-charts/blob/main/charts/cadence/README.md)**: `values.yaml` reference
- **[Persistence documentation](https://github.com/cadence-workflow/cadence/blob/master/docs/persistence.md)**: production database configuration
