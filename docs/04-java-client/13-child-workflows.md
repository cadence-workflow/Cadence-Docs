---
layout: default
title: Child workflows
description: Schedule and manage child workflows from a parent workflow in Java using Cadence, including async execution, signals, parallel children, options, and parent close policy.
keywords:
  - cadence child workflow java
  - ExecuteChildWorkflow java
  - cadence parent child workflow
  - cadence nested workflow java
  - cadence child workflow async
  - cadence java child workflow example
  - newChildWorkflowStub java
  - ParentClosePolicy java
permalink: /docs/java-client/child-workflows
---

Besides activities, a workflow can also orchestrate other workflows. The orchestrating workflow is the *parent* and the workflow it schedules is the *child*. A child has a lifecycle the parent shapes at every stage: the parent starts it, watches it, communicates with it, and decides its fate when the parent itself closes or is canceled.

Child workflows run independently of that relationship in every other respect: each has its own event history, its own timeouts and retry policy, and can run on a different task list and worker pool than the parent. This page follows a child from start to finish.

---

## When to use a child workflow

A child workflow is not always the right tool. Pick the lightest option that fits the work:

| Option | When to use it |
|--------|----------------|
| **Activity** | The work is a single non-deterministic operation, such as an API call, a DB write, or sending an email. Activities are retried independently and have the lowest overhead. |
| **Child Workflow** | You need a reusable, self-contained orchestration with its own event history, timeouts, and retry policy, but whose lifecycle is still tied to the parent. |
| **Standalone Workflow** | The process is fully independent and shouldn't share the parent's lifecycle. Start it as its own top-level execution with a `WorkflowClient` instead. |

---

## Starting a child

`Workflow.newChildWorkflowStub` returns a client-side stub that implements a child workflow interface. It takes a child workflow type and optional `ChildWorkflowOptions`. Options are needed only to override the timeouts and task list defined on the child's `@WorkflowMethod` annotation or inherited from the parent.

The first call on the stub must be to the method annotated with `@WorkflowMethod`. As with activities, the call can be synchronous or asynchronous via `Async#function` or `Async#procedure`. A synchronous call blocks until the child completes; an asynchronous call returns a `Promise`.

```java
public static class GreetingWorkflowImpl implements GreetingWorkflow {

  @Override
  public String getGreeting(String name) {
    // Workflows are stateful, so a new stub must be created for each new child.
    GreetingChild child = Workflow.newChildWorkflowStub(GreetingChild.class);

    // Non-blocking call that returns immediately.
    // Use child.composeGreeting("Hello", name) to call synchronously.
    Promise<String> greeting = Async.function(child::composeGreeting, "Hello", name);
    // Do something else here.
    return greeting.get(); // blocks waiting for the child to complete.
  }
}
```

