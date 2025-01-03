---
layout: default
title: Workflow Replay and Shadowing
permalink: /docs/go-client/workflow-replay-shadowing
---

# Workflow Replay and Shadowing

In the Versioning section, we mentioned that incompatible changes to workflow definition code could cause non-deterministic issues when processing workflow tasks if versioning is not done correctly. However, it may be hard for you to tell if a particular change is incompatible or not and whether versioning logic is needed. To help you identify incompatible changes and catch them before production traffic is impacted, we implemented Workflow Replayer and Workflow Shadower.

## Workflow Replayer

Workflow Replayer is a testing component for replaying existing workflow histories against a workflow definition. The replaying logic is the same as the one used for processing workflow tasks, so if there's any incompatible changes in the workflow definition, the replay test will fail.

### Write a Replay Test

#### Step 1: Create workflow replayer

Create a workflow Replayer by:

```go
replayer := worker.NewWorkflowReplayer()
```
or if custom data converter, context propagator, interceptor, etc. is used in your workflow:

```go
options := worker.ReplayOptions{
  DataConverter: myDataConverter,
  ContextPropagators: []workflow.ContextPropagator{
    myContextPropagator,
  },
  WorkflowInterceptorChainFactories: []interceptors.WorkflowInterceptorFactory{
    myInterceptorFactory,
  },
  Tracer: myTracer,
}
replayer := worker.NewWorkflowReplayWithOptions(options)
```

#### Step 2: Register workflow definition

Next, register your workflow definitions as you normally do. Make sure workflows are registered the same way as they were when running and generating histories; otherwise the replay will not be able to find the corresponding definition.

```go
replayer.RegisterWorkflow(myWorkflowFunc1)
replayer.RegisterWorkflow(myWorkflowFunc2, workflow.RegisterOptions{
	Name: workflowName,
})
```

#### Step 3: Prepare workflow histories

Replayer can read workflow history from a local json file or fetch it directly from the Cadence server. If you would like to use the first method, you can use the following CLI command, otherwise you can skip to the next step.

```bash
cadence --do <domain> workflow show --wid <workflowID> --rid <runID> --of <output file name>
```

The dumped workflow history will be stored in the file at the path you specified in json format.

#### Step 4: Call the replay method

Once you have the workflow history or have the connection to Cadence server for fetching history, call one of the four replay methods to start the replay test.

```go
// if workflow history has been loaded into memory
err := replayer.ReplayWorkflowHistory(logger, history)

// if workflow history is stored in a json file
err = replayer.ReplayWorkflowHistoryFromJSONFile(logger, jsonFileName)

// if workflow history is stored in a json file and you only want to replay part of it
// NOTE: lastEventID can't be set arbitrarily. It must be the end of of a history events batch
// when in doubt, set to the eventID of decisionTaskStarted events.
err = replayer.ReplayPartialWorkflowHistoryFromJSONFile(logger, jsonFileName, lastEventID)

// if you want to fetch workflow history directly from cadence server
// please check the Worker Service page for how to create a cadence service client
err = replayer.ReplayWorkflowExecution(ctx, cadenceServiceClient, logger, domain, execution)
```

#### Step 5: Check returned error

If an error is returned from the replay method, it means there's a incompatible change in the workflow definition and the error message will contain more information regarding where the non-deterministic error happens.

Note: currently an error will be returned if there are less than 3 events in the history. It is because the first 3 events in the history has nothing to do with the workflow code, so Replayer can't tell if there's a incompatible change or not.

### Sample Replay Test

