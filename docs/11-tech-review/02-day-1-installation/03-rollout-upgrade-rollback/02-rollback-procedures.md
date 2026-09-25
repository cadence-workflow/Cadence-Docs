---
layout: default
title: Rollback Procedures
description: How Cadence handles rollback procedures after a failed upgrade or deployment.
keywords:
  - cadence rollback
  - cadence rollback procedures
  - cadence downgrade
---

A Cadence rollback restores the previous server binary and leaves the persistence schema at its newer version. Cadence has no rollback controller of its own. Operators roll back with the tool that deployed the release, such as Helm, Docker Compose, or their own manifests. Workflow state lives in the database, so rolling back a server process does not move or rewrite open executions.

This works because schema changes are applied before the new binary and are usually backward compatible, and the project aims to keep adjacent minor versions compatible. At startup, each server process [checks](https://github.com/cadence-workflow/cadence/blob/master/tools/common/schema/handler.go) that the installed schema is at least the version the binary expects. A newer schema is accepted on purpose, so the previous binary starts normally against it. See [Upgrade and rollback testing](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/upgrade-rollback-testing) for how this path is exercised.

For how a rollback can fail, see [Failure scenarios](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/failure-scenarios). For the signals that should trigger one, see [Rollback metrics](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/rollback-metrics).

## What gets rolled back

| Component | Rollback action | Notes |
| --- | --- | --- |
| Server binary | Redeploy the previous image or binary with a rolling restart | Supported from N+1 to N. Rolling back further, from N+1 to N-1, is not maintained. |
| Persistence and visibility schema | None | The schema tools have no down migrations. The previous binary runs on the newer schema. |
| Dynamic configuration | Revert the value | Reloaded without a restart, except on the Helm chart. See [Dynamic configuration](#dynamic-configuration). Revert this before the binary when the regression came from a config change. |
| Static YAML configuration | Restore the previous file and restart | Required when the release renamed or added static keys. |
| Application workers | Redeploy the previous worker version | Deployed independently of the server. Workflow determinism applies. See [Worker rollback](#worker-rollback). |
| Web UI and CLI | Redeploy the previous image or binary | Neither stores state of its own. |

A release can include a one-time data migration or special rollback instructions. [Cluster maintenance](/docs/operation-guide/maintain#upgrading-server) requires reading the release notes for every version on the upgrade path, and those notes override the general procedure on this page.

## Rolling back the server

1. **Stop the rollout.** Pause the Deployment or deployment pipeline so no more processes move to the new version.
2. **Revert recent dynamic config changes first.** If the rollout shipped a dynamic config change, reverting it is faster than rolling back the binary and may be enough on its own.
3. **Redeploy the previous version.** Use the same image tag, static configuration, and `numHistoryShards` the cluster ran before the upgrade. Replace processes gradually so History shards can move to surviving hosts between batches. Old and new binaries can share the cluster during the rollout, because the schema is already at least as new as every running binary requires.
4. **Leave the schema in place.** Do not run a schema downgrade or restore a backup as part of a normal rollback.
5. **Validate.** Check that workers are polling, existing workflows continue, new workflows start, and the [rollback metrics](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/rollback-metrics) return to their pre-upgrade levels.

Once a schema is applied, the next attempt only needs the binary rollout. There is no need to re-run the schema step.

## Helm deployments

`helm rollback <release> <revision>` restores the chart, values, and image tag of an earlier release revision. The chart's schema Job is a plain Job, not a Helm hook, with `ttlSecondsAfterFinished: 60`. Once Kubernetes has deleted the finished Job, `helm rollback` recreates it with the previous image. Because the database is already newer, `update-schema` exits with an error, since no schema directory in the image is newer than the database's version. The [setup script](https://github.com/cadence-workflow/cadence-charts/blob/main/charts/cadence/files/schema/setup-postgres.sh) catches that error, logs `Rollback is not allowed`, and exits successfully. The schema is not downgraded.

Each server pod in the chart also runs a `wait-for-schema` init container before Cadence starts. It reads the schema version bundled in the pod's image and [waits until the database reports that version](https://github.com/cadence-workflow/cadence-charts/blob/main/charts/cadence/files/schema/wait-schema-postgres.sh). Unlike the server's own check, this one checks that the database version matches the image's version and does not accept a newer schema. If the rollback crosses a release that raised the schema version, new pods remain in `Init`. Such releases include patch releases: the Cassandra schema moved from `0.45` in v1.4.0 to `0.47` in v1.4.1. The Deployment stops progressing when it reaches its `maxUnavailable` limit, and the remaining pods on the newer image keep serving.

Before running `helm rollback`, compare the schema version in the database with the `version.go` of the target image for your driver, for example [`schema/cassandra/version.go`](https://github.com/cadence-workflow/cadence/blob/master/schema/cassandra/version.go). The chart has no value that disables the init container. If the versions differ, one workaround is to roll the image back with the `wait-for-schema` init container removed, for example with `helm upgrade --post-renderer`. Restore the unmodified chart on the next upgrade.

## Dynamic configuration

[Dynamic configuration](/docs/operation-guide/setup#dynamic-configuration) is not versioned with a release, so a server rollback does not revert it. Revert it separately:

- **File-based client:** restore the previous YAML file. Processes reload the file on their polling interval. On Helm, restore `dynamicConfig.values`, run `helm upgrade`, then restart the server pods, for example with `kubectl rollout restart`. The chart mounts the file with `subPath`, so a ConfigMap change does not reach running pods.
- **`configstore` client:** use `cadence admin config update` to set the previous value, or `cadence admin config restore` to remove an override. Without `--filter`, `restore` removes the unfiltered value. With `--filter`, it removes only the matching filtered value. See [Config store client](/docs/operation-guide/setup#config-store-client).

Shipping dynamic config changes separately from binary changes keeps each one independently reversible.

## Multi-cluster deployments

With [cross-cluster replication](/docs/concepts/cross-dc-replication), upgrade and roll back one cluster at a time. If the new version misbehaves on one cluster, [fail over](/docs/concepts/cross-dc-replication#failover-a-global-domain) the affected domains to a cluster still on the previous version, then roll back the upgraded cluster. Keep cluster names, `initialFailoverVersion`, and `failoverVersionIncrement` unchanged in both the upgrade and the rollback. `initialFailoverVersion` [identifies each cluster](https://github.com/cadence-workflow/cadence/blob/master/common/config/cluster.go), and changing it requires a separate migration.

## Worker rollback

Worker code is part of the adopter's application, not the Cadence server, and is rolled back through the application's own deployment. A worker rollback is only safe if the previous code can replay histories written by the new code. Guard workflow changes with the SDK versioning APIs, [Go](/docs/go-client/workflow-versioning) or [Java](/docs/java-client/versioning), and replay recorded histories against both versions before deploying.

If a rolled-back worker hits nondeterminism on executions that started on the new code, recover them with `cadence workflow reset-batch`. See [Reset workflow](/docs/cli#reset-workflow).

## When a binary rollback is not enough

Some changes are not undone by restoring the previous binary. They include:

- A changed `numHistoryShards`
- A domain archival URI, which can be set only once
- Data already written by a one-time migration
- A release note that marks a migration as incompatible

See [Failure scenarios](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/failure-scenarios) for their impact.

If the schema change itself is the problem, the recovery order is: fail over to a cluster still on the previous schema, reset affected workflows, and restore from backup as a last resort. [Upgrade and rollback testing](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/upgrade-rollback-testing#if-a-schema-upgrade-needs-to-be-reversed) covers each step.

## Related documentation

- [Failure scenarios](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/failure-scenarios)
- [Rollback metrics](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/rollback-metrics)
- [Upgrade and rollback testing](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/upgrade-rollback-testing)
- [Infrastructure compatibility](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/infrastructure-compatibility)
- [Live cluster enablement and rollback](/docs/tech-review/day-1-installation/enablement-rollback/live-cluster-enablement-rollback)
- [Cluster maintenance](/docs/operation-guide/maintain#upgrading-server)
- [Cluster configuration](/docs/operation-guide/setup)
- [Cross-cluster replication](/docs/concepts/cross-dc-replication)
- [Helm chart README](https://github.com/cadence-workflow/cadence-charts/blob/main/charts/cadence/README.md)
