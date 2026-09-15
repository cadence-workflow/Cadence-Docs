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

Cadence has one public API. It is defined as Protobuf in [cadence-idl](https://github.com/cadence-workflow/cadence-idl) and served by the Frontend to SDKs, workers, the CLI, and the Web UI. This page covers topology and conventions. Defaults, configuration, API changes, compatibility, and versioning will follow.

## Topology

- **Single entry point.** Clients call only the Frontend. History and Matching APIs are internal. Workers make outbound long-poll calls only. See [Architecture requirements](/docs/tech-review/day-0-planning/design/architecture-requirements).
- **One definition.** The server, the Go, Java, and Python SDKs, and Cadence Web all generate code from [cadence-idl](https://github.com/cadence-workflow/cadence-idl).
- **Transports.** gRPC is primary. Thrift over TChannel is kept for older SDKs. An optional [HTTP/JSON](/docs/concepts/http-api) inbound serves allow-listed procedures. The same handlers serve all three.
- **Common pipeline.** Every RPC passes through access control, cluster redirection, metrics, rate limiting, and client version checks. See [Mutual TLS](/docs/concepts/mutual-tls) and [IAM](/docs/tech-review/day-0-planning/design/iam).

| Service | Purpose | Callers |
| --- | --- | --- |
| `WorkflowAPI` | Start, signal, query, cancel, terminate, reset, and describe executions; fetch history | SDKs, CLI, Web UI |
| `WorkerAPI` | Long-poll tasks, report results, heartbeat | SDK workers |
| `VisibilityAPI` | List, scan, and count executions | CLI, Web UI, SDKs |
| `DomainAPI` | Manage domains and failover | Operators |
| `ScheduleAPI` | Manage schedules | SDKs, CLI, Web UI |
| `MetaAPI` | Health | Probes |
| `AdminAPI` | Cluster, shard, queue, dynamic config, and replication tooling | Admin CLI |

## Conventions

- **Naming.** `XRequest` and `XResponse` per RPC. Package `uber.cadence.api.v1`, `snake_case` fields, `google.protobuf` time types, enum zero value `*_INVALID`.
- **Domain scoping.** Almost every request carries `domain`. Exceptions: `Health`, `GetClusterInfo`, and admin RPCs that use `domain_id`.
- **Identity.** An execution is `{ workflow_id, run_id }`. Empty `run_id` means the latest run. Workers send an `identity` string.
- **Opaque payloads.** `Payload { bytes data }`. The server never reads it. Encoding and encryption belong to the SDK [data converter](/docs/concepts/data-converter). Search attributes are the exception: always JSON, indexed.
- **Pagination.** `page_size` plus opaque `next_page_token`. Empty token is the last page.
- **Long polling.** Poll RPCs block until a task arrives or the window expires (one minute default). `GetWorkflowExecutionHistory` supports `wait_for_new_event`.
- **Idempotency.** Start, signal, and cancel RPCs carry a client `request_id`. `WorkflowIdReusePolicy` governs repeated starts.
- **Errors.** Thirteen typed error details in `error.proto`, mapped to gRPC status codes, for example `EntityNotExistsError` to `NOT_FOUND` and `ServiceBusyError` to `RESOURCE_EXHAUSTED`. Thrift gets the same set as exceptions.
- **Headers.** `cadence-client-*` headers identify the SDK for compatibility checks. `cadence-caller-type` marks CLI, UI, or SDK. `cadence-authorization` carries a JWT.

## Related documentation

- **[Topology](/docs/concepts/topology)**
- [Architecture requirements](/docs/tech-review/day-0-planning/design/architecture-requirements)
- [Production integrations](/docs/tech-review/day-0-planning/usability/production-integrations)
- [HTTP API](/docs/concepts/http-api)
- [Data converter](/docs/concepts/data-converter)
- [Mutual TLS](/docs/concepts/mutual-tls)
- [cadence-idl](https://github.com/cadence-workflow/cadence-idl)