This sample is also available in our samples repo at [here](https://github.com/cadence-workflow/cadence-samples/blob/master/cmd/samples/recipes/helloworld/replay_test.go#L39).

```go
func TestReplayWorkflowHistoryFromFile(t *testing.T) {
	replayer := worker.NewWorkflowReplayer()
	replayer.RegisterWorkflow(helloWorldWorkflow)
	err := replayer.ReplayWorkflowHistoryFromJSONFile(zaptest.NewLogger(t), "helloworld.json")
	require.NoError(t, err)
}
```

## Workflow Shadower

Workflow Replayer works well when verifying the compatibility against a small number of workflow histories. If there are lots of workflows in production need to be verified, dumping all histories manually clearly won't work. Directly fetching histories from cadence server might be a solution, but the time to replay all workflow histories might be too long for a test.

Workflow Shadower is built on top of Workflow Replayer to address this problem. The basic idea of shadowing is: scan workflows based on the filters you defined, fetch history for each of workflow in the scan result from Cadence server and run the replay test. It can be run either as a test to serve local development purpose or as a workflow in your worker to continuously replay production workflows.

### Shadow Options

Complete documentation on shadow options which includes default values, accepted values, etc. can be found [here](https://github.com/cadence-workflow/cadence-go-client/blob/master/internal/workflow_shadower.go#L53). The following sections are just a brief description of each option.

#### Scan Filters

- WorkflowQuery: If you are familiar with our advanced visibility query syntax, you can specify a query directly. If specified, all other scan filters must be left empty.
- WorkflowTypes: A list of workflow Type names.
- WorkflowStatus: A list of workflow status.
- WorkflowStartTimeFilter: Min and max timestamp for workflow start time.
- SamplingRate: Sampling workflows from the scan result before executing the replay test.

#### Shadow Exit Condition

- ExpirationInterval: Shadowing will exit when the specified interval has passed.
- ShadowCount: Shadowing will exit after this number of workflow has been replayed. Note: replay maybe skipped due to errors like can't fetch history, history too short, etc. Skipped workflows won't be taken account into ShadowCount.

#### Shadow Mode

- Normal: Shadowing will complete after all workflows matches WorkflowQuery (after sampling) have been replayed or when exit condition is met.
- Continuous: A new round of shadowing will be started after all workflows matches WorkflowQuery have been replayed. There will be a 5 min wait period between each round, and currently this wait period is not configurable. Shadowing will complete only when ExitCondition is met. ExitCondition must be specified when using this mode.

#### Shadow Concurrency

- Concurrency: workflow replay concurrency. If not specified, will be default to 1. For local shadowing, an error will be returned if a value higher than 1 is specified.

### Local Shadowing Test

Local shadowing test is similar to the replay test. First create a workflow shadower with optional shadow and replay options, then register the workflow that need to be shadowed. Finally, call the `Run` method to start the shadowing. The method will return if shadowing has finished or any non-deterministic error is found.

Here's a simple example. The example is also available [here](https://github.com/cadence-workflow/cadence-samples/blob/master/cmd/samples/recipes/helloworld/shadow_test.go).

```go
func TestShadowWorkflow(t *testing.T) {
	options := worker.ShadowOptions{
		WorkflowStartTimeFilter: worker.TimeFilter{
			MinTimestamp: time.Now().Add(-time.Hour),
		},
		ExitCondition: worker.ShadowExitCondition{
			ShadowCount: 10,
		},
	}

  // please check the Worker Service page for how to create a cadence service client
	service := buildCadenceClient()
	shadower, err := worker.NewWorkflowShadower(service, "samples-domain", options, worker.ReplayOptions{}, zaptest.NewLogger(t))
	assert.NoError(t, err)

	shadower.RegisterWorkflowWithOptions(helloWorldWorkflow, workflow.RegisterOptions{Name: "helloWorld"})
	assert.NoError(t, shadower.Run())
}
```

### Shadowing Worker

NOTE:
- **All shadow workflows are running in one Cadence system domain, and right now, every user domain can only have one shadow workflow at a time.**
- **The Cadence server used for scanning and getting workflow history will also be the Cadence server for running your shadow workflow.** Currently, there's no way to specify different Cadence servers for hosting the shadowing workflow and scanning/fetching workflow.

Your worker can also be configured to run in shadow mode to run shadow tests as a workflow. This is useful if there's a number of workflows need to be replayed. Using a workflow can make sure the shadowing won't accidentally fail in the middle and the replay load can be distributed by deploying more shadow mode workers. It can also be incorporated into your deployment process to make sure there's no failed replay checks before deploying your change to production workers.

When running in shadow mode, the normal decision, activity and session worker will be disabled so that it won't update any production workflows. A special shadow activity worker will be started to execute activities for scanning and replaying workflows. The actual shadow workflow logic is controlled by Cadence server and your worker is only responsible for scanning and replaying workflows.

[Replay succeed, skipped and failed metrics](https://github.com/cadence-workflow/cadence-go-client/blob/master/internal/common/metrics/constants.go#L105) will be emitted by your worker when executing the shadow workflow and you can monitor those metrics to see if there's any incompatible changes.

To enable the shadow mode, the only change needed is setting the `EnableShadowWorker` field in `worker.Options` to `true`, and then specify the `ShadowOptions`.

Registered workflows will be forwarded to the underlying WorkflowReplayer. DataConverter, WorkflowInterceptorChainFactories, ContextPropagators, and Tracer specified in the `worker.Options` will also be used as ReplayOptions. Since all shadow workflows are running in one system domain, to avoid conflict, **the actual task list name used will be `domain-tasklist`.**

A sample setup can be found [here](https://github.com/cadence-workflow/cadence-samples/blob/master/cmd/samples/recipes/helloworld/main.go#L24).
