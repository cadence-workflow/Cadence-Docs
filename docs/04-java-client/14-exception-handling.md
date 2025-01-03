---
layout: default
title: Exception Handling
permalink: /docs/java-client/exception-handling
---

# Exception Handling

By default, Exceptions thrown by an activity are received by the workflow wrapped into an `com.uber.cadence.workflow.ActivityFailureException`,

Exceptions thrown by a child workflow are received by a parent workflow wrapped into a `com.uber.cadence.workflow.ChildWorkflowFailureException`

Exceptions thrown by a workflow are received by a workflow client wrapped into `com.uber.cadence.client.WorkflowFailureException`.


 In this [example](https://github.com/cadence-workflow/cadence-java-samples/blob/master/src/main/java/com/uber/cadence/samples/hello/HelloException.java) a Workflow Client executes a workflow which executes a child workflow which
 executes an activity which throws an IOException. The resulting exception stack trace is:

```log
 com.uber.cadence.client.WorkflowFailureException: WorkflowType="GreetingWorkflow::getGreeting", WorkflowID="38b9ce7a-e370-4cd8-a9f3-35e7295f7b3d", RunID="37ceb58c-9271-4fca-b5aa-ba06c5495214
     at com.uber.cadence.internal.dispatcher.UntypedWorkflowStubImpl.getResult(UntypedWorkflowStubImpl.java:139)
     at com.uber.cadence.internal.dispatcher.UntypedWorkflowStubImpl.getResult(UntypedWorkflowStubImpl.java:111)
     at com.uber.cadence.internal.dispatcher.WorkflowExternalInvocationHandler.startWorkflow(WorkflowExternalInvocationHandler.java:187)
     at com.uber.cadence.internal.dispatcher.WorkflowExternalInvocationHandler.invoke(WorkflowExternalInvocationHandler.java:113)
     at com.sun.proxy.$Proxy2.getGreeting(Unknown Source)
     at com.uber.cadence.samples.hello.HelloException.main(HelloException.java:117)
 Caused by: com.uber.cadence.workflow.ChildWorkflowFailureException: WorkflowType="GreetingChild::composeGreeting", ID="37ceb58c-9271-4fca-b5aa-ba06c5495214:1", RunID="47859b47-da4c-4225-876a-462421c98c72, EventID=10
     at java.lang.Thread.getStackTrace(Thread.java:1559)
     at com.uber.cadence.internal.dispatcher.ChildWorkflowInvocationHandler.executeChildWorkflow(ChildWorkflowInvocationHandler.java:114)
     at com.uber.cadence.internal.dispatcher.ChildWorkflowInvocationHandler.invoke(ChildWorkflowInvocationHandler.java:71)
     at com.sun.proxy.$Proxy5.composeGreeting(Unknown Source:0)
     at com.uber.cadence.samples.hello.HelloException$GreetingWorkflowImpl.getGreeting(HelloException.java:70)
     at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method:0)
     at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
     at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
     at java.lang.reflect.Method.invoke(Method.java:498)
     at com.uber.cadence.internal.worker.POJOWorkflowImplementationFactory$POJOWorkflowImplementation.execute(POJOWorkflowImplementationFactory.java:160)
 Caused by: com.uber.cadence.workflow.ActivityFailureException: ActivityType="GreetingActivities::composeGreeting" ActivityID="1", EventID=7
     at java.lang.Thread.getStackTrace(Thread.java:1559)
     at com.uber.cadence.internal.dispatcher.ActivityInvocationHandler.invoke(ActivityInvocationHandler.java:75)
     at com.sun.proxy.$Proxy6.composeGreeting(Unknown Source:0)
     at com.uber.cadence.samples.hello.HelloException$GreetingChildImpl.composeGreeting(HelloException.java:85)
     ... 5 more
 Caused by: java.io.IOException: Hello World!
     at com.uber.cadence.samples.hello.HelloException$GreetingActivitiesImpl.composeGreeting(HelloException.java:93)
     at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method:0)
     at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
     at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
     at java.lang.reflect.Method.invoke(Method.java:498)
     at com.uber.cadence.internal.worker.POJOActivityImplementationFactory$POJOActivityImplementation.execute(POJOActivityImplementationFactory.java:162)
```

 Note that IOException is a checked exception. The standard Java way of adding
 throws IOException to method signature of activity, child and workflow interfaces is not going to help. It is
 because at all levels it is never received directly, but in wrapped form. Propagating it without
 wrapping would not allow adding additional context information like activity, child workflow and
 parent workflow types and IDs. The Cadence library solution is to provide a special wrapper
 method `Workflow.wrap(Exception)` which wraps a checked exception in a special runtime
 exception. It is special because the framework strips it when chaining exceptions across logical
 process boundaries. In this example IOException is directly attached to ActivityFailureException
 besides being wrapped when rethrown.

```java
public class HelloException {

  static final String TASK_LIST = "HelloException";

  public interface GreetingWorkflow {
    @WorkflowMethod
    String getGreeting(String name);
  }

  public interface GreetingChild {
    @WorkflowMethod
    String composeGreeting(String greeting, String name);
  }

  public interface GreetingActivities {
    String composeGreeting(String greeting, String name);
  }

  /** Parent implementation that calls GreetingChild#composeGreeting.**/
  public static class GreetingWorkflowImpl implements GreetingWorkflow {

    @Override
    public String getGreeting(String name) {
      GreetingChild child = Workflow.newChildWorkflowStub(GreetingChild.class);
      return child.composeGreeting("Hello", name);
    }
  }

  /** Child workflow implementation.**/
  public static class GreetingChildImpl implements GreetingChild {
    private final GreetingActivities activities =
        Workflow.newActivityStub(
            GreetingActivities.class,
            new ActivityOptions.Builder()
                .setScheduleToCloseTimeout(Duration.ofSeconds(10))
                .build());

    @Override
    public String composeGreeting(String greeting, String name) {
      return activities.composeGreeting(greeting, name);
    }
  }

  static class GreetingActivitiesImpl implements GreetingActivities {
    @Override
    public String composeGreeting(String greeting, String name) {
      try {
        throw new IOException(greeting + " " + name + "!");
      } catch (IOException e) {
        // Wrapping the exception as checked exceptions in activity and workflow interface methods
        // are prohibited.
        // It will be unwrapped and attached as a cause to the ActivityFailureException.
        throw Workflow.wrap(e);
      }
    }
  }

  public static void main(String[] args) {
     // Get a new client
     // NOTE: to set a different options, you can do like this:
     // ClientOptions.newBuilder().setRpcTimeout(5 * 1000).build();
     WorkflowClient workflowClient =
         WorkflowClient.newInstance(
             new WorkflowServiceTChannel(ClientOptions.defaultInstance()),
             WorkflowClientOptions.newBuilder().setDomain(DOMAIN).build());
     // Get worker to poll the task list.
     WorkerFactory factory = WorkerFactory.newInstance(workflowClient);
     Worker worker = factory.newWorker(TASK_LIST);
     worker.registerWorkflowImplementationTypes(GreetingWorkflowImpl.class, GreetingChildImpl.class);
     worker.registerActivitiesImplementations(new GreetingActivitiesImpl());
     factory.start();

     WorkflowOptions workflowOptions =
         new WorkflowOptions.Builder()
             .setTaskList(TASK_LIST)
             .setExecutionStartToCloseTimeout(Duration.ofSeconds(30))
             .build();
     GreetingWorkflow workflow =
         workflowClient.newWorkflowStub(GreetingWorkflow.class, workflowOptions);
     try {
       workflow.getGreeting("World");
       throw new IllegalStateException("unreachable");
     } catch (WorkflowException e) {
       Throwable cause = Throwables.getRootCause(e);
       // prints "Hello World!"
       System.out.println(cause.getMessage());
       System.out.println("\nStack Trace:\n" + Throwables.getStackTraceAsString(e));
     }
     System.exit(0);
   }

}
```

The code is slightly different if you are using client version prior to 3.0.0:
```java
public static void main(String[] args) {
  Worker.Factory factory = new Worker.Factory(DOMAIN);
  Worker worker = factory.newWorker(TASK_LIST);
  worker.registerWorkflowImplementationTypes(GreetingWorkflowImpl.class, GreetingChildImpl.class);
  worker.registerActivitiesImplementations(new GreetingActivitiesImpl());
  factory.start();

  WorkflowClient workflowClient = WorkflowClient.newInstance(DOMAIN);
  WorkflowOptions workflowOptions =
      new WorkflowOptions.Builder()
          .setTaskList(TASK_LIST)
          .setExecutionStartToCloseTimeout(Duration.ofSeconds(30))
          .build();
  GreetingWorkflow workflow =
      workflowClient.newWorkflowStub(GreetingWorkflow.class, workflowOptions);
  try {
    workflow.getGreeting("World");
    throw new IllegalStateException("unreachable");
  } catch (WorkflowException e) {
    Throwable cause = Throwables.getRootCause(e);
    // prints "Hello World!"
    System.out.println(cause.getMessage());
    System.out.println("\nStack Trace:\n" + Throwables.getStackTraceAsString(e));
  }
  System.exit(0);
}
```
