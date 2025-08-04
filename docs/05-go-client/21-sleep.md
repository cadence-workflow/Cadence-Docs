---
layout: default
title: Sleep
permalink: /docs/go-client/sleep
---

# Workflow Sleep

The `workflow.Sleep` function allows a Cadence workflow to pause its execution for a specified duration. This is similar to `time.Sleep` in Go, but is safe and deterministic for use within Cadence workflows. The workflow will be paused and resumed by the Cadence service, and the sleep is durable—meaning the workflow can survive worker restarts or failures during the sleep period.

## Example: Sleep for 30 Seconds

Here is a minimal example of using `workflow.Sleep` in a Cadence workflow, as demonstrated in [cadence-samples PR #99](https://github.com/cadence-workflow/cadence-samples/pull/99):

```go
import (
    "time"
    "go.uber.org/cadence/workflow"
)

func SleepWorkflow(ctx workflow.Context) error {
    workflow.GetLogger(ctx).Info("Workflow started, going to sleep for 30 seconds...")
    err := workflow.Sleep(ctx, 30*time.Second)
    if err != nil {
        workflow.GetLogger(ctx).Error("Sleep interrupted", "Error", err)
        return err
    }
    workflow.GetLogger(ctx).Info("Woke up after 30 seconds!")
    return nil
}
```

### Key Points
- Use `workflow.Sleep(ctx, duration)` instead of `time.Sleep` inside workflow code.
- The sleep is durable: if the worker crashes or restarts, the workflow will resume sleeping where it left off.
- The workflow is not consuming worker resources while sleeping; the state is persisted by Cadence.
- You can use any duration supported by Go's `time.Duration`.

### When to Use
- Delaying workflow progress for a fixed period (e.g., retry with backoff, scheduled reminders, timeouts).
- Waiting for an external event or timeout before proceeding.

### Limitations
- Do not use `time.Sleep` in workflow code; always use `workflow.Sleep` for determinism and durability.
- Very large numbers of simultaneous timers (sleeps) may impact cluster performance; consider jittering or batching if needed.

For more details and advanced usage, see the [Cadence Go client documentation](https://pkg.go.dev/go.uber.org/cadence/workflow#Sleep).
