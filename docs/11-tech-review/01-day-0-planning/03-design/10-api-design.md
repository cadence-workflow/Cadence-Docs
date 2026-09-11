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

Cadence exposes a single public API. It is defined once, as Protobuf in the [cadence-idl](https://github.com/cadence-workflow/cadence-idl) repository, and served by the Frontend service to every kind of caller: SDK clients and workers, the CLI, and the Web UI. This page describes the topology of that API and the conventions it follows. Defaults, additional configuration, API changes, compatibility, and versioning will be added to this page separately.

Related pages: [Architecture requirements](/docs/tech-review/day-0-planning/design/architecture-requirements) for service roles, default ports, and worker networking; [Production integrations](/docs/tech-review/day-0-planning/usability/production-integrations) for SDK and protocol support tiers; [Topology](/docs/concepts/topology) for how the services fit together.

## API topology

### One entry point

Frontend is the only service that clients call. History and Matching have RPC interfaces of their own (`uber.cadence.history.v1` and `uber.cadence.matching.v1`), but those are internal: they are reachable only from other Cadence services and are not part of the public contract. Cadence's own Worker service uses the public API like any other client. Application workers make outbound long-poll calls only; Cadence never dials back into them. See [Worker and client requirements](/docs/tech-review/day-0-planning/design/architecture-requirements#worker-and-client-requirements).

### One definition, shared by every consumer

The API lives in [cadence-idl](https://github.com/cadence-workflow/cadence-idl): public services under `proto/uber/cadence/api/v1`, operator services under `proto/uber/cadence/admin/v1`, and the older Thrift definitions under `thrift/`. Every consumer generates code from that one repository.

- The server generates Go from both the Protobuf and Thrift definitions and maps each into a single transport-independent internal type layer, so every handler is written once regardless of how a request arrived.
- The Go, Java, and Python SDKs vendor `cadence-idl` as a git submodule and generate their clients from it.
- Cadence Web pins a specific `cadence-idl` commit and generates its TypeScript types from the same `.proto` files, so the UI and the server always agree on message shapes.

### Services

| Service | Covers | Typical callers |
| --- | --- | --- |
| `WorkflowAPI` | Start, signal, query, cancel, terminate, reset, restart, and describe executions; fetch history; describe task lists; run diagnostics | Application code through the SDKs, CLI, Web UI |
| `WorkerAPI` | Long-poll for decision and activity tasks, report results and failures, heartbeat, answer queries | SDK workers only |
| `VisibilityAPI` | List, scan, and count executions, including archived ones; discover search attributes | CLI, Web UI, application code |
| `DomainAPI` | Register, describe, update, fail over, deprecate, and delete domains; list failover history | Operators through the CLI and Web UI |
| `ScheduleAPI` | Create, describe, list, update, pause, unpause, backfill, and delete schedules | Application code, CLI, Web UI |
| `MetaAPI` | Health | Probes and load balancers |
| `AdminAPI` (`uber.cadence.admin.v1`) | Cluster, shard, queue, and dead-letter-queue inspection; dynamic configuration; isolation groups; replication tooling; raw history; forced deletion | Operators through the admin CLI. The Web UI calls only `DescribeCluster` |

All seven services are registered on the same Frontend dispatcher. The first six form the application-facing API; `AdminAPI` is operator tooling and is not something SDKs call.

### Transports

gRPC is the primary transport. Thrift over TChannel is served by the same Frontend and retained for older SDK workers. An optional HTTP/JSON inbound exists from server 1.2.0 onwards, enabled per procedure through an explicit allow-list, for callers without a gRPC stack. See [HTTP API](/docs/concepts/http-api). The transport does not change the API: the same handlers serve all three.

- The Go and Java SDKs connect over gRPC or TChannel. See [Go workers](/docs/go-client/workers) and [Java: starting workflow executions](/docs/java-client/starting-workflow-executions).
- The [Python SDK](/docs/python-client/index) and Cadence Web are gRPC only.
- The [CLI](/docs/cli) supports both and defaults to TChannel; `--transport grpc` or `CADENCE_CLI_TRANSPORT_PROTOCOL=grpc` switches it.

### One request pipeline

Every public RPC passes through the same chain of Frontend wrappers before it reaches its handler, whichever transport carried it: access control, cluster redirection for global domains, metrics, rate limiting, and client version checks. Admin RPCs pass through access control on the same terms. Transport security is covered on [Mutual TLS](/docs/concepts/mutual-tls) and authorization on [Identity and access management](/docs/tech-review/day-0-planning/design/iam).

## Conventions

**Naming.** Each RPC takes an `XRequest` and returns an `XResponse`. Messages live in package `uber.cadence.api.v1`, fields are `snake_case`, times and durations use `google.protobuf.Timestamp` and `google.protobuf.Duration`, and every enum reserves its zero value as `*_INVALID` so an unset field is never mistaken for a real value.

**Domain scoping.** Almost every request carries a `domain` field holding the domain name. [Domains](/docs/concepts/topology) are the unit of isolation, so the server resolves the domain before anything else. The exceptions are cluster-level calls (`Health`, `GetClusterInfo`) and admin RPCs, which mostly address domains by `domain_id` UUID rather than by name.

**Identity.** A workflow execution is `{ workflow_id, run_id }`. Where a request accepts an execution and `run_id` is left empty, the server targets the latest run of that workflow ID; the [CLI](/docs/cli) exposes the same shortcut. Workers identify themselves with an `identity` string on poll and respond calls, which is what appears in history events and in task list poller views. Task lists are plain names, unique within a domain.

**Opaque payloads.** Workflow and activity inputs and results, signal arguments, and query answers travel as `Payload { bytes data }`. `Memo`, `Header`, and `SearchAttributes` are maps from string to `Payload`. The server stores and forwards these bytes without interpreting them; encoding is the SDK's job, and a custom [data converter](/docs/concepts/data-converter) can encrypt or offload payloads before they leave the client. Search attribute values are the exception: they are indexed for visibility queries and are always JSON. See [Sovereignty](/docs/tech-review/day-0-planning/design/sovereignty) for what that means for data handling.

**Pagination.** List RPCs take `page_size` and an opaque `bytes next_page_token`, and return the next token with each page. An empty token marks the last page. Tokens are server-generated and must be passed back unchanged.

**Long polling.** Workers receive work by long polling. `PollForDecisionTask` and `PollForActivityTask` block until a task is available or the server's poll window expires (one minute by default), and the worker polls again immediately. `GetWorkflowExecutionHistory` offers the same shape to observers through `wait_for_new_event`, which holds the call until new history arrives or a shorter window expires (20 seconds by default). This is why workers need no inbound ports.

**Idempotency.** `StartWorkflowExecution`, `SignalWithStartWorkflowExecution`, `SignalWorkflowExecution`, and `RequestCancelWorkflowExecution` carry a client-supplied `request_id`, so a retried request is recognised rather than applied twice. Starting a workflow ID that already has a run is governed by `WorkflowIdReusePolicy` (`ALLOW_DUPLICATE`, `ALLOW_DUPLICATE_FAILED_ONLY`, `REJECT_DUPLICATE`, `TERMINATE_IF_RUNNING`). A rejected start returns `WorkflowExecutionAlreadyStartedError` carrying the existing run's ID and the request ID that started it.

**Errors.** Failures are typed. `error.proto` defines thirteen error detail messages, and the server attaches them to standard gRPC status codes. Thrift callers receive the same set as Thrift exceptions.

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

**Request metadata.** Callers describe themselves in request headers, carried as gRPC metadata or TChannel headers under the same names.

| Header | Purpose |
| --- | --- |
| `cadence-client-name`, `cadence-client-library-version`, `cadence-client-feature-version`, `cadence-client-feature-flags` | Identify the SDK and what it supports. The Frontend uses them for compatibility checks and feature gating. |
| `cadence-caller-type` | Classifies the caller as `cli`, `ui`, or `sdk`. Operators can exempt caller types from rate limiting. |
| `cadence-authorization` | Bearer credential (JWT) for deployments with authorization enabled. |
| `cadence-worker-isolation-group`, `cadence-client-isolation-group` | Isolation-group placement for workers and for the clients that start work. |
| `cadence-workflow-partition-config` | Partition configuration used to route a workflow's tasks. |
| `cadence-forwarding-cluster` | Set by a Frontend that forwards a request to the active cluster of a global domain. |

## Related documentation

- **[Topology](/docs/concepts/topology)** (service roles and the link to the gRPC API definitions)
- [Architecture requirements](/docs/tech-review/day-0-planning/design/architecture-requirements)
- [Production integrations](/docs/tech-review/day-0-planning/usability/production-integrations)
- [HTTP API](/docs/concepts/http-api)
- [Data converter](/docs/concepts/data-converter)
- [Mutual TLS](/docs/concepts/mutual-tls)
- [Go client: workers](/docs/go-client/workers)
- [Java client: starting workflow executions](/docs/java-client/starting-workflow-executions)
- [Python client](/docs/python-client/index)
- [cadence-idl](https://github.com/cadence-workflow/cadence-idl)
