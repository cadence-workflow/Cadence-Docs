---
layout: default
title: Activity Failures
permalink: /docs/workflow-troubleshooting/activity-failures
---
#  Activity failures
An activity fails when it encounters an error during its execution. This results in ActivityTaskFailed event in the workflow execution with some details of the error. The different kinds of errors that can be seen in activity failures are listed here.

## Panic errors
Description: There is a issue in the activity code that is causing a panic.

Mitigation: Panics are usually caused by nil pointer dereferences or out-of-range array access and should never be expected in a workflow. Check the stack trace provided in the error details to find where in the activity code, the panic is seen. Fix the rootcause of the panic.

## Custom errors
Description: This is a customised error returned by the activity.

Mitigation: This is a way of facilitating error handling done within the activity code. Check your activity code to find where it returns a NewCustomError with some information. This is ideally an expected error scenario and should be handled within the workflow that executed the activity.

Read more about [error handling](https://cadenceworkflow.io/docs/go-client/error-handling/)

## Generic errors
Description: This is an error returned by the activity.

Mitigation: This error is caused by something unexpected within the activity code, typically due to a downstream service that your activity communicates with. Cadence does not know anything about it and just puts all unknown errors in this category. Check your activity code to find the potential error cases. This is ideally an unexpected error scenario and should be debugged further to fix the rootcause.

Read more about [error handling](https://cadenceworkflow.io/docs/go-client/error-handling/)

## Blob Size limits
Description: This is an error caused when a decision contains data that exceeds the configured limit. If an API call contains data that exceeds the limit, the API call will fail. These limits are dynamically configured per cadence domain.

Mitigation: It is recommended to store the data elsewhere in another storage technology and using its reference. The workflow can then take that reference and pass it around to other parts of the workflow to retrieve that data.

Different cases for which Cadence checks the blob size:

Signal input
Workflow input and output
Workflow continueAsNew input
Activity input and output
Workflow/Activity error_details
Record marker
Heartbeat details