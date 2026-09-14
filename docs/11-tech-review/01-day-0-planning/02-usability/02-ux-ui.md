---
layout: default
title: UX & UI
description: The user experience and user interface of Cadence.
keywords:
  - cadence ux
  - cadence ui
  - cadence user interface
  - cadence web ui
---

The Cadence user experience spans three interfaces rather than a single screen: language **SDKs** for writing workflows, a **CLI** for scripted operations, and a **Web UI** for visual ones. A user may touch more than one in a single task.

## SDKs — the authoring interface

Cadence has no GUI workflow builder and no YAML dialect. Workflows and activities are written as ordinary functions in a general-purpose language, and Cadence makes their execution durable across process and host failures. Per the [Get started guide](https://cadenceworkflow.io/docs/get-started), SDKs are available for **Go and Java (official)** and **Python and Ruby (community)**, with [iWF](https://cadenceworkflow.io/docs/get-started) available as a DSL framework layered on top for teams who want one.

From the [helloworld sample](https://github.com/cadence-workflow/cadence-samples/blob/d643bfcd7fb9c45707c3667ed54ca0c0354ea640/cmd/samples/recipes/helloworld/helloworld_workflow.go):

```go
func helloWorldWorkflow(ctx workflow.Context, name string) error {
	ao := workflow.ActivityOptions{
		ScheduleToStartTimeout: time.Minute,
		StartToCloseTimeout:    time.Minute,
		HeartbeatTimeout:       time.Second * 20,
	}
	ctx = workflow.WithActivityOptions(ctx, ao)

	var helloworldResult string
	err := workflow.ExecuteActivity(ctx, helloWorldActivity, name).Get(ctx, &helloworldResult)
	if err != nil {
		return err
	}
	return nil
}
```

The developer experience here is deliberately unremarkable: normal control flow, normal types, normal tests. The SDK repositories carry replay and shadowing test helpers so a workflow change can be checked against real recorded histories before deployment.

## CLI — the scriptable interface

The `cadence` [CLI](https://cadenceworkflow.io/docs/cli) groups subcommands by object — `domain` (`d`), `workflow` (`wf`), `tasklist` (`tl`), `admin` (`adm`), `cluster` (`cl`) — and is self-documenting through `--help` at every level. Typical use covers `workflow start`/`run`, `show`, `describe`, `signal`, `query`, `stack`, `reset`, `cancel`, `terminate`, `batch`, and `list`/`scan`/`count` for search.

It is distributed as a Homebrew binary, a local build (`make tools` from the server repo), and the `ubercadence/cli` Docker Hub image whose tags track server releases. Global options include `--address`, `--domain`, `--transport grpc|tchannel`, `--tls_cert_path`, and `--jwt`/`--jwt-private-key`, each with a `CADENCE_CLI_*` environment variable so repeated flags can be set once. This is the layer CI pipelines, runbooks, and break-glass scripts call.

## Web UI — the visual interface

[cadence-web](https://github.com/cadence-workflow/cadence-web/tree/v4.0.16) is part of a default deployment, not an optional add-on: it ships as the `ubercadence/web` image, comes up with the Cadence Docker Compose setup, and is deployed by the [official Helm chart](https://github.com/cadence-workflow/cadence-charts/blob/cadence-1.6.7/charts/cadence/values.yaml). The quickstart points a new user at it on `localhost:8088` before their first workflow runs. It can also run standalone against any gRPC-reachable cluster.

At release [v4.0.16](https://github.com/cadence-workflow/cadence-web/releases/tag/v4.0.16) it covers domains and failover history; workflow search; a workflow page with summary details, filterable event history with JSON export, payloads, and a pending-activity badge; single-execution actions (start, restart, reset, signal, cancel, terminate) plus batch cancel/terminate/signal across a query with a rate limit; registered workflow queries that can render interactive Markdoc; a `__stack_trace` tab; task list worker inspection; cron and schedule listings; Diagnostics; and archived histories.

The [v4.0 announcement](https://cadenceworkflow.io/blog/2025/04/11/2025-04-11-announcing-cadence-web-v4/announcing-cadence-web-v4) has side-by-side screenshots of the workflow history page and the multi-cluster experience before and after the v4 rewrite.

The UI does not try to hide the layer below it. The workflow page and domain help menu open a [CLI commands modal](https://github.com/cadence-workflow/cadence-web/blob/v4.0.16/src/views/workflow-page/config/workflow-page-cli-commands.config.ts) listing the equivalent `cadence` commands with the current domain, workflow ID, and run ID substituted in, so an action taken visually can be lifted into a script.

## What each layer exposes in a given deployment

The stack is configurable per deployment without code changes.

- **Cluster capability** decides the search experience: cadence-web reads `advancedVisibilityEnabled` from `describeCluster` and falls back to basic search when the feature is absent, or when an authenticated non-admin user is not permitted to call `describeCluster`. Basic visibility is, per the [Search workflows docs](https://cadenceworkflow.io/docs/concepts/search-workflows), "basic listing without being able to search".
- **Feature flags** gate several UI areas behind environment variables, some with a minimum Cadence server version — see the [README feature-flags table](https://github.com/cadence-workflow/cadence-web/blob/v4.0.16/README.md#feature-flags); the [dynamic config resolvers](https://github.com/cadence-workflow/cadence-web/tree/v4.0.16/src/config/dynamic/resolvers) behind it are the extension point for forks.
- **Authentication** is `disabled` or cookie-based `jwt` (`CADENCE_WEB_AUTH_STRATEGY`). Under `jwt`, the [`WORKFLOW_ACTIONS_ENABLED` resolver](https://github.com/cadence-workflow/cadence-web/blob/v4.0.16/src/config/dynamic/resolvers/workflow-actions-enabled.ts) withholds write actions from users without write access to the domain and falls back to disabled if access cannot be resolved. The CLI carries `--jwt`/`--jwt-private-key` for the equivalent path.


## Related documentation

- [Target persona interactions](/docs/tech-review/day-0-planning/usability/persona-interactions)
- [Production integrations](/docs/tech-review/day-0-planning/usability/production-integrations)
- [Design principles](/docs/tech-review/day-0-planning/design/design-principles)
- [End user research](/docs/tech-review/day-0-planning/scope/end-user-research) — currently a stub, so nothing on this page depends on it
- [Get started with Cadence](https://cadenceworkflow.io/docs/get-started)
- [cadence-web repository at v4.0.16](https://github.com/cadence-workflow/cadence-web/tree/v4.0.16)
- [Cadence CLI docs](https://cadenceworkflow.io/docs/cli)
- [Cadence Helm chart at cadence-1.6.7](https://github.com/cadence-workflow/cadence-charts/tree/cadence-1.6.7)
- [Search workflows (Advanced visibility)](https://cadenceworkflow.io/docs/concepts/search-workflows)
