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
| `Buffer` | Queue new fires and execute them sequentially. Depth is configurable via `BufferLimit`; the server enforces a ceiling of 1000. Fires beyond the limit are dropped. |
| `Concurrent` | Start each fire regardless of how many runs are already active. Add `--concurrency_limit N` to cap the maximum number of simultaneous runs. |
| `CancelPrevious` | Request cancellation of the current run, then start the new one. |
| `TerminatePrevious` | Terminate the current run immediately, then start the new one. |

Policy values are case-insensitive when passed to the CLI (`SkipNew`, `skipnew`, and `skip_new` all work).

**`CancelPrevious` vs `TerminatePrevious`:** Cancellation is cooperative. The running workflow receives the signal and may continue for some time while it cleans up. Termination is immediate and unconditional. Use `TerminatePrevious` only when you need a hard guarantee that no two runs overlap even briefly.

**Bounded concurrency:** `Concurrent` with `--concurrency_limit N` caps how many runs are active at once. For example, set `--concurrency_limit 5` to allow free firing but never more than 5 simultaneous runs. Set `--concurrency_limit 0` for unlimited.

The overlap policy can be changed on a live schedule via `UpdateSchedule`. The change applies to future fires only; in-flight runs continue under the policy that was active when they started.

### Pause and unpause

A schedule can be paused with an optional human-readable note, useful for referencing an incident ticket or change-freeze period. While paused, no new fires are dispatched.

When unpausing, you can control catch-up behavior with `--catch_up_policy`:

| Policy | Behavior |
|---|---|
| `Skip` (default) | Resume from now; all missed fires are dropped. |
| `One` | Dispatch at most one missed fire, then resume from now. |
| `All` | Dispatch all missed fires within the catch-up window, then resume from now. |

Policy values are case-insensitive when passed to the CLI.

### Catch-up window

If the Cadence server is unavailable and fires are missed, the scheduler catches up when it recovers by dispatching missed fires within a configurable window (default: one year). Fires older than the window are dropped silently. Fires within the window are dispatched according to the overlap policy.

The scheduler uses the schedule's creation time as the earliest possible catch-up point. A brand-new schedule that is immediately paused and then unpaused will not dispatch ancient phantom fires.

### Backfill

Backfill lets you manually request fires for a specific time range in the past. Common cases:

- A schedule was paused during an outage and you need to process the missed period.
- You created a schedule today but want runs retroactively from an earlier date.
- You are replaying historical data through your workflow.

Each backfill request takes a start time, end time, and an optional backfill ID. Backfill fires are subject to the configured overlap policy, so with `SkipNew` only the first backfill fire will run; use `Concurrent` or `CancelPrevious` when backfilling a large time range.

### Search attributes on scheduled workflows

Every workflow started by a schedule receives the following search attributes automatically:

| Attribute | Type | Description |
|---|---|---|
| `CadenceScheduleID` | Keyword | The schedule ID that triggered this run. |
| `CadenceScheduleTime` | Datetime | The scheduled fire time (not the actual start time). |
| `CadenceScheduleIsBackfill` | Bool | `true` if this run was started by a backfill request. |
| `CadenceScheduleBackfillID` | Keyword | The backfill ID, if one was provided. Only set when `CadenceScheduleIsBackfill` is `true`. |

These attributes are queryable via the Cadence visibility API. For example, to find all backfill runs for a given schedule:

```
CadenceScheduleID = "my-schedule" AND CadenceScheduleIsBackfill = true
```

The `CadenceScheduleTime` attribute reflects the nominal fire time, not when the workflow actually started. This is useful in data pipelines where the workflow needs to know which time window it owns regardless of how late it started.

The following attributes are set on the internal scheduler workflow itself (not on triggered runs). They allow `ListSchedules` to surface schedule state without querying each scheduler workflow individually:

