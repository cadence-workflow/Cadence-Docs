---
layout: default
title: Workflow Versioning
description: How to make backward-compatible workflow code changes with get_version in the Cadence Python SDK.
keywords:
  - cadence python workflow versioning
  - cadence python get_version
  - cadence python DEFAULT_VERSION
  - cadence python deterministic deployment
permalink: /docs/python-client/workflow-versioning
---

# Workflow Versioning

Workers replay existing workflow histories against the currently deployed workflow code. A code change that produces a different sequence of decisions can therefore cause a non-deterministic workflow error.

Use `workflow.get_version` to introduce incompatible workflow changes while preserving the path recorded by executions that started on older code.

## Samples

| Sample | Description | Code |
|---|---|---|
| **Versioning integration test** | Records and replays a version marker against a Cadence server | [test_versioning.py](https://github.com/cadence-workflow/cadence-python-client/blob/v0.4.0/tests/integration_tests/workflow/test_versioning.py) |

## Adding a version gate

Suppose a workflow originally called one activity:

```python
result = await workflow.execute_activity(
    "charge_card",
    str,
    order_id,
    start_to_close_timeout=timedelta(minutes=1),
)
```

To replace it with a new activity, deploy a version gate:

```python
from cadence import workflow

version = workflow.get_version(
    "charge-card-api",
    workflow.DEFAULT_VERSION,
    1,
)

if version == workflow.DEFAULT_VERSION:
    result = await workflow.execute_activity(
        "charge_card",
        str,
        order_id,
        start_to_close_timeout=timedelta(minutes=1),
    )
else:
    result = await workflow.execute_activity(
        "charge_card_v2",
        str,
        order_id,
        start_to_close_timeout=timedelta(minutes=1),
    )
```

For a new execution, `get_version` selects and records `max_supported`, which is `1` here. When replaying history created before the gate existed, it returns `workflow.DEFAULT_VERSION` (`-1`).

Use a unique, stable `change_id` for each incompatible change. Repeated calls with the same ID return the version already selected for that workflow execution.

## Raising the maximum version

To introduce another implementation later, increase `max_supported` and retain every path that may still appear in open workflow histories:

```python
version = workflow.get_version(
    "charge-card-api",
    workflow.DEFAULT_VERSION,
    2,
)

if version == workflow.DEFAULT_VERSION:
    result = await charge_with_v1(order_id)
elif version == 1:
    result = await charge_with_v2(order_id)
else:
    result = await charge_with_v3(order_id)
```

New executions select version `2`; older executions continue to use the version recorded in their history.

## Removing old branches

Remove an old branch only after no execution can replay that version. First raise `min_supported` while keeping the `get_version` call:

```python
version = workflow.get_version("charge-card-api", 1, 2)
```

Do not exclude `workflow.DEFAULT_VERSION` while executions whose histories predate the version gate are still open. Replaying an unsupported recorded version is treated as a fatal non-determinism error.

Eventually, after all histories containing the change have aged out or can no longer replay, you can remove the gate and obsolete branches.

## Finding versioned executions

When a new version is selected, the SDK updates the reserved `CadenceChangeVersion` search attribute with a value in the form:

```text
<change-id>-<version>
```

For example, `charge-card-api-2` identifies executions that selected version `2`. Do not write `CadenceChangeVersion` yourself; it is reserved for `get_version`.
