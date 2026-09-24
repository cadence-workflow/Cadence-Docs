---
layout: default
title: Failure Scenarios
description: How a rollout or rollback can fail and the impact on running workloads.
keywords:
  - cadence failure scenarios
  - cadence rollout failure
  - cadence upgrade failure
---

Cadence server processes are stateless. Every workflow, timer, and pending task lives in the database, and application workers deploy separately from the server. Most failed rollouts or rollbacks therefore only cost availability. Open executions stay in the database and resume once the cluster is healthy. The exceptions are long outages that let workflow timeouts expire, a changed `numHistoryShards`, and nondeterministic worker code, all covered below.

The rollback procedure is on [Rollback procedures](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/rollback-procedures) and the signals that should trigger one are on [Rollback metrics](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/rollback-metrics).

## Running workflows during a failed rollout

Tasks stay persisted until acknowledged, and the next shard owner redelivers anything unacknowledged. Because of that redelivery, activity implementations must be idempotent. See [Default behaviors](/docs/tech-review/day-1-installation/enablement-rollback/default-behaviors#application-behavior).

Timers are persisted per shard and fire late while their shard has no owner. Workers poll Frontend and reconnect on their own, without a redeploy.

If the server is not running for longer periods of time, workflows will hit timeouts and be failed when the server becomes available again.

## Failure modes

### Schema and persistence

Schema migrations are additive and are applied with [`cadence-cassandra-tool`](https://github.com/cadence-workflow/cadence/tree/master/tools/cassandra) or [`cadence-sql-tool`](https://github.com/cadence-workflow/cadence/tree/master/tools/sql) before the new binary. Each process then [verifies at startup](https://github.com/cadence-workflow/cadence/blob/master/cmd/server/cadence/fx.go) that the installed schema is at least what the binary expects. If it's not, the process exits.

| Failure | Cause | Impact on running workloads |
| --- | --- | --- |
| Server refuses to start | Binary upgraded before the schema. The version check fails and the process exits. | Rolling update stalls. Old replicas keep serving, but if the rollout already replaced them that role is down. |
| Partially applied migration | The tool tracks progress in a [`schema_version`](https://github.com/cadence-workflow/cadence/blob/master/tools/cassandra/cqlclient.go) table, but there is no cross-table transaction. | None until a binary needs the missing object, then persistence errors on that path. Re-run or finish the migration. |
| Advanced visibility index not migrated | A release adds a search-attribute mapping and the Elasticsearch or OpenSearch index was not updated. | Core execution is unaffected. Visibility writes for the new attribute fail and search results go stale. |

Because the [check](https://github.com/cadence-workflow/cadence/blob/master/tools/common/schema/handler.go) is `installed >= expected`, a binary downgrade runs fine against the newer schema and needs no schema rollback.

A stricter check, [`system.enforceSchemaVerificationV2`](https://github.com/cadence-workflow/cadence/blob/master/common/dynamicconfig/dynamicproperties/constants.go), also covers advanced visibility but defaults to `false` and only warns. Enable it in staging to make a missing index block startup.

### Configuration and packaging

| Failure | Cause | Impact on running workloads |
| --- | --- | --- |
| Process crash-loops on start | Invalid or renamed static YAML field, a removed key, or a secret that did not roll with the image. | Rolling update stalls at the first new pod. Existing replicas keep serving. |
| New pods never become Ready | Unreachable database, Kafka, or search endpoint, or a [Ringpop bootstrap](https://github.com/cadence-workflow/cadence/blob/master/common/peerprovider/ringpopprovider/factory.go) address that does not resolve. | A process that cannot join the ring serves nothing, so capacity does not grow with the rollout. |
| Rollout succeeds, behavior is wrong | A dynamic config change shipped with the binary, or the release renamed a key and the old override is now silently ignored. Dynamic config is not versioned with the release. | Depends on the key. Reverting the value is faster than rolling the binary, so do that first. |
| Changed `numHistoryShards` | A rollout ships a different `persistence.numHistoryShards`, for example from a new Helm values file. Nothing compares it with the shards already in the database, so the server starts normally. | Every workflow ID [hashes to a different shard](https://github.com/cadence-workflow/cadence/blob/master/common/util.go). See below. |
| `auto-setup` image used for an upgrade | The image is meant for development. It [sets up and updates the schema](https://github.com/cadence-workflow/cadence/blob/master/cmd/server/cadence/cadence.go) every time the server starts. | Each new pod migrates the schema as it starts, so the schema changes in the middle of the rollout. Use the regular server image and apply schema with the versioned tools first. |

`persistence.numHistoryShards` must be the same in the config of every Cadence server process, on every host and in every role, and it must match the value the cluster was created with. If one host has a different value, requests for the same workflow [reach different shards](https://github.com/cadence-workflow/cadence/blob/master/client/history/peer_resolver.go) depending on which host handles them. If the whole cluster moves to a new value, existing workflows appear missing and a start can create a second run for an ID that is already running. Treat any mismatch as a full outage and restore the original value. Workflows started in between are orphaned.

Between replicated clusters, a different count is tolerated for a one-way scale-up because replication [redirects tasks to the right shard](https://github.com/cadence-workflow/cadence/blob/master/service/history/replication/task_executor.go). Failing back to the smaller cluster is then not possible. See [Cluster migration](/docs/operation-guide/migration).

### Restart and membership churn

Every rollout restarts every process. On shutdown, [Frontend](https://github.com/cadence-workflow/cadence/blob/master/service/frontend/service.go) fails its health check and then stops taking requests. [History](https://github.com/cadence-workflow/cadence/blob/master/service/history/service.go) evicts itself from the ring and waits for shard ownership to transfer. [Matching](https://github.com/cadence-workflow/cadence/blob/master/service/matching/service.go) sleeps for its drain duration.

| Failure | Cause | Impact on running workloads |
| --- | --- | --- |
| Error spike at each pod replacement | `frontend.shutdownDrainDuration`, `matching.shutdownDrainDuration`, and `history.shutdownDrainDuration` all default to `0`, so a process stops before callers notice it is gone. | In-flight requests fail and SDKs retry. Workflows only see latency, but the error rate can trip alerts. Set a non-zero drain first. |
| Shard ownership thrash | Shards move on every membership change. Replacing pods faster than they can be reacquired leaves shards repeatedly unowned. | Decisions, activities, and timers on those shards stall. Callers see `ShardOwnershipLost` and retry. Replace History pods gradually. |
| Database overload after restart | History and events caches start empty, so every reloaded shard reads from the database. Both caches are controlled by `history.cacheTTL` and `history.eventsCacheTTL`, which default to one hour. | A cold-cache read burst. If the database is near its limit, latency rises cluster-wide and the rollout looks like a Cadence regression when the database is the bottleneck. |
| Capacity dip | New Frontend hosts report unhealthy for `frontend.warmupDuration` (30 seconds) before taking traffic. | Surviving hosts absorb full load and rate limits may engage. |

The defaults above are in [`constants.go`](https://github.com/cadence-workflow/cadence/blob/master/common/dynamicconfig/dynamicproperties/constants.go), and reacquisition is driven by the [shard controller](https://github.com/cadence-workflow/cadence/blob/master/service/history/shard/controller.go).

### Multi-cluster replication

Cluster names, `initialFailoverVersion`, and `failoverVersionIncrement` must match across every cluster in a replication group. The server [validates its local copy](https://github.com/cadence-workflow/cadence/blob/master/common/config/cluster.go) at startup but cannot check that other clusters agree, so a mismatch attributes replication tasks to the wrong cluster. Keep metadata changes out of version rollouts. See [Cross-cluster replication](/docs/concepts/cross-dc-replication).

### Application code

The rollout most likely to break a running workflow is the adopter's own worker deploy.

| Failure | Cause | Impact on running workloads |
| --- | --- | --- |
| Nondeterminism after a worker deploy or rollback | Workflow code now produces different commands than the recorded history. | Affected workflows stop progressing and the server records [`cadence_errors_nondeterministic`](https://github.com/cadence-workflow/cadence/blob/master/common/metrics/defs.go). Only executions that were open across the change are hit, which after a rollback includes those started on the new code. Versioning the change prevents this. See the [Go](/docs/go-client/workflow-versioning) and [Java](/docs/java-client/versioning) versioning guides. |
| Removed activity or workflow type | A deploy dropped a registration that open executions still reference. | Activities fail with [`unable to find activityType`](https://github.com/cadence-workflow/cadence-go-client/blob/master/internal/activity_task_handler.go) and burn through their retry policy. Workflows fail every decision task and stall. |
| SDK upgraded past the server | The SDK's feature version is newer than the server accepts. | With `frontend.enableClientVersionCheck` on (default `false`), Frontend [rejects every call](https://github.com/cadence-workflow/cadence/blob/master/common/client/versionChecker.go) with `ClientVersionNotSupportedError`. With it off, only calls using the new feature fail. Upgrade the server first. |

Replay existing histories against new workflow code before rollout. See [Infrastructure compatibility](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/infrastructure-compatibility#sdk-and-worker-environments).

## Permanent changes

A rollback restores the binary. These changes stay in place.

| Change | Why |
| --- | --- |
| `numHistoryShards` | Fixed at cluster creation. Changing it requires a [cluster migration](/docs/operation-guide/migration). |
| A domain's archival URI | Settable once. |
| Data already written in a new format | A pre-upgrade data migration stays migrated. Release notes flag the rare releases that need one. |
| A removed persistence or archival provider | Stored data still references it and becomes unreachable. |

## Reducing the blast radius

- Read the [release notes](https://github.com/cadence-workflow/cadence/releases) for every version you pass through. They carry data migrations and special rollback instructions.
- Apply schema changes as a separate step and confirm they completed before rolling the binary.
- The order in which roles are rolled out does not matter. Any combination of versions across roles is compatible.
- Set non-zero drain durations and a disruption budget.
- Ship dynamic config changes separately from binary changes, so a regression can be reverted on its own.
- Rehearse the rollback, including the worker rollback with history replay. See [Upgrade and rollback testing](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/upgrade-rollback-testing).

## Related documentation

- [Rollback procedures](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/rollback-procedures)
- [Rollback metrics](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/rollback-metrics)
- [Upgrade and rollback testing](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/upgrade-rollback-testing)
- [Infrastructure compatibility](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/infrastructure-compatibility)
- [Live cluster enablement and rollback](/docs/tech-review/day-1-installation/enablement-rollback/live-cluster-enablement-rollback)
- [Default behaviors and overrides](/docs/tech-review/day-1-installation/enablement-rollback/default-behaviors)
- [Cluster maintenance](/docs/operation-guide/maintain#upgrading-server)
- [Known failure modes](/docs/tech-review/day-2-operations/troubleshooting/known-failure-modes)