| Attribute | Type | Description |
|---|---|---|
| `CadenceScheduleState` | Keyword | `"active"` or `"paused"`. |
| `CadenceScheduleCron` | Keyword | The current cron expression. |
| `CadenceScheduleWorkflowType` | Keyword | The target workflow type name. |

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

### Which one to use

The key question is whether each scheduled time window matters independently.

**Use Schedules** when every execution has its own semantic meaning. A data pipeline that processes the previous hour's events is a good example: if three runs are missed during an outage, you need to backfill and process each of those three specific time windows. Missing one means missing that window's data permanently.

**Use `CronSchedule`** when only the most recent execution matters. Syncing a restaurant's current hours or menu is a good example: if three syncs are missed, running once now gives you the current state. There is nothing useful to backfill; the past windows have no independent value.

`CronSchedule` remains available for backwards compatibility and for simple set-and-forget jobs where the historical record of runs is irrelevant.

## Observability

The `DescribeSchedule` API (and CLI command) returns:

- The current schedule spec (cron expression, start/end bounds, jitter, overlap policy)
- Whether the schedule is paused and the pause note
- Recent run history (last started and last completed times) and the next scheduled fire time
- Lifetime counters: `total_runs`, `missed_runs` (dropped by catch-up), `skipped_runs` (dropped by overlap policy)
- Queue state for concurrent and buffered policies:
  - `buffered_fire_count` — number of fires currently queued in the buffer (`Buffer` overlap policy)
  - `running_workflow_count` — number of target workflows currently executing (`Concurrent` overlap policy)
- Active backfill progress

## Limitations

- **`Buffer` queue depth is bounded.** The server enforces a ceiling of 1000 queued fires. Fires that arrive when the queue is full are dropped. Set `BufferLimit` via the SDK to apply a lower cap.
- **Overlap policy changes are not retroactive.** Changing the policy on a live schedule does not affect runs that are already active or buffered. Only future fires use the new policy.
- **Catch-up is bounded by the catch-up window.** The default window is one year. If the server is down for longer than the configured window, fires older than the window are silently dropped with no way to recover them automatically. Use backfill to recover those manually.
- **Backfill fires respect the overlap policy.** Backfilling a large range with `SkipNew` will run only one workflow. Use `Concurrent` or set `--overlap_policy` on the backfill command when you need all fires to run.
- **Jitter is not reproducible.** The random offset applied to each fire is not seeded from the schedule state. If the scheduler workflow restarts, a fire may get a different jitter offset than it would have had otherwise.
- **The scheduler workflow counts against domain limits.** Each schedule consumes one workflow execution slot in the domain. In domains with very tight workflow count limits this is worth accounting for.

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
  --overlap_policy Concurrent \
  --concurrency_limit 3 \
  --execution_timeout 3600

# Create with jitter (random delay up to 60 seconds after each tick)
cadence schedule create \
  --schedule_id my-schedule \
  --cron_expression "0 9 * * *" \
  --workflow_type MyWorkflow \
  --tasklist my-tasklist \
  --jitter_start_seconds 60 \
  --execution_timeout 3600

# Describe
cadence schedule describe --schedule_id my-schedule

# List all schedules in the domain
cadence schedule list

# Pause
cadence schedule pause --schedule_id my-schedule --reason "planned maintenance"

# Unpause (catch up on all missed fires)
cadence schedule unpause --schedule_id my-schedule --catch_up_policy All

# Unpause (skip missed fires, resume from now)
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
  --overlap_policy SkipNew

# Delete
cadence schedule delete --schedule_id my-schedule
```

## SDK usage

- Go SDK -- `ScheduleClient` with full Create, Describe, Update, Pause, Unpause, Backfill, and List support. See the Schedules page under Go Client in the sidebar.
- Python SDK -- see the [cadence-python-client repository](https://github.com/cadence-workflow/cadence-python-client) for `create_schedule`, `describe_schedule`, `pause_schedule`, `unpause_schedule`, `update_schedule`, `backfill_schedule`, and `list_schedules` on the client. A dedicated docs page is coming.
- Java SDK -- coming soon.
