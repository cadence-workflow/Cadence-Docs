---
layout: default
title: Testing
permalink: /docs/java-client/testing
---

[TestActivityEnvironment](https://www.javadoc.io/static/com.uber.cadence/cadence-client/2.7.9-alpha/com/cadence-workflow/cadence/testing/TestActivityEnvironment.html) is the helper class for unit testing activity implementations. Supports calls to Activity methods from the tested activities. An example test:

[See full example here.](https://github.com/cadence-workflow/cadence-java-samples/blob/master/src/test/java/com/uber/cadence/samples/hello/HelloActivityTest.java)

```java

   public interface TestActivity {
     String activity1(String input);
   }

   private static class ActivityImpl implements TestActivity {
     @Override
     public String activity1(String input) {
       return Activity.getTask().getActivityType().getName() + "-" + input;
     }
   }

   @Test
   public void testSuccess() {
     testEnvironment.registerActivitiesImplementations(new ActivityImpl());
     TestActivity activity = testEnvironment.newActivityStub(TestActivity.class);
     String result = activity.activity1("input1");
     assertEquals("TestActivity::activity1-input1", result);
   }

```

## Workflow Test Environment
TestWorkflowEnvironment provides workflow unit testing capabilities.

Testing the workflow code is hard as it might be potentially very long running. The included in-memory implementation of the Cadence service supports an automatic time skipping. Anytime a workflow under the test as well as the unit test code are waiting on a timer (or sleep) the internal service time is automatically advanced to the nearest time that unblocks one of the waiting threads. This way a workflow that runs in production for months is unit tested in milliseconds. Here is an example of a test that executes in a few milliseconds instead of over two hours that are needed for the workflow to complete.

[See full example here. ](https://github.com/cadence-workflow/cadence-java-samples/blob/master/src/test/java/com/uber/cadence/samples/hello/HelloSignalTest.java#L76)

```java
public class SignaledWorkflowImpl implements SignaledWorkflow {
  private String signalInput;

  @Override
  public String workflow1(String input) {
    Workflow.sleep(Duration.ofHours(1));
    Workflow.await(() -> signalInput != null);
    Workflow.sleep(Duration.ofHours(1));
    return signalInput + "-" + input;
  }

  @Override
  public void processSignal(String input) {
    signalInput = input;
 }
}

@Test
public void testSignal() throws ExecutionException, InterruptedException {
    // Get a workflow stub using the same task list the worker uses.
    WorkflowOptions workflowOptions =
        new WorkflowOptions.Builder()
            .setTaskList(HelloSignal.TASK_LIST)
            .setExecutionStartToCloseTimeout(Duration.ofDays(30))
            .build();
    GreetingWorkflow workflow =
        workflowClient.newWorkflowStub(GreetingWorkflow.class, workflowOptions);

    // Start workflow asynchronously to not use another thread to signal.
    WorkflowClient.start(workflow::getGreetings);

    // After start for getGreeting returns, the workflow is guaranteed to be started.
    // So we can send a signal to it using workflow stub immediately.
    // But just to demonstrate the unit testing of a long running workflow adding a long sleep here.
    testEnv.sleep(Duration.ofDays(1));
    // This workflow keeps receiving signals until exit is called
    workflow.waitForName("World");
    workflow.waitForName("Universe");
    workflow.exit();
    // Calling synchronous getGreeting after workflow has started reconnects to the existing
    // workflow and
    // blocks until result is available. Note that this behavior assumes that WorkflowOptions are
    // not configured
    // with WorkflowIdReusePolicy.AllowDuplicate. In that case the call would fail with
    // WorkflowExecutionAlreadyStartedException.
    List<String> greetings = workflow.getGreetings();
    assertEquals(2, greetings.size());
    assertEquals("Hello World!", greetings.get(0));
    assertEquals("Hello Universe!", greetings.get(1));
}
```
