---
layout: default
title: Schedules
description: How to create, manage, and backfill Cadence Schedules from Python using the schedule methods on the Client.
keywords:
  - cadence python schedules
  - cadence python create schedule
  - cadence python recurring workflow
  - cadence python overlap policy
  - cadence python backfill schedule
permalink: /docs/python-client/schedules
---

# Schedules

The Python client exposes schedule management through methods on `Client`. For a full explanation of overlap policies, backfill, catch-up, and when to use Schedules over `cron_schedule`, see the [Schedules concept page](/docs/concepts/schedules).

Schedule operations use protobuf types from `cadence.api.v1.schedule_pb2`.

## Getting the client

```python
from cadence.client import Client

async with Client(domain="my-domain", target="localhost:7833") as client:
    # call client.create_schedule(...), client.describe_schedule(...), etc.
    ...
```

## Creating a schedule

```python
from datetime import timedelta
from google.protobuf.duration_pb2 import Duration
from cadence.api.v1 import common_pb2, schedule_pb2, tasklist_pb2

def _dur(td: timedelta) -> Duration:
    d = Duration()
    d.FromTimedelta(td)
    return d

await client.create_schedule(
    "daily-etl",
    spec=schedule_pb2.ScheduleSpec(
        cron_expression="0 2 * * *",  # every day at 2 AM UTC
    ),
    action=schedule_pb2.ScheduleAction(
        start_workflow=schedule_pb2.ScheduleAction.StartWorkflowAction(
            workflow_type=common_pb2.WorkflowType(name="RunETL"),
            task_list=tasklist_pb2.TaskList(name="etl-workers"),
            workflow_id_prefix="daily-etl-",
            execution_start_to_close_timeout=_dur(timedelta(hours=2)),
            task_start_to_close_timeout=_dur(timedelta(seconds=10)),
        )
    ),
    policies=schedule_pb2.SchedulePolicies(
        overlap_policy=schedule_pb2.SCHEDULE_OVERLAP_POLICY_SKIP_NEW,
        catch_up_policy=schedule_pb2.SCHEDULE_CATCH_UP_POLICY_SKIP,
        pause_on_failure=True,
    ),
)
```

### Overlap policies

| Constant | Behavior |
|---|---|
| `SCHEDULE_OVERLAP_POLICY_SKIP_NEW` (default) | Skip the new fire if a previous run is still active. |
| `SCHEDULE_OVERLAP_POLICY_BUFFER` | Queue new fires and run them sequentially. |
| `SCHEDULE_OVERLAP_POLICY_CONCURRENT` | Start every fire. |
| `SCHEDULE_OVERLAP_POLICY_CANCEL_PREVIOUS` | Cancel the active run, then start the new one. |
| `SCHEDULE_OVERLAP_POLICY_TERMINATE_PREVIOUS` | Terminate the active run immediately, then start the new one. |

### Jitter

```python
spec=schedule_pb2.ScheduleSpec(
    cron_expression="0 0 * * *",
    jitter=_dur(timedelta(minutes=10)),  # random delay up to 10 minutes
)
```

### Bounded schedule window

```python
from google.protobuf.timestamp_pb2 import Timestamp
import datetime

spec=schedule_pb2.ScheduleSpec(
    cron_expression="0 9 * * 1-5",
    start_time=Timestamp(seconds=int(datetime.datetime(2026, 7, 1, tzinfo=datetime.timezone.utc).timestamp())),
    end_time=Timestamp(seconds=int(datetime.datetime(2026, 12, 31, tzinfo=datetime.timezone.utc).timestamp())),
)
```

## Describing a schedule

```python
resp = await client.describe_schedule("daily-etl")
print(resp.state.paused)
print(resp.info.next_run_time)
print(resp.info.last_run_time)
```

## Pause and unpause

```python
# Pause with a reason
await client.pause_schedule("daily-etl", note="INFRA-4421: cluster maintenance")

# Unpause -- skip missed fires (default)
await client.unpause_schedule(
    "daily-etl",
    note="maintenance complete",
    catch_up_policy=schedule_pb2.SCHEDULE_CATCH_UP_POLICY_SKIP,
)

# Unpause -- catch up on all missed fires
await client.unpause_schedule(
    "daily-etl",
    note="maintenance complete",
    catch_up_policy=schedule_pb2.SCHEDULE_CATCH_UP_POLICY_ALL,
)
```

### Catch-up policies

| Constant | Behavior |
|---|---|
| `SCHEDULE_CATCH_UP_POLICY_SKIP` (default) | Resume from now; all missed fires are dropped. |
| `SCHEDULE_CATCH_UP_POLICY_ONE` | Dispatch at most one missed fire, then resume from now. |
| `SCHEDULE_CATCH_UP_POLICY_ALL` | Dispatch all missed fires within the catch-up window. |

## Updating a schedule

`update_schedule` uses a read-modify-write pattern. Pass a callback that receives the current `DescribeScheduleResponse` and mutates it in place:

```python
def change_cron(schedule):
    schedule.spec.cron_expression = "0 3 * * *"  # move to 3 AM

await client.update_schedule("daily-etl", change_cron)
```

The callback receives the full describe response. Mutate any fields you want to change; the rest are sent back unchanged.

## Backfill

```python
import datetime
from google.protobuf.timestamp_pb2 import Timestamp

def ts(dt: datetime.datetime) -> Timestamp:
    return Timestamp(seconds=int(dt.timestamp()))

await client.backfill_schedule(
    "daily-etl",
    start_time=ts(datetime.datetime(2026, 6, 20, tzinfo=datetime.timezone.utc)),
    end_time=ts(datetime.datetime(2026, 6, 23, tzinfo=datetime.timezone.utc)),
    backfill_id="backfill-june-gap",
    overlap_policy=schedule_pb2.SCHEDULE_OVERLAP_POLICY_CONCURRENT,
)
```

`overlap_policy` is optional. If omitted, the backfill uses the schedule's configured overlap policy.

## Listing schedules

`list_schedules` is an async generator that handles pagination automatically:

```python
async for entry in client.list_schedules():
    paused = entry.state.paused
    cron = entry.cron_expression
    wf_type = entry.workflow_type.name
    print(f"{entry.schedule_id}: cron={cron} paused={paused} workflow={wf_type}")
```

## Deleting a schedule

```python
await client.delete_schedule("daily-etl")
```

Deleting a schedule does not cancel or terminate any workflows it already started.
