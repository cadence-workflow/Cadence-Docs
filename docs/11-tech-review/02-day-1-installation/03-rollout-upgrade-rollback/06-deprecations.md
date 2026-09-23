---
layout: default
title: Deprecations & Removals
description: How Cadence informs users of deprecations and removals of features and APIs.
keywords:
  - cadence deprecations
  - cadence api removals
  - cadence breaking changes
---

Cadence repositories use semantic versioning and publish changes in GitHub Releases. The server, SDKs, Helm chart, and Web UI have independent versions and release schedules. Review the release notes for every component that you upgrade.

A deprecation is a call to stop using that surface and move to the replacement as soon as possible. Cadence does not publish a fixed deprecation period or an end-of-life calendar. The old path may keep working so you can migrate without an immediate outage, but that is not permission to stay on it. Do not wait for a later removal date unless a release note or migration guide names one.

## How users are informed

Deprecation and removal notices use several channels:

- **GitHub Releases:** Release notes are the written record for behavior changes, migration steps, and removed features. See the [server](https://github.com/cadence-workflow/cadence/releases), [Go SDK](https://github.com/cadence-workflow/cadence-go-client/releases), [Java SDK](https://github.com/cadence-workflow/cadence-java-client/releases), [Python SDK](https://github.com/cadence-workflow/cadence-python-client/releases), [Helm chart](https://github.com/cadence-workflow/cadence-charts/releases), and [Web UI](https://github.com/cadence-workflow/cadence-web/releases) releases.
- **CNCF Slack `#cadence-users`:** This is the most active community channel. Maintainers announce deprecations, removals, and other breaking changes here, and it is the place to ask follow-up questions. [Join the CNCF Slack workspace](https://inviter.co/cncf) and open `#cadence-users`.
- **Migration and upgrade documentation:** Changes that require operator action include a replacement or migration procedure. Read each minor release's notes before an upgrade.
- **Source-level deprecation markers:** SDK APIs and Protocol Buffer fields are marked in source so language tooling can warn on new use. Those warnings appear in editors and, when the checks are enabled, in build and CI results.
- **Runtime and CLI warnings:** Some deprecated configuration keys and flags still work, and Cadence prints a warning when they are used so you can find leftover usage in logs.
- **Other community posts:** Larger migrations can also appear on the [Cadence blog](/blog) and in [GitHub Discussions](https://github.com/cadence-workflow/cadence/discussions).

Cadence uses the usual marker for each language. Adding one of these is what makes the deprecation show up in a downstream build:

| Surface | Marker | How it shows in a build |
| --- | --- | --- |
| Go SDK | `// Deprecated:` in the doc comment | Go tooling (`go vet`, `staticcheck`, and editors) warns on use. Examples: [`worker.New`](https://github.com/cadence-workflow/cadence-go-client/blob/v1.3.1/worker/worker.go), [`activity.Register`](https://github.com/cadence-workflow/cadence-go-client/blob/v1.3.1/activity/activity.go), [`workflow.Register`](https://github.com/cadence-workflow/cadence-go-client/blob/v1.3.1/workflow/workflow.go). |
| Protocol Buffers | `[deprecated = true]` on the field | Code generators attach the language deprecation. Generated Go is `// Deprecated: Do not use.` Generated Java accessors use `@Deprecated`. Examples: [`region_to_cluster`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/domain.proto), [`num_read_partitions`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/tasklist.proto). |
| Java SDK | `@Deprecated` and Javadoc | `javac -Xlint:deprecation` and IDEs warn on use. Example: the `query` overloads on [`WorkflowStub`](https://github.com/cadence-workflow/cadence-java-client/blob/v4.0.0/src/main/java/com/uber/cadence/client/WorkflowStub.java). |
| Python SDK | No equivalent marker today | Use of a deprecated Python API does not by itself fail or warn in a build. |

Proto's `[deprecated = true]` option does not produce a compile-time warning in every generated language. Generated Java and Go code surfaces the deprecation to their respective tooling.

Deprecated configuration and CLI usage can also show up as **warning logs at runtime**, even when the old value is still accepted. Treat those lines as leftover use to fix, not as a permanent compatibility path. The messages below are examples of that pattern. Later deprecations may log different text, on different components, or only after a specific flag or config is read.

| Example | What you see today |
| --- | --- |
| Deprecated cluster YAML aliases | On process start, if `masterClusterName` or `clusterInformation` is set and the replacement is empty, the server logs `[WARN]` and names `primaryClusterName` or `clusterGroup`. See [`cluster.go`](https://github.com/cadence-workflow/cadence/blob/master/common/config/cluster.go). |
| Deprecated CLI flag | `--print_json` still runs, and the CLI writes a warning to stderr telling you to use `--format json`. |

Watch server and CLI logs for `deprecated` and `[WARN]` when you upgrade. A warning means stop using that surface; it does not mean the process failed. New warnings will use the same idea even if the key or flag is different.

Major or controversial feature deprecations can require a Technical Steering Committee decision. The [governance process](/community/governance) requires recorded decisions to be published and announced publicly.

## How a removal is developed

Contributors are expected to identify compatibility and migration effects before merge. Cadence repositories use a breaking-change review template for selected schema and public-interface changes. It asks for impact analysis, testing, rollout, and rollback plans. See the [server template](https://github.com/cadence-workflow/cadence/blob/master/.github/workflows/breaking_change_pr_template.md) for the current text; the same review is expected in the other Cadence repositories.

When the existing surface can remain available, the project follows this sequence:

1. **Deprecate the old surface:** Mark the API, field, flag, or configuration key as deprecated and identify the replacement. Treat that mark as the signal to stop new use immediately.
2. **Run both paths:** Keep the old path operational while existing callers migrate, when compatibility permits.
3. **Announce the removal:** Describe required action in release notes or a migration guide.
4. **Release the change:** Follow that component's release notes for the exact compatibility boundary and migration steps. Do not infer compatibility only from another Cadence component's version.

Security, data-integrity, or correctness defects can require a faster change. Experimental surfaces can also change without the same compatibility expectations as stable APIs.

## Current deprecations

The following deprecated surfaces still exist in released code. Plan the replacement now rather than waiting for a later removal.

| Surface | Status and replacement |
| --- | --- |
| Server configuration `clusterMetadata` | Still accepted with a startup warning. Stop using it; rename the section to `clusterGroupMetadata`. |
| Server configuration `masterClusterName` | Still accepted with a startup warning. Stop using it; set `primaryClusterName`. |
| Server configuration `clusterInformation` | Still accepted with a startup warning. Stop using it; set `clusterGroup`. |
| Server configuration top-level `dcRedirectionPolicy` | Still accepted with a startup warning. Stop using it; set `clusterRedirectionPolicy` inside `clusterGroupMetadata`. |
| Static `dynamicConfigClient` configuration | Stop using it. Replace with the `dynamicconfig` section. Values are not copied automatically when moving from a YAML file to the `configstore` client. See [Cluster configuration](/docs/operation-guide/setup#config-store-client). |
| Go SDK `worker.New` | Deprecated; it panics on construction errors. Use `worker.NewV2`, which returns those errors. |
| Go SDK global activity registration | `activity.Register` and `activity.RegisterWithOptions` are deprecated. Register activities on the Worker instance instead. |
| Go SDK global workflow registration | The global `workflow.Register` functions are deprecated. Register workflows on the Worker instance instead. |
| CLI `--print_json` | Stop using it. Use `--format json`. The two flags return different JSON shapes, and the CLI prints that warning when the deprecated flag is used. |

The source remains the authoritative inventory because there is no centralized machine-readable list. See the server's [cluster configuration aliases](https://github.com/cadence-workflow/cadence/blob/master/common/config/cluster.go), the Go SDK's [`worker.New` deprecation](https://github.com/cadence-workflow/cadence-go-client/blob/v1.3.1/worker/worker.go), [activity registration deprecations](https://github.com/cadence-workflow/cadence-go-client/blob/v1.3.1/activity/activity.go), and [workflow registration deprecations](https://github.com/cadence-workflow/cadence-go-client/blob/v1.3.1/workflow/workflow.go).

## Recent removals and major migrations

### Java SDK 4.x

Java SDK 4.0 removed Thrift and TChannel from the client. Java 4.x uses `WorkflowServiceGrpc`; Java 3.x supports both gRPC and TChannel and remains a separate release line with no published end-of-life date. The [4.0 release notes](https://github.com/cadence-workflow/cadence-java-client/releases/tag/v4.0.0) list the API, exception, and data-converter changes required for migration.

This SDK removal does not remove TChannel from the Cadence server. The server still exposes its TChannel endpoints for the Go SDK, Java 3.x, and other compatibility clients.

### Server 1.4

Server 1.4.0 removed unused dynamic configuration keys and deprecated active-active fields and providers. These removals are listed under **Deprecation & Cleanup** in the [1.4.0 release notes](https://github.com/cadence-workflow/cadence/releases/tag/v1.4.0). Operators should not depend on undocumented configuration keys, even when older binaries accepted them.

## Terms that do not mean API deprecation

Deprecating a Cadence domain is an operational action that prevents new workflow executions in that domain. It is not a statement that a product API or feature will be removed. Workflow versioning is also separate: it keeps workflow code deterministic while workers with different code versions process existing histories.

## Related documentation

- [Infrastructure compatibility](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/infrastructure-compatibility)
- [Upgrade and rollback testing](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/upgrade-rollback-testing)
- [Cluster maintenance](/docs/operation-guide/maintain)
- [Cluster configuration](/docs/operation-guide/setup)
