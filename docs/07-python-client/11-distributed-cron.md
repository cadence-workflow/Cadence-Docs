---
layout: default
title: Distributed Cron
description: How to run a recurring workflow using the cron_schedule option in the Cadence Python SDK.
keywords:
  - cadence python cron
  - cadence python distributed cron
  - cadence python recurring workflow
permalink: /docs/python-client/distributed-cron
---

# Distributed Cron

The `cron_schedule` field on `start_workflow` runs a workflow on a recurring cadence. This is the legacy approach; for new use cases consider [Schedules](/docs/python-client/schedules), which add pause/unpause, backfill, overlap control, and visibility.

## Starting a cron workflow

```python
from datetime import timedelta
from cadence.client import Client

CADENCE_TARGET = "localhost:7833"  # replace with your Cadence frontend address

async with Client(domain="my-domain", target=CADENCE_TARGET) as client:
    execution = await client.start_workflow(
        "DailyReportWorkflow",
        workflow_id="daily-report",
        task_list="report-workers",
        cron_schedule="0 9 * * *",   # every day at 9 AM UTC
        execution_start_to_close_timeout=timedelta(hours=2),
    )
```

Standard five-field cron syntax is used (`minute hour day-of-month month day-of-week`). All times are UTC.

## How it works

After each run completes (or fails), the Cadence server automatically starts the next execution at the next scheduled time. Each execution is independent: it gets a fresh workflow history and runs from the beginning of the workflow function.

If a run is still executing when the next fire time arrives, the new fire is skipped.

## Passing state between runs

Each execution of the workflow function is independent. To carry state from one run to the next, use the workflow result: the next execution receives the previous run's result as its first argument.

```python
from datetime import timedelta
from cadence import workflow
from cadence.worker import Registry
from cadence.workflow import execute_activity

registry = Registry()

@registry.workflow()
class DailyReportWorkflow:
    @workflow.run
    async def run(self, last_cursor: str | None = None) -> str:
        # Process from where last run left off
        new_cursor = await execute_activity(
            "generate_report",
            str,
            last_cursor,
            start_to_close_timeout=timedelta(hours=1),
        )
        return new_cursor  # passed to next execution
```

## Stopping a cron workflow

Cancel or terminate the workflow execution. Cancelling stops the next scheduled run; no built-in mechanism pauses and resumes a cron workflow. For pause/unpause support, use [Schedules](/docs/python-client/schedules).

```python
await client.cancel_workflow("daily-report", "")
```

## Cron vs Schedules

| | `cron_schedule` field | Schedules |
|---|---|---|
| Overlap control | Always skip | Configurable |
| Pause/unpause | No | Yes |
| Backfill | No | Yes |
| Visibility | No | Yes |
| Update without restart | No | Yes |

For new recurring workflows, prefer Schedules.
