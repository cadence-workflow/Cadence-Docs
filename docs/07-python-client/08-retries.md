---
layout: default
title: Retries
description: How to configure retry policies for activities and child workflows in the Cadence Python SDK.
keywords:
  - cadence python retry
  - cadence python retry policy
  - cadence python activity retry
permalink: /docs/python-client/retries
---

# Retries

Cadence retries activities and workflows automatically on failure. You control the retry behavior with a `RetryPolicy`.

## RetryPolicy

`RetryPolicy` is a `TypedDict` defined in `cadence.workflow`. All fields are optional.

```python
from datetime import timedelta
from cadence.workflow import RetryPolicy

policy = RetryPolicy(
    initial_interval=timedelta(seconds=1),     # delay before first retry
    backoff_coefficient=2.0,                   # multiply delay by this each attempt
    maximum_interval=timedelta(minutes=5),     # cap the delay
    maximum_attempts=5,                        # 0 = unlimited
    non_retryable_error_reasons=["InvalidInput"],
    expiration_interval=timedelta(hours=1),    # stop retrying after this wall-clock time
)
```

| Field | Default | Description |
|---|---|---|
| `initial_interval` | 1 s | Delay before the first retry |
| `backoff_coefficient` | 2.0 | Multiplier applied to delay on each attempt |
| `maximum_interval` | 100x initial | Cap on retry delay |
| `maximum_attempts` | Unlimited | Stop after this many total attempts (0 = unlimited) |
| `non_retryable_error_reasons` | None | Error reason strings that bypass retries entirely |
| `expiration_interval` | None | Stop retrying after this wall-clock duration |

## Applying to an activity

Pass `retry_policy` in the activity options inside a workflow:

```python
from cadence.workflow import execute_activity, RetryPolicy

result = await execute_activity(
    "fetch_order",
    dict,
    order_id,
    start_to_close_timeout=timedelta(minutes=5),
    retry_policy=RetryPolicy(
        maximum_attempts=3,
        non_retryable_error_reasons=["OrderNotFound"],
    ),
)
```

## Applying to a child workflow

```python
from cadence.workflow import execute_child_workflow, RetryPolicy

result = await execute_child_workflow(
    "ProcessOrderWorkflow",
    str,
    order_id,
    task_list="order-workers",
    execution_start_to_close_timeout=timedelta(hours=1),
    retry_policy=RetryPolicy(
        maximum_attempts=2,
    ),
)
```

## Non-retryable errors

Set `non_retryable_error_reasons` to a list of error reason strings. When an activity raises an exception whose string representation matches one of these reasons, the retry stops immediately and the error propagates to the workflow.

```python
retry_policy=RetryPolicy(
    maximum_attempts=10,
    non_retryable_error_reasons=["InvalidInput", "Unauthorized"],
)
```
