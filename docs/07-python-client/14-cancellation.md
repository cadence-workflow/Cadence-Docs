---
layout: default
title: Cancellation
description: How to request and handle workflow, activity, and child workflow cancellation with the Cadence Python SDK.
keywords:
  - cadence python cancellation
  - cadence python cancel workflow
  - cadence python cancel activity
  - cadence python asyncio CancelledError
permalink: /docs/python-client/cancellation
---

# Cancellation

Cancellation is a cooperative request. A client can request that a workflow cancel, but workflow and activity code decide when to observe the request, clean up, and stop.

## Samples

| Sample | Description | Code |
|---|---|---|
| **Workflow cancellation tests** | Covers uncaught, handled, activity, timer, and child workflow cancellation | [test_workflow_engine.py](https://github.com/cadence-workflow/cadence-python-client/blob/v0.4.0/tests/cadence/_internal/workflow/test_workflow_engine.py) |
| **Activity heartbeat tests** | Exercises cancellation delivered to sync and async activities through heartbeats | [test_heartbeat.py](https://github.com/cadence-workflow/cadence-python-client/blob/v0.4.0/tests/integration_tests/workflow/test_heartbeat.py) |

## Requesting workflow cancellation

Use `Client.cancel_workflow` with the workflow ID and, optionally, a specific run ID:

```python
await client.cancel_workflow(
    "order-123",
    "",  # empty string targets the current run
)
```

The call returns after Cadence accepts the request, not after the workflow finishes cancelling.

## Handling cancellation in a workflow

When a cancellation request reaches a workflow, pending workflow operations such as activities, timers, and child workflows raise `asyncio.CancelledError`. If the exception leaves the workflow uncaught, Cadence records the execution as cancelled.

```python
import asyncio
from datetime import timedelta
from cadence import workflow

@registry.workflow()
class OrderWorkflow:
    @workflow.run
    async def run(self, order_id: str) -> None:
        try:
            await workflow.execute_activity(
                "process_order",
                type(None),
                order_id,
                start_to_close_timeout=timedelta(minutes=5),
            )
        except asyncio.CancelledError:
            await workflow.execute_activity(
                "release_reservation",
                type(None),
                order_id,
                start_to_close_timeout=timedelta(minutes=1),
            )
            raise
```

Re-raise `asyncio.CancelledError` after cleanup to close the workflow as cancelled. If you catch the exception and return a result instead, the workflow completes normally.

Use `workflow.is_cancel_requested()` when code needs to inspect cancellation state without waiting for another operation:

```python
if workflow.is_cancel_requested():
    ...
```

Cancellation automatically requests cancellation of an unshielded activity, timer, or child workflow that the workflow is currently awaiting. Use `asyncio.shield()` only when an operation must continue independently of the root cancellation request.

## Handling cancellation in an async activity

Activity cancellation is delivered through heartbeats. A long-running activity must set `heartbeat_timeout` when scheduled and heartbeat regularly. After a heartbeat observes the server request, an async activity receives `asyncio.CancelledError`.

```python
import asyncio
from cadence import activity

@activity.defn()
async def process_items(items: list[str]) -> None:
    try:
        for index, item in enumerate(items):
            await process(item)
            activity.heartbeat(index)
    except asyncio.CancelledError:
        await release_resources()
        raise
```

If an activity never heartbeats, it may not learn about cancellation before another timeout closes the attempt.

## Handling cancellation in a synchronous activity

Synchronous activities can inspect the cancellation flag after heartbeating and raise `ActivityCancelledError`:

```python
from cadence import activity
from cadence.error import ActivityCancelledError

@activity.defn()
def process_items(items: list[str]) -> None:
    index = 0
    try:
        for index, item in enumerate(items):
            activity.raise_if_cancelled()
            process(item)
            activity.heartbeat(index)
    except ActivityCancelledError:
        release_resources()
        raise ActivityCancelledError(index)
```

`activity.is_cancelled()` returns the same cancellation flag without raising. A synchronous activity can also call `activity.wait_for_cancelled(timeout)` to block until cancellation is requested or the timeout elapses.

## Cancelling a child workflow

`ChildWorkflowFuture.cancel()` requests cancellation of the child and returns whether the local future accepted the request:

```python
child = await workflow.start_child_workflow(
    "ChildWorkflow",
    str,
    task_list="child-workers",
    execution_start_to_close_timeout=timedelta(hours=1),
)

child.cancel()
```

The child's own cancellation handling determines when it closes. The parent's [`parent_close_policy`](/docs/python-client/child-workflows#parent-close-policy) separately controls what happens when the parent closes.
