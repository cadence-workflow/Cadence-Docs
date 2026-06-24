---
layout: default
title: Schedules
description: Cadence Schedules let you run workflows on a recurring cadence — with overlap policies, backfill, pause/unpause, and catch-up — without writing any scheduling glue code in your workflow.
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

Cadence Schedules let you run a workflow on a recurring cadence. Unlike the older `CronSchedule` option on `StartWorkflowOptions`, Schedules are first-class server-side objects: you can inspect them, pause them, update them, backfill missed runs, and observe their history — all without touching your workflow code.

## How it works

When you create a schedule, the Cadence server runs an internal **scheduler workflow** in the background. On each tick it checks the cron expression, decides whether to fire, applies the overlap policy, and starts your target workflow. The scheduler workflow is durable — it survives server restarts and failures just like any other workflow.

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

The overlap policy controls what happens when a scheduled fire arrives while the previous run is still executing. The available policies are:

| Policy | Behavior |
|---|---|
| `SKIP_NEW` (default) | Skip the new fire; the current run continues uninterrupted. |
| `BUFFER_ONE` | Buffer one pending fire. Once the current run completes, the buffered fire starts immediately. |
| `CANCEL_PREVIOUS` | Request cancellation of the current run, then start the new one. |
| `TERMINATE_PREVIOUS` | Terminate the current run immediately, then start the new one. |
| `ALLOW_ALL` | Start every fire unconditionally, regardless of how many runs are active. |

The overlap policy can be changed on a live schedule via `UpdateSchedule`. Changing the policy is not retroactive: in-flight runs continue under the policy that was active when they started.

### Pause and unpause

A schedule can be paused with an optional human-readable note (e.g., the reason or ticket number). While paused, no new fires are dispatched. Unpausing resumes the schedule from the current time — it does not replay missed fires by default.

Unpausing with `ALLOW_ALL` overlap policy will attempt to catch up on fires that occurred while the schedule was paused, up to a configurable window.

### Catch-up window

If the Cadence server is down or the scheduler workflow is delayed, fires may be missed. The catch-up window (default: one year) controls how far back the scheduler looks when it restarts. Fires older than the window are dropped silently. Fires within the window are dispatched according to the overlap policy.

The scheduler uses the schedule's creation time as the earliest possible catch-up point, so a brand-new schedule that was immediately paused and then unpaused will not dispatch ancient phantom fires.

### Backfill

Backfill lets you manually request fires for a specific time range in the past. This is useful when:

- A schedule was paused during an outage and you need to process the missed period.
- You created a schedule today but want runs retroactively from last week.
- You are replaying historical data through your workflow.

Each backfill request takes a start time, end time, and an optional backfill ID. Fired workflows are tagged with a search attribute so you can distinguish backfill runs from normal scheduled runs.

### Jitter

An optional jitter (in seconds) adds a random delay to each fire, up to the specified maximum. This is useful for spreading load when many schedules are configured to fire at the same wall-clock time (e.g., midnight).

## Schedules vs. distributed cron

Both Schedules and the legacy `CronSchedule` field run a workflow on a recurring cadence, but they differ significantly:

| | Schedules | Distributed Cron (`CronSchedule`) |
|---|---|---|
| Server-side object | Yes — inspect, update, delete via API | No — embedded in workflow options at start |
| Overlap policy | Configurable per schedule | Fixed: always skip if previous run is active |
| Pause/unpause | Yes, with notes | No |
| Backfill | Yes | No |
| History/observability | Yes — last N runs visible via describe | No |
| Update without restart | Yes | No — must cancel and restart |

For new use cases, prefer Schedules. Distributed cron remains available for backwards compatibility.

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
  --cron "0 9 * * *" \
  --workflow_type MyWorkflow \
  --tasklist my-tasklist \
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

# Update (replace spec with a new JSON file)
cadence schedule update --schedule_id my-schedule --schedule_file updated.json

# Delete
cadence schedule delete --schedule_id my-schedule
```

## SDK usage

SDK-specific guides for creating and managing schedules in code will be added here as each client ships support:

- Go SDK — coming soon
- Java SDK — coming soon
- Python SDK — coming soon
