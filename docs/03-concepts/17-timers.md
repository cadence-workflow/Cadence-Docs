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

Timers are useful for delays, reminders, deadlines, and waiting for a :signal:signal: or timeout.

## Timer tasks

A **user timer** is created by workflow code. A **timer task** is the internal Cadence task that processes work at a future time.

When workflow code starts a timer:

1. The workflow worker returns a `StartTimer` decision.
2. Cadence records a `TimerStarted` event and creates a timer task for the expiry time.
3. The active cluster processes the timer task, records `TimerFired`, and schedules a decision task.
4. A workflow worker receives the decision task and continues the workflow.

Timer tasks are also used for workflow, decision, and activity timeouts; activity retries; and workflow backoff. These service-managed timer tasks do not appear as `TimerStarted` and `TimerFired` events in workflow history.

Canceling a pending timer records `TimerCanceled`. If cancellation races with firing, the history determines the result.

## Use timers in workflow code

Use the Cadence workflow API instead of the language runtime's sleep or clock APIs. Native sleeps are not durable or replay-safe.

| Client | Simple wait | Timer for composition | Avoid in workflow code |
| --- | --- | --- | --- |
| Go | `workflow.Sleep(ctx, duration)` | `workflow.NewTimer(ctx, duration)` | `time.Sleep` or `time.NewTimer` |
| Java | `Workflow.sleep(duration)` | `Workflow.newTimer(duration)` | `Thread.sleep` |
| Python | `await workflow.sleep(duration)` | `workflow.sleep()` can be awaited with other workflow work | `asyncio.sleep` or `time.sleep` |

## Determinism

Starting a timer is a recorded workflow decision. Replaying workflow code must make compatible timer decisions in the same order as the history. Adding, removing, or reordering timers for already-running workflows can cause a non-deterministic workflow error. Use workflow versioning before changing timer behavior for existing executions.

For recurring workflow starts, use [Schedules](16-schedules.md) or distributed cron. For repeating work inside one long-running execution, use timers with continue-as-new to limit history growth.

Timer expiry is a target time, not a latency guarantee. Monitor timer-task latency when workflows resume later than expected.
