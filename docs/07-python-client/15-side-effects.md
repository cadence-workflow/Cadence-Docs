---
layout: default
title: Side Effects
description: How to safely use non-deterministic values in Cadence Python workflows with side_effect and mutable_side_effect.
keywords:
  - cadence python side effect
  - cadence python mutable side effect
  - cadence python deterministic workflow
  - cadence python workflow marker
permalink: /docs/python-client/side-effects
---

# Side Effects

Workflow code must be deterministic because Cadence replays it from event history. `workflow.side_effect` and `workflow.mutable_side_effect` let a workflow capture a short, non-deterministic calculation and record its result in history.

Use an [activity](/docs/python-client/activities) instead when the operation performs I/O, can take significant time, needs retries, or changes an external system.

## Samples

| Sample | Description | Code |
|---|---|---|
| **Side-effect tests** | Demonstrates recorded values, replay behavior, updates, and stable mutable IDs | [test_context_side_effect.py](https://github.com/cadence-workflow/cadence-python-client/blob/v0.4.0/tests/cadence/_internal/workflow/test_context_side_effect.py) |

## `side_effect`

`side_effect` runs a synchronous callback once, records its result as a workflow marker, and returns the recorded result during replay without calling the callback again.

```python
import uuid
from cadence import workflow

request_id = workflow.side_effect(
    lambda: str(uuid.uuid4()),
    str,
)
```

The second argument is the result type used by the workflow's [data converter](/docs/python-client/data-converters).

The callback must not mutate workflow state. Only the returned value is recorded, so other callback effects are not reproduced during replay.

## `mutable_side_effect`

Use `mutable_side_effect` for a value that may change during a long-running workflow, such as a dynamic configuration value. The SDK records the first value and records a new marker only when the `updated` callback says the value changed.

```python
limit = workflow.mutable_side_effect(
    "processing-limit",
    read_processing_limit,
    int,
    lambda previous, current: previous != current,
)
```

The arguments are:

| Argument | Description |
|---|---|
| `id` | Stable, non-empty identifier for this value within the workflow execution. |
| `fn` | Synchronous callback that obtains the current value. |
| `result_type` | Type used to deserialize recorded values. |
| `updated` | Callback that receives `(previous, current)` and returns `True` when the current value should be recorded. |

During replay, neither `fn` nor `updated` runs. The SDK returns the value stored in workflow history.

## Determinism rules

- Call side effects in the same logical order on every replay.
- Do not conditionally add or remove a side-effect call without using [workflow versioning](/docs/python-client/workflow-versioning).
- Keep callbacks fast and free of external mutations.
- Do not catch a callback failure and substitute a different non-deterministic path.
- Keep the `mutable_side_effect` ID stable for the life of the workflow execution.
