---
title: "Workflow Diagnostics"

date: 2025-08-06
authors: sankari165
tags:
  - announcement
---

Cadence users, especially new users, often struggle with failed/stuck workflows and are unable to understand what is wrong with their workflow. This can now be addressed by a tool that runs on demand to check the workflow and provide diagnostics with actionable information via clear runbooks that users can follow. The overarching goal is to help cadence users understand what is wrong with their workflow

<!-- truncate -->

## Introducing Workflow Diagnostics

Cadence workflow diagnostics fetches the workflow execution history and identifies  the issues in the workflow i.e. points out the different items that did not work as expected. For example, workflow timeouts. Next, for the issue identified, it provides the potential root cause by listing the different reasons that must've caused the issue. For example, the tasklist does not have pollers. Lastly, it provides ways to resolve the issue since we want the cadence users to have actionable diagnostics. For example, timeouts could occur when the workflow is running on a tasklist without enough workers to start the activities

## How it works?

Cadence Workflow Diagnostics will be initiated on demand by a user for a given workflow execution in a cadence domain. The call will be made to cadence-frontend service which in turn triggers a diagnostics workflow that runs in the cadence-worker service to perform the diagnostics based on workflow execution history.

Code references:

1. The [invariant interface](https://github.com/cadence-workflow/cadence/tree/master/service/worker/diagnostics/invariant) where each invariant implementation checks and root causes one specific issue like timeouts or failures.

2. The [diagnostics workflow](https://github.com/cadence-workflow/cadence/blob/master/service/worker/diagnostics/workflow.go) that runs as a cadence workflow where it has 2 activities: one to identify the issues using the invariant checks and other to root cause them. Some invariants might not have a rootcause implementation too.

3. [Parent workflow](https://github.com/cadence-workflow/cadence/blob/master/service/worker/diagnostics/parent_workflow.go) to trigger diagnostics as a child workflow followed by emission of some usage logs for observability

## How to use this feature?

1. [Frontend API](https://github.com/cadence-workflow/cadence/blob/master/service/frontend/api/interface.go#L47) or cadence CLI that triggers a call to start the diagnostics workflow - This starts the diagnostics workflow and provides the wf execution details.

```bash
cadence --do cadence-sample-domain workflow diag --wid w123 --rid 123
```

The above command would start performing diagnostics via a cadence workflow and return its details. Sample output:

```bash
Workflow diagnosis started. Query the diagnostic workflow to get diagnostics report.
============Diagnostic Workflow details============
Domain: cadence-system, Workflow Id: diag123wid, Run Id: diag123rid
```

Use workflow query command to fetch the results of the diagnostics

```bash
cadence --do cadence-system workflow query --wid diag123wid --rid diag123rid --qt query-diagnostics-report
```

2. The cadence web UI will have a diagnostics tab on the workflow execution page that displays the results of running diagnostics on the workflow. It lists the various issues identified, the potential rootcause and the link to runbooks.

## How to add a new use-case to workflow diagnostics?

1. Define an implementation of the invariant interface. [link](https://github.com/cadence-workflow/cadence/tree/master/service/worker/diagnostics/invariant/failure)

2. Add it to the list of invariants provided on service start up. [link](https://github.com/cadence-workflow/cadence/blob/master/cmd/server/cadence/server.go#L265)

3. Update the diagnostics workflow to be able to construct the diagnostics result [link](https://github.com/cadence-workflow/cadence/blob/master/service/worker/diagnostics/workflow.go#L201)

4. Provide a runbook for the issues/rootcause and link it up along with the diagnostics result
