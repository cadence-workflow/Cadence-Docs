---
layout: default
title: Workflow Engine and Workflow Orchestration
description: Cadence is an open-source, fault-tolerant workflow engine for orchestrating long-running distributed applications. Learn how it compares to queues, databases, and other orchestration platforms.
keywords:
  - workflow engine
  - workflow orchestration
  - distributed workflow engine
  - workflow orchestration platform
  - open source orchestration
  - cadence workflow
  - fault tolerant workflow
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Cadence is a fault-tolerant, stateful workflow engine for orchestrating long-running distributed applications. It replaces the patchwork of databases, queues, cron jobs, and microservice glue code that most teams use today to coordinate multi-step business processes — replacing it with plain code.

A workflow in Cadence is a durable function. It can run for seconds or years, survive server restarts, retry failed downstream calls automatically, and receive external events — all without the developer managing any of that infrastructure. Cadence handles durability, retries, timeouts, and state recovery transparently, so the business logic stays in one place.

---

## What a workflow engine does

A workflow engine moves a process through a defined sequence of steps while guaranteeing that every step eventually completes, failures are retried, and the current state is always recoverable. Without a dedicated engine, teams typically stitch this together from several systems.

| Capability | Ad hoc queue + DB approach | Cadence workflow engine |
|---|---|---|
| Durable state across steps | Rows in a database, updated by each worker | Implicit — Cadence replays event history automatically |
| Retry on failure | Custom retry logic per task, often inconsistent | Built-in exponential retry with configurable policy per activity |
| Long-running timers | External timer service or cron + DB polling | `workflow.Sleep()` — sleeps for minutes or years, no polling |
| Event-driven branching | Pull from queue, check DB state, route | `workflow.GetSignalChannel()` — receive signals directly in workflow code |
| Visibility into running processes | Query multiple tables and join | Query workflow state directly via the Cadence UI or API |
| Compensation (saga rollback) | Hand-rolled, easy to get wrong | Activities are cancellable; saga pattern is a few lines of Go or Java |
| Scalability | Each component scales independently; coordination is the bottleneck | Horizontal workers; Cadence cluster handles millions of open workflows |

---

## How Cadence differs from queue + database patterns

The standard alternative to a workflow engine is to center coordination around a database and a message queue. A worker polls a queue, executes an action, updates a row, and pushes downstream messages. This works for simple flows, but it fractures state across tables, makes the execution history invisible, and turns every failure scenario into a bespoke retry loop.

Cadence takes a different approach. The entire process — its state, timer, retries, and event handling — lives in a single durable function called a workflow. The Cadence server persists a log of every event the workflow produces. When a worker dies and restarts, the server replays that log to reconstruct the exact in-memory state of the workflow. The developer never writes checkpoint or recovery code.

The subscription management example below illustrates the difference. The full business logic — charge a customer monthly, handle cancellation, send emails — fits in a single function. If the billing service goes down for two days, the workflow simply waits. When the service recovers, execution resumes exactly where it stopped.

<Tabs groupId="lang">
<TabItem value="go" label="Go">

```go
func SubscriptionWorkflow(ctx workflow.Context, customerID string) error {
    ao := workflow.ActivityOptions{
        ScheduleToCloseTimeout: 3 * 24 * time.Hour,
        RetryPolicy: &cadence.RetryPolicy{
            InitialInterval:    time.Second,
            BackoffCoefficient: 2,
            MaximumInterval:    time.Hour,
        },
    }
    ctx = workflow.WithActivityOptions(ctx, ao)

    if err := workflow.ExecuteActivity(ctx, SendWelcomeEmail, customerID).Get(ctx, nil); err != nil {
        return err
    }

    cancelCh := workflow.GetSignalChannel(ctx, "cancel")

    for i := 0; i < MaxBillingPeriods; i++ {
        selector := workflow.NewSelector(ctx)
        var cancelled bool

        selector.AddReceive(cancelCh, func(c workflow.Channel, ok bool) {
            cancelled = true
        })
        selector.AddFuture(workflow.NewTimer(ctx, BillingPeriod), func(f workflow.Future) {})
        selector.Select(ctx)

        if cancelled {
            return workflow.ExecuteActivity(ctx, SendCancellationEmail, customerID).Get(ctx, nil)
        }
        if err := workflow.ExecuteActivity(ctx, ChargeCustomer, customerID, i).Get(ctx, nil); err != nil {
            return err
        }
    }
    return workflow.ExecuteActivity(ctx, SendSubscriptionOverEmail, customerID).Get(ctx, nil)
}
```

</TabItem>
<TabItem value="java" label="Java">

```java
public class SubscriptionWorkflowImpl implements SubscriptionWorkflow {

    private boolean cancelled = false;
    private final SubscriptionActivities activities =
        Workflow.newActivityStub(SubscriptionActivities.class,
            new ActivityOptions.Builder()
                .setScheduleToCloseTimeout(Duration.ofDays(3))
                .setRetryOptions(new RetryOptions.Builder()
                    .setInitialInterval(Duration.ofSeconds(1))
                    .setBackoffCoefficient(2)
                    .setMaximumInterval(Duration.ofHours(1))
                    .build())
                .build());

    @Override
    public void manageSubscription(String customerId) {
        activities.sendWelcomeEmail(customerId);

        for (int i = 0; i < MAX_BILLING_PERIODS; i++) {
            Workflow.await(BILLING_PERIOD, () -> cancelled);

            if (cancelled) {
                activities.sendCancellationEmail(customerId);
                return;
            }
            activities.chargeCustomer(customerId, i);
        }
        activities.sendSubscriptionOverEmail(customerId);
    }

    @Override
    public void cancelSubscription() {
        cancelled = true;
    }
}
```

