---
layout: default
title: Overview
description: This page provides an overview of the Cadence workflow troubleshooting guide, helping developers identify and resolve common issues with workflow and activity execution, and explains how to run Workflow Diagnostics from Cadence Web or the CLI.
keywords:
  - cadence workflow troubleshooting
  - workflow issues
  - activity failures
  - workflow timeouts
  - cadence debugging
  - workflow problems
  - cadence workflow diagnostics
  - cadence diagnose workflow
permalink: /docs/workflow-troubleshooting
---

This guide helps you find out why a workflow failed, timed out, or is at risk of doing so, and how to fix it. Each page covers one kind of issue, how it shows up in workflow history, and how to mitigate it.

| Page | Covers |
|---|---|
| [Timeouts](/docs/workflow-troubleshooting/timeouts) | Common causes of timeouts: missing pollers, a task list backlog, and heartbeat timeout and retry policy settings |
| [Activity and Workflow Failures](/docs/workflow-troubleshooting/activity-failures) | Panics, custom and generic errors, and blob size or history size limits |
| [Retries](/docs/workflow-troubleshooting/retries) | How retries show up in history, retry policies that never retry, and heartbeat timeouts that do not help |
| [Antipatterns](/docs/workflow-troubleshooting/antipatterns) | Bursts of activity scheduling, and Continue-As-New in cron workflows |
| [Timeout Risks](/docs/workflow-troubleshooting/timeout-risks) | Activity timeout settings that put the workflow at risk before anything times out |

## Workflow Diagnostics

You do not have to read the history yourself to find these issues. Workflow Diagnostics checks a workflow execution's history, reports the issues it finds, suggests a root cause where it can, and links to the page above that explains the fix.

Diagnostics runs on demand. Each request starts a diagnostics workflow in the `cadence-system` domain, which the Cadence worker service runs on the `diagnostics-wf-tasklist` task list. No setup is needed on the server beyond running the worker service.

| Check | Example issues | Root causes |
|---|---|---|
| Timeouts | An activity timed out, or the workflow execution timed out | No pollers on the task list, pollers present but the task was not picked up, or how the heartbeat timeout and retry policy are configured |
| Failures | An activity or the workflow failed | Panic, custom error, error from the worker, blob size or history size limit exceeded |
| Retries | `MaximumAttempts` is 1, the expiration interval is shorter than the initial interval, or the heartbeat timeout is not shorter than the StartToClose timeout | |
| Timeout risks | An activity's StartToClose timeout equals the workflow execution timeout, or a long-running activity has no heartbeat timeout | |
| Antipatterns | 50 or more activities scheduled within 10 seconds, or Continue-As-New from a cron workflow | |

Diagnostics was added in server v1.2.14. The current report format needs v1.3.1 or later, and the timeout risk and antipattern checks need v1.4.2 or later.

### Run diagnostics in Cadence Web

Set `CADENCE_WORKFLOW_DIAGNOSTICS_ENABLED=true` on Cadence Web to add a **Diagnostics** tab to the workflow page. The tab runs diagnostics on closed workflows and lists the issues, their root causes, and a link to the matching page in this guide.

To show the issues in the **History** tab instead, on the events that caused them, also set `CADENCE_WORKFLOW_DIAGNOSTICS_IN_HISTORY_ENABLED=true`. This also runs diagnostics on workflows that are still running. A running workflow with no issues can still develop them as more events happen. See [Workflow Diagnostics, Now in Workflow History](/blog/2026/11/09/2026-11-09-diagnostics-in-workflow-history/diagnostics-in-workflow-history) for a walkthrough.

### Run diagnostics from the CLI

Start diagnostics for a workflow execution. Both the workflow ID and the run ID are required:

```bash
cadence --do my-domain workflow diagnose --wid my-workflow-id --rid my-run-id
```

The command prints the diagnostics workflow it started:

```text
Workflow diagnosis started. Query the diagnostic workflow to get diagnostics report.
============Diagnostic Workflow details============
Domain: cadence-system, Workflow Id: my-domain-my-run-id, Run Id: 5e8b7c0a-...
```

The diagnostics workflow ID is the domain name and the run ID joined by `-`. If diagnostics is already running for that execution, the command returns the running diagnostics workflow instead of starting another one.

Query the diagnostics workflow for the report:

```bash
cadence --do cadence-system workflow query --wid my-domain-my-run-id --rid 5e8b7c0a-... --qt query-diagnostics-report
```

The report is JSON. `DiagnosticsCompleted` is `false` until all checks have finished. `DiagnosticsResult` has one field per check, `Timeouts`, `Failures`, `Retries`, `TimeoutRisks`, and `Antipatterns`, which is `null` when the check found nothing. Each check lists its `Issues` and a `Runbook` link to the page in this guide. The `Timeouts` and `Failures` checks also list `RootCause` entries matched to their issues by `IssueID`.

Applications can start diagnostics through the `DiagnoseWorkflowExecution` frontend API, which the CLI and Cadence Web use.