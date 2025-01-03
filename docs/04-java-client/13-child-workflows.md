---
layout: default
title: Child workflows
permalink: /docs/java-client/child-workflows
---

# Child workflows

Besides :activity:activities:, a :workflow: can also orchestrate other :workflow:workflows:.

`workflow.ExecuteChildWorkflow` enables the scheduling of other :workflow:workflows: from within a :workflow:workflow:'s
implementation. The parent :workflow: has the ability to monitor and impact the lifecycle of the child
:workflow:, similar to the way it does for an :activity: that it invoked.

```java
public static class GreetingWorkflowImpl implements GreetingWorkflow {

  @Override
  public String getGreeting(String name) {
    // Workflows are stateful. So a new stub must be created for each new child.
    GreetingChild child = Workflow.newChildWorkflowStub(GreetingChild.class);

    // This is a non blocking call that returns immediately.
    // Use child.composeGreeting("Hello", name) to call synchronously.
    Promise<String> greeting = Async.function(child::composeGreeting, "Hello", name);
    // Do something else here.
    return greeting.get(); // blocks waiting for the child to complete.
  }

  // This example shows how parent workflow return right after starting a child workflow,
  // and let the child run itself.
  private String demoAsyncChildRun(String name) {
    GreetingChild child = Workflow.newChildWorkflowStub(GreetingChild.class);
    // non blocking call that initiated child workflow
    Async.function(child::composeGreeting, "Hello", name);
    // instead of using greeting.get() to block till child complete,
    // sometimes we just want to return parent immediately and keep child running
    Promise<WorkflowExecution> childPromise = Workflow.getWorkflowExecution(child);
    childPromise.get(); // block until child started,
    // otherwise child may not start because parent complete first.
    return "let child run, parent just return";
  }
}
```

`Workflow.newChildWorkflowStub` returns a client-side stub that implements a child :workflow: interface.
 It takes a child :workflow: type and optional child :workflow: options as arguments. :workflow:Workflow: options may be needed to override
 the timeouts and :task_list: if they differ from the ones defined in the `@WorkflowMethod` annotation or parent :workflow:.

 The first call to the child :workflow: stub must always be to a method annotated with `@WorkflowMethod`. Similar to :activity:activities:, a call
 can be made synchronous or asynchronous by using `Async#function` or `Async#procedure`. The synchronous call blocks until a child :workflow: completes. The asynchronous call
 returns a `Promise` that can be used to wait for the completion. After an async call returns the stub, it can be used to send :signal:signals: to the child
 by calling methods annotated with `@SignalMethod`. :query:Querying: a child :workflow: by calling methods annotated with `@QueryMethod`
 from within :workflow: code is not supported. However, :query:queries: can be done from :activity:activities:
 using the provided `WorkflowClient` stub.

 Running two children in parallel:
 ```java
 public static class GreetingWorkflowImpl implements GreetingWorkflow {

     @Override
     public String getGreeting(String name) {

         // Workflows are stateful, so a new stub must be created for each new child.
         GreetingChild child1 = Workflow.newChildWorkflowStub(GreetingChild.class);
         Promise<String> greeting1 = Async.function(child1::composeGreeting, "Hello", name);

         // Both children will run concurrently.
         GreetingChild child2 = Workflow.newChildWorkflowStub(GreetingChild.class);
         Promise<String> greeting2 = Async.function(child2::composeGreeting, "Bye", name);

         // Do something else here.
         ...
         return "First: " + greeting1.get() + ", second: " + greeting2.get();
     }
 }
 ```


 To send a :signal: to a child, call a method annotated with `@SignalMethod`:
 ```java
 public interface GreetingChild {
     @WorkflowMethod
     String composeGreeting(String greeting, String name);

     @SignalMethod
     void updateName(String name);
 }

 public static class GreetingWorkflowImpl implements GreetingWorkflow {

     @Override
     public String getGreeting(String name) {
         GreetingChild child = Workflow.newChildWorkflowStub(GreetingChild.class);
         Promise<String> greeting = Async.function(child::composeGreeting, "Hello", name);
         child.updateName("Cadence");
         return greeting.get();
     }
 }
 ```
 Calling methods annotated with `@QueryMethod` is not allowed from within :workflow: code.
