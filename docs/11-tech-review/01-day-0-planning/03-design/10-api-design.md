---
layout: default
title: API Design
description: Cadence's API design, including topology, conventions, defaults, additional configuration, API changes, compatibility, and versioning
keywords:
  - cadence api design
  - cadence api
  - cadence api topology
---

Cadence has one public API. It is defined as Protobuf in [cadence-idl](https://github.com/cadence-workflow/cadence-idl). The Frontend serves this API to SDKs, workers, the CLI, and the Web UI. API changes, compatibility, and versioning will follow separately.

## Topology

- Clients call only the Frontend service. The History and Matching APIs are internal. See [Topology](/docs/concepts/topology) and [Architecture requirements](/docs/tech-review/day-0-planning/design/architecture-requirements).
- gRPC is the primary protocol. Thrift over TChannel is available for older SDKs. An optional [HTTP/JSON](/docs/concepts/http-api) inbound serves allow-listed procedures. See [`common/rpc`](https://github.com/cadence-workflow/cadence/tree/master/common/rpc).
- All public RPCs go through the same [Frontend wrappers](https://github.com/cadence-workflow/cadence/tree/master/service/frontend/wrappers). These wrappers do access control, cluster redirection, metrics, rate limiting, and client version checks.

| Service | Scope |
| --- | --- |
| [`WorkflowAPI`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_workflow.proto) | Start, signal, query, cancel, terminate, reset, and describe workflow executions. Get execution history. |
| [`WorkerAPI`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_worker.proto) | Long-poll for decision and activity tasks, report results, and send heartbeats. Used by workers through the Cadence SDKs. |
| [`VisibilityAPI`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_visibility.proto) | List, scan, and count workflow executions, including archived ones. |
| [`DomainAPI`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_domain.proto) | Register, describe, update, fail over, and delete domains. |
| [`ScheduleAPI`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_schedule.proto) | Create, update, pause, unpause, and backfill schedules. |
| [`MetaAPI`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_meta.proto) | Health checks for load balancers. |

Operators use [`AdminAPI`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/admin/v1/service.proto) through the admin CLI. It gives access to cluster, shard, and queue inspection, dynamic configuration, and replication tools. It is not part of the client-facing pipeline above.

Legacy Thrift definitions: [thrift/](https://github.com/cadence-workflow/cadence-idl/tree/master/thrift).

## Conventions

- Each RPC has a dedicated `VerbNounRequest`/`VerbNounResponse` message pair, e.g. [`StartWorkflowExecution`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_workflow.proto#L46).
- Services are split by concern (Workflow, Worker, Visibility, Domain, Schedule, Meta).
- Errors use typed Protobuf messages, not bare gRPC status codes, e.g. [`error.proto`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/error.proto).
- List endpoints paginate with `page_size` and an opaque `next_page_token`, e.g. [`ListWorkflowExecutions`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_visibility.proto#L59-L66).

## Defaults

When a request does not set an optional field, the Frontend fills in a server-side default. List calls that omit `page_size` get the configured maximum (1000 by default). `StartWorkflowExecution` without `WorkflowExecutionStartToCloseTimeout` uses the domain-level default. The server rejects any single event payload larger than 2 MB (and warns at 256 KB). Each domain sets its own history retention period, between 1 and 30 days, at registration time.

## Additional configuration

Operators can change most API limits and behaviors at runtime through [dynamic configuration](/docs/operation-guide/setup). This does not need a server redeploy. Values can be set globally or per domain. Key settings include:

- **Rate limits**: per-instance and global RPS caps for user, worker, visibility, and async request classes (e.g. `frontend.rps`, default 1200).
- **Page sizes**: maximum items per list or history page (`frontend.visibilityMaxPageSize`, `frontend.historyMaxPageSize`).
- **Payload limits**: per-event blob size thresholds for errors and warnings (`limit.blobSize.error`, `limit.blobSize.warn`).
- **ID length limits**: maximum length for workflow IDs, domain names, task list names, and other identifiers.
- **Search attributes**: allowed indexed keys and per-domain size limits for custom search attributes.

See [`service/frontend/config`](https://github.com/cadence-workflow/cadence/blob/master/service/frontend/config/config.go) for all Frontend settings.

## Related documentation

- [Production integrations](/docs/tech-review/day-0-planning/usability/production-integrations)
- [Mutual TLS](/docs/concepts/mutual-tls)
- [Data converter](/docs/concepts/data-converter)
- [Go workers](/docs/go-client/workers), [Java client](/docs/java-client/starting-workflow-executions), [Python client](/docs/python-client/index)
- [CLI](/docs/cli)
