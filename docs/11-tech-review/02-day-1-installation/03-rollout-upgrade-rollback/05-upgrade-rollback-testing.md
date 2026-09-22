---
layout: default
title: Upgrade & Rollback Testing
description: How Cadence tests upgrade and rollback paths, including upgrade-downgrade-upgrade scenarios.
keywords:
  - cadence upgrade testing
  - cadence rollback testing
  - cadence downgrade testing
---

Cadence upgrades persistence schemas before server processes. Schema migrations move forward, while a rollback normally restores the previous server binary without reverting the schema. This sequence lets old and new server processes share a cluster during a rolling deployment when the release's schema changes are backward compatible.

Cadence tests schema, persistence, and startup compatibility in continuous integration. The complete upgrade path is then exercised by rolling each candidate release through more than 20 environments: development first, then staging, then production, from higher-tier clusters to lower-tier ones.

The public CI suite does not currently include an automated job that deploys two released server images and runs upgrade, rollback, and second-upgrade in isolation. Operators may still rehearse that three-transition sequence in their own staging cluster before a production minor-version upgrade.

## What the project tests

| Area | Project validation |
| --- | --- |
| Persistence backends | Server integration suites run against Cassandra, MySQL, PostgreSQL, and SQLite. Additional jobs exercise Elasticsearch, OpenSearch, Pinot, Kafka, and cross-cluster replication configurations. |
| Schema updates | Unit and integration tests apply versioned migrations, exercise fresh-store setup, and verify the schema recorded in each configured default and visibility store. |
| Staged pre-release rollout | Before a version is published as a stable GitHub Release, it is rolled through more than 20 environments, from development and staging into production, higher-tier clusters first, at high scale. Pre-release tags such as [`v1.2.19-prerelease07`](https://github.com/cadence-workflow/cadence/releases/tag/v1.2.19-prerelease07) mark those soaks. |
| Server startup | Schema verification checks that persistence is not older than the version required by the server binary. A newer schema is accepted to permit binary rollback after a backward-compatible migration. |
| API evolution | Changes to public interfaces and schemas trigger the repository's breaking-change review, which asks authors to document compatibility, rollout, and rollback safety. |
| Release deployment | Release images and the Helm chart are built independently. The chart runs schema setup as a separate job before starting the Cadence services. |

See the server's [CI workflow](https://github.com/cadence-workflow/cadence/blob/master/.github/workflows/ci-checks.yml), [schema update tests](https://github.com/cadence-workflow/cadence/tree/master/common/persistence/schema), [breaking-change review template](https://github.com/cadence-workflow/cadence/blob/master/.github/workflows/breaking_change_pr_template.md), and [GitHub Releases](https://github.com/cadence-workflow/cadence/releases) for the current validation paths.

Continuous integration covers backends, migrations, and startup checks for a revision. The staged rollout already exercises each upgrade across more than 20 environments at high scale, including billions of workflow executions and the most critical production services. An operator's own setup may still differ. Neither public CI nor the staged rollout replaces a rehearsal with the exact database service, configuration, deployment package, and adjacent server versions used in a given production cluster.

## Upgrade, downgrade, and upgrade rehearsal

Use adjacent minor releases and the latest patch in each minor line. Read both releases' notes before the rehearsal because a release can require configuration changes or a one-time data migration in addition to schema changes.

1. **Prepare the baseline:** Deploy version N with the same persistence and visibility backends as production. Start representative workflows that remain open across the test, including timers, signals, queries, activities, retries, and search attributes used by the application.
2. **Apply the N+1 schemas:** Use the schema tooling and schema files shipped with N+1. Apply the default-store and visibility-store changes before starting N+1 server processes. Run `cadence-cassandra-tool` or `cadence-sql-tool` for each configured default and visibility store.
3. **Roll forward to N+1:** Replace Cadence server processes gradually so N and N+1 coexist during the rollout. Wait for service membership and History shard ownership to stabilize between batches.
4. **Validate N+1:** Confirm that workflows started on N continue, workers keep polling, new workflows start and complete, signals and queries succeed, timers fire, visibility queries return expected results, and service error and persistence latency metrics remain within the deployment's normal range.
5. **Roll binaries back to N:** Restore the N server image without downgrading the schema. Repeat the workload and operational checks. A release note that marks a change as incompatible overrides the general rollback expectation.
6. **Roll forward to N+1 again:** Repeat the rolling deployment and validation. Confirm that executions created or updated during the downgrade remain readable and continue to make progress.

The rehearsal succeeds only when existing and new executions continue through all three transitions without data loss, stuck task delivery, schema-version errors, or a sustained regression in service health. Pod readiness alone is not sufficient.

Upgrade a staging environment with the same persistence, visibility, and version pair before touching production. For a [multi-cluster](/docs/concepts/cross-dc-replication) deployment, apply the N+1 schema on each cluster, then roll the N+1 binary one cluster at a time and soak after each binary rollout. A dedicated soak between schema upgrades is not required: schema tools have no down migration, and the supported rollback is the previous binary on the newer schema. If a schema problem is found while another cluster still has the previous schema, the failover recovery below is available.

## If a schema upgrade needs to be reversed

The schema tools do not provide down migrations. The supported rollback is still the previous **binary** on the newer schema. Adjacent-version schemas are applied before any N+1 binary starts, which is the main guard that a binary rollback remains safe.

If a schema change itself is the problem:

1. **One cluster still on the previous schema:** [Fail over](/docs/concepts/cross-dc-replication) to that cluster, then delete the affected workflows on the upgraded cluster. Replication does not resend an execution on its own if open workflows don't have a new history event; users may need to send a signal to each affected open workflow on the now-active cluster to trigger a decision and start replication. A [batch signal job](/docs/cli#signal-cancel-terminate-workflows-as-a-batch-job) with a `CloseTime = missing` query covers the open executions.
2. **Every cluster already on the new schema:** Reset the impacted workflows so they replay on a healthy code path. `cadence workflow reset-batch` takes either an input file of workflows or a visibility query. See [Reset workflow](/docs/cli#reset-workflow).
3. **No previous action resolved the issue:** Restore the datastore and visibility stores from a backup taken before the schema change, then run the previous binary against that restored schema. Treat restore as the last option, not the default recovery path.

To date, Cadence has not required a production schema rollback. A persistence backup is still available as that last-resort precaution; take datastore and visibility backups with the provider's usual procedure if you want it.

## Schema compatibility during rollback

Schema version numbers are independent of Cadence server release numbers. The schema tools record the current version in persistence and apply migrations in order. They do not provide down migrations. Before a schema ships in an official release, the upgrade has already been part of that staged pre-release rollout. Rollback is expected to keep the newer schema and restore the previous binary.

The project aims to keep adjacent minor versions N and N+1 backward compatible, so rolling the server binary back from N+1 to N is the supported path unless the release notes document an incompatible schema or data migration. Check the target release notes before upgrading. Compatibility between N-1 and N+1 is not maintained. If a farther rollback is necessary, ask the maintainers in [`#cadence-users` on CNCF Slack](https://inviter.co/cncf) before you attempt it.

On startup, Cadence compares the installed schema with the version required by the binary. Persistence must be at least as new as the binary expects. This asymmetric check is intentional: after an additive schema migration, the previous binary can run against the newer schema during rollback. See the [schema compatibility check](https://github.com/cadence-workflow/cadence/blob/master/tools/common/schema/handler.go) and [schema verification implementation](https://github.com/cadence-workflow/cadence/blob/master/common/persistence/schema/verify.go).

Do not assume every schema or data migration is backward compatible. Check the target release notes before upgrading and do not roll a binary back across a release that documents an incompatible migration. Also:

- Do not use the auto-setup image to migrate production schemas. It is intended for development and initial setup.
- Do not change `numHistoryShards`, cluster identity, or the persistence driver as part of a binary upgrade. Changing those values requires a separate cluster migration.
- Test advanced visibility separately from the default persistence store because it has its own schema and write path.

For commands and backend-specific caveats, see [Cluster maintenance](/docs/operation-guide/maintain), the [`cadence-cassandra-tool` README](https://github.com/cadence-workflow/cadence/tree/master/tools/cassandra), and the [`cadence-sql-tool` README](https://github.com/cadence-workflow/cadence/tree/master/tools/sql).

## Worker and SDK changes

Server rollback testing does not prove that application workflow code can be rolled back safely. Workflow implementations replay event history and must remain deterministic. Test worker changes with history replay and the SDK's workflow-versioning APIs, then deploy workers independently from the server rollout. See [Workflow versioning](/docs/go-client/workflow-versioning).

If a worker rolls back to a version that is incompatible with the new workflow code, executions can fail on replay. Recover them with a [batch reset](/docs/cli) of the workflows that started after the new worker rollout and before the rollback.

## Related documentation

- [Infrastructure compatibility](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/infrastructure-compatibility)
- [Rollback procedures](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/rollback-procedures)
- [Failure scenarios](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/failure-scenarios)
- [Rollback metrics](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/rollback-metrics)
