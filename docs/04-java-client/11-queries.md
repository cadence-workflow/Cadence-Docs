---
layout: default
title: Queries
permalink: /docs/java-client/queries
---

# Queries

Query is to expose this internal state to the external world Cadence provides a synchronous :query: feature. From the :workflow: implementer point of view the :query: is exposed as a synchronous callback that is invoked by external entities. Multiple such callbacks can be provided per :workflow: type exposing different information to different external systems.

:query:Query: callbacks must be read-only not mutating the :workflow: state in any way. The other limitation is that the :query: callback cannot contain any blocking code. Both above limitations rule out ability to invoke :activity:activities: from the :query: handlers.

## Built-in Query: Stack Trace

If a :workflow_execution: has been stuck at a state for longer than an expected period of time, you
might want to :query: the current call stack. You can use the Cadence :CLI: to perform this :query:. For
example:

`cadence-cli --domain samples-domain workflow query -w my_workflow_id -r my_run_id -qt __stack_trace`

This command uses `__stack_trace`, which is a built-in :query: type supported by the Cadence client
library. You can add custom :query: types to handle :query:queries: such as :query:querying: the current state of a
:workflow:, or :query:querying: how many :activity:activities: the :workflow: has completed.

## Customized Query

Cadence provides a :query: feature that supports synchronously returning any information from a :workflow: to an external caller.

Interface [__QueryMethod__](https://www.javadoc.io/doc/com.uber.cadence/cadence-client/latest/com/cadence-workflow/cadence/workflow/QueryMethod.html) indicates that the method is a query method. Query method can be used to query a workflow state by external process at any time during its execution. This annotation applies only to workflow interface methods.


See the [:workflow:](https://github.com/cadence-workflow/cadence-java-samples/blob/master/src/main/java/com/uber/cadence/samples/hello/HelloQuery.java) example code :

```java
public interface HelloWorld {
    @WorkflowMethod
    void sayHello(String name);

    @SignalMethod
    void updateGreeting(String greeting);

    @QueryMethod
    int getCount();
}

public static class HelloWorldImpl implements HelloWorld {

    private String greeting = "Hello";
    private int count = 0;

    @Override
    public void sayHello(String name) {
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

    @Override
    public int getCount() {
        return count;
    }
}
```
The new `getCount` method annotated with `@QueryMethod` was added to the :workflow: interface definition. It is allowed
to have multiple :query: methods per :workflow: interface.

The main restriction on the implementation of the :query: method is that it is not allowed to modify :workflow: state in any form.
It also is not allowed to block its thread in any way. It usually just returns a value derived from the fields of the :workflow: object.

## Run Query from Command Line
Let's run the updated :worker: and send a couple :signal:signals: to it:
```bash
cadence: docker run --network=host --rm ubercadence/cli:master --do test-domain workflow start  --workflow_id "HelloQuery" --tasklist HelloWorldTaskList --workflow_type HelloWorld::sayHello --execution_timeout 3600 --input \"World\"
Started Workflow Id: HelloQuery, run Id: 1925f668-45b5-4405-8cba-74f7c68c3135
cadence: docker run --network=host --rm ubercadence/cli:master --do test-domain workflow signal --workflow_id "HelloQuery" --name "HelloWorld::updateGreeting" --input \"Hi\"
Signal workflow succeeded.
cadence: docker run --network=host --rm ubercadence/cli:master --do test-domain workflow signal --workflow_id "HelloQuery" --name "HelloWorld::updateGreeting" --input \"Welcome\"
Signal workflow succeeded.
```
The :worker: output:
```bash
17:35:50.485 [workflow-root] INFO  c.u.c.samples.hello.GettingStarted - 1: Hello World!
17:36:10.483 [workflow-root] INFO  c.u.c.samples.hello.GettingStarted - 2: Hi World!
17:36:16.204 [workflow-root] INFO  c.u.c.samples.hello.GettingStarted - 3: Welcome World!
```
Now let's :query: the :workflow: using the :CLI::
```bash
cadence: docker run --network=host --rm ubercadence/cli:master --do test-domain workflow query --workflow_id "HelloQuery" --query_type "HelloWorld::getCount"
:query:Query: result as JSON:
3
```
One limitation of the :query: is that it requires a :worker: process running because it is executing callback code.
An interesting feature of the :query: is that it works for completed :workflow:workflows: as well. Let's complete the :workflow: by sending "Bye" and :query: it.
```bash
cadence: docker run --network=host --rm ubercadence/cli:master --do test-domain workflow signal --workflow_id "HelloQuery" --name "HelloWorld::updateGreeting" --input \"Bye\"
Signal workflow succeeded.
cadence: docker run --network=host --rm ubercadence/cli:master --do test-domain workflow query --workflow_id "HelloQuery" --query_type "HelloWorld::getCount"
:query:Query: result as JSON:
4
```
The :query:Query: method can accept parameters. This might be useful if only part of the :workflow: state should be returned.

## Run Query from external application code
The [WorkflowStub](https://www.javadoc.io/static/com.uber.cadence/cadence-client/2.7.9-alpha/com/cadence-workflow/cadence/client/WorkflowClient.html#newWorkflowStub-java.lang.Class-java.lang.String-) without WorkflowOptions is for signal or [query](/docs/java-client/queries)


## Consistent Query

:query:Query: has two consistency levels, eventual and strong. Consider if you were to :signal: a :workflow: and then
immediately :query: the :workflow::

`cadence-cli --domain samples-domain workflow signal -w my_workflow_id -r my_run_id -n signal_name -if ./input.json`

`cadence-cli --domain samples-domain workflow query -w my_workflow_id -r my_run_id -qt current_state`

In this example if :signal: were to change :workflow: state, :query: may or may not see that state update reflected
in the :query: result. This is what it means for :query: to be eventually consistent.

:query:Query: has another consistency level called strong consistency. A strongly consistent :query: is guaranteed
to be based on :workflow: state which includes all :event:events: that came before the :query: was issued. An :event:
is considered to have come before a :query: if the call creating the external :event: returned success before
the :query: was issued. External :event:events: which are created while the :query: is outstanding may or may not
be reflected in the :workflow: state the :query: result is based on.

In order to run consistent :query: through the :CLI: do the following:

`cadence-cli --domain samples-domain workflow query -w my_workflow_id -r my_run_id -qt current_state --qcl strong`

In order to run a :query: using application code, you need to use [service client](https://www.javadoc.io/doc/com.uber.cadence/cadence-client/latest/com/cadence-workflow/cadence/WorkflowService.Iface.html#SignalWorkflowExecution-com.uber.cadence.SignalWorkflowExecutionRequest-).

When using strongly consistent :query: you should expect higher latency than eventually consistent :query:.
