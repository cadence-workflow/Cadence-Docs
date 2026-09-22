---
layout: default
title: Context Propagation
description: How to propagate request context through Cadence Python clients, workflows, activities, child workflows, and continue-as-new.
keywords:
  - cadence python context propagation
  - cadence python ContextVar
  - cadence python ContextVarPropagator
  - cadence python workflow headers
permalink: /docs/python-client/context-propagation
---

# Context Propagation

Context propagation copies request-scoped values into Cadence headers and restores them while workflows and activities execute. Common uses include correlation IDs, tenant identifiers, and tracing context.

Do not put secrets or large payloads in propagated context. Header values are stored in workflow history.

## Samples

| Sample | Description | Code |
|---|---|---|
| **Request ID propagation** | Propagates a `ContextVar` from a client through a workflow into an activity | [context_propagation_example.py](https://github.com/cadence-workflow/cadence-python-client/blob/v0.4.0/cadence/sample/context_propagation_example.py) |

## Propagating a `ContextVar`

Create a `ContextVarPropagator` with a header key and byte serialization functions:

```python
from contextvars import ContextVar
from cadence import ContextVarPropagator

request_id: ContextVar[str] = ContextVar("request_id")

request_id_propagator = ContextVarPropagator(
    request_id,
    "request-id",
    lambda value: value.encode(),
    bytes.decode,
)
```

Configure the propagator on the client:

```python
from cadence.client import Client

client = Client(
    domain="my-domain",
    target="localhost:7833",
    context_propagators=(request_id_propagator,),
)
```

A `Worker` inherits `context_propagators` from its client unless you explicitly pass a different sequence to the worker.

## Starting a workflow with context

Set the context variable around the client call:

```python
from datetime import timedelta

token = request_id.set("request-8f42")
try:
    execution = await client.start_workflow(
        "OrderWorkflow",
        task_list="order-workers",
        execution_start_to_close_timeout=timedelta(hours=1),
    )
finally:
    request_id.reset(token)
```

The value is available from the same `ContextVar` inside the workflow and its activities:

```python
from datetime import timedelta
from cadence import workflow

@registry.activity()
async def write_audit_record() -> None:
    print(f"request_id={request_id.get()}")

@registry.workflow()
class OrderWorkflow:
    @workflow.run
    async def run(self) -> None:
        current_request_id = request_id.get()
        await workflow.execute_activity(
            "write_audit_record",
            type(None),
            start_to_close_timeout=timedelta(seconds=30),
        )
```

The SDK propagates configured context through:

- `Client.start_workflow` and `Client.signal_with_start_workflow`
- workflow execution on a worker
- activities started by a workflow
- child workflows
- continue-as-new

Context changes made inside a workflow are injected into subsequent outbound operations. Extracted values are scoped to the current workflow or activity invocation and do not leak back into the caller.

## Custom propagators

Implement `ContextPropagator` when application context does not fit a single `ContextVar`:

```python
from collections.abc import Iterator, Mapping
from contextlib import contextmanager

class CorrelationPropagator:
    def inject(self) -> Mapping[str, bytes]:
        return {"correlation-id": current_correlation_id().encode()}

    @contextmanager
    def extract(self, headers: Mapping[str, bytes]) -> Iterator[None]:
        value = headers.get("correlation-id")
        if value is None:
            yield
            return

        token = set_current_correlation_id(value.decode())
        try:
            yield
        finally:
            reset_current_correlation_id(token)
```

`inject` must return a mapping of string keys to byte values. `extract` must return a context manager that restores the previous local context when its scope exits. Configure the same propagator implementation on clients and workers that exchange the context.
