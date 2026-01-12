---
layout: default
title: Signals
permalink: /docs/java-client/signals
---

:signal:Signals: provide a mechanism to send data directly to a running :workflow:. Previously, you had
two options for passing data to the :workflow: implementation:

* Via start parameters
* As return values from :activity:activities:

With start parameters, we could only pass in values before :workflow_execution: began.

Return values from :activity:activities: allowed us to pass information to a running :workflow:, but this
approach comes with its own complications. One major drawback is reliance on polling. This means
that the data needs to be stored in a third-party location until it's ready to be picked up by
the :activity:. Further, the lifecycle of this :activity: requires management, and the :activity:
requires manual restart if it fails before acquiring the data.

:signal:Signals:, on the other hand, provide a fully asynchronous and durable mechanism for providing data to
a running :workflow:. When a :signal: is received for a running :workflow:, Cadence persists the :event:
and the payload in the :workflow: history. The :workflow: can then process the :signal: at any time
afterwards without the risk of losing the information. The :workflow: also has the option to stop
execution by blocking on a :signal: channel.

## Implement Signal Handler in Workflow

See the below example from [sample](https://github.com/cadence-workflow/cadence-java-samples/blob/master/src/main/java/com/uber/cadence/samples/hello/HelloSignal.java).

```java
public interface HelloWorld {
    @WorkflowMethod
    void sayHello(String name);

    @SignalMethod
    void updateGreeting(String greeting);
}

public static class HelloWorldImpl implements HelloWorld {

    private String greeting = "Hello";

    @Override
    public void sayHello(String name) {
        int count = 0;
        while (!"Bye".equals(greeting)) {
            logger.info(++count + ": " + greeting + " " + name + "!");
            String oldGreeting = greeting;
            Workflow.await(() -> !Objects.equals(greeting, oldGreeting));
        }
        logger.info(++count + ": " + greeting + " " + name + "!");
    }

    @Override
    public void updateGreeting(String greeting) {
        this.greeting = greeting;
    }
}
```
The :workflow: interface now has a new method annotated with @SignalMethod. It is a callback method that is invoked
every time a new :signal: of "HelloWorld::updateGreeting" is delivered to a :workflow:. The :workflow: interface can have only
one @WorkflowMethod which is a _main_ function of the :workflow: and as many :signal: methods as needed.

The updated :workflow: implementation demonstrates a few important Cadence concepts. The first is that :workflow: is stateful and can
have fields of any complex type. Another is that the `Workflow.await` function that blocks until the function it receives as a parameter evaluates to true. The condition is going to be evaluated only on :workflow: state changes, so it is not a busy wait in traditional sense.

## Signal From Command Line
```bash
cadence: docker run --network=host --rm ubercadence/cli:master --do test-domain workflow start  --workflow_id "HelloSignal" --tasklist HelloWorldTaskList --workflow_type HelloWorld::sayHello --execution_timeout 3600 --input \"World\"
Started Workflow Id: HelloSignal, run Id: 6fa204cb-f478-469a-9432-78060b83b6cd
```
Program output:
```bash
16:53:56.120 [workflow-root] INFO  c.u.c.samples.hello.GettingStarted - 1: Hello World!
```
Let's send a :signal: using :CLI::
```bash
cadence: docker run --network=host --rm ubercadence/cli:master --do test-domain workflow signal --workflow_id "HelloSignal" --name "HelloWorld::updateGreeting" --input \"Hi\"
Signal workflow succeeded.
```
Program output:
```bash
16:53:56.120 [workflow-root] INFO  c.u.c.samples.hello.GettingStarted - 1: Hello World!
16:54:57.901 [workflow-root] INFO  c.u.c.samples.hello.GettingStarted - 2: Hi World!
```
Try sending the same :signal: with the same input again. Note that the output doesn't change. This happens because the await condition
doesn't unblock when it sees the same value. But a new greeting unblocks it:
```bash
cadence: docker run --network=host --rm ubercadence/cli:master --do test-domain workflow signal --workflow_id "HelloSignal" --name "HelloWorld::updateGreeting" --input \"Welcome\"
Signal workflow succeeded.
```
Program output:
```bash
16:53:56.120 [workflow-root] INFO  c.u.c.samples.hello.GettingStarted - 1: Hello World!
16:54:57.901 [workflow-root] INFO  c.u.c.samples.hello.GettingStarted - 2: Hi World!
16:56:24.400 [workflow-root] INFO  c.u.c.samples.hello.GettingStarted - 3: Welcome World!
```
Now shut down the :worker: and send the same :signal: again:
```bash
cadence: docker run --network=host --rm ubercadence/cli:master --do test-domain workflow signal --workflow_id "HelloSignal" --name "HelloWorld::updateGreeting" --input \"Welcome\"
Signal workflow succeeded.
```
Note that sending :signal:signals: as well as starting :workflow:workflows: does not need a :worker: running. The requests are queued inside the Cadence service.

Now bring the :worker: back. Note that it doesn't log anything besides the standard startup messages.
This occurs because it ignores the queued :signal: that contains the same input as the current value of greeting.
Note that the restart of the :worker: didn't affect the :workflow_execution:. It is still blocked on the same line of code as before the failure.
This is the most important feature of Cadence. The :workflow: code doesn't need to deal with :worker: failures at all. Its state is fully recovered to its current state that includes all the local variables and threads.

Let's look at the line where the :workflow: is blocked:
```sh-session
$ docker run --network=host --rm ubercadence/cli:master --do test-domain workflow stack --workflow_id "Hello2"
Query result:
"workflow-root: (BLOCKED on await)
com.uber.cadence.internal.sync.SyncDecisionContext.await(SyncDecisionContext.java:546)
com.uber.cadence.internal.sync.WorkflowInternal.await(WorkflowInternal.java:243)
com.uber.cadence.workflow.Workflow.await(Workflow.java:611)
com.uber.cadence.samples.hello.GettingStarted$HelloWorldImpl.sayHello(GettingStarted.java:32)
sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)"
```
Yes, indeed the :workflow: is blocked on await. This feature works for any open :workflow:, greatly simplifying troubleshooting in production.
Let's complete the :workflow: by sending a :signal: with a "Bye" greeting:

```log
16:58:22.962 [workflow-root] INFO  c.u.c.samples.hello.GettingStarted - 4: Bye World!
```
Note that the value of the count variable was not lost during the restart.

Also note that while a single :worker: instance is used for this
walkthrough, any real production deployment has multiple :worker: instances running. So any :worker: failure or restart does not delay any
:workflow_execution: because it is just migrated to any other available :worker:.

## SignalWithStart From Command Line
You may not know if a :workflow: is running and can accept a :signal:.
The signalWithStart feature allows you to send a :signal: to the current :workflow: instance if one exists or to create a new
run and then send the :signal:. `SignalWithStartWorkflow` therefore doesn't take a :run_ID: as a
parameter.

Learn more from the `--help` manual:
```sh-session
$ docker run --network=host --rm ubercadence/cli:master --do test-domain workflow signalwithstart -h
NAME:
   cadence workflow signalwithstart - signal the current open workflow if exists, or attempt to start a new run based on IDResuePolicy and signals it

USAGE:
   cadence workflow signalwithstart [command options] [arguments...]
...
...
...
```

## Signal from user/application code

You may want to signal workflows without running the command line.

The
[WorkflowClient](https://www.javadoc.io/doc/com.uber.cadence/cadence-client/latest/com/cadence-workflow/cadence/client/WorkflowClient.html) API allows you to send signal (or SignalWithStartWorkflow) from outside of the workflow
to send a :signal: to the current :workflow:.

Note that when using `newWorkflowStub` to signal a workflow, you MUST NOT pass WorkflowOptions.

The [WorkflowStub](https://www.javadoc.io/static/com.uber.cadence/cadence-client/2.7.9-alpha/com/cadence-workflow/cadence/client/WorkflowClient.html#newWorkflowStub-java.lang.Class-com.uber.cadence.client.WorkflowOptions-) with WorkflowOptions is only for starting workflows.

The [WorkflowStub](https://www.javadoc.io/static/com.uber.cadence/cadence-client/2.7.9-alpha/com/cadence-workflow/cadence/client/WorkflowClient.html#newWorkflowStub-java.lang.Class-java.lang.String-) without WorkflowOptions is for signal or [query](/docs/java-client/queries)
