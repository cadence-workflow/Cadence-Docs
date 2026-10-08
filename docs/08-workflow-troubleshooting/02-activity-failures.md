---
layout: default
title: Activity and Workflow Failures
description: This page explains the different types of activity and workflow failures in Cadence, including panic errors, custom errors, generic errors, and blob size or history size limit violations, with guidance on how to mitigate each.
keywords:
  - cadence activity failures
  - cadence workflow failures
  - activity panic error
  - custom error
  - generic error
  - blob size limit
  - history size limit
  - ActivityTaskFailed
  - WorkflowExecutionFailed
  - cadence troubleshooting
  - activity error types
permalink: /docs/workflow-troubleshooting/activity-failures
---

An activity fails when it encounters an error during its execution. This results in ActivityTaskFailed event in the workflow execution with some details of the error. A workflow can also fail as a whole, for example when its history exceeds the configured limits, resulting in a WorkflowExecutionFailed event. The different kinds of errors that can be seen in these failures are listed here.

## Panic errors
Description: There is an issue in the activity code that is causing a panic.

Mitigation: Panics are usually caused by nil pointer dereferences or out-of-range array access and should never be expected in a workflow. Check the stack trace provided in the error details to find where in the activity code, the panic is seen. Fix the root cause of the panic.

## Custom errors
Description: This is a customized error returned by the activity.

Mitigation: This is a way of facilitating error handling done within the activity code. Check your activity code to find where it returns a NewCustomError with some information. This is ideally an expected error scenario and should be handled within the workflow that executed the activity.

Read more about [error handling](/docs/go-client/error-handling)

## Generic errors
Description: This is an error returned by the activity.

Mitigation: This error is caused by something unexpected within the activity code, typically due to a downstream service that your activity communicates with. Cadence does not know anything about it and just puts all unknown errors in this category. Check your activity code to find the potential error cases. This is ideally an unexpected error scenario and should be debugged further to fix the root cause.

Read more about [error handling](/docs/go-client/error-handling)

## Blob Size limits
Description: This is an error caused when a decision contains data that exceeds the configured limit. If an API call contains data that exceeds the limit, the API call will fail. These limits are dynamically configured per cadence domain ([link to code](https://github.com/cadence-workflow/cadence/blob/master/common/dynamicconfig/dynamicproperties/constants.go)).

Mitigation: It is recommended to store the data elsewhere in another storage technology and using its reference. The workflow can then take that reference and pass it around to other parts of the workflow to retrieve that data.

Cadence enforces the maximum blob size in several cases. Some of these are:

- Signal input
- Workflow input and output
- Workflow continueAsNew input
- Activity input and output
- Workflow/Activity error_details
- Record marker
- Heartbeat details

## History size or count limits
Description: This is an error caused when the workflow history grows past the size or event count limit configured for the domain. The workflow fails with the reason "HISTORY_EXCEEDS_LIMIT" and the details "Workflow history size / count exceeds limit." These limits are dynamically configured per cadence domain ([link to code](https://github.com/cadence-workflow/cadence/blob/master/common/dynamicconfig/dynamicproperties/constants.go)).

Mitigation:

- Use ContinueAsNew to split long-running workflows into smaller runs before the history grows too large. Note that ContinueAsNew does not work for cron workflows.
- Keep activity inputs and outputs small.
- Avoid unbounded loops of activities, signals, or timers within a single run.

Read more about [continue as new](/docs/go-client/continue-as-new)