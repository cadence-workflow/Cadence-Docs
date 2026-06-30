---
layout: default
title: Activities
description: How to define, register, and execute activities in the Cadence Python SDK, including heartbeating and retry policies.
keywords:
  - cadence python activity
  - cadence python execute activity
  - cadence python activity heartbeat
  - cadence python activity retry
permalink: /docs/python-client/activities
---

# Activities

Activities are where non-deterministic work happens: database calls, HTTP requests, file I/O, and anything else that touches the outside world.

## Defining activities

Use `@activity.defn()` for standalone functions:

```python
from cadence import activity

@activity.defn()
async def fetch_order(order_id: str) -> dict:
    # HTTP call, DB query, etc.
    return {"id": order_id, "status": "pending"}

@activity.defn()
def send_email(to: str, subject: str) -> None:
    # synchronous activities work too
    ...
```

Use `name=` to give the activity an explicit name:

```python
@activity.defn(name="fetch-order-v2")
async def fetch_order_v2(order_id: str) -> dict:
    ...
```

### Method activities

Group related activities into a class using `@activity.method()`:

```python
from cadence import activity

class OrderActivities:
    @activity.method()
    async def fetch_order(self, order_id: str) -> dict:
        ...

    @activity.method()
    async def update_status(self, order_id: str, status: str) -> None:
        ...
```

Register an instance with the registry:

```python
registry.register_activities(OrderActivities())
```

## Registering activities

```python
from cadence.worker import Registry

registry = Registry()

# Standalone function
registry.register_activity(fetch_order)

# All methods on an instance
registry.register_activities(OrderActivities())
```

Or use the registry decorator directly:

```python
@registry.activity()
async def process_payment(amount: float) -> str:
    ...
```

## Executing activities from a workflow

Inside a workflow, call `execute_activity` with the activity name, expected return type, arguments, and options:

```python
from datetime import timedelta
from cadence.workflow import execute_activity

@registry.workflow()
class OrderWorkflow:
    @workflow.run
    async def run(self, order_id: str) -> str:
        order = await execute_activity(
            "fetch_order",
            dict,
            order_id,
            start_to_close_timeout=timedelta(minutes=5),
        )
        await execute_activity(
            "send_email",
            type(None),
            order["email"],
            "Your order is ready",
            start_to_close_timeout=timedelta(seconds=30),
        )
        return "done"
```

### Activity options

| Option | Description |
|---|---|
| `start_to_close_timeout` | Max time for one activity attempt (required if `schedule_to_close_timeout` is not set) |
| `schedule_to_close_timeout` | Max total time including scheduling and all retries |
| `schedule_to_start_timeout` | Max time waiting in the task list before execution starts |
| `heartbeat_timeout` | Max time between heartbeats for long-running activities |
| `task_list` | Override the task list for this activity |
| `retry_policy` | Retry policy (see [Retries](/docs/python-client/retries)) |

## Heartbeating

Long-running activities should call `activity.heartbeat()` periodically so the server can detect failures and reschedule:

```python
from cadence import activity
import asyncio

@activity.defn()
async def process_large_file(file_path: str) -> int:
    rows_processed = 0
    with open(file_path) as f:
        for line in f:
            process_line(line)
            rows_processed += 1
            if rows_processed % 1000 == 0:
                activity.heartbeat(rows_processed)  # report progress
            await asyncio.sleep(0)  # yield control
    return rows_processed
```

Pass progress details to `heartbeat()` and retrieve them on restart with `activity.heartbeat_details()`.

## Activity context

Inside an activity, use the `activity` module to access context:

```python
@activity.defn()
async def my_activity() -> None:
    info = activity.info()
    print(info.activity_id)
    print(info.workflow_id)
    print(info.workflow_run_id)
    print(info.attempt)
    print(info.heartbeat_timeout)
```
