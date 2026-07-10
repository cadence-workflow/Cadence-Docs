---
layout: default
title: Testing
description: How to unit test workflows in the Cadence Python SDK using TestWorkflowEnvironment.
keywords:
  - cadence python testing
  - cadence python workflow test
  - cadence python unit test
  - cadence python TestWorkflowEnvironment
permalink: /docs/python-client/testing
---

# Testing

`TestWorkflowEnvironment` runs workflow code in-memory without a Cadence server. It executes workflow and activity logic deterministically, mocks activities with fixed values or custom functions, and advances virtual time for timer-based workflows.

## Basic test

```python
import pytest
from cadence import Registry, workflow
from cadence.workflow import execute_activity
from cadence.testing import TestWorkflowEnvironment
from datetime import timedelta

registry = Registry()

@registry.workflow()
class GreetingWorkflow:
    @workflow.run
    async def run(self, name: str) -> str:
        return await execute_activity(
            "greet",
            str,
            name,
            start_to_close_timeout=timedelta(seconds=5),
        )

@pytest.mark.asyncio
async def test_greeting():
    env = TestWorkflowEnvironment(registry)
    env.on_activity("greet", result="Hello, World!")

    client = env.client
    await client.start_workflow(
        "GreetingWorkflow",
        "World",
        workflow_id="test-greeting",
        task_list="tl",
        execution_start_to_close_timeout=timedelta(minutes=1),
    )

    result = env.get_workflow_result(str, workflow_id="test-greeting")
    assert result == "Hello, World!"
```

## Mocking activities

Mock an activity by name with a fixed return value:

```python
env.on_activity("fetch_order", result={"id": "123", "status": "pending"})
```

Mock with a function to inspect arguments or return dynamic values:

```python
def fake_fetch(order_id: str) -> dict:
    assert order_id == "123"
    return {"id": order_id, "status": "pending"}

env.on_activity("fetch_order", fn=fake_fetch)
```

The mock function receives the decoded activity arguments. It can be sync or async.

## Checking workflow results

```python
result = env.get_workflow_result(str, workflow_id="my-wf")
```

If the workflow failed, `get_workflow_result` re-raises the error. To inspect the error without re-raising:

```python
error = env.get_workflow_error(workflow_id="my-wf")
```

Check whether a workflow has finished:

```python
assert env.is_workflow_completed(workflow_id="my-wf")
```

## Testing signals

Send a signal from the test after starting the workflow:

```python
@pytest.mark.asyncio
async def test_approval():
    env = TestWorkflowEnvironment(registry)
    client = env.client

    execution = await client.start_workflow(
        "ApprovalWorkflow",
        workflow_id="approval-test",
        task_list="tl",
        execution_start_to_close_timeout=timedelta(minutes=1),
    )

    await client.signal_workflow(execution.workflow_id, "", "approve", True)

    result = env.get_workflow_result(bool, workflow_id="approval-test")
    assert result is True
```

## Testing queries

```python
await client.signal_workflow("my-wf", "", "set_status", "processing")
status = await client.query_workflow("my-wf", "", "get_status", result_type=str)
assert status == "processing"
```

## TestWorkflowEnvironment reference

| Method / Property | Description |
|---|---|
| `env.client` | `Client`-compatible object for starting and interacting with workflows |
| `env.on_activity(name, result=...)` | Mock an activity with a fixed return value |
| `env.on_activity(name, fn=...)` | Mock an activity with a callable |
| `env.get_workflow_result(type, workflow_id="")` | Get the decoded result; raises if the workflow failed |
| `env.get_workflow_error(workflow_id="")` | Get the error if the workflow failed, or `None` |
| `env.is_workflow_completed(workflow_id="")` | Whether the workflow has finished |
| `env.now()` | Current virtual time |
| `env.close()` | Shut down the executor |

`TestWorkflowEnvironment` is also a synchronous context manager:

```python
with TestWorkflowEnvironment(registry) as env:
    ...
```
