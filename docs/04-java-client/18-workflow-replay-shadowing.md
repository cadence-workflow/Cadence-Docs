---
layout: default
title: Workflow Replay and Shadowing
permalink: /docs/java-client/workflow-replay-shadowing
---

# Workflow Replay and Shadowing

In the Versioning section, we mentioned that incompatible changes to workflow definition code could cause non-deterministic issues when processing workflow tasks if versioning is not done correctly. However, it may be hard for you to tell if a particular change is incompatible or not and whether versioning logic is needed. To help you identify incompatible changes and catch them before production traffic is impacted, we implemented Workflow Replayer and Workflow Shadower.

## Workflow Replayer

Workflow Replayer is a testing component for replaying existing workflow histories against a workflow definition. The replaying logic is the same as the one used for processing workflow tasks, so if there's any incompatible changes in the workflow definition, the replay test will fail.

### Write a Replay Test

#### Step 1: Prepare workflow histories

Replayer can read workflow history from a local json file or fetch it directly from the Cadence server. If you would like to use the first method, you can use the following CLI command, otherwise you can skip to the next step.

```
cadence --do <domain> workflow show --wid <workflowID> --rid <runID> --of <output file name>
```

The dumped workflow history will be stored in the file at the path you specified in json format.

#### Step 2: Call the replay method

Once you have the workflow history or have the connection to Cadence server for fetching history, call one of the four replay methods to start the replay test.

```java
// if workflow history has been loaded into memory
WorkflowReplayer.replayWorkflowExecution(history, MyWorkflowImpl.class);

// if workflow history is stored in a json file
WorkflowReplayer.replayWorkflowExecutionFromResource("workflowHistory.json", MyWorkflowImpl.class);

// if workflow history is read from a File
WorkflowReplayer.replayWorkflowExecution(historyFileObject, MyWorkflowImpl.class);
```

#### Step 3: Catch returned exception

If an exception is returned from the replay method, it means there's a incompatible change in the workflow definition and the error message will contain more information regarding where the non-deterministic error happens.

### Sample Replay Test

