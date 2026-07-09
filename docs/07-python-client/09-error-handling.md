---
layout: default
title: Error Handling
description: How exceptions propagate in the Cadence Python SDK across activities, child workflows, and signals.
keywords:
  - cadence python error handling
  - cadence python exception
  - cadence python activity failure
  - cadence python workflow failure
permalink: /docs/python-client/error-handling
---

# Error Handling

The Python SDK converts server-side failures into Python exceptions that you catch with standard `try/except`.

## Activity failures

When an activity raises an exception (after all retries are exhausted), the workflow receives an `ActivityFailure`. Wrap the `execute_activity` call to handle it:

```python
from datetime import timedelta
from cadence.error import ActivityFailure
from cadence.workflow import execute_activity

@registry.workflow()
class OrderWorkflow:
    @workflow.run
    async def run(self, order_id: str) -> str:
        try:
            result = await execute_activity(
                "fetch_order",
                dict,
                order_id,
                start_to_close_timeout=timedelta(minutes=5),
            )
        except ActivityFailure as e:
            # Log and compensate
            await execute_activity(
                "send_alert",
                type(None),
                str(e),
                start_to_close_timeout=timedelta(seconds=30),
            )
            return "failed"
        return result["status"]
```

## Child workflow failures

Child workflows raise different exceptions depending on how they ended:

```python
from cadence.error import (
    StartChildWorkflowExecutionFailed,
    ChildWorkflowExecutionFailed,
    ChildWorkflowExecutionCanceled,
    ChildWorkflowExecutionTimedOut,
    ChildWorkflowExecutionTerminated,
)

try:
    result = await execute_child_workflow("ProcessWorkflow", str, ...)
except StartChildWorkflowExecutionFailed as e:
    # Child could not be started (e.g. duplicate workflow ID)
    ...
except ChildWorkflowExecutionFailed as e:
    # Child started but failed during execution
    ...
except ChildWorkflowExecutionCanceled as e:
    # Child was cancelled (e.g. parent requested cancellation)
    ...
except ChildWorkflowExecutionTimedOut as e:
    # Child exceeded its execution timeout
    # e.timeout_type indicates which timeout fired
    ...
except ChildWorkflowExecutionTerminated:
    # Child was forcibly terminated
    ...
```

All five are subclasses of `ChildWorkflowError`, so you can catch that base class if you want a single handler for any child workflow lifecycle error.

## Signal failures

Sending a signal to a workflow that no longer exists raises `SignalExternalWorkflowFailed`:

```python
from cadence.error import SignalExternalWorkflowFailed
from cadence.workflow import signal_external_workflow

try:
    await signal_external_workflow("target-wf", "my-signal")
except SignalExternalWorkflowFailed as e:
    # Target workflow was not found or could not receive the signal
    ...
```

## Workflow cancellation

When a workflow is cancelled, pending `await` points raise `asyncio.CancelledError`. Catch it to run cleanup:

```python
@registry.workflow()
class LongWorkflow:
    @workflow.run
    async def run(self) -> None:
        try:
            await execute_activity("long_activity", type(None), ...)
        except asyncio.CancelledError:
            await execute_activity("cleanup_activity", type(None), ...)
            raise  # re-raise so Cadence records the cancellation
```

## Error reference

| Exception | When raised |
|---|---|
| `ActivityFailure` | Activity exhausted all retries or returned a non-retryable error |
| `WorkflowFailure` | A workflow execution failed |
| `StartChildWorkflowExecutionFailed` | Child workflow could not be started |
| `ChildWorkflowExecutionFailed` | Child workflow started but failed |
| `ChildWorkflowExecutionCanceled` | Child workflow was cancelled |
| `ChildWorkflowExecutionTimedOut` | Child workflow exceeded its execution timeout |
| `ChildWorkflowExecutionTerminated` | Child workflow was forcibly terminated |
| `ChildWorkflowError` | Base class for all five child workflow lifecycle errors above |
| `SignalExternalWorkflowFailed` | Signal delivery to an external workflow failed |
| `SignalFailure` | Internal signal routing failure |
| `ContinueAsNewError` | Raised internally by `workflow.continue_as_new()`. Do not catch. |
| `CadenceRpcError` | gRPC-level error from the Cadence server (client-side code) |

Import from `cadence.error`:

```python
from cadence.error import ActivityFailure, ChildWorkflowExecutionFailed, CadenceRpcError
```