Starting a child only *schedules* it. The child is not actually created until the parent yields control back to Cadence. This matters when the parent may finish quickly (see [When the parent closes](#when-the-parent-closes)).

---

## Monitoring and communicating

An asynchronous call returns a `Promise`; block on it only when the parent needs the result.

To let a child keep running while the parent returns, block until the child has *started* first. Otherwise the parent may complete before the child is scheduled:

```java
private String demoAsyncChildRun(String name) {
  GreetingChild child = Workflow.newChildWorkflowStub(GreetingChild.class);
  // Non-blocking call that initiates the child workflow.
  Async.function(child::composeGreeting, "Hello", name);
  // Block until the child has started, otherwise it may not start
  // because the parent completes first.
  Promise<WorkflowExecution> childPromise = Workflow.getWorkflowExecution(child);
  childPromise.get();
  return "let child run, parent just return";
}
```

**Run children in parallel** by creating a separate stub per child and starting each asynchronously. The children run concurrently; block on each `Promise` when you need its result.

```java
GreetingChild child1 = Workflow.newChildWorkflowStub(GreetingChild.class);
Promise<String> greeting1 = Async.function(child1::composeGreeting, "Hello", name);

GreetingChild child2 = Workflow.newChildWorkflowStub(GreetingChild.class);
Promise<String> greeting2 = Async.function(child2::composeGreeting, "Bye", name);

return "First: " + greeting1.get() + ", second: " + greeting2.get();
```

**Signal a running child** by calling a method annotated with `@SignalMethod` on the stub after the async call returns.

```java
public interface GreetingChild {
    @WorkflowMethod
    String composeGreeting(String greeting, String name);

    @SignalMethod
    void updateName(String name);
}

// In the parent:
GreetingChild child = Workflow.newChildWorkflowStub(GreetingChild.class);
Promise<String> greeting = Async.function(child::composeGreeting, "Hello", name);
child.updateName("Cadence");
return greeting.get();
```

:::note Queries cannot be issued from workflow code
Calling `@QueryMethod` methods on a child from within workflow code is not supported. Run queries from an activity or external process using a `WorkflowClient` stub instead.
:::

---

## When the parent closes

`ParentClosePolicy` decides what Cadence does to a still-running child when the **parent closes**, whether the parent completes, fails, times out, or is terminated. It is set per child on `ChildWorkflowOptions`.

| Policy | Java enum | Behavior |
|--------|-----------|----------|
| **Terminate** (default) | `ParentClosePolicy.TERMINATE` | The child is terminated immediately when the parent closes. |
| **Request cancel** | `ParentClosePolicy.REQUEST_CANCEL` | A cancellation request is sent to the child, giving it a chance to run cleanup before exiting. |
| **Abandon** | `ParentClosePolicy.ABANDON` | The child keeps running independently after the parent closes. |

Use **abandon** for children that are meant to outlive their parent. For example, a long-running detached process started by a short-lived orchestrator.

```java
import com.uber.cadence.ParentClosePolicy;

ChildWorkflowOptions options = new ChildWorkflowOptions.Builder()
    .setWorkflowId("detached-child")
    .setParentClosePolicy(ParentClosePolicy.ABANDON)
    .build();

GreetingChild child = Workflow.newChildWorkflowStub(GreetingChild.class, options);
Async.function(child::composeGreeting, "Hello", name);

// Block until the child has started before the parent returns.
Workflow.getWorkflowExecution(child).get();
```

:::caution Wait for an abandoned child to start before the parent returns
A child is only scheduled once the parent yields control to Cadence. If the parent completes before the child has started, the child may never run, which defeats the purpose of `ABANDON`. Always block on `Workflow.getWorkflowExecution(child).get()` before returning from the parent, as shown in [Monitoring and communicating](#monitoring-and-communicating).
:::

:::note Default is terminate
If you do not call `setParentClosePolicy`, children are terminated when the parent closes. Set it explicitly whenever a child should survive or shut down gracefully.
:::

---

## Cancelling a child

Closing is not the only way a child ends early. A child runs inside a `CancellationScope`; cancel the scope to request cancellation of every child started within it.

```java
CancellationScope scope = Workflow.newCancellationScope(() -> {
    GreetingChild child = Workflow.newChildWorkflowStub(GreetingChild.class);
    Async.function(child::composeGreeting, "Hello", name);
});
scope.run();

// Request cancellation of everything started inside the scope, including the child.
scope.cancel();
```

---

## Child workflow options

`ChildWorkflowOptions` controls the child's identity, routing, and lifecycle. Most fields are optional and inherit sensible defaults from the parent or the child's annotations.

| Builder method | Required | Purpose |
|----------------|----------|---------|
| `setWorkflowId` | No | Stable ID for the child execution. Generated automatically if omitted. |
| `setDomain` | No | Run the child in a different domain than the parent. |
| `setTaskList` | No | Route the child to a specific worker pool. Inherits the parent's task list if omitted. |
| `setExecutionStartToCloseTimeout` | No | Maximum total runtime for the child execution. |
| `setTaskStartToCloseTimeout` | No | Maximum time for a single decision task. |
| `setWorkflowIdReusePolicy` | No | Whether a completed `WorkflowId` may be reused. |
| `setRetryOptions` | No | Exponential retry policy applied to the child execution. |
| `setParentClosePolicy` | No | What happens to the child when the parent closes. See [When the parent closes](#when-the-parent-closes). |

---

## Samples

Runnable child-workflow samples:

| Sample | Description | Code |
|--------|-------------|------|
| **Child workflow** | Parent starts a child, waits for its result | [HelloChild.java](https://github.com/cadence-workflow/cadence-java-samples/blob/master/src/main/java/com/uber/cadence/samples/hello/HelloChild.java) |
| **Child cancellation** | Parent cancels a running child | [HelloCancelChild.java](https://github.com/cadence-workflow/cadence-java-samples/blob/master/src/main/java/com/uber/cadence/samples/hello/HelloCancelChild.java) |

---

## References

- Java SDK Javadoc: [Child Workflows](https://javadoc.io/doc/com.uber.cadence/cadence-client/latest/com/uber/cadence/workflow/Workflow.html)
- Java SDK Javadoc: [ChildWorkflowOptions](https://javadoc.io/doc/com.uber.cadence/cadence-client/latest/com/uber/cadence/workflow/ChildWorkflowOptions.html)
- [Workflows](/docs/concepts/workflows): workflow semantics, IDs, retries
