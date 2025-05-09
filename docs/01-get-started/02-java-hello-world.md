---
layout: default
title: Java hello world
permalink: /docs/get-started/java-hello-world
---

# Java Hello World
This section provides step by step instructions on how to write and run a HelloWorld with Java.

For complete, ready to build samples covering all the key Cadence concepts go to [Cadence-Java-Samples](https://github.com/cadence-workflow/cadence-java-samples).

You can also review [Java-Client](/docs/java-client) and [java-docs](https://www.javadoc.io/doc/com.uber.cadence/cadence-client/latest/index.html) for more documentation.


## Include Cadence Java Client Dependency

Custom snippets for including the Cadence Java Client can be found in the [cadence-client](https://central.sonatype.com/artifact/com.uber.cadence/cadence-client) page on Maven Central. Latest version is available in the [Cadence Java Client Releases](/docs/releases/cadence-java-client) page

Include the cadence-client as a dependency into your Java project. For example if you
are using Gradle, the dependency looks like:
```gradle
implementation group: 'com.uber.cadence', name: 'cadence-client', version: '<latest_version>'
```
Also add the following dependencies that cadence-client relies on:
```gradle
implementation group: 'commons-configuration', name: 'commons-configuration', version: '1.9'
implementation group: 'ch.qos.logback', name: 'logback-classic', version: '1.2.3'
```
Make sure that the following code compiles:
```java
import com.uber.cadence.workflow.Workflow;
import com.uber.cadence.workflow.WorkflowMethod;
import org.slf4j.Logger;

public class GettingStarted {

    private static Logger logger = Workflow.getLogger(GettingStarted.class);

    public interface HelloWorld {
        @WorkflowMethod
        void sayHello(String name);
    }

}
```
If you are having problems setting up the build files use the
[Cadence Java Samples](https://github.com/cadence-workflow/cadence-java-samples) GitHub repository as a reference.

Also add the following logback config file somewhere in your classpath:
```xml
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <!-- encoders are assigned the type
             ch.qos.logback.classic.encoder.PatternLayoutEncoder by default -->
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    <logger name="io.netty" level="INFO"/>
    <root level="INFO">
        <appender-ref ref="STDOUT" />
    </root>
</configuration>
```

## Implement Hello World Workflow

Let's add `HelloWorldImpl` with the `sayHello` method that just logs the "Hello ..." and returns.
```java
import com.uber.cadence.worker.Worker;
import com.uber.cadence.workflow.Workflow;
import com.uber.cadence.workflow.WorkflowMethod;
import org.slf4j.Logger;

public class GettingStarted {

    private static Logger logger = Workflow.getLogger(GettingStarted.class);

    public interface HelloWorld {
        @WorkflowMethod
        void sayHello(String name);
    }

    public static class HelloWorldImpl implements HelloWorld {

        @Override
        public void sayHello(String name) {
            logger.info("Hello " + name + "!");
        }
    }
}
```
To link the :workflow: implementation to the Cadence framework, it should be registered with a :worker: that connects to
a Cadence Service. By default the :worker: connects to the locally running Cadence service.

```java
public static void main(String[] args) {
  WorkflowClient workflowClient =
      WorkflowClient.newInstance(
          new WorkflowServiceTChannel(ClientOptions.defaultInstance()),
          WorkflowClientOptions.newBuilder().setDomain(DOMAIN).build());
  // Get worker to poll the task list.
  WorkerFactory factory = WorkerFactory.newInstance(workflowClient);
  Worker worker = factory.newWorker(TASK_LIST);
  worker.registerWorkflowImplementationTypes(HelloWorldImpl.class);
  factory.start();
}
```

The code is slightly different if you are using client version prior to 3.0.0:

```java
public static void main(String[] args) {
    Worker.Factory factory = new Worker.Factory("test-domain");
    Worker worker = factory.newWorker("HelloWorldTaskList");
    worker.registerWorkflowImplementationTypes(HelloWorldImpl.class);
    factory.start();
}
```
## Execute Hello World Workflow using the CLI

Now run the :worker: program. Following is an example log:
```log
13:35:02.575 [main] INFO  c.u.c.s.WorkflowServiceTChannel - Initialized TChannel for service cadence-frontend, LibraryVersion: 2.2.0, FeatureVersion: 1.0.0
13:35:02.671 [main] INFO  c.u.cadence.internal.worker.Poller - start(): Poller{options=PollerOptions{maximumPollRateIntervalMilliseconds=1000, maximumPollRatePerSecond=0.0, pollBackoffCoefficient=2.0, pollBackoffInitialInterval=PT0.2S, pollBackoffMaximumInterval=PT20S, pollThreadCount=1, pollThreadNamePrefix='Workflow Poller taskList="HelloWorldTaskList", domain="test-domain", type="workflow"'}, identity=45937@maxim-C02XD0AAJGH6}
13:35:02.673 [main] INFO  c.u.cadence.internal.worker.Poller - start(): Poller{options=PollerOptions{maximumPollRateIntervalMilliseconds=1000, maximumPollRatePerSecond=0.0, pollBackoffCoefficient=2.0, pollBackoffInitialInterval=PT0.2S, pollBackoffMaximumInterval=PT20S, pollThreadCount=1, pollThreadNamePrefix='null'}, identity=81b8d0ac-ff89-47e8-b842-3dd26337feea}
```
No Hello printed. This is expected because a :worker: is just a :workflow: code host. The :workflow: has to be started to execute. Let's use Cadence :CLI: to start the workflow:
```sh-session
$ docker run --network=host --rm ubercadence/cli:master --do test-domain workflow start --tasklist HelloWorldTaskList --workflow_type HelloWorld::sayHello --execution_timeout 3600 --input \"World\"
Started Workflow Id: bcacfabd-9f9a-46ac-9b25-83bcea5d7fd7, run Id: e7c40431-8e23-485b-9649-e8f161219efe
```
The output of the program should change to:
```log
13:35:02.575 [main] INFO  c.u.c.s.WorkflowServiceTChannel - Initialized TChannel for service cadence-frontend, LibraryVersion: 2.2.0, FeatureVersion: 1.0.0
13:35:02.671 [main] INFO  c.u.cadence.internal.worker.Poller - start(): Poller{options=PollerOptions{maximumPollRateIntervalMilliseconds=1000, maximumPollRatePerSecond=0.0, pollBackoffCoefficient=2.0, pollBackoffInitialInterval=PT0.2S, pollBackoffMaximumInterval=PT20S, pollThreadCount=1, pollThreadNamePrefix='Workflow Poller taskList="HelloWorldTaskList", domain="test-domain", type="workflow"'}, identity=45937@maxim-C02XD0AAJGH6}
13:35:02.673 [main] INFO  c.u.cadence.internal.worker.Poller - start(): Poller{options=PollerOptions{maximumPollRateIntervalMilliseconds=1000, maximumPollRatePerSecond=0.0, pollBackoffCoefficient=2.0, pollBackoffInitialInterval=PT0.2S, pollBackoffMaximumInterval=PT20S, pollThreadCount=1, pollThreadNamePrefix='null'}, identity=81b8d0ac-ff89-47e8-b842-3dd26337feea}
13:40:28.308 [workflow-root] INFO  c.u.c.samples.hello.GettingStarted - Hello World!
```
Let's start another :workflow_execution::
```sh-session
$ docker run --network=host --rm ubercadence/cli:master --do test-domain workflow start --tasklist HelloWorldTaskList --workflow_type HelloWorld::sayHello --execution_timeout 3600 --input \"Cadence\"
Started Workflow Id: d2083532-9c68-49ab-90e1-d960175377a7, run Id: 331bfa04-834b-45a7-861e-bcb9f6ddae3e
```
And the output changed to:
```log
13:35:02.575 [main] INFO  c.u.c.s.WorkflowServiceTChannel - Initialized TChannel for service cadence-frontend, LibraryVersion: 2.2.0, FeatureVersion: 1.0.0
13:35:02.671 [main] INFO  c.u.cadence.internal.worker.Poller - start(): Poller{options=PollerOptions{maximumPollRateIntervalMilliseconds=1000, maximumPollRatePerSecond=0.0, pollBackoffCoefficient=2.0, pollBackoffInitialInterval=PT0.2S, pollBackoffMaximumInterval=PT20S, pollThreadCount=1, pollThreadNamePrefix='Workflow Poller taskList="HelloWorldTaskList", domain="test-domain", type="workflow"'}, identity=45937@maxim-C02XD0AAJGH6}
13:35:02.673 [main] INFO  c.u.cadence.internal.worker.Poller - start(): Poller{options=PollerOptions{maximumPollRateIntervalMilliseconds=1000, maximumPollRatePerSecond=0.0, pollBackoffCoefficient=2.0, pollBackoffInitialInterval=PT0.2S, pollBackoffMaximumInterval=PT20S, pollThreadCount=1, pollThreadNamePrefix='null'}, identity=81b8d0ac-ff89-47e8-b842-3dd26337feea}
13:40:28.308 [workflow-root] INFO  c.u.c.samples.hello.GettingStarted - Hello World!
13:42:34.994 [workflow-root] INFO  c.u.c.samples.hello.GettingStarted - Hello Cadence!
```
## List Workflows and Workflow History

Let's list our :workflow: in the :CLI::
```sh-session
$ docker run --network=host --rm ubercadence/cli:master --do test-domain workflow list
             WORKFLOW TYPE            |             WORKFLOW ID              |                RUN ID                | START TIME | EXECUTION TIME | END TIME
  HelloWorld::sayHello                | d2083532-9c68-49ab-90e1-d960175377a7 | 331bfa04-834b-45a7-861e-bcb9f6ddae3e | 20:42:34   | 20:42:34       | 20:42:35
  HelloWorld::sayHello                | bcacfabd-9f9a-46ac-9b25-83bcea5d7fd7 | e7c40431-8e23-485b-9649-e8f161219efe | 20:40:28   | 20:40:28       | 20:40:29
```
Now let's look at the :workflow_execution: history:
```sh-session
$ docker run --network=host --rm ubercadence/cli:master --do test-domain workflow showid 1965109f-607f-4b14-a5f2-24399a7b8fa7
  1  WorkflowExecutionStarted    {WorkflowType:{Name:HelloWorld::sayHello},
                                  TaskList:{Name:HelloWorldTaskList},
                                  Input:["World"],
                                  ExecutionStartToCloseTimeoutSeconds:3600,
                                  TaskStartToCloseTimeoutSeconds:10,
                                  ContinuedFailureDetails:[],
                                  LastCompletionResult:[],
                                  Identity:cadence-cli@linuxkit-025000000001,
                                  Attempt:0,
                                  FirstDecisionTaskBackoffSeconds:0}
  2  DecisionTaskScheduled       {TaskList:{Name:HelloWorldTaskList},
                                  StartToCloseTimeoutSeconds:10,
                                  Attempt:0}
  3  DecisionTaskStarted         {ScheduledEventId:2,
                                  Identity:45937@maxim-C02XD0AAJGH6,
                                  RequestId:481a14e5-67a4-436e-9a23-7f7fb7f87ef3}
  4  DecisionTaskCompleted       {ExecutionContext:[],
                                  ScheduledEventId:2,
                                  StartedEventId:3,
                                  Identity:45937@maxim-C02XD0AAJGH6}
  5  WorkflowExecutionCompleted  {Result:[],
                                  DecisionTaskCompletedEventId:4}
```
Even for such a trivial :workflow:, the history gives a lot of useful information. For complex :workflow:workflows: this is a really useful tool for production and development troubleshooting. History can be automatically archived to a long-term blob store (for example Amazon S3) upon :workflow: completion for compliance, analytical, and troubleshooting purposes.

## What is Next
Now you have completed the tutorials. You can continue to explore the key [concepts](/docs/concepts) in Cadence, and also how to use them with [Java Client](/docs/java-client)
