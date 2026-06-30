---
layout: default
title: Workers
description: How to create a Cadence client, define a registry of workflows and activities, and start a worker in Python.
keywords:
  - cadence python worker
  - cadence python client setup
  - cadence python registry
  - cadence python task list
permalink: /docs/python-client/workers
---

# Workers

A worker connects to the Cadence server, polls a task list for workflow and activity tasks, and executes them. Three objects work together: `Client`, `Registry`, and `Worker`.

## Client

`Client` connects to the Cadence frontend over gRPC. It is an async context manager.

```python
from cadence.client import Client

CADENCE_TARGET = "localhost:7833"  # replace with your Cadence frontend address

async with Client(domain="my-domain", target=CADENCE_TARGET) as client:
    # client is ready here
    ...
```

| Option | Description |
|---|---|
| `domain` | Cadence domain (required) |
| `target` | Cadence frontend address, `host:port` (default: `localhost:7833`) |
| `identity` | Identity string shown in workflow history (default: auto-generated) |
| `data_converter` | Custom data converter for serializing workflow arguments |

## Registry

`Registry` holds workflow and activity definitions. Create one per worker process (or share one across multiple workers).

```python
from cadence.worker import Registry

registry = Registry()
```

Register workflows and activities on the registry using decorators:

```python
@registry.workflow()
class MyWorkflow:
    @workflow.run
    async def run(self, name: str) -> str:
        ...

@registry.activity()
async def my_activity(input: str) -> str:
    ...
```

You can also register definitions imperatively:

```python
registry.register_activity(my_activity)
```

## Worker

`Worker` is an async context manager that polls the task list and dispatches tasks.

```python
from cadence.worker import Worker

async with Client(domain="my-domain", target=CADENCE_TARGET) as client:
    async with Worker(client, "my-task-list", registry):
        # Worker is polling; keep alive until interrupted
        await asyncio.Event().wait()
```

`Worker` runs two pollers internally: one for decision (workflow) tasks and one for activity tasks. Both run concurrently.

### Disabling one poller

```python
Worker(client, "my-task-list", registry, disable_activity_worker=True)
Worker(client, "my-task-list", registry, disable_workflow_worker=True)
```

## Full example

```python
import asyncio
from cadence.client import Client
from cadence.worker import Worker, Registry
from cadence import workflow

CADENCE_TARGET = "localhost:7833"  # replace with your Cadence frontend address

registry = Registry()

@registry.workflow()
class GreetingWorkflow:
    @workflow.run
    async def run(self, name: str) -> str:
        return f"Hello, {name}!"

async def main():
    async with Client(domain="my-domain", target=CADENCE_TARGET) as client:
        print("Worker running, press Ctrl-C to stop")
        async with Worker(client, "my-task-list", registry):
            await asyncio.Event().wait()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
```
