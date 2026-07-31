---
layout: default
title: Timers
description: Cadence timers provide durable delays in workflow code. This page explains timer tasks, client APIs, and global domain replication.
keywords:
  - cadence timers
  - cadence timer tasks
  - cadence workflow sleep
  - cadence global domain timers
permalink: /docs/concepts/timers
---

# Timers

Cadence timers allow :workflow:workflows: to wait without holding a :worker:worker: thread or process. The wait is durable: after the timer is created, a worker can restart or be removed from cache, and Cadence resumes the workflow when the timer fires.

Timers are useful for delays, reminders, deadlines, and waiting for a signal or timeout.

## Timer tasks

A **user timer** is created by workflow code. A **timer task** is the internal Cadence task that processes work at a future time.

When workflow code starts a timer:

1. The workflow worker returns a `StartTimer` decision.
2. Cadence records a `TimerStarted` event and creates a timer task for the expiry time.
3. The active cluster processes the timer task, records `TimerFired`, and schedules a decision task.
4. A workflow worker receives the decision task and continues the workflow.

Timer tasks are also used for workflow, decision, and activity timeouts; activity retries; and workflow backoff. These service-managed timer tasks do not appear as `TimerStarted` and `TimerFired` events in workflow history.

## Cancel a timer

To cancel a pending timer, create it in a cancellable workflow context, then cancel that context. Cadence records a `CancelTimer` decision and, when the cancellation succeeds, a `TimerCanceled` event.

For example, in Go:

```go
timerCtx, cancelTimer := workflow.WithCancel(ctx)
timer := workflow.NewTimer(timerCtx, time.Hour)

// Cancel the pending timer.
cancelTimer()

// The timer future now completes with a cancellation error.
err := timer.Get(ctx, nil)
```

If the timer has already fired or is no longer pending, Cadence records `CancelTimerFailed` instead. Cancellation and expiry can race: a `TimerFired` event means the timer fired, while a `TimerCanceled` event means it was canceled. Write workflow code to handle either outcome.

## Use timers in workflow code

Use the Cadence workflow API instead of the language runtime's sleep or clock APIs. Native sleeps run only in the worker process; Cadence does not record them in workflow history. If the worker fails, is evicted from cache, or the workflow is replayed on another worker, Cadence cannot resume the original sleep.

Native sleeps can also cause nondeterminism when workflow logic depends on whether the sleep finishes before a signal, cancellation, or another event. That race can resolve differently during replay and cause the workflow to make decisions that do not match its history.

Cadence timer APIs record the timer outcome in history. On replay, Cadence uses that recorded outcome rather than the new worker's clock, making the wait durable and replay-safe.

| Client | Simple wait | Timer for composition | Avoid in workflow code |
| --- | --- | --- | --- |
| Go | `workflow.Sleep(ctx, duration)` | `workflow.NewTimer(ctx, duration)` | `time.Sleep` or `time.NewTimer` |
| Java | `Workflow.sleep(duration)` | `Workflow.newTimer(duration)` | `Thread.sleep` |
| Python | `await workflow.sleep(duration)` | `workflow.sleep()` can be awaited with other workflow work | `asyncio.sleep` or `time.sleep` |

## Determinism

Starting a timer is a recorded workflow decision. Replaying workflow code must make compatible timer decisions in the same order as the history. Adding, removing, or reordering timers for already-running workflows can cause a non-deterministic workflow error. Use workflow versioning before changing timer behavior for existing executions.

For recurring workflow starts, use [Schedules](16-schedules.md) or distributed cron. For repeating work inside one long-running execution, use timers with continue-as-new to limit history growth.

Timer expiry is a target time, not a latency guarantee. Monitor timer-task latency when workflows resume later than expected.
