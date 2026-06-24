---
title: "Introducing Cadence Schedules"
description: Cadence Schedules bring first-class recurring workflow execution to the platform — with overlap policies, backfill, pause/unpause, and full observability, all without touching your workflow code.
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

Cadence has had cron-based scheduling since early on via the `CronSchedule` field on `StartWorkflowOptions`. It works, but it is embedded in the workflow at start time — you cannot pause it, inspect its history, update its spec, or backfill missed runs without cancelling and restarting the workflow entirely.

Schedules fix all of that.

<!-- truncate -->

## What are Schedules?

A Schedule is a first-class server-side object in Cadence. You create one with a cron expression and a workflow action. The Cadence server runs a durable internal scheduler workflow that fires your target workflow on each tick — surviving restarts, failures, and rollouts just like any other workflow.

Your target workflow does not need to know it is being run by a schedule. It is a plain workflow. The scheduler handles the timing, the overlap logic, and the observability.

## Overlap policies

The most common operational headache with cron-based scheduling is: what happens when the next fire is due but the previous run is still going?

With the old `CronSchedule`, the answer was always: skip. Schedules give you a choice:

| Policy | What happens |
|---|---|
| `SKIP_NEW` (default) | The new fire is dropped; the current run continues. |
| `BUFFER_ONE` | The new fire is queued. It starts as soon as the current run finishes. |
| `CANCEL_PREVIOUS` | The current run receives a cancellation signal; the new run starts. |
| `TERMINATE_PREVIOUS` | The current run is forcibly terminated; the new run starts immediately. |
| `ALLOW_ALL` | Every fire starts unconditionally, regardless of how many runs are active. |

You can change the overlap policy on a live schedule via `UpdateSchedule` without interrupting anything that is already running.

## Backfill

If your schedule was paused during a maintenance window, or if a bug meant runs were skipped, backfill lets you request fires for any historical time range:

```bash
cadence schedule backfill \
  --schedule_id my-schedule \
  --start_time "2026-06-01T00:00:00Z" \
  --end_time   "2026-06-10T00:00:00Z" \
  --backfill_id backfill-june-gap
```

Each backfilled run is tagged with search attributes so you can distinguish it from normal scheduled runs in queries.

## Pause and unpause

Pausing a schedule suspends all new fires. You can attach a note explaining why — useful for linking to an incident ticket or a change freeze notice.

```bash
cadence schedule pause \
  --schedule_id my-schedule \
  --reason "INFRA-4421: cluster maintenance 2026-06-22"

cadence schedule unpause --schedule_id my-schedule
```

Unpausing resumes from the current time. Missed fires during the pause window are not replayed automatically — use backfill if you need them.

## Observability

`DescribeSchedule` returns everything you need to understand the current state of a schedule:

- Cron expression and overlap policy
- Whether it is paused and the pause note
- Recent run history — last started and last completed times
- The next scheduled fire time

```bash
cadence schedule describe --schedule_id my-schedule
```

## Catch-up on restart

If the Cadence server is unavailable long enough that fires are missed, the scheduler catches up when it comes back — dispatching missed fires within a configurable window (default: one year). Fires older than the window are dropped. The scheduler uses the schedule's creation time as the earliest catch-up point, so a brand-new schedule will never dispatch phantom fires from before it existed.

## How it compares to distributed cron

|  | Schedules | `CronSchedule` field |
|---|---|---|
| Server-side object | Yes | No |
| Overlap policy | Configurable | Always skip |
| Pause/unpause | Yes | No |
| Backfill | Yes | No |
| Update without restart | Yes | No |
| Run history | Yes | No |

For new use cases, use Schedules. `CronSchedule` stays available for backwards compatibility.

## Getting started

Create a schedule from the CLI:

```bash
cadence schedule create \
  --schedule_id daily-report \
  --cron "0 9 * * *" \
  --workflow_type GenerateDailyReport \
  --tasklist report-workers \
  --execution_timeout 3600
```

SDK support for Go, Java, and Python is on the way. For now, the full API surface is available through the CLI and directly via the Cadence frontend API.

See the [Schedules concept page](/docs/concepts/schedules) for the full reference.
