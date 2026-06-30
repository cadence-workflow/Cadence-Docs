---
layout: default
title: Queries
description: How to define query handlers in workflows and query workflow state from the Cadence Python client.
keywords:
  - cadence python query
  - cadence python query workflow
  - cadence python query handler
permalink: /docs/python-client/queries
---

# Queries

Queries let external code read the current state of a running workflow without affecting it. Query handlers must be synchronous and must not modify workflow state.

## Defining a query handler

```python
from cadence import Registry, workflow

registry = Registry()

@registry.workflow()
class OrderWorkflow:
    def __init__(self):
        self._status = "pending"
        self._order_id = ""

    @workflow.run
    async def run(self, order_id: str) -> str:
        self._order_id = order_id
        self._status = "processing"
        result = await execute_activity(...)
        self._status = "completed"
        return result

    @workflow.query
    def get_status(self) -> str:
        return self._status

    @workflow.query
    def get_order_id(self) -> str:
        return self._order_id
```

Use `name=` to override the query name:

```python
@workflow.query(name="status")
def get_status(self) -> str:
    return self._status
```

## Querying from a client

```python
status = await client.query_workflow(
    "order-123",    # workflow_id
    "",             # run_id (empty = current run)
    "get_status",   # query type (must match the handler name)
    result_type=str,
)
print(status)  # "processing"
```

Pass arguments to parameterized query handlers:

```python
@workflow.query
def get_item(self, item_id: str) -> dict:
    return self._items.get(item_id)

# Client side:
item = await client.query_workflow(
    "order-123", "", "get_item", "item-42",
    result_type=dict,
)
```

## Constraints

- Query handlers must return a value (cannot return `None` from an intended-to-be-queried method).
- Query handlers must be synchronous (`def`, not `async def`).
- Query handlers must not call `execute_activity`, `execute_child_workflow`, `sleep`, or any other workflow APIs that schedule work.
- A query on a closed (completed/failed/cancelled) workflow returns the last known state.
