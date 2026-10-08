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

The Cadence user experience spans three interfaces: language **SDKs** for writing workflows, a **CLI** for scripted operations, and a **Web UI** for visual ones. A user may touch more than one in a single task.

## SDKs: the authoring interface

Workflows and activities are written as functions in a general-purpose language, and Cadence makes their execution durable across process and host failures. Per the [Get started guide](/docs/get-started), SDKs are available for **Go and Java (official)** and **Python and Ruby (community)**, with [iWF](https://github.com/indeedeng/iwf) available as a DSL framework layered on top for teams who want one.

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

The Go and Java SDKs add replay and shadowing helpers so a workflow change can be checked against real recorded histories before deployment.

## CLI: the scriptable interface

The `cadence` [CLI](/docs/cli) groups subcommands by object: `domain` (`d`), `workflow` (`wf`), `tasklist` (`tl`), `admin` (`adm`), `cluster` (`cl`); it is self-documenting through `--help` at every level. Typical use covers `workflow start`/`run`, `show`, `describe`, `signal`, `query`, `stack`, `reset`, `cancel`, `terminate`, `batch`, and `list`/`scan`/`count` for search.

It is distributed as a Homebrew binary, a local build (`make tools` from the server repo), and the `ubercadence/cli` Docker Hub image whose tags track server releases. Global options include `--address`, `--domain`, `--transport grpc|tchannel`, `--tls_cert_path`, and `--jwt`/`--jwt-private-key`, each with a `CADENCE_CLI_*` environment variable so repeated flags can be set once. This is the layer CI pipelines, runbooks, and incident-response scripts call.

## Web UI: the visual interface

[cadence-web](https://github.com/cadence-workflow/cadence-web) is an optional, separately deployed browser UI. Docker Compose includes it; the [Helm chart](https://github.com/cadence-workflow/cadence-charts) can deploy it; a local server binary does not. It can also run standalone against any gRPC-reachable cluster.

It covers domains and failover history; workflow search; a workflow page with summary details, filterable event history with JSON export, payloads, and a pending-activity badge; single-execution actions (start, restart, reset, signal, cancel, terminate) plus batch cancel/terminate/signal; registered workflow queries that can render interactive Markdoc; a `__stack_trace` tab; task list worker inspection; cron and schedule listings; Diagnostics; and archived histories.

## Deployment-dependent Web UI capabilities

What the UI can do depends on the cluster and how cadence-web is configured.

- **Visibility.** The UI's search experience follows the cluster. With [advanced visibility](/docs/concepts/search-workflows) it can query executions; without it, the UI shows a listing with limited search experience.
- **Feature flags.** Several UI areas are opt-in; see the [cadence-web README](https://github.com/cadence-workflow/cadence-web/blob/master/README.md#feature-flags).
- **Authentication.** Auth can be off or JWT. Under JWT, users without write access to a domain do not get write actions (except batch actions, which depend on access to the `cadence-batcher` domain). The CLI has the equivalent `--jwt` path. 

## Related documentation

- [Target persona interactions](/docs/tech-review/day-0-planning/usability/persona-interactions)
- [Production integrations](/docs/tech-review/day-0-planning/usability/production-integrations)
- [Design principles](/docs/tech-review/day-0-planning/design/design-principles)
