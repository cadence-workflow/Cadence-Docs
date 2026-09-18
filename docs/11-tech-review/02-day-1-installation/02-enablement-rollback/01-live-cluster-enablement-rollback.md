---
layout: default
title: Live Cluster Enablement & Rollback
description: How Cadence can be enabled or disabled in a live cluster and any downtime requirements.
keywords:
  - cadence live cluster
  - cadence enablement
  - cadence disable
  - cadence downtime
---

Cadence is a **self-contained service**: It defines no CRDs, installs no admission webhooks, and does not take over the API server, kubelets, or other workloads in the cluster that hosts it. Enabling Cadence means **starting its four service roles** (Frontend, History, Matching, and Worker) against a datastore the adopter already provisioned. Disabling it means **stopping those processes**. Workflow state lives in that datastore, so a disable that leaves the database in place is reversible.

You can install or remove the project as ordinary Deployments (or VMs, or Compose), and the host cluster's control plane is unaffected. Related pages: [Installation and initialization](/docs/tech-review/day-0-planning/installation/installation-initialization) for how Cadence is first brought up, [Service dependencies](/docs/tech-review/day-0-planning/design/service-dependencies) for what else must be running, [Default behaviors](/docs/tech-review/day-1-installation/enablement-rollback/default-behaviors) for finding service defaults and ways to override them, and [Rollback procedures](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/rollback-procedures) for **version** downgrades after an upgrade.

## Enabling Cadence in a live environment

Cadence can be added to an existing Kubernetes cluster, a VM fleet, or a laptop without pausing the host platform.

