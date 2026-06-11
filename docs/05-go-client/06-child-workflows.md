---
layout: default
title: Child workflows
description: Schedule and manage child workflows from a parent workflow in Go using workflow.ExecuteChildWorkflow, including options, signals, parallel execution, and parent close policy.
keywords:
  - cadence child workflow go
  - workflow.ExecuteChildWorkflow go
  - cadence go child workflow
  - cadence nested workflow go
  - cadence parent child workflow go
  - cadence golang child workflow example
  - ChildWorkflowOptions go
  - ParentClosePolicy go
permalink: /docs/go-client/child-workflows
---

`workflow.ExecuteChildWorkflow` schedules another workflow from inside a running workflow. The scheduling workflow is the *parent* and the scheduled workflow is the *child*. A child has a lifecycle the parent shapes at every stage: the parent starts it, watches it, communicates with it, and decides its fate when the parent itself closes or is canceled.

Child workflows run independently of that relationship in every other respect: each has its own event history, its own timeouts and retry policy, and can run on a different task list and worker pool than the parent. This page follows a child from start to finish.

---

## When to use a child workflow

A child workflow is not always the right tool. Pick the lightest option that fits the work:

| Option | When to use it |
|--------|----------------|
| **Activity** | The work is a single non-deterministic operation, such as an API call, a DB write, or sending an email. Activities are retried independently and have the lowest overhead. |
| **Child Workflow** | You need a reusable, self-contained orchestration with its own event history, timeouts, and retry policy, but whose lifecycle is still tied to the parent. |
| **Standalone Workflow** | The process is fully independent and shouldn't share the parent's lifecycle. Start it as its own top-level execution with a `WorkflowClient` instead. |

---

## Starting a child

Configure `ChildWorkflowOptions`, derive a child context from the parent context, then call `workflow.ExecuteChildWorkflow`. The call returns immediately with a `workflow.ChildWorkflowFuture`.

```go
cwo := workflow.ChildWorkflowOptions{
    // Omit WorkflowID to let Cadence generate a unique ID for the child execution.
    WorkflowID:                   "BID-SIMPLE-CHILD-WORKFLOW",
    ExecutionStartToCloseTimeout: time.Minute * 30,
}
ctx = workflow.WithChildOptions(ctx, cwo)

future := workflow.ExecuteChildWorkflow(ctx, SimpleChildWorkflow, value)
```

The second argument is the registered workflow function. You can also pass its fully qualified name as a string, but passing the function lets the framework validate the parameter types. The remaining arguments are forwarded to the child and must match the child's signature.

