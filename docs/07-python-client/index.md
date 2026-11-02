---
layout: default
title: Introduction
description: Overview of the Cadence Python client SDK, an async Python library for building workflows and activities.
keywords:
  - cadence python client
  - cadence python sdk
  - cadence python workflow
  - cadence python async
permalink: /docs/python-client
---

# Introduction

The Cadence Python client is an async Python SDK for building workflows and activities, connecting to the Cadence server over gRPC.

- [cadence-python-client on GitHub](https://github.com/cadence-workflow/cadence-python-client)
- [Python SDK samples](https://github.com/cadence-workflow/cadence-samples/tree/master/python_sdk_samples)

## Installation

```bash
pip install cadence-python-client
```

Or with `uv`:

```bash
uv add cadence-python-client
```

The SDK supports Python 3.11, 3.12, and 3.13.

## Packages

### `cadence.client`

`Client` connects to the Cadence frontend, starts, signals, queries, and cancels workflows, and manages schedules.

### `cadence.worker`

`Worker` polls the server for workflow and activity tasks. `Registry` holds workflow and activity definitions.

### `cadence.workflow`

Decorators and functions for defining workflow logic: `@workflow.run`, `@workflow.signal`, `@workflow.query`, `execute_activity`, `execute_child_workflow`, `sleep`, `continue_as_new`, and more.

### `cadence.activity`

Decorators for defining activities: `@activity.defn`, `@activity.method`. Context functions cover metadata, heartbeats, cancellation, and access to the client.

### `cadence.testing`

`TestWorkflowEnvironment` runs workflows in-memory, and `TestActivityEnvironment` executes individual activities with simulated metadata, heartbeats, cancellation, and timeouts.

### `cadence.data_converter`

`DataConverter` defines payload serialization. `DefaultDataConverter` handles JSON-compatible Python values, while `cadence.contrib.pydantic.PydanticDataConverter` adds Pydantic v2 model support.

### `cadence.context`

`ContextPropagator` and `ContextVarPropagator` carry request-scoped values from clients into workflows, activities, child workflows, and continue-as-new.

### `cadence.metrics`

`MetricsEmitter` enables custom metrics backends. `PrometheusMetrics` exports built-in client and worker metrics.

### `cadence.contrib`

Optional integrations include [Pydantic](https://github.com/cadence-workflow/cadence-python-client/tree/v0.4.0/cadence/contrib/pydantic), [OpenAI Agents](https://github.com/cadence-workflow/cadence-python-client/tree/v0.4.0/cadence/contrib/openai), and [Google ADK](https://github.com/cadence-workflow/cadence-python-client/tree/v0.4.0/cadence/contrib/google_adk).

## Feature coverage

| Feature | Supported |
|---|---|
| Workers and task lists | Yes |
| Workflow definition and registration | Yes |
| Starting, signaling, querying, cancelling workflows | Yes |
| Activities with retry and heartbeat | Yes |
| Child workflows | Yes |
| Signals (inbound and outbound) | Yes |
| Queries | Yes |
| Retry policies | Yes |
| Continue-as-new | Yes |
| Sleep and wait conditions | Yes |
| Distributed cron | Yes |
| Schedules | Yes |
| Workflow and activity cancellation | Yes |
| In-memory workflow and activity testing | Yes |
| Workflow versioning (`get_version`) | Yes |
| Side effects and mutable side effects | Yes |
| Workflow search-attribute upserts | Yes |
| Context propagation | Yes |
| Prometheus and custom metrics emitters | Yes |
| Custom and Pydantic data converters | Yes |
| Activity async completion | Not yet |
| Sessions | Not yet |
