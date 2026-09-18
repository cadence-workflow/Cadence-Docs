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
| [`WorkflowAPI`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_workflow.proto) | APIs to interact with workflows, such as starting, signaling, querying, canceling, terminating, resetting, and describing executions, plus fetching their history |
| [`WorkerAPI`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_worker.proto) | APIs used by worker services through the Cadence SDKs to long-poll for decision and activity tasks, report results, and send heartbeats |
| [`VisibilityAPI`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_visibility.proto) | APIs used for workflow visibility, to list, scan, and count executions, including archived ones |
| [`DomainAPI`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_domain.proto) | APIs to interact with domains, such as registering, describing, updating, failing over, and deleting them |
| [`ScheduleAPI`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_schedule.proto) | APIs to interact with schedules, such as creating, updating, pausing, unpausing, and backfilling them |
| [`MetaAPI`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_meta.proto) | Health checks for load balancers |

Operators use [`AdminAPI`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/admin/v1/service.proto) through the admin CLI. It gives access to cluster, shard, and queue inspection, dynamic configuration, and replication tools. It is not part of the client-facing pipeline above.

Legacy Thrift definitions: [thrift/](https://github.com/cadence-workflow/cadence-idl/tree/master/thrift).

## Conventions

- Each RPC has a dedicated `VerbNounRequest`/`VerbNounResponse` message pair, e.g. [`StartWorkflowExecution`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_workflow.proto#L46).
- Services are split by concern (Workflow, Worker, Visibility, Domain, Schedule, Meta).
- Errors return a standard gRPC status code and message, plus a typed Protobuf message in the details field, e.g. [`error.proto`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/error.proto).
- Paginated list endpoints, such as the Visibility, Domain, and Schedule list APIs, take a `page_size` and an opaque `next_page_token`, e.g. [`ListWorkflowExecutions`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_visibility.proto#L59-L66). A few small, bounded listings (e.g. `ListTaskListPartitions`) return their full result set.

## Defaults

When a request does not set an optional field, the Frontend fills in a server-side default. List calls that omit `page_size` get the configured maximum (1000 by default). The server rejects any single event payload larger than 2 MB (and warns at 256 KB). Each domain sets its own history retention period at registration time, bounded by cluster dynamic configuration (`system.minRetentionDays`, default 1 day, and `system.maxRetentionDays`, default 30 days).

## Additional configuration

Operators can change most API limits and behaviors at runtime through [dynamic configuration](/docs/operation-guide/setup#dynamic-configuration). This does not need a server redeploy. Values can be set globally or per domain. Key settings include:

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