Starting a child only *schedules* it. The child is not actually created until the parent yields control back to Cadence. This matters when the parent may finish quickly (see [When the parent closes](#when-the-parent-closes)).

---

## Monitoring and communicating

Because the start call returns a future, the parent can keep working and block on the result only when it needs it.

```go
var result string
if err := future.Get(ctx, &result); err != nil {
    workflow.GetLogger(ctx).Error("SimpleChildWorkflow failed.", zap.Error(err))
    return err
}
```

**Run children in parallel** by giving each its own future, then blocking on the results. The children run concurrently.

```go
child1 := workflow.ExecuteChildWorkflow(ctx, GreetingChild, "Hello", name)
child2 := workflow.ExecuteChildWorkflow(ctx, GreetingChild, "Bye", name)

var greeting1, greeting2 string
if err := child1.Get(ctx, &greeting1); err != nil {
    return err
}
if err := child2.Get(ctx, &greeting2); err != nil {
    return err
}
```

**Signal a running child** by resolving its execution from the future, then calling `workflow.SignalExternalWorkflow`.

```go
var childWE workflow.Execution
if err := future.GetChildWorkflowExecution().Get(ctx, &childWE); err != nil {
    return err
}

if err := workflow.SignalExternalWorkflow(
    ctx, childWE.ID, childWE.RunID, "updateName", "Cadence",
).Get(ctx, nil); err != nil {
    return err
}
```

:::note Queries cannot be issued from workflow code
A parent cannot query a child from within workflow code. Run queries from an activity or external process using a `WorkflowClient` stub instead.
:::

---

## When the parent closes

`ParentClosePolicy` decides what Cadence does to a still-running child when the **parent closes**, whether the parent completes, fails, times out, or is terminated. It is set per child on `ChildWorkflowOptions`.

| Policy | Go constant | Behavior |
|--------|-------------|----------|
| **Terminate** (default) | `client.ParentClosePolicyTerminate` | The child is terminated immediately when the parent closes. |
| **Request cancel** | `client.ParentClosePolicyRequestCancel` | A cancellation request is sent to the child, giving it a chance to run cleanup before exiting. |
| **Abandon** | `client.ParentClosePolicyAbandon` | The child keeps running independently after the parent closes. |

Use **abandon** for children that are meant to outlive their parent. For example, a long-running detached process started by a short-lived orchestrator.

```go
import "go.uber.org/cadence/client"

cwo := workflow.ChildWorkflowOptions{
    WorkflowID:        "detached-child",
    ParentClosePolicy: client.ParentClosePolicyAbandon,
}
ctx = workflow.WithChildOptions(ctx, cwo)

future := workflow.ExecuteChildWorkflow(ctx, SimpleChildWorkflow, value)

// Block until the child has actually started before the parent returns.
if err := future.GetChildWorkflowExecution().Get(ctx, nil); err != nil {
    return err
}
```

:::caution Wait for an abandoned child to start before the parent returns
A child is only scheduled once the parent yields control to Cadence. If the parent completes before the child has started, the child may never run, which defeats the purpose of `ABANDON`. Always block on `future.GetChildWorkflowExecution().Get(ctx, nil)` before returning from the parent.
:::

:::note Default is terminate
If you do not set `ParentClosePolicy`, children are terminated when the parent closes. Set it explicitly whenever a child should survive or shut down gracefully.
:::

---

## Cancelling a child

Closing is not the only way a child ends early. A child is also canceled when the parent's workflow context is canceled, or explicitly via `workflow.RequestCancelExternalWorkflow`. By default the parent does not wait for the child to finish reacting; set `WaitForCancellation: true` if the parent should block until the child has fully exited.

```go
cwo := workflow.ChildWorkflowOptions{
    WorkflowID:          "cancellable-child",
    WaitForCancellation: true,
}
ctx = workflow.WithChildOptions(ctx, cwo)

childCtx, cancel := workflow.WithCancel(ctx)
future := workflow.ExecuteChildWorkflow(childCtx, SimpleChildWorkflow, value)

// Cancel the child; because WaitForCancellation is true, the parent blocks until it exits.
cancel()
_ = future.Get(ctx, nil)
```

---

## Child workflow options

`ChildWorkflowOptions` controls the child's identity, routing, and lifecycle. Most fields are optional and inherit sensible defaults from the parent.

| Field | Required | Purpose |
|-------|----------|---------|
| `WorkflowID` | No | Stable ID for the child execution. Generated automatically if omitted. |
| `Domain` | No | Run the child in a different domain than the parent. |
| `TaskList` | No | Route the child to a specific worker pool. Inherits the parent's task list if omitted. |
| `ExecutionStartToCloseTimeout` | Yes | Maximum total runtime for the child execution. |
| `TaskStartToCloseTimeout` | No | Maximum time for a single decision task. |
| `WorkflowIDReusePolicy` | No | Whether a completed `WorkflowID` may be reused. |
| `RetryPolicy` | No | Exponential retry policy applied to the child execution. |
| `WaitForCancellation` | No | If `true`, the parent waits for the child to finish reacting to a cancellation. See [Cancelling a child](#cancelling-a-child). |
| `ParentClosePolicy` | No | What happens to the child when the parent closes. See [When the parent closes](#when-the-parent-closes). |

---

## Samples

Runnable child-workflow samples:

| Sample | Description | Code |
|--------|-------------|------|
| **Child workflow** | Parent starts a child, waits for its result | [Go source](https://github.com/cadence-workflow/cadence-samples/tree/master/new_samples/childworkflow) |
| **Child cancellation** | Parent cancels a running child | [Recipe](https://github.com/cadence-workflow/cadence-samples/tree/master/cmd/samples/recipes/childworkflow) |

---

## References

- Go SDK godoc: [Child Workflows](https://pkg.go.dev/go.uber.org/cadence/workflow#hdr-Child_Workflow)
- Go SDK godoc: [ChildWorkflowOptions](https://pkg.go.dev/go.uber.org/cadence/workflow#ChildWorkflowOptions)
- [Workflows](/docs/concepts/workflows): workflow semantics, IDs, retries
