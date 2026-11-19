---
layout: default
title: Workflow Diagnostics
description: This page explains Cadence Workflow Diagnostics, which checks a workflow execution's history for timeouts, failures, retry misconfigurations, timeout risks, and antipatterns. It covers the supported checks, version requirements, the Cadence Web feature flags, the CLI and API, and the diagnostics report format.
keywords:
  - cadence workflow diagnostics
  - cadence diagnose workflow
  - cadence workflow diag
  - cadence diagnostics report
  - query-diagnostics-report
  - DiagnoseWorkflowExecution
  - CADENCE_WORKFLOW_DIAGNOSTICS_ENABLED
  - cadence root cause analysis
permalink: /docs/workflow-troubleshooting/workflow-diagnostics
---

Workflow Diagnostics checks a workflow execution's history so you do not have to read it yourself. It reports the issues it finds, suggests a root cause where it can, and links each issue to the page in this guide that explains the fix.

## How it works

Diagnostics runs on demand. Each request starts a diagnostics workflow in the `cadence-system` domain, which the Cadence worker service runs on the `diagnostics-wf-tasklist` task list. No setup is needed on the server beyond running the worker service.

## Checks

| Check | Example issues | Root causes | Runbook |
|---|---|---|---|
| Timeouts | An activity timed out, or the workflow execution timed out | No pollers on the task list, pollers present but the task was not picked up, or how the heartbeat timeout and retry policy are configured | [Timeouts](/docs/workflow-troubleshooting/timeouts) |
| Failures | An activity or the workflow failed | Panic, custom error, error from the worker, blob size or history size limit exceeded | [Activity and Workflow Failures](/docs/workflow-troubleshooting/activity-failures) |
| Retries | `MaximumAttempts` is 1, the expiration interval is shorter than the initial interval, or the heartbeat timeout is not shorter than the StartToClose timeout | | [Retries](/docs/workflow-troubleshooting/retries) |
| Timeout risks | An activity's StartToClose timeout equals the workflow execution timeout, or a long-running activity has no heartbeat timeout | | [Timeout Risks](/docs/workflow-troubleshooting/timeout-risks) |
| Antipatterns | 50 or more activities scheduled within 10 seconds, or Continue-As-New from a cron workflow | | [Antipatterns](/docs/workflow-troubleshooting/antipatterns) |

## Version requirements

Diagnostics was added in server v1.2.14. The current report format needs v1.3.1 or later, and the timeout risk and antipattern checks need v1.4.2 or later.

## Run diagnostics in Cadence Web

Set `CADENCE_WORKFLOW_DIAGNOSTICS_ENABLED=true` on Cadence Web to add a **Diagnostics** tab to the workflow page. The tab runs diagnostics on closed workflows and lists the issues, their root causes, and a link to the matching page in this guide.

To show the issues in the **History** tab instead, on the events that caused them, also set `CADENCE_WORKFLOW_DIAGNOSTICS_IN_HISTORY_ENABLED=true`. This also runs diagnostics on workflows that are still running. A running workflow with no issues can still develop them as more events happen.

These flags only show or hide the UI. Removing them does not turn off the CLI or the API. See the [Feature Flags section](https://github.com/cadence-workflow/cadence-web#feature-flags) of the Cadence Web README for the full list.

## Run diagnostics from the CLI

Start diagnostics for a workflow execution. Both the workflow ID and the run ID are required:

```bash
cadence --do my-domain workflow diagnose --wid my-workflow-id --rid my-run-id
```

`diag` is a short alias for `diagnose`. The command prints the diagnostics workflow it started:

```text
Workflow diagnosis started. Query the diagnostic workflow to get diagnostics report.
============Diagnostic Workflow details============
Domain: cadence-system, Workflow Id: my-domain-my-run-id, Run Id: 5e8b7c0a-...
```

The diagnostics workflow ID is the domain name and the run ID joined by `-`. If diagnostics is already running for that execution, the command returns the running diagnostics workflow instead of starting another one. If an earlier diagnostics workflow for that execution has finished, the command starts a new run with the same workflow ID, so use the run ID it prints.

Query the diagnostics workflow for the report:

```bash
cadence --do cadence-system workflow query --wid my-domain-my-run-id --rid 5e8b7c0a-... --qt query-diagnostics-report
```

## Read the report

The report is JSON. `DiagnosticsCompleted` is `false` until all checks have finished. `DiagnosticsResult` has one field per check, `Timeouts`, `Failures`, `Retries`, `TimeoutRisks`, and `Antipatterns`, which is `null` when the check found nothing. Each check lists its `Issues` and a `Runbook` link to the page in this guide. The `Timeouts` and `Failures` checks also list `RootCause` entries matched to their issues by `IssueID`.

## Use the API

Applications can start diagnostics through the `DiagnoseWorkflowExecution` frontend API, which the CLI and Cadence Web use. The request takes the domain and the workflow execution, and the response returns the diagnostics workflow's domain and execution. Query that workflow with `query-diagnostics-report` to get the report, as in the CLI example above.

## Further reading

- [Workflow Diagnostics](/blog/2025/08/06/workflow-diagnostics), the original announcement, which also explains how to add a new check to the server
- [Workflow Diagnostics, Now in Workflow History](/blog/2026/11/09/2026-11-09-diagnostics-in-workflow-history/diagnostics-in-workflow-history), a walkthrough of the History tab view