This sample is also available in our samples repo at [here](https://github.com/cadence-workflow/cadence-java-samples/blob/master/src/test/java/com/uber/cadence/samples/hello/HelloActivityReplayTest.java).

```java
public class HelloActivityReplayTest {
  @Test
  public void testReplay() throws Exception {
    WorkflowReplayer.replayWorkflowExecutionFromResource(
        "HelloActivity.json", HelloActivity.GreetingWorkflowImpl.class);
  }
}
```

## Workflow Shadower

Workflow Replayer works well when verifying the compatibility against a small number of workflows histories. If there are lots of workflows in production that need to be verified, dumping all histories manually clearly won't work. Directly fetching histories from cadence server might be a solution, but the time to replay all workflow histories might be too long for a test.

Workflow Shadower is built on top of Workflow Replayer to address this problem. The basic idea of shadowing is: scan workflows based on the filters you defined, fetch history for each workflow in the scan result from Cadence server and run the replay test. It can be run either as a test to serve local development purpose or as a workflow in your worker to continuously replay production workflows.

### Shadow Options

Complete documentation on shadow options which includes default values, accepted values, etc. can be found [here](https://github.com/cadence-workflow/cadence-java-client/blob/master/src/main/java/com/uber/cadence/worker/ShadowingOptions.java). The following sections are just a brief description of each option.

#### Scan Filters

- WorkflowQuery: If you are familiar with our advanced visibility query syntax, you can specify a query directly. If specified, all other scan filters must be left empty.
- WorkflowTypes: A list of workflow Type names.
- WorkflowStatuses: A list of workflow status.
- WorkflowStartTimeFilter: Min and max timestamp for workflow start time.
- WorkflowSamplingRate: Sampling workflows from the scan result before executing the replay test.

#### Shadow Exit Condition

- ExpirationInterval: Shadowing will exit when the specified interval has passed.
- ShadowCount: Shadowing will exit after this number of workflow has been replayed. Note: replay maybe skipped due to errors like can't fetch history, history too short, etc. Skipped workflows won't be taken into account for ShadowCount.

#### Shadow Mode

- Normal: Shadowing will complete after all workflows matches WorkflowQuery (after sampling) have been replayed or when exit condition is met.
- Continuous: A new round of shadowing will be started after all workflows matches WorkflowQuery have been replayed. There will be a 5 min wait period between each round, and currently this wait period is not configurable. Shadowing will complete only when ExitCondition is met. ExitCondition must be specified when using this mode.

#### Shadow Concurrency

- Concurrency: workflow replay concurrency. If not specified, it will default to 1. For local shadowing, an error will be returned if a value higher than 1 is specified.

### Local Shadowing Test

Local shadowing test is similar to the replay test. First create a workflow shadower with optional shadow and replay options, then register the workflow that needs to be shadowed. Finally, call the `Run` method to start the shadowing. The method will return if shadowing has finished or any non-deterministic error is found.

Here's a simple example. The example is also available [here](https://github.com/cadence-workflow/cadence-java-samples/blob/master/src/test/java/com/uber/cadence/samples/hello/HelloWorkflowShadowingTest.java).

```java
public void testShadowing() throws Throwable {
  IWorkflowService service = new WorkflowServiceTChannel(ClientOptions.defaultInstance());

  ShadowingOptions options = ShadowingOptions
          .newBuilder()
          .setDomain(DOMAIN)
          .setShadowMode(Mode.Normal)
          .setWorkflowTypes(Lists.newArrayList("GreetingWorkflow::getGreeting"))
          .setWorkflowStatuses(Lists.newArrayList(WorkflowStatus.OPEN, WorkflowStatus.CLOSED))
          .setExitCondition(new ExitCondition().setExpirationIntervalInSeconds(60))
          .build();
  WorkflowShadower shadower = new WorkflowShadower(service, options, TASK_LIST);
  shadower.registerWorkflowImplementationTypes(HelloActivity.GreetingWorkflowImpl.class);

  shadower.run();
}
```

### Shadowing Worker

NOTE:
- **All shadow workflows are running in one Cadence system domain, and right now, every user domain can only have one shadow workflow at a time.**
- **The Cadence server used for scanning and getting workflow history will also be the Cadence server for running your shadow workflow.** Currently, there's no way to specify different Cadence servers for hosting the shadowing workflow and scanning/fetching workflow.

Your worker can also be configured to run in shadow mode to run shadow tests as a workflow. This is useful if there's a number of workflows that need to be replayed. Using a workflow can make sure the shadowing won't accidentally fail in the middle and the replay load can be distributed by deploying more shadow mode workers. It can also be incorporated into your deployment process to make sure there's no failed replay checks before deploying your change to production workers.

When running in shadow mode, the normal decision worker will be disabled so that it won't update any production workflows. A special shadow activity worker will be started to execute activities for scanning and replaying workflows. The actual shadow workflow logic is controlled by Cadence server and your worker is only responsible for scanning and replaying workflows.

[Replay succeed, skipped and failed metrics](https://github.com/cadence-workflow/cadence-java-client/blob/master/src/main/java/com/uber/cadence/internal/metrics/MetricsType.java#L169-L172) will be emitted by your worker when executing the shadow workflow and you can monitor those metrics to see if there's any incompatible changes.

To enable the shadow mode, you can initialize a shadowing worker and pass in the shadowing options.

To enable the shadowing worker, here is a example. The example is also available [here](https://github.com/cadence-workflow/cadence-java-samples/blob/master/src/main/java/com/uber/cadence/samples/shadowing/ShadowTraffic.java):

```java
WorkflowClient workflowClient =
  WorkflowClient.newInstance(
          new WorkflowServiceTChannel(ClientOptions.defaultInstance()),
          WorkflowClientOptions.newBuilder().setDomain(DOMAIN).build());
  ShadowingOptions options = ShadowingOptions
          .newBuilder()
          .setDomain(DOMAIN)
          .setShadowMode(Mode.Normal)
          .setWorkflowTypes(Lists.newArrayList("GreetingWorkflow::getGreeting"))
          .setWorkflowStatuses(Lists.newArrayList(WorkflowStatus.OPEN, WorkflowStatus.CLOSED))
          .setExitCondition(new ExitCondition().setExpirationIntervalInSeconds(60))
          .build();

  ShadowingWorker shadowingWorker = new ShadowingWorker(
          workflowClient,
          "HelloActivity",
          WorkerOptions.defaultInstance(),
          options);
  shadowingWorker.registerWorkflowImplementationTypes(HelloActivity.GreetingWorkflowImpl.class);
	shadowingWorker.start();
```

Registered workflows will be forwarded to the underlying WorkflowReplayer. DataConverter, WorkflowInterceptorChainFactories, ContextPropagators, and Tracer specified in the `worker.Options` will also be used as ReplayOptions. Since all shadow workflows are running in one system domain, to avoid conflict, **the actual task list name used will be `domain-tasklist`.**
