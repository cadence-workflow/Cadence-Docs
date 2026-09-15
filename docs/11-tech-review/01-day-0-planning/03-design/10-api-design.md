---
layout: default
title: API Design
description: Cadence API topology, conventions, defaults, versioning, and compatibility.
keywords:
  - cadence api design
  - cadence api
  - cadence api versioning
  - cadence api compatibility
---

Cadence has one public API. It is defined as Protobuf in [cadence-idl](https://github.com/cadence-workflow/cadence-idl) and served by the Frontend to SDKs, workers, the CLI, and the Web UI. Defaults, configuration, API changes, compatibility, and versioning will follow.

## Topology

- Clients call only the Frontend. History and Matching APIs are internal. See [Topology](/docs/concepts/topology) and [Architecture requirements](/docs/tech-review/day-0-planning/design/architecture-requirements).
- gRPC is primary. Thrift over TChannel remains for older SDKs, and an optional [HTTP/JSON](/docs/concepts/http-api) inbound serves allow-listed procedures. See [`common/rpc`](https://github.com/cadence-workflow/cadence/tree/master/common/rpc).
- Every RPC passes through the same [Frontend wrappers](https://github.com/cadence-workflow/cadence/tree/master/service/frontend/wrappers): access control, cluster redirection, metrics, rate limiting, and client version checks.

| Service | Definition |
| --- | --- |
| `WorkflowAPI` | [service_workflow.proto](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_workflow.proto) |
| `WorkerAPI` | [service_worker.proto](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_worker.proto) |
| `VisibilityAPI` | [service_visibility.proto](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_visibility.proto) |
| `DomainAPI` | [service_domain.proto](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_domain.proto) |
| `ScheduleAPI` | [service_schedule.proto](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_schedule.proto) |
| `MetaAPI` | [service_meta.proto](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_meta.proto) |
| `AdminAPI` | [admin/v1/service.proto](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/admin/v1/service.proto) |

Legacy Thrift definitions: [thrift/](https://github.com/cadence-workflow/cadence-idl/tree/master/thrift).

## Related documentation

- [Production integrations](/docs/tech-review/day-0-planning/usability/production-integrations)
- [Mutual TLS](/docs/concepts/mutual-tls)
- [Go workers](/docs/go-client/workers), [Java client](/docs/java-client/starting-workflow-executions), [Python client](/docs/python-client/index)
- [CLI](/docs/cli)
