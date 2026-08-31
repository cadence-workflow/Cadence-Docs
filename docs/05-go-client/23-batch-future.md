---
layout: default
title: Batch Future
description: This page explains how to use workflow.NewBatchFuture to fan out many activities or child workflows from a Cadence Go workflow with a bounded concurrency limit.
keywords:
  - cadence batch future
  - workflow.NewBatchFuture
  - bounded concurrency
  - cadence parallel activities
  - pending activity limit
  - multierr
  - cadence go bulk operations
  - cadence go batch future tutorial
permalink: /docs/go-client/batch-future
---

The straightforward way to process many items in a workflow is a loop over `workflow.ExecuteActivity`, collecting the futures and draining them afterwards:

```go
var futures []workflow.Future
for _, userID := range userIDs {
    futures = append(futures, workflow.ExecuteActivity(ctx, UpdateUserActivity, userID))
}
for _, f := range futures {
    if err := f.Get(ctx, nil); err != nil {
        return err
    }
}
```

This schedules every activity at once. A large fan-out can exceed the Cadence server's limit on pending activities for each workflow, which is 1024 by default, and send more concurrent requests than a downstream service can handle.

`workflow.NewBatchFuture` accepts a concurrency limit and a slice of *factories*, which create futures when called. It keeps at most that many futures in flight and starts queued work as slots become available.

`workflow.NewBatchFuture` is available in Go client v1.3.1 or later.

:::note
Batch Future bounds **in-flight** operations. It does not reduce the number of history events your workflow produces, so event count and history size limits are unaffected. The same 5,000 activities write the same number of events whether you schedule them all at once or ten at a time. To limit total history size, use [Continue as new](/docs/go-client/continue-as-new) or [child workflows](/docs/go-client/child-workflows) instead.
:::

---

## Samples

Runnable Batch Future sample:

