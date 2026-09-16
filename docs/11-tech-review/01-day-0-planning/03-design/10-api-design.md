---
layout: default
title: API Design
description: Cadence's API design, including topology, conventions, defaults, additional configuration, API changes, compatibility, and versioning
keywords:
  - cadence api design
  - cadence api
  - cadence api topology
---

Cadence has one public API. It is defined as Protobuf in [cadence-idl](https://github.com/cadence-workflow/cadence-idl) and served by the Frontend to SDKs, workers, the CLI, and the Web UI. This page covers topology for now. Conventions, defaults, additional configuration, API changes, compatibility, and versioning will follow separately.

## Topology

- Clients call only the Frontend service. History and Matching APIs are internal. See [Topology](/docs/concepts/topology) and [Architecture requirements](/docs/tech-review/day-0-planning/design/architecture-requirements).
- gRPC is primary. Thrift over TChannel remains for older SDKs, and an optional [HTTP/JSON](/docs/concepts/http-api) inbound serves allow-listed procedures. See [`common/rpc`](https://github.com/cadence-workflow/cadence/tree/master/common/rpc).
- Every public RPC passes through the same [Frontend wrappers](https://github.com/cadence-workflow/cadence/tree/master/service/frontend/wrappers): access control, cluster redirection, metrics, rate limiting, and client version checks.

| Service | Scope |
| --- | --- |
| [`WorkflowAPI`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_workflow.proto) | APIs to interact with workflows, such as starting, signaling, querying, canceling, terminating, resetting, and describing executions, plus fetching their history |
| [`WorkerAPI`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_worker.proto) | APIs used by worker services through the Cadence SDKs to long-poll for decision and activity tasks, report results, and send heartbeats |
| [`VisibilityAPI`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_visibility.proto) | APIs used for workflow visibility, to list, scan, and count executions, including archived ones |
| [`DomainAPI`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_domain.proto) | APIs to interact with domains, such as registering, describing, updating, failing over, and deleting them |
| [`ScheduleAPI`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_schedule.proto) | APIs to interact with schedules, such as creating, updating, pausing, unpausing, and backfilling them |
| [`MetaAPI`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/api/v1/service_meta.proto) | Health checks for load balancers |

Operators separately use [`AdminAPI`](https://github.com/cadence-workflow/cadence-idl/blob/master/proto/uber/cadence/admin/v1/service.proto) through the admin CLI, for cluster, shard, and queue inspection, dynamic configuration, and replication tooling. It sits outside the client-facing pipeline above.

Legacy Thrift definitions: [thrift/](https://github.com/cadence-workflow/cadence-idl/tree/master/thrift).

## Related documentation

- [Production integrations](/docs/tech-review/day-0-planning/usability/production-integrations)
- [Mutual TLS](/docs/concepts/mutual-tls)
- [Data converter](/docs/concepts/data-converter)
- [Go workers](/docs/go-client/workers), [Java client](/docs/java-client/starting-workflow-executions), [Python client](/docs/python-client/index)
- [CLI](/docs/cli)
