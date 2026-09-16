---
layout: default
title: API Design
description: Cadence's API topology and conventions — the public and admin APIs, transports, and request conventions.
keywords:
  - cadence api design
  - cadence api
  - cadence api topology
  - cadence api conventions
---

Cadence has one public API. It is defined as Protobuf in [cadence-idl](https://github.com/cadence-workflow/cadence-idl) and served by the Frontend to SDKs, workers, the CLI, and the Web UI. This page covers topology and conventions; defaults, additional configuration, API changes, compatibility, and versioning will follow separately.

## Topology and conventions

- Clients call only the Frontend. History and Matching APIs are internal. See [Topology](/docs/concepts/topology) and [Architecture requirements](/docs/tech-review/day-0-planning/design/architecture-requirements).
- gRPC is primary. Thrift over TChannel remains for older SDKs, and an optional [HTTP/JSON](/docs/concepts/http-api) inbound serves allow-listed procedures. See [`common/rpc`](https://github.com/cadence-workflow/cadence/tree/master/common/rpc).
- Every public RPC passes through the same [Frontend wrappers](https://github.com/cadence-workflow/cadence/tree/master/service/frontend/wrappers): access control, cluster redirection, metrics, rate limiting, and client version checks.

| Service | Scope |
| --- | --- |
| [`WorkflowAPI`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_workflow.proto) | Start, signal, query, cancel, terminate, reset, and describe executions; fetch history |
| [`WorkerAPI`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_worker.proto) | Long-poll for decision and activity tasks, report results, heartbeat — used by SDK workers only |
| [`VisibilityAPI`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_visibility.proto) | List, scan, and count executions, including archived ones |
| [`DomainAPI`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_domain.proto) | Register, describe, update, fail over, and delete domains |
| [`ScheduleAPI`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_schedule.proto) | Create, update, pause, unpause, and backfill schedules |
| [`MetaAPI`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_meta.proto) | Health checks for load balancers |

Operators separately use [`AdminAPI`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/admin/v1/service.proto) through the admin CLI, for cluster, shard, and queue inspection, dynamic configuration, and replication tooling. It sits outside the client-facing pipeline above — cluster redirection, for example, does not apply to it.

Legacy Thrift definitions: [thrift/](https://github.com/cadence-workflow/cadence-idl/tree/master/thrift).

**Conventions.** Every RPC is named `XRequest`/`XResponse`, and almost every request carries a `domain` name — cluster-level calls like `Health` are the exception. Workflow and activity payloads are opaque `Payload` bytes that the server never interprets; see [Data converter](/docs/concepts/data-converter). List calls page with `page_size` and an opaque `next_page_token`, and workers get work by long-polling (`PollForDecisionTask`, `PollForActivityTask`) rather than being pushed to. A client-supplied `request_id` on start, signal, and cancel calls makes retries idempotent, and typed errors such as `EntityNotExistsError` and `WorkflowExecutionAlreadyStartedError` map to standard gRPC status codes.

## Related documentation

- [Production integrations](/docs/tech-review/day-0-planning/usability/production-integrations)
- [Mutual TLS](/docs/concepts/mutual-tls)
- [Data converter](/docs/concepts/data-converter)
- [Go workers](/docs/go-client/workers), [Java client](/docs/java-client/starting-workflow-executions), [Python client](/docs/python-client/index)
- [CLI](/docs/cli)
