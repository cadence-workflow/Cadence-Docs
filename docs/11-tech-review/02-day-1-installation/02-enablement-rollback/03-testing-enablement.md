---
layout: default
title: Testing Enablement & Disablement
description: How Cadence tests enablement and disablement of server roles and optional subsystems.
keywords:
  - cadence testing enablement
  - cadence disablement testing
  - cadence docker compose tests
  - cadence helm install testing
---

Cadence is not a Kubernetes extension. It defines no CRDs, installs no admission webhooks, and does not take over the host cluster's control plane. For this project, **enablement** means starting the Frontend, History, Matching, and Worker roles (and optionally turning on subsystems such as advanced visibility or archival). **Disablement** means stopping those processes or turning the optional subsystem off. The operational model is on [Live cluster enablement and rollback](/docs/tech-review/day-1-installation/enablement-rollback/live-cluster-enablement-rollback).

Public continuous integration exercises in-process server bring-up and tear-down against real datastores, and it runs dedicated profiles with optional features configured on. It does not currently automate a Helm install and uninstall cycle on a live Kubernetes cluster. That path is documented for operators and is validated in staged rollout and operator rehearsal rather than by a public chart-install job.

## What is tested where

| Path | What "enable" / "disable" means in the test | Where it runs |
| --- | --- | --- |
| Host integration suites | Start Cadence service processes in-process against Cassandra, MySQL, PostgreSQL, or SQLite; stop them and tear down the test store | Public [CI Checks](https://github.com/cadence-workflow/cadence/blob/master/.github/workflows/ci-checks.yml) via Compose under [`docker/github_actions/`](https://github.com/cadence-workflow/cadence/tree/master/docker/github_actions) |
| Advanced visibility profiles | Bring up Elasticsearch v7, OpenSearch 2, or Pinot (plus Kafka where required) and run integration suites with the indexer / visibility path enabled | Same CI workflow; separate Compose files such as [`docker-compose-es7.yml`](https://github.com/cadence-workflow/cadence/blob/master/docker/github_actions/docker-compose-es7.yml), [`docker-compose-opensearch2.yml`](https://github.com/cadence-workflow/cadence/blob/master/docker/github_actions/docker-compose-opensearch2.yml), and [`docker-compose-pinot.yml`](https://github.com/cadence-workflow/cadence/blob/master/docker/github_actions/docker-compose-pinot.yml) |
| History queue v2 profiles | Integration suite with `history.enableTransferQueueV2` and `history.enableTimerQueueV2` set true in dynamic config | The regular queue-v2 job is standard CI coverage (`ENABLE_QUEUE_V2=true`). The alert variant (`ENABLE_QUEUE_V2_ALERT=true`) is experimental and non-gating: that workflow sets `continue-on-error: true`, so a failure there does not fail the CI run |
| Archival, scheduler, async workflows | Integration configs turn the Worker subsystems on (filestore archival, `worker.enableScheduler`, Kafka async workflow consumer) and exercise those paths | Host suites under [`host/`](https://github.com/cadence-workflow/cadence/tree/master/host); async-WF job in CI Checks |
| Dynamic configuration clients | Unit tests load, poll, and override dynamic keys (including enable/disable style bool and string properties) | Golang unit-test job in CI Checks |
| Local contributor Compose | `docker compose -f docker/dev/*.yml up` then `down` for dependency enablement and cleanup | Documented in [CONTRIBUTING.md](https://github.com/cadence-workflow/cadence/blob/master/CONTRIBUTING.md); not a required public CI job |
| Packaged server Compose | `docker compose up` / `down` for full local stacks, including feature overlays (ES, archival, HTTP API, canary, bench) | Documented in the [Docker README](https://github.com/cadence-workflow/cadence/blob/master/docker/README.md); canary and bench are not jobs in public CI Checks |
| Helm chart | `helm install` / `helm delete` (uninstall) of the [cadence-charts](https://github.com/cadence-workflow/cadence-charts) release | Documented in the [chart README](https://github.com/cadence-workflow/cadence-charts/blob/main/README.md). Public chart CI publishes releases and shellchecks schema scripts; it does **not** run an automated install/uninstall test suite |
| Staged pre-release rollout | Candidate builds are enabled in real clusters (development, staging, production) before a stable GitHub Release | Same staged path described on [Upgrade and rollback testing](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/upgrade-rollback-testing) |

## Public CI: Compose-backed integration enablement

Server [CI Checks](https://github.com/cadence-workflow/cadence/blob/master/.github/workflows/ci-checks.yml) start dependency containers with Docker Compose, run a test container against them, and exit. Typical commands look like:

```bash
docker compose -f docker/github_actions/docker-compose.yml run integration-test-cassandra \
  bash -c "make .just-build && make cover_integration_profile"
```

[`docker/github_actions/docker-compose.yml`](https://github.com/cadence-workflow/cadence/blob/master/docker/github_actions/docker-compose.yml) defines Cassandra, MySQL, PostgreSQL, Kafka, Elasticsearch, and the integration-test services. Separate Compose files swap in Elasticsearch 7, OpenSearch 2, or Pinot for visibility-focused jobs. Those Compose services are ephemeral to the GitHub Actions runner and are discarded when the job ends. That is the project's automated proof that a revision can **enable** Cadence against those backends and stop the in-process services cleanly in teardown.

Inside each suite, enablement is the in-process cluster start in [`host/testcluster.go`](https://github.com/cadence-workflow/cadence/blob/master/host/testcluster.go) and [`host/onebox.go`](https://github.com/cadence-workflow/cadence/blob/master/host/onebox.go). Disablement of that test cluster is `TearDownCluster()`, which calls `host.Stop()` (Frontend, History, Matching, and any enabled Worker subsystems such as replicator, archiver, or scheduler), closes the dynamic-config client's `doneCh`, tears down the persistence test store, and removes temporary archival directories.

Local reproduction of the same Compose runners is documented under [`docker/github_actions/README.md`](https://github.com/cadence-workflow/cadence/blob/master/docker/github_actions/README.md). Contributor dependency-only stacks use `docker/dev/*.yml` with explicit `up` and `down` steps in [CONTRIBUTING.md](https://github.com/cadence-workflow/cadence/blob/master/CONTRIBUTING.md).

History and replication [simulation workflows](https://github.com/cadence-workflow/cadence/tree/master/.github/workflows) also start disposable environments for specific scenarios (including queue v2 history scenarios). They validate subsystem behavior after enablement; they are not a substitute for a Helm lifecycle test.

## Optional subsystem enablement in tests

Optional features are not all on in every suite. Dedicated configs and CI jobs turn them on:

| Subsystem | How the test enables it | Evidence |
| --- | --- | --- |
| Advanced visibility (Elasticsearch / OpenSearch) | Test cluster YAML sets `workerconfig.enableindexer: true` and an `esconfig`; CI Compose brings up search + Kafka | [`host/testdata/integration_elasticsearch_v7_cluster.yaml`](https://github.com/cadence-workflow/cadence/blob/master/host/testdata/integration_elasticsearch_v7_cluster.yaml), [`host/elastic_search_test.go`](https://github.com/cadence-workflow/cadence/blob/master/host/elastic_search_test.go), ES7 / OpenSearch CI jobs |
| Advanced visibility (Pinot) | Pinot-specific cluster config and `TestPinotIntegrationSuite` | [`docker-compose-pinot.yml`](https://github.com/cadence-workflow/cadence/blob/master/docker/github_actions/docker-compose-pinot.yml), Pinot CI job in CI Checks |
| History queue v2 | Env `ENABLE_QUEUE_V2=true` (read in [`host/integration_test.go`](https://github.com/cadence-workflow/cadence/blob/master/host/integration_test.go)) selects [`integration_queuev2_cluster.yaml`](https://github.com/cadence-workflow/cadence/blob/master/host/testdata/integration_queuev2_cluster.yaml). The alert variant selects `integration_queuev2_with_alert_cluster.yaml` and is non-gating (`continue-on-error: true` on the alert job) | Queue-v2 Compose services and CI jobs in [CI Checks](https://github.com/cadence-workflow/cadence/blob/master/.github/workflows/ci-checks.yml) |
| Archival | Default integration cluster YAML sets `enablearchival` / `enablearchiver`; filestore provider under the test archiver base | [`host/testdata/integration_test_cluster.yaml`](https://github.com/cadence-workflow/cadence/blob/master/host/testdata/integration_test_cluster.yaml), [`host/archival_test.go`](https://github.com/cadence-workflow/cadence/blob/master/host/archival_test.go); local overlay [`docker-compose-archival-filestore.yml`](https://github.com/cadence-workflow/cadence/blob/master/docker/docker-compose-archival-filestore.yml) |
| Schedules | Default integration cluster sets `workerconfig.enablescheduler: true`, and dynamic config sets `worker.enableScheduler: true`; suite skips if the worker config leaves the scheduler off | [`host/testdata/integration_test_cluster.yaml`](https://github.com/cadence-workflow/cadence/blob/master/host/testdata/integration_test_cluster.yaml), [`host/testdata/dynamicconfig/integration_test.yaml`](https://github.com/cadence-workflow/cadence/blob/master/host/testdata/dynamicconfig/integration_test.yaml), [`host/schedule_test.go`](https://github.com/cadence-workflow/cadence/blob/master/host/schedule_test.go) |
| Async workflows | Kafka topic env and async-WF integration suite | Async-WF job in CI Checks; Compose service `integration-test-async-wf` |
| Dynamic config plumbing | File-based and in-memory clients: set a key, read the new value, restore defaults | [`common/dynamicconfig/config_test.go`](https://github.com/cadence-workflow/cadence/blob/master/common/dynamicconfig/config_test.go), [`file_based_client_test.go`](https://github.com/cadence-workflow/cadence/blob/master/common/dynamicconfig/file_based_client_test.go), [`configstore/`](https://github.com/cadence-workflow/cadence/tree/master/common/dynamicconfig/configstore) |

Those suites prove Cadence can start with the subsystem configured and that the feature path works. They are not a matrix that flips every production dynamic key (`system.writeVisibilityStoreName`, archival domain status, and similar) from on to off inside one CI job. Operators who need that rehearsal should follow the enable and disable steps on [Live cluster enablement and rollback](/docs/tech-review/day-1-installation/enablement-rollback/live-cluster-enablement-rollback) in a non-production cluster, then confirm workers, visibility queries, and archival read paths still match expectations after the change.

## Helm install and uninstall

The chart documents enablement as `helm install` and disablement as `helm delete` (uninstall) in the [cadence-charts README](https://github.com/cadence-workflow/cadence-charts/blob/main/README.md). Schema setup runs as a Kubernetes Job before the service Deployments become ready, which matches the operational enablement sequence on the live-cluster page.

Public automation in [cadence-charts `.github/workflows`](https://github.com/cadence-workflow/cadence-charts/tree/main/.github/workflows) today is:

| Workflow | What it does |
| --- | --- |
| [`release.yml`](https://github.com/cadence-workflow/cadence-charts/blob/main/.github/workflows/release.yml) | Chart-releaser publish on pushes to `main` |
| [`shellcheck.yml`](https://github.com/cadence-workflow/cadence-charts/blob/main/.github/workflows/shellcheck.yml) | ShellCheck on schema helper scripts |

There is no public `ct install` / chart-testing job, and no public workflow that installs the chart into a kind or similar cluster and then uninstalls it. Treat Helm enablement and disablement as an **operator rehearsal** (and part of staged rollout of packaged deployments), not as something the public chart CI currently proves on every PR. Leftover objects after uninstall are covered on [Resource cleanup](/docs/tech-review/day-1-installation/enablement-rollback/resource-cleanup).

## Local Compose stacks, canary, and bench

The server [`docker/`](https://github.com/cadence-workflow/cadence/tree/master/docker) directory ships full-stack Compose files for evaluation and operational testing. `docker compose up` enables a local Cadence (often via the `auto-setup` image). `docker compose down` disables it. Shipped Compose files do not declare named volumes. Cassandra, MySQL, and PostgreSQL images declare a data `VOLUME`, so `docker compose down` orphans those volumes and a later `up` starts an empty database. Kafka, Elasticsearch, and OpenSearch images in those files do not declare a `VOLUME`, so `down` deletes their data with the container. To keep either kind of data across a restart, add named volumes or bind mounts, or use `docker compose stop` and `docker compose start` instead of `down`. `docker compose down -v` also deletes the orphaned database volumes. Feature overlays include advanced visibility, archival filestore, HTTP API, multi-cluster, and custom config. See the [Docker README](https://github.com/cadence-workflow/cadence/blob/master/docker/README.md) and [Resource cleanup](/docs/tech-review/day-1-installation/enablement-rollback/resource-cleanup).

After a local server is up, [`docker-compose-canary.yml`](https://github.com/cadence-workflow/cadence/blob/master/docker/docker-compose-canary.yml) and [`docker-compose-bench.yml`](https://github.com/cadence-workflow/cadence/blob/master/docker/docker-compose-bench.yml) start canary and load-test workers. Those Compose files are for local or deployed health and capacity checks. They are **not** steps in the public CI Checks workflow. Validation expectations for canary and bench after an install are on [Validation](/docs/tech-review/day-0-planning/installation/validation).

## Operator rehearsal for enablement and disablement

Use the same honesty threshold as [Upgrade and rollback testing](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/upgrade-rollback-testing): public CI covers a revision against project-maintained Compose backends; your production package, values, and adjacent services may differ.

A practical rehearsal for enablement and disablement:

1. **Enable** Cadence with the deployment path you run in production (Helm values, Compose overlay, or binaries), including any optional subsystem you rely on.
2. Register a domain, start a worker, and complete a representative workflow (see [Validation](/docs/tech-review/day-0-planning/installation/validation)).
3. **Disable** without destroying the datastore you intend to keep. On Kubernetes, scale roles to zero or run `helm uninstall` / `helm delete` and leave PVCs or the external database in place. On the shipped Compose files, use `docker compose stop`. A plain `docker compose down` orphans Cassandra, MySQL, and PostgreSQL volumes and deletes Kafka, Elasticsearch, and OpenSearch data with those containers. The next `up` starts empty unless you added named volumes or bind mounts.
4. Confirm the host Kubernetes cluster (if any) is unaffected, and that workflow data remains in the datastore when you chose a non-destructive disable.
5. **Re-enable** against the same datastore and `numHistoryShards` (`docker compose start` after `stop`, or a new Helm install against the retained PVCs or external database). Confirm open and new workflows progress again.

Version upgrade and binary rollback are a separate question from process enablement. See [Upgrade and rollback testing](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/upgrade-rollback-testing) and [Rollback procedures](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/rollback-procedures).

## Related documentation

- [Live cluster enablement and rollback](/docs/tech-review/day-1-installation/enablement-rollback/live-cluster-enablement-rollback)
- [Default behaviors and overrides](/docs/tech-review/day-1-installation/enablement-rollback/default-behaviors)
- [Resource cleanup](/docs/tech-review/day-1-installation/enablement-rollback/resource-cleanup)
- [Upgrade and rollback testing](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/upgrade-rollback-testing)
- [Installation and initialization](/docs/tech-review/day-0-planning/installation/installation-initialization)
- [Validation](/docs/tech-review/day-0-planning/installation/validation)
- [Cluster configuration](/docs/operation-guide/setup)
- [Server CI Checks workflow](https://github.com/cadence-workflow/cadence/blob/master/.github/workflows/ci-checks.yml)
- [Docker README](https://github.com/cadence-workflow/cadence/blob/master/docker/README.md)
- [CONTRIBUTING.md testing setup](https://github.com/cadence-workflow/cadence/blob/master/CONTRIBUTING.md)
- [cadence-charts README](https://github.com/cadence-workflow/cadence-charts/blob/main/README.md)
