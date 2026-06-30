---
layout: default
title: Starting Workflows
description: How to start, signal, query, and cancel workflow executions from the Cadence Python client.
keywords:
  - cadence python start workflow
  - cadence python signal workflow
  - cadence python query workflow
  - cadence python cancel workflow
permalink: /docs/python-client/starting-workflows
---

# Starting Workflows

All workflow lifecycle operations go through the `Client`.

## Start a workflow

```python
from datetime import timedelta
from cadence.client import Client

CADENCE_TARGET = "localhost:7833"  # replace with your Cadence frontend address

async with Client(domain="my-domain", target=CADENCE_TARGET) as client:
    execution = await client.start_workflow(
        "OrderWorkflow",           # workflow type name
        "order-123",               # argument passed to workflow.run
        workflow_id="order-123",
        task_list="order-workers",
        execution_start_to_close_timeout=timedelta(hours=1),
    )
    print(execution.workflow_id, execution.run_id)
```

`start_workflow` returns a `WorkflowExecution` with `.workflow_id` and `.run_id`. If a workflow with the same ID is already running, the default policy raises an error. Use `workflow_id_reuse_policy` to control this.

### Start options

| Option | Description |
|---|---|
| `workflow_id` | Unique ID for this execution (auto-generated if omitted) |
| `task_list` | Task list the worker polls (required) |
| `execution_start_to_close_timeout` | Max total duration for the workflow (required) |
| `task_start_to_close_timeout` | Max time for a single decision task (default: 10 s) |
| `cron_schedule` | Start as a recurring cron workflow |
| `retry_policy` | Retry policy for the workflow |
| `memo` | Key-value metadata attached to the execution |
| `workflow_id_reuse_policy` | Controls what happens if the workflow ID is already in use |

## Signal a running workflow

```python
await client.signal_workflow(
    "order-123",   # workflow_id
    "",            # run_id (empty = current run)
    "approve",     # signal name
    True,          # signal argument
)
```

## Query a running workflow

```python
status = await client.query_workflow(
    "order-123",    # workflow_id
    "",             # run_id
    "get_status",   # query type (matches @workflow.query handler name)
    result_type=str,
)
```

## Cancel a workflow

```python
await client.cancel_workflow(
    "order-123",  # workflow_id
    "",           # run_id
)
```

Cancellation is cooperative. The workflow receives the cancellation and may continue for some time while cleaning up.

## Signal-with-start

`signal_with_start_workflow` signals a workflow if it is running, or starts it and delivers the signal if it is not.

```python
execution = await client.signal_with_start_workflow(
    "OrderWorkflow",        # workflow type
    "approve",              # signal name
    [True],                 # signal arguments (list)
    "order-123",            # workflow argument
    workflow_id="order-123",
    task_list="order-workers",
    execution_start_to_close_timeout=timedelta(hours=1),
)
```
