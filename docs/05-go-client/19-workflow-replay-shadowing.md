---
layout: default
title: Workflow Replay and Shadowing
permalink: /docs/go-client/workflow-replay-shadowing
---

In the Versioning section, we mentioned that incompatible changes to workflow definition code could cause non-deterministic issues when processing workflow tasks if versioning is not done correctly. However, it may be hard for you to tell if a particular change is incompatible or not and whether versioning logic is needed. To help you identify incompatible changes and catch them before production traffic is impacted, we implemented Workflow Replayer and Workflow Shadower.

## Hands-On Codelab
**Ready for hands-on learning?** Follow our step-by-step [**Workflow Testing Codelab**](/docs/00-codelabs/01-workflow-tests-go-replayer-shadower.md) to build a complete testing setup from scratch. 

**You'll learn:** Replayer setup • Shadower integration • Breaking change detection<br/>
**Time commitment:** 30-45 minutes 

## Workflow Replayer

Workflow Replayer is a testing component for replaying existing workflow histories against a workflow definition. The replaying logic is the same as the one used for processing workflow tasks, so if there are any incompatible changes in the workflow definition, the replay test will fail.

### Replay Options

Complete documentation on replay options which includes default values, accepted values, etc. can be found [here](https://github.com/cadence-workflow/cadence-go-client/blob/master/internal/workflow_replayer.go). The following sections are just a brief description of each option.

#### Replayer Creation
- **NewWorkflowReplayer()**: Default replayer constructor with standard configuration.
- **NewWorkflowReplayWithOptions(ReplayOptions)**: Advanced constructor with customizable replay configuration.

#### ReplayOptions Fields
- **DataConverter**: Custom data converter interface for workflow argument/result serialization.
- **ContextPropagators**: Slice of context propagators for maintaining request context during replay.
- **WorkflowInterceptorChainFactories**: Slice of interceptor factories for workflow execution middleware.
- **Tracer**: OpenTracing tracer interface for distributed tracing support.

>⚠️ **Important:** Replay options must exactly match your production worker settings to ensure accurate replay results.

#### Registration Methods
- **RegisterWorkflow(workflowFunc)**: Standard registration using Go function name as workflow type.
- **RegisterWorkflow(workflowFunc, RegisterOptions)**: Registration with custom workflow name and additional options.

> ⚠️ **Critical:** All registration methods and options must exactly match those used during original workflow execution.

#### Replay Methods
- **ReplayWorkflowHistory(logger, WorkflowHistory)**: Replay from pre-loaded workflow history object in memory.
- **ReplayWorkflowHistoryFromJSONFile(logger, string)**: Replay from JSON file created by `cadence workflow show --of filename.json`.
- **ReplayPartialWorkflowHistoryFromJSONFile(logger, string, int64)**: Replay partial history up to specified decision task event ID.
- **ReplayWorkflowExecution(context, WorkflowServiceClient, logger, string, WorkflowExecution)**: Fetch and replay directly from Cadence server.

#### Error Conditions
- **Non-deterministic Changes**: Workflow code modifications that alter execution flow will cause replay failures.
- **Insufficient History**: Minimum of 3 workflow events required for meaningful replay validation.

#### Downloading History
Replayer can read workflow history from a local JSON file or fetch it directly from the Cadence server. If you would like to use the first method, you can use the following CLI command, otherwise you can skip to the next step.
```bash
cadence --do <domain> workflow show --wid <workflowID> --rid <runID> --of <output file name>
```
### Sample Unit Test

This sample is also available in our samples repo [here](https://github.com/cadence-workflow/cadence-samples/blob/6350c61d16487d3a6cf9b31e3fac6967170c71ba/cmd/samples/recipes/helloworld/replay_test.go#L18).

```go
func TestReplayWorkflowHistoryFromFile(t *testing.T) {
	replayer := worker.NewWorkflowReplayer()
	replayer.RegisterWorkflow(helloWorldWorkflow)
	err := replayer.ReplayWorkflowHistoryFromJSONFile(zaptest.NewLogger(t), "helloworld.json")
	require.NoError(t, err)
}
```

## Workflow Shadower

Workflow Replayer works well when verifying the compatibility against a small number of workflow histories. If there are a lot of workflows in production that need to be verified, dumping all histories manually clearly won't work. Directly fetching histories from the Cadence server might be a solution, but the time to replay all workflow histories might be too long for a test.

Workflow Shadower is built on top of Workflow Replayer to address this problem. The basic idea of shadowing is: scan workflows based on the filters you defined, fetch history for each of workflow in the scan result from Cadence server and run the replay test. It can be run either as a test to serve local development purposes or as a workflow in your worker to continuously replay production workflows.

### Shadow Options

Complete documentation on shadow options which includes default values, accepted values, etc. can be found [here](https://github.com/cadence-workflow/cadence-go-client/blob/2af19f25b056ce1039feaeabd3fb0e803d20010b/internal/workflow_shadower.go#L53). The following sections are just a brief description of each option.

#### Scan Filters: Advanced Query
- **WorkflowQuery**: Use advanced visibility query syntax for complex filtering.
- **SamplingRate**: Sampling workflows from the scan result before executing the replay test.

#### Scan Filters: Basic
- **WorkflowTypes**: A list of workflow Type names.
- **WorkflowStatus**: A list of workflow statuses. ([accepted values](https://github.com/cadence-workflow/cadence-go-client/blob/2af19f25b056ce1039feaeabd3fb0e803d20010b/internal/workflow_shadower.go#L72)) <br />*Note*: By default, an empty status list will only scan for "OPEN" workflows. 
- **WorkflowStartTimeFilter**: Min and max timestamp for workflow start time.
- **SamplingRate**: Sampling workflows from the scan result before executing the replay test.

> ⚠️ **Compatibility Rule:** Use either WorkflowQuery OR the basic filters (WorkflowTypes/WorkflowStatus/WorkflowStartTimeFilter). SamplingRate works with both approaches.

#### Shadow Exit Condition

- **ExpirationInterval**: Shadowing will exit when the specified interval has passed.
- **ShadowCount**: Shadowing will exit after this number of workflows have been replayed. Note: replay may be skipped due to errors like cannot fetch history, history too short, etc. Skipped workflows won't be taken into account in ShadowCount.

#### Shadow Mode

- **Normal**: Shadowing will complete after all workflows that match WorkflowQuery (after sampling) have been replayed or when exit condition is met.
- **Continuous**: A new round of shadowing will be started after all workflows that match WorkflowQuery have been replayed. There will be a 5-minute wait period between each round, and currently this wait period is not configurable. Shadowing will complete only when ExitCondition is met. ExitCondition must be specified when using this mode.

#### Shadow Concurrency

- **Concurrency**: The default workflow replay concurrency is 1. Values greater than 1 only apply to a Shadowing Worker.

### Sample Integration Test

Local shadowing with the Workflow Shadower is similar to the replay test. First create a workflow shadower with optional shadow and replay options, then register the workflow that needs to be shadowed. Finally, call the `Run` method to start the shadowing. The method will return if shadowing has finished or any non-deterministic error is found.

Here's a simple example. The example is also available [here](https://github.com/cadence-workflow/cadence-samples/blob/6350c61d16487d3a6cf9b31e3fac6967170c71ba/cmd/samples/recipes/helloworld/shadow_test.go#L21).

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

## Shadowing Worker 


- **Each user domain is limited to one Shadowing Worker.**
- **Each Shadowing Worker runs a single shadowing workflow in the "cadence-shadower" domain. You must create this domain before running a Shadowing Worker.**
- **The Cadence server used for scanning and getting workflow history will also be the Cadence server for running your shadow workflow. Currently, there's no way to specify different Cadence servers for hosting the shadowing workflow and scanning/fetching workflow.**

Your worker can also be configured to run in shadow mode to run shadow tests as a workflow. This is useful if there are a number of workflows that need to be replayed. Using a workflow can make sure the shadowing won't accidentally fail in the middle and the replay load can be distributed by deploying more shadow mode workers. It can also be incorporated into your deployment process to make sure there's no failed replay checks before deploying your change to production workers.

When running in shadow mode, the normal decision, activity and session worker will be disabled so that it won't update any production workflows. A special shadow activity worker will be started to execute activities for scanning and replaying workflows. The actual shadow workflow logic is controlled by Cadence server and your worker is only responsible for scanning and replaying workflows.

[Replay succeed, skipped, and failed metrics](https://github.com/cadence-workflow/cadence-go-client/blob/654b9a72a6abb40317387c8d97b19d882d1aaa6c/internal/common/metrics/constants.go#L108-L111) will be emitted by your worker when executing the shadow workflow and you can monitor those metrics to see if there's any incompatible changes.

To enable the shadow mode, the only change needed is setting the `EnableShadowWorker` field in `worker.Options` to `true`, and then specify the `ShadowOptions`.

Registered workflows will be forwarded to the underlying WorkflowReplayer. DataConverter, WorkflowInterceptorChainFactories, ContextPropagators, and Tracer specified in the `worker.Options` will also be used as ReplayOptions. Since all shadow workflows are running in one system domain, to avoid conflict, **the actual task list name used will be `domain-tasklist`.**

### How to Set Up
A sample of this setup can be found [here](https://github.com/cadence-workflow/cadence-samples/blob/6350c61d16487d3a6cf9b31e3fac6967170c71ba/cmd/samples/recipes/helloworld/main.go#L77).

