---
layout: default
title: Resource Cleanup
description: How Cadence cleans up resources created at install time, including why CRDs do not apply and how datastores, visibility, archival, and workers are removed.
keywords:
  - cadence resource cleanup
  - cadence uninstall
  - cadence helm uninstall
  - cadence PVC cleanup
  - cadence CRD
  - cadence docker compose down
---

Cadence does **not** install Kubernetes Custom Resource Definitions (CRDs), admission webhooks, or API extensions. There is therefore no CRD cleanup step. Cleanup means removing the ordinary objects Cadence (or its Helm chart) created, then separately deciding whether to destroy the adopter-owned datastore, visibility, archival, and application-worker resources that still hold workflow data.

Disablement that leaves persistence in place is covered on [Live cluster enablement and rollback](/docs/tech-review/day-1-installation/enablement-rollback/live-cluster-enablement-rollback). This page is about what is removed, what is retained on purpose, and which deletions are intentional data destruction.

## CRDs and Kubernetes API extensions

| Extension type | Does Cadence install it? | Cleanup |
| --- | --- | --- |
| CustomResourceDefinition | No | **N/A.** No CRDs to delete. |
| ValidatingWebhookConfiguration / MutatingWebhookConfiguration | No | **N/A.** |
| APIService / aggregated API | No | **N/A.** |
| Ordinary Kubernetes objects (Deployments, Services, Jobs, ConfigMaps, Secrets, ServiceAccounts, optional HPAs, Ingress, ServiceMonitor, PodMonitoring, NetworkPolicy) | Yes, when installed via the [Helm chart](https://github.com/cadence-workflow/cadence-charts) | Removed by `helm uninstall`. Deleting the namespace removes the namespaced ones. |

Evidence: the [cadence-charts](https://github.com/cadence-workflow/cadence-charts) templates directory contains Deployments, Services, Jobs, ConfigMaps, Secrets, and related objects. It contains no `CustomResourceDefinition` manifests and no `crds/` directory. The [cadence](https://github.com/cadence-workflow/cadence) server repository likewise defines no Kubernetes CRDs. Cadence extends its own Frontend API and persistence model, not the Kubernetes API. See also [Live cluster enablement and rollback](/docs/tech-review/day-1-installation/enablement-rollback/live-cluster-enablement-rollback), which states the same CRD and webhook boundary.

Projects that do ship CRDs (for example Kubewarden or KubeVirt) document CRD deletion as part of uninstall. Cadence's answer is the opposite: there is nothing CRD-shaped to clean up.

## Layers of cleanup

Cadence cleanup is layered. Stopping the server is not the same as deleting workflow data.

| Layer | Created by | Removed by stopping Cadence / `helm uninstall`? | How to remove |
| --- | --- | --- | --- |
| 1. Kubernetes / Helm objects | Cadence Helm release (and optional subcharts) | Yes, for release-managed objects, including cluster-scoped RBAC when `rbac.create` is true | `helm uninstall`. Namespace delete removes namespaced objects only |
| 2. PersistentVolumeClaims / in-cluster datastore volumes | StatefulSet `volumeClaimTemplates` from optional Bitnami/OpenSearch subcharts | **No.** Retained on purpose | `kubectl delete pvc`, or delete the namespace |
| 3. Persistence schemas / keyspaces / databases | Schema Jobs or `cadence-cassandra-tool` / `cadence-sql-tool` | No | Drop with the datastore's tools (or recreate the store) |
| 4. Visibility stores (ES/OpenSearch indices, Kafka topics) | Schema Job / chart topic provisioning / server writes | No (unless the whole in-cluster subchart PVC or namespace is deleted) | Delete indices and topics with search/messaging tools, or destroy that store |
| 5. Archival blob objects | Worker archival path, when enabled | No | Delete objects in the configured filestore, S3, or GCS URI |
| 6. Domains and workflow execution data | Domain register and workflow APIs | Domain delete removes **metadata only** | Retention, admin workflow delete, store drop, or archival URI cleanup. See [Sovereignty](/docs/tech-review/day-0-planning/design/sovereignty#retention-and-deletion) |
| 7. Application workers | Adopter application deploy | No. Not part of the Helm release | Stop or undeploy the worker processes separately |

Data destruction is always an explicit operator step. Scale-to-zero and `helm uninstall` that leave the database are reversible enablement rollback, not cleanup of workflow state.

## Kubernetes and Helm objects

The [Cadence Helm chart](https://github.com/cadence-workflow/cadence-charts/tree/main/charts/cadence) deploys Frontend, History, Matching, Worker, and optionally Cadence Web as Deployments and Services. It also creates ConfigMaps (server and schema scripts), Secrets, a ServiceAccount by default, schema Jobs (`ttlSecondsAfterFinished: 60`), and optional HPA, PDB, Ingress, ServiceMonitor, PodMonitoring, NetworkPolicy, and RBAC resources. Optional subcharts can add Cassandra, PostgreSQL, MySQL, Elasticsearch, OpenSearch, and Kafka into the same release.

| Operation | What is removed | What remains |
| --- | --- | --- |
| `helm uninstall <release> -n <namespace>` | Release-managed Deployments, Services, Jobs, ConfigMaps, Secrets, ServiceAccounts, and other chart objects, including enabled subchart workloads | The namespace itself. **PersistentVolumeClaims** from StatefulSet volumeClaimTemplates. Data in any **external** datastore the chart was pointed at |
| `kubectl delete namespace <namespace>` | Everything in the namespace, including PVCs for in-cluster datastores | External datastores, archival buckets, application workers outside the namespace. **ClusterRole and ClusterRoleBinding** if `rbac.create` was true and `helm uninstall` did not run first |
| Scale role replicas to zero | Running pods for that role | All Kubernetes objects and all data |

Practical commands (replace names with your release and namespace):

```bash
# Remove Cadence processes and chart objects; keep PVCs
helm uninstall cadence-release -n cadence-postgres-os2

# After helm uninstall, destroy in-cluster datastore volumes deliberately
kubectl delete pvc --all -n cadence-postgres-os2

# Or remove namespaced objects, including PVCs. Run helm uninstall first if rbac.create was true.
kubectl delete namespace cadence-postgres-os2
```

The chart [README uninstall section](https://github.com/cadence-workflow/cadence-charts/blob/main/README.md#uninstallation) uses `helm delete` (an alias of `helm uninstall`). The [Helm codelab Step 6](/docs/codelabs/helm-deploy-postgres-opensearch) deletes the namespace for that walkthrough. The example values leave `rbac.create` at its default of `false`, so that delete does not leave chart RBAC behind. If you turned `rbac.create` on, run `helm uninstall` before deleting the namespace, or delete the ClusterRole and ClusterRoleBinding by name.

Schema Jobs are part of the release. Completed Jobs are also eligible for automatic removal after `ttlSecondsAfterFinished` (60 seconds in the chart templates). They do not leave CRDs or aggregated APIs behind. ClusterRole and ClusterRoleBinding are created only when `rbac.create` is enabled (default `false`). Those objects are cluster-scoped. `helm uninstall` removes them because Helm tracks the release. `kubectl delete namespace` does not.

## PersistentVolumeClaims and datastore volumes

When the chart enables an in-cluster database or search subchart with persistence, those charts create PVCs through StatefulSet volumeClaimTemplates. On `helm uninstall`, Kubernetes leaves those PVCs in place so a reinstall can reattach the same data. That retention is intentional and is documented in the [Helm codelab cleanup step](/docs/codelabs/helm-deploy-postgres-opensearch).

| Goal | Command / action |
| --- | --- |
| Keep workflow data, remove Cadence pods | `helm uninstall` only |
| Destroy in-cluster volumes after uninstall | `kubectl delete pvc --all -n <namespace>` |
| Destroy namespaced objects and PVCs | `kubectl delete namespace <namespace>` (does not remove ClusterRole or ClusterRoleBinding) |
| External managed database (Cloud SQL, self-managed Cassandra outside the chart, and similar) | Uninstall does not touch it. Drop schemas or decommission that service separately |

Reinstalling the chart against retained PVCs (or the same external store) with the same `numHistoryShards` is how you bring Cadence back without losing executions. See [Live cluster enablement and rollback](/docs/tech-review/day-1-installation/enablement-rollback/live-cluster-enablement-rollback).

## Persistence schemas, keyspaces, and databases

Stopping Cadence never drops its schema. Schema setup Jobs and the `cadence-cassandra-tool` / `cadence-sql-tool` utilities create and migrate keyspaces or databases. They do not run a teardown on uninstall.

Default names from the Helm chart [`values.yaml`](https://github.com/cadence-workflow/cadence-charts/blob/main/charts/cadence/values.yaml) (override as configured):

| Store | Chart key | Default name |
| --- | --- | --- |
| Cassandra main keyspace | `config.persistence.database.cassandra.keyspace` | `cadence` |
| Cassandra visibility keyspace | `config.persistence.database.cassandra.visibilityKeyspace` | `cadence_visibility` |
| MySQL / PostgreSQL main database | `config.persistence.database.sql.dbname` | `cadence` |
| MySQL / PostgreSQL visibility database | `config.persistence.database.sql.visibilityDbname` | `cadence_visibility` |

To destroy persistence data you must use the datastore itself (for example `DROP KEYSPACE`, `DROP DATABASE`, restore an empty volume, or delete the cloud database instance). Cadence provides no automated "uninstall schema" Job. Treat schema deletion as data destruction, not as disablement.

## Visibility stores (Elasticsearch, OpenSearch, Kafka)

Advanced visibility writes through Kafka into an Elasticsearch or OpenSearch index (Pinot is supported by the server but is not a Helm subchart). Chart defaults include a visibility index such as `cadence-visibility` and Kafka topics such as `cadence-visibility` and `cadence-visibility-dlq` (example values files may use variant index names such as `cadence-visibility-os2`).

| Resource | Removed by `helm uninstall`? | How to clean up |
| --- | --- | --- |
| In-cluster Kafka / OpenSearch / Elasticsearch pods | Yes (subchart workloads) | Part of uninstall |
| PVCs for those subcharts | No | Delete PVCs or the namespace |
| Indices and topics on an **external** cluster | No | Delete with Elasticsearch/OpenSearch and Kafka admin tools |
| Basic visibility rows in the SQL/Cassandra visibility database | No | Dropped only when that database/keyspace or its volume is destroyed |

Turning advanced visibility off in dynamic configuration stops new writes. It does not delete existing indices or topics. See [Default behaviors](/docs/tech-review/day-1-installation/enablement-rollback/default-behaviors) and [Live cluster enablement and rollback](/docs/tech-review/day-1-installation/enablement-rollback/live-cluster-enablement-rollback).

## Archival storage

When archival is enabled, closed workflow histories and visibility records are written to the domain's configured URI (filestore, S3, or GCS). Uninstalling Cadence does not delete those blobs. Domain delete also does not remove archives. Operators delete archival objects with the storage provider's tools, using the URI configured on each domain. See [Archival](/docs/concepts/archival) and [Sovereignty](/docs/tech-review/day-0-planning/design/sovereignty#retention-and-deletion).

## Domains and workflow execution data

| Operation | Removes | Does not remove |
| --- | --- | --- |
| `cadence domain deprecate` | Marks the domain deprecated (no new executions) | Existing executions, histories, visibility, archives |
| `cadence domain delete` | Domain **metadata** only | Workflow executions, histories, visibility records, archives |
| Domain retention expiry | Execution, history, current-execution record, and visibility record in primary storage (and archival of history when configured) | Already archived blobs outside primary storage |
| Admin workflow delete | Primary execution records (visibility depends on `--remote`; see Sovereignty) | Archived blobs unless deleted separately |
| Drop database / delete PVC / delete archival bucket | Everything in that store | Nothing in other stores |

Domain delete is confirmed interactively in the CLI and calls `DeleteDomainByName` on the domain metadata tables only. It is not a bulk workflow purge. Full erasure across stores is an operator runbook composed from retention, admin delete, visibility delete, archival object delete, and ultimately store teardown. Details and the deletion matrix live under [Sovereignty: Retention and deletion](/docs/tech-review/day-0-planning/design/sovereignty#retention-and-deletion).

## Application workers

Application workers are processes in the adopter's application that poll task lists through a language SDK. They are **not** packaged in the Cadence Helm release and are not stopped by `helm uninstall`.

| When Cadence is uninstalled or scaled to zero | Worker behavior |
| --- | --- |
| Workers still running | Polls fail or idle. No tasks are dispatched until Frontend/Matching/History return |
| Cadence restored against the same datastore | Existing workers resume without a worker redeploy |
| Full environment teardown | Stop or undeploy workers with the application's own deployment tooling |

Internal Cadence Worker service pods (archival, scanners, and similar system workflows) **are** part of the Helm release and are removed with it. Do not confuse those with application workers.

## Docker Compose cleanup

Shipped Compose files under [`cadence/docker`](https://github.com/cadence-workflow/cadence/tree/master/docker) (`docker-compose.yml`, `docker-compose-mysql.yml`, `docker-compose-postgres.yml`, Elasticsearch/OpenSearch variants, and similar) run Cassandra, MySQL, PostgreSQL, Elasticsearch, OpenSearch, and Kafka **without** declaring named volumes for those datastores. The images still expose data directories as Docker `VOLUME`s, so Compose attaches **anonymous volumes**. Those volumes have no stable name. `docker compose down` does not delete them, and the next `up` does not mount them. It creates new empty volumes. The old data sits in orphaned volumes until `docker volume prune` or an explicit `docker volume rm`.

| Command | Processes | Datastore volumes |
| --- | --- | --- |
| `docker compose stop` / `start` | Containers stop and start again | Anonymous volumes stay attached. Data is kept |
| `docker compose down` | Containers and networks removed | Anonymous volumes are **orphaned**, not reattached by the next `up` |
| `docker compose down -v` | Containers and networks removed | Anonymous volumes **deleted** (data destruction) |
| `docker volume prune` | None | Removes orphaned anonymous volumes left by `down` |
| Bind mounts such as `./prometheus` and `./grafana` | Not removed by Compose | Remain on the host filesystem |

```bash
# Pause Compose services and keep the same anonymous volumes
docker compose -f docker/docker-compose.yml stop
docker compose -f docker/docker-compose.yml start

# Remove containers. Anonymous volumes are orphaned and not reused by the next up
docker compose -f docker/docker-compose.yml down

# Remove containers and delete anonymous volumes (deletes local workflow data)
docker compose -f docker/docker-compose.yml down -v
```

To keep data across `down` and `up`, add named volumes or bind mounts in an override file. `down -v` removes named volumes you added as well. External databases pointed at by custom Compose files are untouched either way.

## Binary or process installs

| Operation | Effect |
| --- | --- |
| Stop `cadence-server` (systemd, process manager, or Ctrl-C) | That process's roles leave the Ringpop membership. Other members continue. Persistence unchanged |
| Stop every Cadence server process | Full outage. Persistence, visibility, archival, and workers unchanged |
| Drop the configured keyspaces/databases and visibility indices | Data destruction for those stores |

There is no Cadence uninstall package that reverses schema setup on VMs. Remove binaries and config files with the same packaging method used to install them, then clean datastores deliberately.

## Preserved versus destroyed (summary)

| Action | Cadence APIs | Kubernetes host cluster | Workflow data |
| --- | --- | --- | --- |
| Scale to zero / stop processes | Down for stopped roles | Unaffected | Preserved |
| `helm uninstall` | Down | Unaffected | Preserved on PVCs / external stores |
| `docker compose stop` / `start` | Down, then back | N/A | Preserved on the same anonymous volumes |
| `docker compose down` | Down | N/A | Orphaned. The next `up` starts **empty** |
| `docker compose down -v` | Down | N/A | **Destroyed** (local Compose volumes) |
| `kubectl delete pvc` or `kubectl delete namespace` | Down if Cadence was there | Unaffected | **Destroyed** for in-cluster volumes |
| Drop DB / indices / topics / archival blobs | N/A | N/A | **Destroyed** for that store |
| Domain delete | Domain metadata gone | N/A | Executions **preserved** |

Install and uninstall behavior is also exercised in project testing described on [Testing enablement](/docs/tech-review/day-1-installation/enablement-rollback/testing-enablement).

## Related documentation

- [Live cluster enablement and rollback](/docs/tech-review/day-1-installation/enablement-rollback/live-cluster-enablement-rollback)
- [Testing enablement](/docs/tech-review/day-1-installation/enablement-rollback/testing-enablement)
- [Default behaviors](/docs/tech-review/day-1-installation/enablement-rollback/default-behaviors)
- [Helm deployment codelab (Step 6 Clean up)](/docs/codelabs/helm-deploy-postgres-opensearch)
- [Helm chart README (Uninstallation)](https://github.com/cadence-workflow/cadence-charts/blob/main/README.md#uninstallation)
- [Sovereignty (retention and deletion)](/docs/tech-review/day-0-planning/design/sovereignty#retention-and-deletion)
- [Archival](/docs/concepts/archival)
- [Service dependencies](/docs/tech-review/day-0-planning/design/service-dependencies)
- [Production integrations](/docs/tech-review/day-0-planning/usability/production-integrations)
- [Installation and initialization](/docs/tech-review/day-0-planning/installation/installation-initialization)
