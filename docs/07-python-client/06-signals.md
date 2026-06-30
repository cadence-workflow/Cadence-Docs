---
layout: default
title: Signals
description: How to define signal handlers in workflows and send signals from the Cadence Python client or from within workflows.
keywords:
  - cadence python signal
  - cadence python signal handler
  - cadence python signal workflow
  - cadence python signal external workflow
permalink: /docs/python-client/signals
---

# Signals

Signals are one-way messages sent to a running workflow. They can carry arguments and can mutate workflow state.

## Defining a signal handler

Add `@workflow.signal` to a method on your workflow class. The handler can be sync or async.

```python
from cadence import Registry, workflow
from cadence.workflow import wait_condition

registry = Registry()

@registry.workflow()
class ApprovalWorkflow:
    def __init__(self):
        self._approved: bool | None = None

    @workflow.run
    async def run(self) -> bool:
        await wait_condition(lambda: self._approved is not None)
        return self._approved

    @workflow.signal
    def approve(self, approved: bool) -> None:
        self._approved = approved
```

Use `name=` to override the signal name:

```python
@workflow.signal(name="cancel-order")
async def cancel(self) -> None:
    self._cancelled = True
```

## Sending a signal from a client

```python
await client.signal_workflow(
    "my-workflow-id",   # workflow_id
    "",                 # run_id (empty = current run)
    "approve",          # signal name
    True,               # signal argument
)
```

## Signal-with-start

Signal a workflow or start it if it is not running:

```python
execution = await client.signal_with_start_workflow(
    "ApprovalWorkflow",
    "approve",           # signal name
    [True],              # signal args (list)
    workflow_id="approval-123",
    task_list="approval-workers",
    execution_start_to_close_timeout=timedelta(hours=1),
)
```

## Signaling external workflows

From inside a workflow, use `signal_external_workflow` to send a signal to a workflow in the same or a different domain:

```python
from cadence.workflow import signal_external_workflow

@registry.workflow()
class OrchestratorWorkflow:
    @workflow.run
    async def run(self, child_id: str) -> None:
        # Signal another running workflow
        await signal_external_workflow(
            child_id,        # workflow_id
            "start",         # signal name
            "go",            # signal argument
        )
```

To target a specific run or a different domain:

```python
await signal_external_workflow(
    "other-workflow-id",
    "cancel",
    run_id="specific-run-id",   # defaults to empty (current run)
    domain="other-domain",       # defaults to empty (same domain)
)
```

## Signaling a child workflow

If you have a `ChildWorkflowFuture`, signal it directly:

```python
future = await start_child_workflow("ChildWorkflow", str, ...)
await future.signal("start-processing", payload)
result = await future
```
