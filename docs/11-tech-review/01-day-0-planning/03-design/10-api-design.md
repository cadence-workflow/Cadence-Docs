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

Cadence has one public API. It is defined as Protobuf in [cadence-idl](https://github.com/cadence-workflow/cadence-idl) and served by the Frontend service to SDK clients, workers, the CLI, and the Web UI. This page covers the topology and conventions of that API. Defaults, configuration, API changes, compatibility, and versioning will follow separately.

Related pages: [Architecture requirements](/docs/tech-review/day-0-planning/design/architecture-requirements) for service roles, ports, and worker networking; [Production integrations](/docs/tech-review/day-0-planning/usability/production-integrations) for SDK and protocol support tiers; [Topology](/docs/concepts/topology) for how the services fit together.

## API topology

### One entry point

Clients call only the Frontend. History and Matching have internal RPC interfaces (`uber.cadence.history.v1`, `uber.cadence.matching.v1`) that only other Cadence services reach. Cadence's own Worker service uses the public API like any client. Application workers make outbound long-poll calls only; Cadence never dials into them. See [Worker and client requirements](/docs/tech-review/day-0-planning/design/architecture-requirements#worker-and-client-requirements).

### One definition, shared by every consumer

The API lives in [cadence-idl](https://github.com/cadence-workflow/cadence-idl): public services under `proto/uber/cadence/api/v1`, operator services under `proto/uber/cadence/admin/v1`, legacy Thrift under `thrift/`. Every consumer generates code from it.

- The server generates Go from both Protobuf and Thrift and maps each into one internal type layer, so each handler is written once.
- The Go, Java, and Python SDKs vendor `cadence-idl` as a git submodule.
- Cadence Web pins a `cadence-idl` commit and generates its TypeScript types from the same protos.

### Services

| Service | Covers | Typical callers |
| --- | --- | --- |
| `WorkflowAPI` | Start, signal, query, cancel, terminate, reset, restart, and describe executions; fetch history; describe task lists; diagnostics | Application code via SDKs, CLI, Web UI |
| `WorkerAPI` | Long-poll for decision and activity tasks; report results, failures, heartbeats, and query answers | SDK workers only |
| `VisibilityAPI` | List, scan, and count executions, including archived; discover search attributes | CLI, Web UI, application code |
| `DomainAPI` | Register, describe, update, fail over, deprecate, and delete domains; failover history | Operators via CLI and Web UI |
| `ScheduleAPI` | Create, describe, list, update, pause, unpause, backfill, and delete schedules | Application code, CLI, Web UI |
| `MetaAPI` | Health | Probes and load balancers |
| `AdminAPI` (`uber.cadence.admin.v1`) | Cluster, shard, queue, and dead-letter-queue inspection; dynamic configuration; isolation groups; replication tooling; raw history; forced deletion | Admin CLI. The Web UI calls only `DescribeCluster` |

All seven are registered on the same Frontend dispatcher. `AdminAPI` is operator tooling; SDKs do not call it.

### Transports

gRPC is the primary transport. The same Frontend also serves Thrift over TChannel for older SDK workers, and an optional HTTP/JSON inbound (server 1.2.0 and later) for allow-listed procedures. See [HTTP API](/docs/concepts/http-api). The same handlers serve all three.

- Go and Java SDKs: gRPC or TChannel. See [Go workers](/docs/go-client/workers) and [Java: starting workflow executions](/docs/java-client/starting-workflow-executions).
- [Python SDK](/docs/python-client/index) and Cadence Web: gRPC only.
- [CLI](/docs/cli): both, default TChannel. `--transport grpc` or `CADENCE_CLI_TRANSPORT_PROTOCOL=grpc` switches it.

### One request pipeline

Every public RPC passes through the same Frontend wrappers before its handler, on any transport: access control, cluster redirection for global domains, metrics, rate limiting, and client version checks. Admin RPCs pass through access control too. See [Mutual TLS](/docs/concepts/mutual-tls) for transport security and [Identity and access management](/docs/tech-review/day-0-planning/design/iam) for authorization.

## Conventions

**Naming.** Each RPC takes an `XRequest` and returns an `XResponse`. Package `uber.cadence.api.v1`, `snake_case` fields, `google.protobuf.Timestamp` and `Duration` for time, and every enum's zero value is `*_INVALID`.

**Domain scoping.** Almost every request carries a `domain` name. [Domains](/docs/concepts/topology) are the unit of isolation, so the server resolves the domain first. Exceptions: cluster-level calls (`Health`, `GetClusterInfo`) and admin RPCs, which mostly use `domain_id` UUIDs.

**Identity.** A workflow execution is `{ workflow_id, run_id }`. An empty `run_id` targets the latest run; the [CLI](/docs/cli) exposes the same shortcut. Workers send an `identity` string on poll and respond calls; it appears in history events and poller views. Task lists are names, unique within a domain.

**Opaque payloads.** Inputs, results, signal arguments, and query answers travel as `Payload { bytes data }`. `Memo`, `Header`, and `SearchAttributes` are maps from string to `Payload`. The server stores and forwards the bytes without reading them. Encoding is the SDK's job, and a custom [data converter](/docs/concepts/data-converter) can encrypt or offload payloads client side. Search attribute values are the exception: they are indexed for queries and always JSON. See [Sovereignty](/docs/tech-review/day-0-planning/design/sovereignty).

**Pagination.** List RPCs take `page_size` and an opaque `next_page_token` and return the next token with each page. An empty token marks the last page.

**Long polling.** `PollForDecisionTask` and `PollForActivityTask` block until a task arrives or the poll window expires (one minute by default); the worker then polls again. `GetWorkflowExecutionHistory` offers the same shape through `wait_for_new_event` (20 seconds by default). This is why workers need no inbound ports.

**Idempotency.** Start, SignalWithStart, Signal, and RequestCancel carry a client-supplied `request_id`, so a retry is recognised rather than applied twice. `WorkflowIdReusePolicy` (`ALLOW_DUPLICATE`, `ALLOW_DUPLICATE_FAILED_ONLY`, `REJECT_DUPLICATE`, `TERMINATE_IF_RUNNING`) governs starts on a workflow ID that already has a run. A rejected start returns `WorkflowExecutionAlreadyStartedError` with the existing run ID and its request ID.

**Errors.** Failures are typed. `error.proto` defines thirteen error detail messages, attached to standard gRPC status codes. Thrift callers get the same set as exceptions.

| gRPC status | Cadence error details |
| --- | --- |
| `NOT_FOUND` | `EntityNotExistsError`, `WorkflowExecutionAlreadyCompletedError` |
| `ALREADY_EXISTS` | `WorkflowExecutionAlreadyStartedError`, `DomainAlreadyExistsError`, `CancellationAlreadyRequestedError` |
| `FAILED_PRECONDITION` | `DomainNotActiveError`, `ClientVersionNotSupportedError`, `FeatureNotEnabledError` |
| `RESOURCE_EXHAUSTED` | `ServiceBusyError`, `LimitExceededError` |
| `INVALID_ARGUMENT` | `QueryFailedError`; malformed requests carry a message only |
| `PERMISSION_DENIED` | Access denied; message only |
| `UNAVAILABLE` | `StickyWorkerUnavailableError` |
| `ABORTED` | `ReadOnlyPartitionError`, shard ownership lost |

**Request metadata.** Callers describe themselves in headers, sent as gRPC metadata or TChannel headers under the same names.

| Header | Purpose |
| --- | --- |
| `cadence-client-name`, `cadence-client-library-version`, `cadence-client-feature-version`, `cadence-client-feature-flags` | Identify the SDK and its capabilities, for compatibility checks and feature gating |
| `cadence-caller-type` | `cli`, `ui`, or `sdk`. Operators can exempt caller types from rate limiting |
| `cadence-authorization` | JWT for deployments with authorization enabled |
| `cadence-worker-isolation-group`, `cadence-client-isolation-group` | Isolation-group placement for workers and clients |
| `cadence-workflow-partition-config` | Partition configuration for task routing |
| `cadence-forwarding-cluster` | Set by a Frontend that forwards a request to a global domain's active cluster |

## Related documentation

- **[Topology](/docs/concepts/topology)** (service roles and the gRPC API definitions)
- [Architecture requirements](/docs/tech-review/day-0-planning/design/architecture-requirements)
- [Production integrations](/docs/tech-review/day-0-planning/usability/production-integrations)
- [HTTP API](/docs/concepts/http-api)
- [Data converter](/docs/concepts/data-converter)
- [Mutual TLS](/docs/concepts/mutual-tls)
- [Go client: workers](/docs/go-client/workers)
- [Java client: starting workflow executions](/docs/java-client/starting-workflow-executions)
- [Python client](/docs/python-client/index)
- [cadence-idl](https://github.com/cadence-workflow/cadence-idl)
