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

# Python Client

The Cadence Python client is an async Python SDK for building workflows and activities, connecting to the Cadence server over gRPC.

- [cadence-python-client on GitHub](https://github.com/cadence-workflow/cadence-python-client)
- [Python SDK samples](https://github.com/cadence-workflow/cadence-samples/tree/master/python_sdk_samples)

## Installation

```bash
pip install cadence-client
```

## Packages

### `cadence.client`

`Client` connects to the Cadence frontend, starts and signals workflows, and manages schedules.

### `cadence.worker`

`Worker` polls the server for workflow and activity tasks. `Registry` holds workflow and activity definitions.

### `cadence.workflow`

Decorators and functions for defining workflow logic: `@workflow.run`, `@workflow.signal`, `@workflow.query`, `execute_activity`, `execute_child_workflow`, `sleep`, `continue_as_new`, and more.

### `cadence.activity`

Decorators for defining activities: `@activity.defn`, `@activity.method`. Context functions: `activity.heartbeat()`, `activity.info()`.

### `cadence.testing`

`TestWorkflowEnvironment` runs workflows in-memory for unit tests without a Cadence server.

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
| In-memory workflow testing | Yes |
| Workflow versioning (get_version) | Not yet |
| Side effects | Not yet |
| Activity async completion | Not yet |
| Sessions | Not yet |
