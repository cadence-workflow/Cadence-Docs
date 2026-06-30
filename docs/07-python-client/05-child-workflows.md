---
layout: default
title: Child Workflows
description: How to start and await child workflow executions from within a parent workflow in the Cadence Python SDK.
keywords:
  - cadence python child workflow
  - cadence python execute child workflow
  - cadence python start child workflow
permalink: /docs/python-client/child-workflows
---

# Child Workflows

A workflow can start other workflows as children. The parent can wait for the child to complete or fire-and-forget it and track it independently.

## Execute and await

`execute_child_workflow` starts a child workflow and waits for its result:

```python
from datetime import timedelta
from cadence.workflow import execute_child_workflow

@registry.workflow()
class ParentWorkflow:
    @workflow.run
    async def run(self, order_id: str) -> str:
        result = await execute_child_workflow(
            "ProcessOrderWorkflow",   # child workflow type name
            str,                      # expected return type
            order_id,                 # argument to child
            task_list="order-workers",
            execution_start_to_close_timeout=timedelta(minutes=30),
        )
        return result
```

## Start without immediately awaiting

`start_child_workflow` returns a `ChildWorkflowFuture` you can await later or signal before awaiting:

```python
from cadence.workflow import start_child_workflow

@registry.workflow()
class ParentWorkflow:
    @workflow.run
    async def run(self) -> None:
        future = await start_child_workflow(
            "ChildWorkflow",
            str,
            task_list="child-workers",
            execution_start_to_close_timeout=timedelta(hours=1),
        )

        # Send a signal before awaiting
        await future.signal("start-processing")

        result = await future
```

### ChildWorkflowFuture

| Method / Property | Description |
|---|---|
| `await future` | Wait for the child to complete and return its result |
| `future.workflow_id` | The child's workflow ID |
| `future.run_id` | The child's run ID |
| `future.cancel()` | Request cancellation of the child |
| `await future.signal(name, *args)` | Send a signal to the child |

## Child workflow options

| Option | Description |
|---|---|
| `workflow_id` | ID for the child execution (auto-generated if omitted) |
| `task_list` | Task list for the child worker |
| `execution_start_to_close_timeout` | Max total duration |
| `task_start_to_close_timeout` | Max time per decision task |
| `retry_policy` | Retry policy for the child |
| `cron_schedule` | Run the child as a recurring cron workflow |
| `domain` | Domain for the child (defaults to parent's domain) |
| `parent_close_policy` | What to do with the child when the parent closes |
| `memo` | Key-value metadata attached to the child execution |

## Parent close policy

`parent_close_policy` controls what happens to the child when the parent workflow closes (completes, fails, or is cancelled):

```python
from cadence.api.v1 import workflow_pb2

future = await start_child_workflow(
    "ChildWorkflow",
    str,
    task_list="child-workers",
    execution_start_to_close_timeout=timedelta(hours=1),
    parent_close_policy=workflow_pb2.PARENT_CLOSE_POLICY_ABANDON,
)
```

| Policy | Behavior |
|---|---|
| `PARENT_CLOSE_POLICY_TERMINATE` (default) | Terminate the child |
| `PARENT_CLOSE_POLICY_ABANDON` | Leave the child running |
| `PARENT_CLOSE_POLICY_REQUEST_CANCEL` | Request cancellation of the child |
