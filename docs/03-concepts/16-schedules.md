---
layout: default
title: Schedules
description: Cadence Schedules let you run workflows on a recurring cadence with overlap policies, backfill, pause/unpause, and catch-up, without writing any scheduling glue code in your workflow.
keywords:
  - cadence schedules
  - cadence schedule workflow
  - cadence recurring workflow
  - cadence cron alternative
  - cadence overlap policy
  - cadence backfill
  - cadence pause schedule
  - cadence schedule catch-up
  - cadence scheduler
  - workflow scheduling
permalink: /docs/concepts/schedules
---

# Schedules

Cadence Schedules let you run a workflow on a recurring cadence. Unlike the older `CronSchedule` option on `StartWorkflowOptions`, Schedules are first-class server-side objects: you can inspect them, pause them, update them, backfill missed runs, and observe their history without touching your workflow code.

## How it works

When you create a schedule, the Cadence server runs an internal durable scheduler workflow in the background. On each tick it evaluates the cron expression, applies the overlap policy, and starts your target workflow. The scheduler workflow is fault-tolerant and survives server restarts and failures just like any other Cadence workflow.

Your target workflow does not need to know it is being run by a schedule. It is a plain workflow started with normal arguments.

## Key concepts

### Schedule ID

Each schedule has a unique string ID within a domain. This ID is how you reference the schedule for updates, pause/unpause, backfill, describe, and delete operations.

### Cron expression

Schedules use standard five-field cron syntax (`minute hour day-of-month month day-of-week`). All times are UTC.

```
# Every day at 9:00 AM UTC
0 9 * * *

# Every 15 minutes
*/15 * * * *

# Weekdays at 6:00 PM UTC
0 18 * * 1-5
```

### Overlap policy

The overlap policy controls what happens when a scheduled fire arrives while a previous run is still executing.

| Policy | Behavior |
|---|---|
| `SkipNew` (default) | Skip the new fire; the current run continues uninterrupted. |
| `Buffer` | Hold one pending fire. Once the current run finishes, the buffered fire starts immediately. |
| `Concurrent` | Start each fire regardless of how many runs are already active. Add `--concurrency_limit N` to cap the maximum number of simultaneous runs. |
| `CancelPrevious` | Request cancellation of the current run, then start the new one. |
| `TerminatePrevious` | Terminate the current run immediately, then start the new one. |

**`CancelPrevious` vs `TerminatePrevious`:** Cancellation is cooperative. The running workflow receives the signal and may continue for some time while it cleans up. Termination is immediate and unconditional. Use `TerminatePrevious` only when you need a hard guarantee that no two runs overlap even briefly.

**Bounded concurrency:** `Concurrent` with `--concurrency_limit N` caps how many runs are active at once. For example, set `--concurrency_limit 5` to allow free firing but never more than 5 simultaneous runs. Set `--concurrency_limit 0` for unlimited.

The overlap policy can be changed on a live schedule via `UpdateSchedule`. The change applies to future fires only; in-flight runs continue under the policy that was active when they started.

### Pause and unpause

A schedule can be paused with an optional human-readable note, useful for referencing an incident ticket or change-freeze period. While paused, no new fires are dispatched. Unpausing resumes from the current time.

Missed fires during a pause window are not replayed automatically. Use [backfill](#backfill) if you need them.

### Catch-up window

If the Cadence server is unavailable and fires are missed, the scheduler catches up when it recovers by dispatching missed fires within a configurable window (default: one year). Fires older than the window are dropped silently. Fires within the window are dispatched according to the overlap policy.

The scheduler uses the schedule's creation time as the earliest possible catch-up point. A brand-new schedule that is immediately paused and then unpaused will not dispatch ancient phantom fires.

### Backfill

Backfill lets you manually request fires for a specific time range in the past. Common cases:

- A schedule was paused during an outage and you need to process the missed period.
- You created a schedule today but want runs retroactively from an earlier date.
- You are replaying historical data through your workflow.

Each backfill request takes a start time, end time, and an optional backfill ID. Workflows started via backfill are tagged with search attributes so you can distinguish them from normal scheduled runs.

### Jitter

An optional jitter (in seconds) adds a random delay to each fire, up to the specified maximum. This spreads load when many schedules fire at the same wall-clock time (for example, midnight).

## Schedules vs. distributed cron

Both Schedules and the legacy `CronSchedule` field run a workflow on a recurring cadence, but they differ significantly:

| | Schedules | `CronSchedule` field |
|---|---|---|
| Server-side object | Yes, inspect/update/delete via API | No, embedded in workflow options at start |
| Overlap policy | Configurable per schedule | Fixed: always skip if previous run is active |
| Pause/unpause | Yes, with notes | No |
| Backfill | Yes | No |
| History and observability | Yes, last N runs visible via describe | No |
| Update without restart | Yes | No |

For new use cases, prefer Schedules. `CronSchedule` remains available for backwards compatibility.

## Observability

The `DescribeSchedule` API (and CLI command) returns:

- The current schedule spec (cron expression, overlap policy, jitter)
- Whether the schedule is paused and the pause note
- Recent run history (last started and last completed times)
- The next scheduled fire time

## CLI quick reference

```bash
# Create
cadence schedule create \
  --schedule_id my-schedule \
  --cron_expression "0 9 * * *" \
  --workflow_type MyWorkflow \
  --tasklist my-tasklist \
  --execution_timeout 3600

# Create with bounded concurrency (max 3 simultaneous runs)
cadence schedule create \
  --schedule_id my-schedule \
  --cron_expression "*/5 * * * *" \
  --workflow_type MyWorkflow \
  --tasklist my-tasklist \
  --overlap_policy concurrent \
  --concurrency_limit 3 \
  --execution_timeout 3600

# Describe
cadence schedule describe --schedule_id my-schedule

# Pause
cadence schedule pause --schedule_id my-schedule --reason "planned maintenance"

# Unpause
cadence schedule unpause --schedule_id my-schedule

# Backfill
cadence schedule backfill \
  --schedule_id my-schedule \
  --start_time "2026-06-01T00:00:00Z" \
  --end_time   "2026-06-10T00:00:00Z" \
  --backfill_id backfill-june-gap

# Update overlap policy
cadence schedule update \
  --schedule_id my-schedule \
  --overlap_policy skipnew

# Delete
cadence schedule delete --schedule_id my-schedule
```

## SDK usage

Go, Java, and Python SDK guides will be added here as each client ships support.
