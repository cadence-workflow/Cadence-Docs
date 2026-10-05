---
layout: default
title: Search Attributes
description: How to add and update indexed search attributes from a workflow with the Cadence Python SDK.
keywords:
  - cadence python search attributes
  - cadence python upsert search attributes
  - cadence python workflow visibility
  - cadence python indexed fields
permalink: /docs/python-client/search-attributes
---

# Search Attributes

Search attributes are indexed workflow metadata that can be used in visibility queries. Unlike a [memo](/docs/concepts/search-workflows#memo-vs-search-attributes), search attributes must be registered with the Cadence server before a workflow writes them.

For server configuration and query syntax, see [Search Workflows](/docs/concepts/search-workflows).

## Samples

| Sample | Description | Code |
|---|---|---|
| **Search-attribute tests** | Demonstrates type encoding, updates, replay behavior, and validation | [test_context_upsert_search_attributes.py](https://github.com/cadence-workflow/cadence-python-client/blob/v0.4.0/tests/cadence/_internal/workflow/test_context_upsert_search_attributes.py) |

## Upserting attributes

Call `workflow.upsert_search_attributes` from workflow code:

```python
from datetime import datetime
from cadence import workflow

@registry.workflow()
class OrderWorkflow:
    @workflow.run
    async def run(self, submitted_at: datetime) -> None:
        workflow.upsert_search_attributes(
            {
                "CustomKeywordField": "priority-order",
                "CustomIntField": 3,
                "CustomBoolField": True,
                "CustomDatetimeField": submitted_at,
            }
        )
```

The Python SDK accepts scalar values or lists of one scalar type:

- `str`
- `int`
- `float`
- `bool`
- `datetime`

The key and its value type must match a search attribute registered on the server. A naive `datetime` is interpreted as UTC; timezone-aware values are recommended.

## Reading current values

The workflow's current search attributes are available through `WorkflowInfo`:

```python
from cadence.workflow import WorkflowContext

info = WorkflowContext.get().info()
current_priority = (info.search_attributes or {}).get("CustomIntField")
```

`upsert_search_attributes` also updates `info.search_attributes` immediately, including during replay.

## Update behavior

Upserts merge into the existing map. Writing an existing key replaces its value:

```python
workflow.upsert_search_attributes({"CustomIntField": 4})
```

The SDK does not provide an API to remove a search attribute key. Passing an empty map raises `ValueError`.

`CadenceChangeVersion` is reserved for [workflow versioning](/docs/python-client/workflow-versioning) and cannot be written with `upsert_search_attributes`.
