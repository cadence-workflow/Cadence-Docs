---
layout: default
title: Continue-as-New
description: How to use continue-as-new to reset workflow history in the Cadence Python SDK.
keywords:
  - cadence python continue as new
  - cadence python workflow history
  - cadence python continue_as_new
permalink: /docs/python-client/continue-as-new
---

# Continue-as-New

Workflow history grows unbounded as the workflow executes. When history becomes too large, use continue-as-new to restart the workflow with a fresh history while preserving its logical state.

`workflow.continue_as_new` never returns -- it raises `ContinueAsNewError` internally, which the worker intercepts to schedule a new execution.

## Basic usage

```python
from cadence import workflow, Registry

registry = Registry()

@registry.workflow()
class ProcessorWorkflow:
    @workflow.run
    async def run(self, processed_count: int) -> None:
        for _ in range(1000):
            await execute_activity("process_item", type(None), ...)
            processed_count += 1

        # History is getting long -- restart with updated state
        workflow.continue_as_new(processed_count)
```

The argument to `continue_as_new` is passed to the next execution's `run` method.

## Overriding workflow parameters

```python
workflow.continue_as_new(
    processed_count,
    workflow_type="ProcessorWorkflowV2",    # switch to a different workflow type
    task_list="new-task-list",              # move to a different task list
    execution_start_to_close_timeout=timedelta(hours=2),
    task_start_to_close_timeout=timedelta(minutes=1),
)
```

All parameters are optional. Omitted parameters inherit from the current execution.

## When to use continue-as-new

- The workflow runs for days or weeks and accumulates many history events.
- The workflow processes an unbounded stream of items (e.g. an event loop).
- The workflow is a long-lived cron-style loop that does not use `CronSchedule`.

Cadence imposes a server-side limit on history size. Workflows that approach the limit are automatically terminated if they do not CAN first. The Python SDK does not enforce a specific event count limit, but a general guideline is to CAN after every few thousand events or whenever you complete a logical "epoch" of processing.

## Do not catch ContinueAsNewError

`workflow.continue_as_new` raises `ContinueAsNewError` internally. Do not catch `ContinueAsNewError` in your workflow code -- doing so prevents the continue-as-new from taking effect.