| Path | What "enable" is |
| --- | --- |
| Kubernetes / Helm | `helm install` of the [Cadence chart](https://github.com/cadence-workflow/cadence-charts) into a namespace. Schema jobs run first, then Frontend, History, Matching, Worker, and optionally Cadence Web. |
| Docker Compose | `docker compose up` from the [server `docker/`](https://github.com/cadence-workflow/cadence/tree/master/docker) directory. |
| Binary or systemd | `cadence-server start` with `--services` selecting which roles this process hosts. |

On Kubernetes, Cadence pods are ordinary Deployments. The chart exposes independent replica counts (`frontend.replicas`, `history.replicas`, `matching.replicas`, `worker.replicas`) and optional HPAs. Production guidance is at least four nodes per Frontend, History, and Matching, spread across zones. See [High availability](/docs/tech-review/day-0-planning/design/high-availability) and [Cluster configuration](/docs/operation-guide/setup).

After the server is up, **domain registration** is what opens the API for application traffic. Until a domain exists, workers and starters have nowhere to run:

```bash
cadence --domain my-domain domain register --retention 7
```

On Kubernetes, if the CLI is not installed locally, run the same command inside a Frontend pod:

```bash
kubectl exec -it deployment/cadence-release-frontend -- \
  cadence --domain my-domain domain register --retention 7
```

Workflows are authored with the language SDKs. A worker process in your application polls a [task list](/docs/concepts/task-lists) for decision and activity tasks; Cadence server never dials into that process. The shortest path from a registered domain to a running workflow is a hello-world sample: [Go](/docs/get-started/golang-hello-world), [Java](/docs/get-started/java-hello-world), and the [Python client](https://github.com/cadence-workflow/cadence-samples/tree/master/python_sdk_samples). Ready-to-run examples, including worker polling, live in [cadence-samples](https://github.com/cadence-workflow/cadence-samples) (Go and Python) and [cadence-java-samples](https://github.com/cadence-workflow/cadence-java-samples). [Validation](/docs/tech-review/day-0-planning/installation/validation) walks through register, describe, start a worker, and start a workflow as an install check.

Optional features (advanced visibility, archival, OAuth authorization, HTTP API) are then turned on independently, as described below.

Cadence does not mutate kube-proxy, CoreDNS, CNI, or other tenants of the same cluster. Other Deployments keep their previous behavior.

## Disabling Cadence, and rolling that enablement back

Disablement is the reverse of the table above. Choose how much you want to take down.

| Operation | Cadence APIs | Workflow data | Host Kubernetes cluster |
| --- | --- | --- | --- |
| Scale a role to zero (`kubectl scale` / Helm replica values) | That role stops serving. Scaling Frontend to zero rejects client RPCs. Scaling History to zero stalls execution. Scaling Matching to zero stalls task dispatch. Scaling the internal Worker to zero pauses archival, scanners, and similar system workflows. | Unchanged, in the datastore | Unaffected |
| `helm uninstall` | All Cadence pods and Services in the release go away | **Preserved** on PersistentVolumeClaims (the chart and the [Helm codelab](/docs/codelabs/helm-deploy-postgres-opensearch) keep PVCs on purpose) | Unaffected |
| Delete the namespace | Cadence and any in-namespace datastore go away | Deleted with the PVCs | Unaffected |
| `docker compose down` without `-v` | Compose services stop | Named volumes remain | N/A |
| Stop the `cadence-server` process | That process's roles stop. Remaining members stay in the Ringpop ring and take over History shards | Unchanged | N/A |

Re-enablement after a scale-to-zero or `helm uninstall` that left the database is: start the processes again against the **same** datastore and the **same** `numHistoryShards`. Schema is already applied. Membership reforms, History reclaims shards, and in-flight workflows resume as workers poll. That is the rollback of "we turned Cadence off."

Deleting the database or the namespace is not a rollback. It is data destruction. Cleanup of leftover objects is on [Resource cleanup](/docs/tech-review/day-1-installation/enablement-rollback/resource-cleanup).

Application **workers** are not part of the Helm release. They keep running when Cadence is disabled; they simply cannot poll. Start Cadence again and those workers resume without a worker redeploy.

## Downtime

**Host Kubernetes control plane and nodes:** None. Cadence never talks to the Kubernetes API. Installing, scaling, or uninstalling it does not drain nodes, restart kubelets, or change default namespaces.

**Cadence as a control plane for workflows:**

| Change | Downtime |
| --- | --- |
| Helm install onto an empty namespace | Cadence is unavailable until pods are Ready and at least one domain is registered. Nothing else in the Kubernetes cluster waits on that. |
| Rolling restart or rolling scale-out of a role | None for API availability if that role has more than one replica and a disruption budget. [Cluster maintenance](/docs/operation-guide/maintain) requires rolling restarts for this reason. History shard ownership moves to surviving nodes when a History pod stops; that transfer is automatic. |
| Scale a role to zero, or uninstall | Cadence APIs for that role are down for as long as it stays down. Open workflows are not lost. Timers do not fire and tasks are not dispatched until History and Matching are back. |
| Stop every Cadence process at once | Full Cadence outage until restart. Persistence still holds executions. |

A single-replica Helm default is not highly available. Enablement onto a live Kubernetes cluster with `replicas: 1` means any pod restart is a Cadence outage for that role. Size replicas before treating the deployment as production.

## Enabling and disabling features on a running Cadence cluster

Once the server is up, most operational switches do not require taking the cluster down.

**Dynamic configuration** is hot-reloaded. File-based or `configstore` (CLI `cadence admin config`) overrides take effect without a process restart. That is how operators turn on scalable task lists, isolation groups, and similar tunables, and how they turn them back off. See [Cluster configuration](/docs/operation-guide/setup#dynamic-configuration).

**Optional subsystems** are gated independently:

| Feature | Enable | Disable / roll back |
| --- | --- | --- |
| [Advanced visibility](/docs/concepts/search-workflows) | Add `persistence.advancedVisibilityStore` (Elasticsearch, OpenSearch, or Pinot) and the Kafka visibility topic in **static YAML**, then rolling-restart **History, Worker, and Frontend**. Those processes construct the search and messaging clients only at startup. After that, `system.writeVisibilityStoreName` and `system.readVisibilityStoreName` turn writing and reading on. Dynamic config alone does nothing if the YAML store is missing. | Set `system.writeVisibilityStoreName` to `off` and `system.readVisibilityStoreName` to `db`. Basic visibility on the core datastore remains. Removing the store from YAML still needs a rolling restart. |
| [Archival](/docs/concepts/archival) | Cluster YAML plus per-domain status and URI | Disable at cluster or domain. The URI, once set on a domain, cannot be changed |
| [OAuth authorization](/docs/tech-review/day-0-planning/design/iam) | `authorization.oauthAuthorizer.enable` in static config | Set it back to off and restart Frontend. The no-op authorizer allows all callers |
| HTTP API | `http` section on Frontend RPC config | Remove it and restart Frontend |
| A domain | `cadence domain register` | Deprecate or delete. Delete removes metadata, not executions. See [Sovereignty](/docs/tech-review/day-0-planning/design/sovereignty#retention-and-deletion) |

Static YAML (TLS, `numHistoryShards`, persistence driver, cluster group metadata) needs a rolling restart to pick up. `numHistoryShards` cannot be changed in place at all; that requires a [cluster migration](/docs/operation-guide/migration), not an enablement toggle.

Server `Stop()` waits up to one minute for the service daemon to exit. Kubernetes then proceeds with the pod's `terminationGracePeriodSeconds`.

Note that enablement and rollback here mean "Cadence is no longer running, or a feature flag is off," not "we reverted v1.4.1 to v1.3.x." **Version upgrade and binary rollback** (schema first, mixed versions, `upgrade → downgrade → upgrade`) live under [Rollout, upgrade, and rollback](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/rollback-procedures).

**Tests** of install and uninstall are on [Testing enablement](/docs/tech-review/day-1-installation/enablement-rollback/testing-enablement).

## Related documentation

- [Installation and initialization](/docs/tech-review/day-0-planning/installation/installation-initialization)
- [Installation and configuration](/docs/tech-review/day-1-installation/installation-configuration)
- [Service dependencies](/docs/tech-review/day-0-planning/design/service-dependencies)
- [High availability](/docs/tech-review/day-0-planning/design/high-availability)
- [Cluster configuration](/docs/operation-guide/setup)
- [Cluster maintenance](/docs/operation-guide/maintain)
- [Helm deployment codelab](/docs/codelabs/helm-deploy-postgres-opensearch)
- [Helm chart README](https://github.com/cadence-workflow/cadence-charts/blob/main/charts/cadence/README.md)
- [Validation](/docs/tech-review/day-0-planning/installation/validation)
- [Go hello world](/docs/get-started/golang-hello-world)
- [Java hello world](/docs/get-started/java-hello-world)
- [cadence-samples](https://github.com/cadence-workflow/cadence-samples)
- [cadence-java-samples](https://github.com/cadence-workflow/cadence-java-samples)
- [Default behaviors](/docs/tech-review/day-1-installation/enablement-rollback/default-behaviors)
- [Resource cleanup](/docs/tech-review/day-1-installation/enablement-rollback/resource-cleanup)
- [Rollback procedures](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/rollback-procedures)
