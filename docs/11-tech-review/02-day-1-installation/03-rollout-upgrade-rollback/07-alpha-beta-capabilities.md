---
layout: default
title: Alpha & Beta Capabilities
description: How Cadence permits utilization of alpha and beta capabilities as part of a rollout.
keywords:
  - cadence alpha features
  - cadence beta features
  - cadence feature flags
  - cadence experimental
---

Cadence keeps one public API for the current server release. A capability that is not yet the default behavior ships in that release and stays off, or in a shadow mode, until you enable it for a chosen scope. Existing workflows keep the previous behavior while you try the new one.

There is no separate alpha or beta API version, and no feature-gate list that graduates from Alpha to Beta to general availability. Public Protocol Buffer packages are not split into alpha and beta packages. Most new capabilities are built and tested in continuous integration, then shipped behind an off-by-default dynamic configuration key or SDK flag. Maintainers enable them progressively across many environments at scale while the default path continues serving existing workloads.

When that staged testing establishes that the flag is safe for broader use, the project publishes usage documentation and a blog post that explains the problem, the rollout, and the observed impact, including relevant metrics. These materials tell users that the capability is available and how to opt in. After further production use, a later release can make the capability the default while retaining a rollback control when compatibility permits. Examples include the [adaptive task-list scaling guide](https://github.com/cadence-workflow/cadence/blob/v1.4.1/docs/migration/tasklist-partition-config.md) and [its rollout results](/blog/2025/06/30/adaptive-tasklist-scaler).

A pre-release tag such as [`v1.2.19-prerelease07`](https://github.com/cadence-workflow/cadence/releases/tag/v1.2.19-prerelease07) marks a candidate server build soaked before the stable GitHub Release. It is not a stability label on an API. See [Upgrade and rollback testing](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/upgrade-rollback-testing).

## What counts as an early capability

There is no published catalog that marks features alpha or beta. Do not infer maturity from an off-by-default key, a shadow mode, an SDK option, or documented limitations. Supported features can use all of these mechanisms for safe rollout and backward compatibility.

Treat a capability as early only when its release notes or usage documentation explicitly describes it as experimental or preview, or warns that its behavior or interface can change or be removed. Do not enable a flag that appears only in source code and has no release note, blog post, or usage guide identifying it as supported for opt-in use. Such a flag is an internal implementation detail, not a user-facing alpha or beta feature.

A documented opt-in is a supported feature whose compiled default stays off. That includes infrastructure you configure yourself, such as TLS, archival, or advanced visibility, and a behavior change shipped behind a flag, such as the global Frontend rate limiter. The flag lets existing deployments keep the previous behavior until they enable it. Once release notes or usage documentation describe that opt-in as available, it has the compatibility expectations on [Deprecations and removals](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/deprecations). Defaults and rollback steps are on [Default behaviors](/docs/tech-review/day-1-installation/enablement-rollback/default-behaviors). An early capability can change, including being removed, when a release note says so.

## Enable an opt-in feature

Use these steps when you enable a supported opt-in. The same steps apply when release notes or usage documentation describe a feature as experimental, preview, or still under test. A supported opt-in stays off so existing deployments keep the previous behavior. Maintainers may also recommend a specific feature for your deployment. When an announcement gives different instructions, follow those instructions.

1. Deploy the release with the capability still at its compiled default. Open workflows continue on the previous path.
2. Enable it for the smallest scope the feature allows. Most features turn on through dynamic configuration. Filters in the current server include domain, task list, task type, shard, and, for some keys, a rate-limit key. The allowed filters are declared on each key in [`constants.go`](https://github.com/cadence-workflow/cadence/blob/v1.4.1/common/dynamicconfig/dynamicproperties/constants.go). Some features turn on through static YAML, such as a new listener or datastore. Those changes take effect after a rolling restart.
3. When the key has a shadow mode, use shadow before the mode that serves the new result. Shadow runs the new path and emits its metrics. The result that clients observe still comes from the previous path.
4. Widen the filter only after that scope stays within the deployment's normal error rate, latency, and task-backlog range.
5. To stop using the capability without rolling the binary back, restore the previous dynamic value or stop setting the SDK flag. If the new path already wrote history, schema, or domain data that the previous path cannot read, use the recovery steps on [Upgrade and rollback testing](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/upgrade-rollback-testing).

The file-based dynamic configuration client reloads its YAML in each process. The `configstore` client polls Cadence persistence. Many of these changes do not need a restart. A new listener, datastore, or other static YAML change still needs a rolling restart. See [Cluster configuration](/docs/operation-guide/setup).

## Shadow modes in the current server

These keys are in Cadence server v1.4.1. `disabled` is the serving default unless the table says otherwise.

| Key | Default | What shadow does | Filter |
| --- | --- | --- | --- |
| `frontend.globalRatelimiterMode` | `disabled` | This key has been used for years. Enabling it changes how rate limits are applied and provides more stable quota management. `local-shadow-global` and `global-shadow-local` run both limiters and serve one of them, so the other can warm up before you switch | Rate-limit key |
| `history.historyTaskDLQMode` | `disabled` | `shadow` writes failed history tasks to the dead-letter queue and does not process them. `enabled` writes those tasks, and processes them only when `history.historyTaskDLQProcessorEnabled` is also true. That key defaults to `false` | Domain |
| `history.timerProcessorCachedQueueReaderMode` | `disabled` | This key serves timer-task reads from an in-memory cache and reduces database usage. It is an internal optimization. No release note or usage guide identifies it as a supported opt-in, so leave it at `disabled` unless maintainers recommend enabling it. `shadow` prefetches with the cached reader and still serves reads from the base reader | Shard |
| `history.taskSchedulerEnableRateLimiter` | `false` | The limiter stays off until this key is true. `history.taskSchedulerEnableRateLimiterShadowMode` defaults to `true`, so turning the limiter on starts in shadow unless you set the shadow key to `false` | Shadow key: domain |

## SDK flags

The Go SDK names the same idea `FeatureFlags`. Its boolean fields default to off, so an upgraded SDK keeps the previous behavior for those fields until the application sets the flag. `PollerAutoScalerEnabled` is deprecated; use `AutoScalerOptions` instead. `MetricEmitMode` is the exception. Leaving it unset selects [`metrics.EmitHistogramsOnly`](https://github.com/cadence-workflow/cadence-go-client/blob/v1.4.0/internal/common/metrics/emit.go#L58), which emits histogram metrics. Set `metrics.EmitTimersOnly` to keep the previous timer-only metrics, or `metrics.EmitBoth` to emit both. Set a boolean flag on both the client and the worker when the two must agree. See [`FeatureFlags`](https://github.com/cadence-workflow/cadence-go-client/blob/v1.4.0/internal/internal_utils.go) in Go SDK v1.4.0 and the SDK rows on [Default behaviors](/docs/tech-review/day-1-installation/enablement-rollback/default-behaviors).

Java and Python expose worker and client options on their own types. Check the options for the SDK you ship before assuming a Go flag name exists there.

## Ask the community

If a capability's support status, rollout instructions, or compatibility guarantees are unclear, ask the Cadence maintainers before enabling it in production. Include your server and SDK versions, the configuration key or SDK option, and the scope in which you plan to enable it.

Ask in [`#cadence-users` on CNCF Slack](https://inviter.co/cncf) or open a [GitHub Discussion](https://github.com/cadence-workflow/cadence/discussions). Do not rely on the presence of a flag in source code as evidence that it is ready for production use.

## Related documentation

- [Default behaviors](/docs/tech-review/day-1-installation/enablement-rollback/default-behaviors)
- [Deprecations and removals](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/deprecations)
- [Upgrade and rollback testing](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/upgrade-rollback-testing)
- [Cluster configuration](/docs/operation-guide/setup)
- [Dynamic configuration definitions](https://github.com/cadence-workflow/cadence/blob/v1.4.1/common/dynamicconfig/dynamicproperties/constants.go)
