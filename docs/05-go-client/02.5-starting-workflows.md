---
layout: default
title: Starting workflows
permalink: /docs/go-client/start-workflows
---

# Starting workflows

Starting workflows can be done from any service that can send requests to
the Cadence server. There is no requirement for workflows to be started from the
worker services. 

Generally workflows can either be started using a direct reference to the
workflow code, or by referring to the registered name of the function. In
[Workflow Registration](/docs/go-client/create-workflows/#registration) we show
how to register the workflows.

## Starting a workflow

After [creating a workflow](/docs/go-client/create-workflows) we can start it.
This can be done [from the cli](/docs/cli/#start-workflow), but typically
we want to start workflow programmatically e.g. from an http handler. We can do
this using the
[`client.StartWorkflow`](https://pkg.go.dev/go.uber.org/cadence/client#Client)
function:

```go
import "go.uber.org/cadence/client"

var cadenceClient client.Client 
# Initialize cadenceClient

cadenceClient.StartWorkflow(
    ctx,
    client.StartWorkflowOptions{
        TaskList: "workflow-task-list",
        ExecutionStartToCloseTimeout: 10 * time.Second,
    },
    WorkflowFunc,
    workflowArg1,
    workflowArg2,
    workflowArg3,
    ...
)
```

The will start the workflow defined in the function `WorkflowFunc`, note that
for named workflows `WorkflowFunc` could be replaced by the name e.g.
`"WorkflowFuncName"`. 

`workflowArg1`, `workflowArg2`, `workflowArg3` are arguments to the workflow, as
specified in `WorkflowFunc`, note that the arguments needs to be _serializable_.

## Jitter Start and Batches of Workflows
Below we list all the `startWorkflowOptions`, however a particularly useful option is
`JitterStart`.

Starting many workflows at the same time will have Cadence trying to schedule
all the workflows immediately. This can result in overloading Cadence and the
database backing Cadence, as well as the workers processing the workflows.

This is especially bad when the workflow starts comes in batches, such as an end
of month load. These sudden loads can lead to both Cadence and the workers
needing to immediately scale up. Scaling up often takes some time, causing
queues in Cadence, delaying the execution of all workflows, potentially causing
workflows to timeout.

To solve this we can start our workflows with `JitterStart`. `JitterStart` will start
the workflow at a random point between `now` and `now + JitterStart`, so if we
e.g. start 1000 workflows at 12:00 AM with a `JitterStart` of 6 hours, the
workflows will be randomly started between 12:00 AM and 6:00 PM.

This makes the sudden load of 1000 workflows much more manageable.

For many batch-like workloads a random delay is completely acceptable as the
batch just needs to be processed e.g. before the end of the day.

Adding a JitterStart of 6 hours in the example above is as simple as adding

```go
JitterStart: 6 * time.Hour,
```

to the options like so,

```go
import "go.uber.org/cadence/client"

var cadenceClient client.Client
# Initialize cadenceClient

cadenceClient.StartWorkflow(
    ctx,
    client.StartWorkflowOptions{
        TaskList: "workflow-task-list",
        ExecutionStartToCloseTimeout: 10 * time.Second,
        JitterStart: 6 * time.Hour, // Added JitterStart
    },
    WorkflowFunc,
    workflowArg1,
    workflowArg2,
    workflowArg3,
    ...
)
```

now the workflow will start at a random point between now and six hours from now.

## StartWorkflowOptions

The
[client.StartWorkflowOptions](https://pkg.go.dev/go.uber.org/cadence/internal#StartWorkflowOptions)
specifies the behavior of this particular workflow. The invocation above only
specifies the two mandatory options; `TaskList` and
`ExecutionStartToCloseTimeout`, all the options are described in the [inline
documentation](https://pkg.go.dev/go.uber.org/cadence/internal#StartWorkflowOptions):

```go
type StartWorkflowOptions struct {
	// ID - The business identifier of the workflow execution.
	// Optional: defaulted to a uuid.
	ID string

	// TaskList - The decisions of the workflow are scheduled on this queue.
	// This is also the default task list on which activities are scheduled. The workflow author can choose
	// to override this using activity options.
	// Mandatory: No default.
	TaskList string

	// ExecutionStartToCloseTimeout - The timeout for duration of workflow execution.
	// The resolution is seconds.
	// Mandatory: No default.
	ExecutionStartToCloseTimeout time.Duration

	// DecisionTaskStartToCloseTimeout - The timeout for processing decision task from the time the worker
	// pulled this task. If a decision task is lost, it is retried after this timeout.
	// The resolution is seconds.
	// Optional: defaulted to 10 secs.
	DecisionTaskStartToCloseTimeout time.Duration

	// WorkflowIDReusePolicy - Whether server allow reuse of workflow ID, can be useful
	// for dedup logic if set to WorkflowIdReusePolicyRejectDuplicate.
	// Optional: defaulted to WorkflowIDReusePolicyAllowDuplicateFailedOnly.
	WorkflowIDReusePolicy WorkflowIDReusePolicy

	// RetryPolicy - Optional retry policy for workflow. If a retry policy is specified, in case of workflow failure
	// server will start new workflow execution if needed based on the retry policy.
	RetryPolicy *RetryPolicy

	// CronSchedule - Optional cron schedule for workflow. If a cron schedule is specified, the workflow will run
	// as a cron based on the schedule. The scheduling will be based on UTC time. Schedule for next run only happen
	// after the current run is completed/failed/timeout. If a RetryPolicy is also supplied, and the workflow failed
	// or timeout, the workflow will be retried based on the retry policy. While the workflow is retrying, it won't
	// schedule its next run. If next schedule is due while workflow is running (or retrying), then it will skip that
	// schedule. Cron workflow will not stop until it is terminated or cancelled (by returning cadence.CanceledError).
	// The cron spec is as following:
	// ┌───────────── minute (0 - 59)
	// │ ┌───────────── hour (0 - 23)
	// │ │ ┌───────────── day of the month (1 - 31)
	// │ │ │ ┌───────────── month (1 - 12)
	// │ │ │ │ ┌───────────── day of the week (0 - 6) (Sunday to Saturday)
	// │ │ │ │ │
	// │ │ │ │ │
	// * * * * *
	CronSchedule string

	// Memo - Optional non-indexed info that will be shown in list workflow.
	Memo map[string]interface{}

	// SearchAttributes - Optional indexed info that can be used in query of List/Scan/Count workflow APIs (only
	// supported when Cadence server is using ElasticSearch). The key and value type must be registered on Cadence server side.
	// Use GetSearchAttributes API to get valid key and corresponding value type.
	SearchAttributes map[string]interface{}

	// DelayStartSeconds - Seconds to delay the workflow start
	// The resolution is seconds.
	// Optional: defaulted to 0 seconds
	DelayStart time.Duration

	// JitterStart - Seconds to jitter the workflow start. For example, if set to 10, the workflow will start some time between 0-10 seconds.
	// This works with CronSchedule and with DelayStart.
	// Optional: defaulted to 0 seconds
	JitterStart time.Duration
}
```