</TabItem>
</Tabs>

This is the complete orchestration logic. There is no scheduler, no polling loop, no state machine table, and no hand-rolled retry code.

---

## Core concepts

Cadence is built on four primitives that compose cleanly with each other.

| Concept | What it is | Docs |
|---|---|---|
| **Workflow** | A durable, stateful function that defines the process. Survives restarts; code must be deterministic. | [Workflows](/docs/concepts/workflows) |
| **Activity** | A unit of non-deterministic work (API call, DB write, email send). Retried independently of the workflow. | [Activities](/docs/concepts/activities) |
| **Task List** | A named queue that routes work to the right pool of workers. | [Task Lists](/docs/concepts/task-lists) |
| **Worker** | A process that polls a task list, executes workflows and activities, and reports results back to the Cadence server. | [Deployment Topology](/docs/concepts/topology) |

The Cadence server itself is stateless. All durable state is stored in the configured persistence layer (Cassandra, MySQL, or Postgres).

:::caution Workflows must be deterministic
Workflow code is replayed from its event history every time a worker picks it up. Any non-deterministic call — random numbers, `time.Now()`, direct HTTP requests, file reads — will produce a different result on replay and corrupt the workflow state. Put all side effects in activities. Use `workflow.Now()` and `workflow.Sleep()` instead of the standard library equivalents.
:::

---

## Starting a workflow

Starting a workflow requires a client pointed at the Cadence frontend service. The call is non-blocking: the client enqueues the workflow and returns a run ID immediately. The worker picks it up asynchronously.

<Tabs groupId="lang">
<TabItem value="go" label="Go">

```go
import "go.uber.org/cadence/client"

c, err := client.NewClient(cadenceServiceClient, domain, &client.Options{})
if err != nil {
    log.Fatal(err)
}

we, err := c.StartWorkflow(ctx, client.StartWorkflowOptions{
    ID:                           "subscription-" + customerID,
    TaskList:                     "subscription-task-list",
    ExecutionStartToCloseTimeout: 365 * 24 * time.Hour,
}, SubscriptionWorkflow, customerID)
if err != nil {
    log.Fatal(err)
}
log.Printf("started workflow: id=%s run_id=%s", we.ID, we.RunID)
```

</TabItem>
<TabItem value="java" label="Java">

```java
WorkflowClient client = WorkflowClient.newInstance(
    new Thrift2ProtoAdapter(IGrpcServiceStubs.newInstance()),
    WorkflowClientOptions.newBuilder().setDomain(DOMAIN).build()
);

WorkflowOptions options = new WorkflowOptions.Builder()
    .setWorkflowId("subscription-" + customerId)
    .setTaskList("subscription-task-list")
    .setExecutionStartToCloseTimeout(Duration.ofDays(365))
    .build();

SubscriptionWorkflow workflow = client.newWorkflowStub(
    SubscriptionWorkflow.class, options
);

// Non-blocking start — returns immediately.
WorkflowClient.start(workflow::manageSubscription, customerId);
```

</TabItem>
</Tabs>

---

## Production topology

A Cadence cluster has four services: **Frontend** (API gateway), **History** (per-workflow state machine), **Matching** (task list routing), and **Worker** (your application code). The first three are operated by the platform team; you only run the Worker.

For deployment options — SQLite for local dev, Docker Compose, Kubernetes Helm chart, or managed cluster — see the [Server Installation guide](/docs/get-started/server-installation).

:::note Cadence has no hard limit on open workflow instances
The Cadence server is designed for millions of concurrently open workflows. Scalability is a function of your persistence tier and worker count, not the engine itself.
:::

---

## Use case patterns

Cadence is a general-purpose workflow engine that fits a wide range of distributed application patterns:

- **Service orchestration** — chain microservice calls with automatic retries and saga rollback. [Orchestration →](/docs/use-cases/orchestration)
- **Periodic execution** — replace cron + DB with a durable timer inside a workflow. [Periodic execution →](/docs/use-cases/periodic-execution)
- **Event-driven applications** — receive signals from external systems and branch on them inside the workflow. [Event-driven →](/docs/use-cases/event-driven)
- **Long-running business processes** — subscriptions, multi-day approvals, infrastructure provisioning. [Operational management →](/docs/use-cases/operational-management)

---

## References

- [Workflows](/docs/concepts/workflows) — full reference for workflow semantics, IDs, retries, child workflows
- [Activities](/docs/concepts/activities) — timeouts, retry policies, heartbeating
- [Deployment Topology](/docs/concepts/topology) — how Frontend, Matching, History, and Workers interact
- [Get Started](/docs/get-started) — server installation and HelloWorld samples in Go and Java
- [Open Source Workflow Engine](/docs/concepts/open-source-workflow-engine) — self-hosting, deployment options, community
- Go SDK: [go.uber.org/cadence](https://pkg.go.dev/go.uber.org/cadence)
- Java SDK: [com.uber.cadence](https://javadoc.io/doc/com.uber.cadence/cadence-client)