| Sample | Description | Code |
|--------|-------------|------|
| **Batch processing** | Fans out a configurable number of activities with a configurable concurrency limit | [concurrency](https://github.com/cadence-workflow/cadence-samples/tree/master/new_samples/concurrency) |


---

## Basic usage

Build one factory per item, then pass the slice to `NewBatchFuture` with your concurrency limit. This example matches the sample's workflow:

```go
// BatchWorkflowInput configures the batch processing parameters.
type BatchWorkflowInput struct {
    Concurrency int // Maximum number of activities running in parallel
    TotalSize   int // Total number of activities to process
}

func BatchWorkflow(ctx workflow.Context, input BatchWorkflowInput) error {
    if input.TotalSize < 0 {
        return fmt.Errorf("total size must not be negative")
    }
    if input.TotalSize > 0 && input.Concurrency <= 0 {
        return fmt.Errorf("concurrency must be positive")
    }

    // Create activity factories for each task (not yet executed)
    factories := make([]func(workflow.Context) workflow.Future, input.TotalSize)
    for taskID := 0; taskID < input.TotalSize; taskID++ {
        taskID := taskID // Capture loop variable for closure
        factories[taskID] = func(ctx workflow.Context) workflow.Future {
            // Configure activity timeouts
            aCtx := workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
                ScheduleToStartTimeout: time.Minute * 1,
                StartToCloseTimeout:    time.Minute * 1,
            })
            return workflow.ExecuteActivity(aCtx, BatchActivity, taskID)
        }
    }

    // Execute all activities with controlled concurrency
    batch, err := workflow.NewBatchFuture(ctx, input.Concurrency, factories)
    if err != nil {
        return fmt.Errorf("failed to create batch future: %w", err)
    }

    // Wait for all activities to complete
    return batch.Get(ctx, nil)
}
```

Pay attention to how the loop variable and activity options are scoped:

- **`taskID := taskID` shadows the loop variable.** Without it, every closure captures the same variable and uses its final value. Go 1.22 changed loop variable scoping, so the copy is required only for modules targeting an earlier language version. Keeping it makes the intended capture explicit.
- **`workflow.WithActivityOptions` is applied inside the factory.** Use the context passed to the factory. If neither that context nor its parent has activity options, `ExecuteActivity` returns a future that fails immediately because required timeouts are missing.

Factories are not limited to activities. Anything that returns a `workflow.Future` works, including `workflow.ExecuteChildWorkflow`, so the same pattern bounds the fan-out of child workflows.

`GetFutures()` returns plain `workflow.Future` values. When factories start child workflows, child-specific methods such as `GetChildWorkflowExecution()` and `SignalChildWorkflow()` are not available through the batch futures.

Factories run only when a concurrency slot is available. `NewBatchFuture` accepts factories rather than futures because a future represents work that has already been scheduled.

---

## Collecting results and errors

Pass `nil` to discard results:

```go
err := batch.Get(ctx, nil)
```

Pass a slice pointer to collect results and inspect aggregated errors:

```go
var results []string
err := batch.Get(ctx, &results)
if err != nil {
    for _, batchErr := range multierr.Errors(err) {
        workflow.GetLogger(ctx).Error("batch item failed", zap.Error(batchErr))
    }
    return err
}
// len(results) == len(factories), in factory order
```

`Get` allocates or grows the slice as needed. It returns an error before waiting if the value is neither `nil` nor a slice pointer. Item failures do not stop the remaining factories during a normal bulk `Get`, and successful values are written to their positions in the output slice.

Batch Future does not fail fast. `Get` waits for every operation to complete and then returns the aggregated errors. `GetFutures()` lets you inspect individual results, but Batch Future does not provide a method that returns when the first operation fails.

Bulk `Get` combines failures with [`go.uber.org/multierr`](https://pkg.go.dev/go.uber.org/multierr). `multierr.Errors` returns the failures but not their input positions. To correlate a failure with an input, read individual items through `GetFutures()`. Index `i` corresponds to `factories[i]`:

```go
results := make([]string, len(factories))
for i, f := range batch.GetFutures() {
    if err := f.Get(ctx, &results[i]); err != nil {
        workflow.GetLogger(ctx).Error("item failed",
            zap.Int("index", i), zap.Error(err))
    }
}
```

---

## Choosing a concurrency value

For activity factories, keep concurrency below the Cadence server's limit on pending activities for each workflow, which is 1024 by default. The practical limit is the concurrency your workers and downstream services can handle.

Start conservative, with 3 to 5 concurrent items, then raise the limit while watching downstream error rates and your activities' `ScheduleToStart` latency. Rising `ScheduleToStart` latency means work is waiting longer for a worker, so extra concurrency is not increasing throughput.

A concurrency limit is not a rate limit. New work can start as soon as a slot opens, so Batch Future does not enforce a maximum number of requests per second. It also does not configure activity retries. Set a `RetryPolicy` in the activity options when retries are required.

:::caution
`NewBatchFuture` does not validate `batchSize`. For a nonempty batch, a value of `0` creates a zero-capacity semaphore that the submitter can never acquire, and the workflow blocks forever with no error. Negative values behave the same way. Validate the value yourself if it comes from workflow input.
:::

---

## Determinism and migration

`batchSize` determines which items are scheduled in which decision task, so it is baked into the shape of your workflow history. That makes all of the following nondeterministic changes that will break in-flight executions:

- Introducing Batch Future into a workflow that previously used a plain fan-out loop
- Removing Batch Future and going back to a plain loop
- Changing `batchSize`
- Changing the number or order of factories for a given input

Use `workflow.GetVersion`, register a new workflow type, or wait for existing executions to finish before deploying one of these changes. Treat `batchSize` as versioned behavior too. See [Versioning](/docs/go-client/workflow-versioning) and [Nondeterministic errors](/docs/go-client/workflow-non-deterministic-error) for details.

Before deployment, use [Workflow Replay and Shadowing](/docs/go-client/workflow-replay-shadowing) to replay production histories against the updated workflow.

Tests should cover the maximum observed concurrency, partial failures, and cancellation in addition to the successful path. Cancellation tests need a heartbeating activity if they assert that running work stops.

---

## When to use something else

- **A plain fan-out loop** is simpler for a small, fixed number of items.
- **A workflow selector using [`workflow.Selector`](https://pkg.go.dev/go.uber.org/cadence/workflow#Selector)** is useful when you need to process results as they become available, such as updating an aggregate or racing operations.
- **Child workflows or [continue-as-new](/docs/go-client/continue-as-new)** are useful when work may exceed a single workflow's history limits. Batch Future can bound child workflow concurrency, but it does not reduce history usage.
- **A custom scheduler using [`workflow.Go`](https://pkg.go.dev/go.uber.org/cadence/workflow#Go) and workflow channels** is useful only when you need behavior Batch Future does not provide, such as priority ordering, stopping new work after the first failure, or changing the concurrency limit during execution.

---

## References

- [Go SDK godoc: `workflow.NewBatchFuture`](https://pkg.go.dev/go.uber.org/cadence/workflow#NewBatchFuture)
- [Introducing Batch Future with Concurrency Control](/blog/2025/09/25/introducing-batch-future-faster-activity-execution): the original announcement
