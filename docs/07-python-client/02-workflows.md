---
layout: default
title: Workflows
description: How to define, register, and implement workflows in the Cadence Python SDK.
keywords:
  - cadence python workflow
  - cadence python workflow definition
  - cadence python workflow.run
  - cadence python signal handler
  - cadence python query handler
permalink: /docs/python-client/workflows
---

# Workflows

A workflow is a class decorated with `@registry.workflow()`. The class has exactly one `@workflow.run` method that contains the workflow logic.

## Defining a workflow

```python
from cadence import Registry, workflow

registry = Registry()

@registry.workflow()
class OrderWorkflow:
    @workflow.run
    async def run(self, order_id: str) -> str:
        # workflow logic
        return "completed"
```

`@registry.workflow()` registers the class under its class name by default. Pass `name=` to use a different name:

```python
@registry.workflow(name="order-workflow-v2")
class OrderWorkflow:
    ...
```

## Signal handlers

Signal handlers receive signals sent while the workflow is running. They can be sync or async.

```python
@registry.workflow()
class ApprovalWorkflow:
    def __init__(self):
        self._approved = False

    @workflow.run
    async def run(self) -> bool:
        await workflow.wait_condition(lambda: self._approved)
        return self._approved

    @workflow.signal
    def approve(self, approved: bool) -> None:
        self._approved = approved
```

Use `name=` to override the signal name:

```python
@workflow.signal(name="cancel-order")
async def cancel(self) -> None:
    ...
```

## Query handlers

Query handlers answer read-only questions about workflow state. They must be synchronous and must not modify state.

```python
@registry.workflow()
class StatusWorkflow:
    def __init__(self):
        self._status = "pending"

    @workflow.run
    async def run(self) -> None:
        ...

    @workflow.query
    def get_status(self) -> str:
        return self._status
```

## Workflow info

Inside a workflow, use `workflow.WorkflowContext.get().info()` to access the current workflow's metadata:

```python
from cadence.workflow import WorkflowContext

ctx = WorkflowContext.get()
print(ctx.info().workflow_id)
print(ctx.info().workflow_run_id)
print(ctx.info().workflow_domain)
print(ctx.info().workflow_task_list)
```

## Initialization

The `__init__` method runs before `run` and is a good place to initialize instance state that signal handlers read and write.

```python
from datetime import timedelta

@registry.workflow()
class CounterWorkflow:
    def __init__(self):
        self._count = 0

    @workflow.run
    async def run(self) -> int:
        await workflow.sleep(timedelta(hours=1))
        return self._count

    @workflow.signal
    def increment(self) -> None:
        self._count += 1
```

## Workflow constraints

Workflow code must be deterministic. The same sequence of inputs must always produce the same sequence of decisions. Specifically:

- Do not use `time.time()` or `datetime.now()` -- use timers via `workflow.sleep()` instead.
- Do not use `random`, `uuid`, or other non-deterministic sources.
- Do not make I/O calls directly -- run them as activities.
- Do not use threading or `asyncio.create_task()` -- the workflow event loop is controlled by the worker.
