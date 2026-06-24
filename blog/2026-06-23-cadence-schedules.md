---
title: "Introducing Cadence Schedules"
description: Cadence Schedules bring first-class recurring workflow execution to the platform with overlap policies, backfill, pause/unpause, and full observability, all without touching your workflow code.
keywords:
  - cadence schedules
  - cadence recurring workflow
  - cadence schedule workflow
  - cadence cron alternative
  - cadence overlap policy
  - cadence backfill schedule
  - cadence pause resume schedule
  - cadence scheduler
  - workflow scheduling cadence
date: 2026-06-23
authors: abhishekj720
tags:
  - announcement
  - deep-dive
---

Your nightly ETL job takes 90 minutes. The schedule fires every hour. What should happen?

With traditional cron, the answer is: both run, you deal with the fallout. With `CronSchedule` on `StartWorkflowOptions`, the answer was always: the new fire is skipped. Neither answer is right for every situation, and neither lets you change your mind without cancelling and restarting the workflow entirely.

Cadence Schedules give you control.

<!-- truncate -->

## What is a Schedule?

A Schedule is a first-class server-side object that manages recurring workflow execution on your behalf. You create it once with a cron expression and a workflow action. Cadence runs a durable internal scheduler workflow that fires your target workflow on each tick, surviving server restarts and failures just like any other Cadence workflow.

Your target workflow does not need to know it is being scheduled. It is a plain workflow. The scheduler handles the timing, overlap logic, and observability.

This is a meaningful shift from `CronSchedule`. With `CronSchedule`, the schedule is baked into the workflow at start time -- opaque to the server, invisible to operators, impossible to modify without a restart. A Schedule is something you can observe, pause, update, and backfill without touching workflow code.

## Overlap policies

Back to the ETL example. You have five reasonable answers depending on what the workflow does:

**Skip the new fire.** The current run is more important. Let it finish; drop the one that arrived early.

```
--overlap_policy skipnew
```

**Buffer it.** The new fire matters, but it can wait. Start it the moment the current run finishes.

```
--overlap_policy buffer
```

**Cancel the current run and start fresh.** The new data has made the current run stale. Request cancellation and proceed.

```
--overlap_policy cancelprevious
```

**Terminate immediately.** No time for cleanup. Stop the current run hard and start the new one now.

```
--overlap_policy terminateprevious
```

**Run them all -- up to a limit.** The job is embarrassingly parallel and you want throughput, but not unbounded throughput. Cap the concurrency at a safe level.

```
--overlap_policy concurrent --concurrency_limit 5
```

That last one is worth pausing on. Most scheduling systems treat concurrent execution as binary: either one at a time, or fully unlimited. With Cadence Schedules, bounded concurrency is a first-class policy. You set the cap; the scheduler enforces it. Fires that arrive when the cap is full are counted as skipped. Set `--concurrency_limit 0` if you want truly unlimited concurrency.

The overlap policy can be changed on a live schedule at any time. The change applies to future fires only; in-flight runs continue under the policy that was active when they started.

## Pause and unpause with context

Pausing a schedule is one operation. Adding context to it is another. With Cadence Schedules they happen together:

```bash
cadence schedule pause \
  --schedule_id daily-etl \
  --reason "INFRA-4421: cluster maintenance, resume after 2026-06-24 08:00 UTC"
```

When someone runs `describe` a week later, they see exactly why the schedule is paused. No digging through Slack history.

```bash
cadence schedule unpause --schedule_id daily-etl
```

Unpausing resumes from the current time. Fires missed during the pause window are not replayed automatically.

## Backfill missed runs

If fires were missed during a pause or an outage, backfill lets you request them explicitly for any historical time range:

```bash
cadence schedule backfill \
  --schedule_id daily-etl \
  --start_time "2026-06-20T00:00:00Z" \
  --end_time   "2026-06-23T00:00:00Z" \
  --backfill_id backfill-maintenance-gap
```

Each backfilled run is tagged with search attributes marking it as a backfill and recording the backfill ID. You can query for backfill runs separately from normal scheduled runs in visibility.

## Catch-up after server downtime

If the Cadence server is unavailable long enough that fires are missed, the scheduler catches up when it recovers. By default it looks back up to one year and dispatches missed fires according to the configured overlap policy. Fires older than the window are dropped.

The scheduler uses the schedule's creation time as the earliest possible catch-up point. A newly created schedule will never dispatch phantom fires for time before it existed.

## Full observability

At any point you can ask the server for the full state of a schedule:

```bash
cadence schedule describe --schedule_id daily-etl
```

This returns the cron expression, overlap policy, pause state and note, the last time a workflow was started, the last time one completed, and the next scheduled fire time. No guessing, no log-digging.

## How it compares to distributed cron

| | Schedules | `CronSchedule` field |
|---|---|---|
| Server-side object | Yes | No |
| Overlap policy | Configurable | Always skip |
| Bounded concurrency | Yes | No |
| Pause/unpause with notes | Yes | No |
| Backfill | Yes | No |
| Update without restart | Yes | No |
| Run history | Yes | No |

For new use cases, prefer Schedules. `CronSchedule` remains available for backwards compatibility.

## Getting started

```bash
cadence schedule create \
  --schedule_id daily-etl \
  --cron "0 2 * * *" \
  --workflow_type RunETL \
  --tasklist etl-workers \
  --execution_timeout 7200
```

The full API surface is available through the CLI. SDK support for Go, Java, and Python is on the way -- each will get its own guide as it ships.

See the [Schedules concept page](/docs/concepts/schedules) for the full reference including overlap policy details, jitter, and CLI commands.
