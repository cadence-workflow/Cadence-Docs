---
layout: default
title: Default Behaviors & Overrides
description: How enabling Cadence changes default behavior of the cluster or running workloads.
keywords:
  - cadence default behavior
  - cadence configuration overrides
  - cadence workload behavior
---

A new Cadence cluster starts in a deliberately quiet state. The most important default is that nothing uses the engine until someone asks it to: an application reaches Cadence only after it connects through a language SDK to a registered domain, so installing the server does not change the behavior of applications that have not done that.

The defaults that matter after that point are the values Cadence picks when a configuration field, a domain setting, or a workflow option is left unset. This page lists those values and, for each one, the layer you change to override it and how to put it back.

## Where defaults come from

Cadence has four configuration surfaces. They control different parts of the system, so they do not form one universal override chain.

| Surface | Scope | When it takes effect | How to reverse it |
| --- | --- | --- | --- |
| [Static configuration](/docs/operation-guide/setup#static-configuration) | Service topology, persistence, cluster metadata, TLS, authorization, archival providers | When a server process starts | Restore the previous YAML and perform a rolling restart |
| [Dynamic configuration](/docs/operation-guide/setup#dynamic-configuration) | Runtime limits, feature switches, rate limits, and values filtered by domain, task list, task type, shard, or cluster | After the dynamic configuration client reloads it | Remove the override or restore the previous value |
| Domain configuration | Retention, archival status and URI, replication, and domain-level metadata | After domain registration or update | Issue another domain update, where the setting is reversible |
| SDK and workflow options | Workflow IDs, task lists, timeouts, retries, worker concurrency, and data conversion | On the client, worker, or newly issued command | Change the application configuration or deploy updated application code |

### Static server configuration

The full file layout, merge order, and field reference are in [Cluster configuration](/docs/operation-guide/setup#static-configuration).

The server loads YAML from a config directory. Later files override earlier files:

1. `base.yaml`
2. `<environment>.yaml` (default `development.yaml`)
3. `<environment>_<zone>.yaml` if a zone is set

Three **independent** environment variables (each also a command-line flag) select which of those files are loaded. They do not override one another:

| Variable | Flag | What it selects | If unset |
| --- | --- | --- | --- |
| `CADENCE_CONFIG_DIR` | `--config` / `-c` | Config directory (relative to `CADENCE_ROOT` / `--root`, or an absolute path) | `config` |
| `CADENCE_ENVIRONMENT` | `--env` / `-e` | The environment file, for example `production.yaml` | `development` |
| `CADENCE_AVAILABILITY_ZONE` | `--zone` / `--az` | Optional zone file, for example `production_az1.yaml` | No zone file |

If both a flag and its environment variable are set, the flag wins. A fourth variable, `CADENCE_ROOT` (`--root` / `-r`), is the process root used to resolve a relative config directory.

A different use of environment variables is **inside** the YAML: `$VAR` or `{$VAR:default}` placeholders expand after the files are merged. That expansion does not map arbitrary environment names onto Go config fields.

Static changes require a rolling restart of the affected services. Persistence backends, cluster identity, TLS, authorization, and archival providers belong to this layer. Some values are cluster design decisions rather than tuning knobs:

- `numHistoryShards` is chosen when the cluster is created. History shard ID is `hash(workflowID) % numHistoryShards`, so raising or lowering the number remaps every existing execution. Cadence does not support changing it in place. Replicated clusters should keep the same count. To scale an environment further [migrating to a larger cluster](/docs/operation-guide/migration#migrate-with-global-domain-replication-feature) is possible but risky; see [the Migration page](/docs/operation-guide/migration#migrate-with-global-domain-replication-feature) for more details.
- Cluster names, initial failover versions, and failover-version increments must remain consistent across replicated clusters.
- Removing a persistence or archival provider while stored data still depends on it is not a safe rollback.

Container images and Helm charts may render static YAML from their own values and environment variables. Those packaging defaults are not universal server defaults. Review the generated configuration before treating a chart or image value as Cadence behavior.

### Dynamic configuration

Every dynamic configuration key has a compiled default. An operator-provided value replaces it globally or under the filters allowed for that key. When several entries match, the first matching constrained entry wins; an entry without constraints is the fallback.

The file-based client periodically reloads its YAML file in each Cadence process. Operators must distribute the same file to every relevant instance. The `configstore` client instead keeps overrides in Cadence persistence and distributes them by polling; the admin CLI can list, get, update, and restore those values. A change is not necessarily visible on every process at the same instant, so staged changes should allow for the configured polling interval.

Dynamic configuration can tune a subsystem that static configuration initialized, but it cannot create a missing dependency. For example, dynamic switches can pause archival or select an already configured advanced visibility store, but they cannot initialize an archival provider or datastore that is absent from static YAML.

## Application behavior

Cadence absorbs durability, timers, recovery, and coordination, but it does not guess the application-specific limits needed to run a workflow.

| Behavior | Default | Override |
| --- | --- | --- |
| Existing applications | Unchanged after Cadence is installed | Connect with a Cadence SDK and register a domain |
| Workflow TaskList | No default; the caller must select one | Set it in workflow start options |
| Workflow execution timeout | No default; the caller must provide one | Set it in workflow start options |
| Decision-task timeout | 10 seconds when omitted by the SDK | Set the decision-task start-to-close timeout |
| Workflow ID | Generated UUID when omitted | Supply a stable application ID |
| Workflow ID reuse | Allow a new run after the previous run failed, timed out, or was terminated | Set the workflow ID reuse policy |
| Activity TaskList | Inherits the workflow TaskList | Set an activity-specific TaskList |
| Activity and workflow retries | Disabled unless a retry policy is supplied | Attach a retry policy with its limits and non-retryable errors |
| Cron schedule | Disabled | Supply a cron schedule in workflow options |
| Context propagation | No application context propagators by default | Configure propagators on clients and workers |
| Payload conversion | Uses the language SDK's default converter | Configure the same custom converter on clients and workers |

Timeout validation and worker defaults differ by SDK. In particular, Go and Java require explicit activity timeout combinations, while the Python SDK supplies activity defaults before sending the command. Use the options reference for the [Go](/docs/go-client), [Java](/docs/java-client), or [Python](/docs/python-client/workers) client rather than assuming values transfer unchanged between languages.

Retries are opt-in. Once a retry policy is attached, the Cadence server records and schedules attempts durably, including after process restarts. Because an activity can be delivered again after a timeout or worker failure, activity implementations should be idempotent even when the retry policy limits the number of attempts.

## Domain and routing defaults

A domain is the boundary for retention, archival, replication, and many dynamic configuration filters. Domain registration persists these settings; they are not inherited from a Kubernetes namespace.

- The server accepts retention periods from 1 through 30 days by default. The CLI supplies 3 days when `domain register` omits `--retention`; that is a CLI convenience, not a server default.
- History and visibility archival are disabled by default in production-oriented container configuration. Enabling archival requires both a statically configured provider and domain-level enablement. After archival is enabled for a domain, its archival URI cannot be changed.
- A TaskList starts with one read partition and one write partition. Additional partitions and adaptive scaling are operator choices. When reducing partitions, lower write partitions first, allow tasks to drain, and then lower read partitions.
- A domain is local unless it is registered as global with replication configuration. Multi-cluster failover is never inferred from Kubernetes regions or server placement.

## Production overrides

A minimal local deployment favors ease of evaluation. Before production traffic, operators normally review these choices explicitly:

| Area | Production decision |
| --- | --- |
| Persistence | Select and initialize supported durable stores; size history shards before cluster creation |
| Security | Enable TLS or mTLS and replace the no-op authorizer when API authorization is required |
| Availability | Run multiple instances of Frontend, History, Matching, and the internal Worker service and configure service discovery |
| Observability | Configure one supported metrics reporter per service and collect structured logs |
| Visibility | Configure the default visibility store; add advanced visibility and Kafka only when indexed search is needed |
| Archival | Configure durable object storage before enabling archival on domains |
| Capacity | Tune persistence QPS, API limits, worker concurrency, and task-list partitions from measured load |
| Multi-cluster | Configure cluster metadata and global domains before relying on cross-cluster replication or failover |

Cadence defaults are intended to make a small deployment operable, not to select production capacity or an organization's security policy. Apply overrides narrowly, record them with the deployment configuration, and validate them on a non-production domain before broad rollout.

## Related documentation

- [Cluster configuration](/docs/operation-guide/setup)
- [Installation and configuration](/docs/tech-review/day-1-installation/installation-configuration)
- [Live cluster enablement and rollback](/docs/tech-review/day-1-installation/enablement-rollback/live-cluster-enablement-rollback)
- [Domain operations](/docs/cli#domain-operation-examples)
- [Go client retries](/docs/go-client/retries)
- [Archival](/docs/concepts/archival)
- [Advanced visibility](/docs/concepts/search-workflows)
- [Cross-cluster replication](/docs/concepts/cross-dc-replication)
