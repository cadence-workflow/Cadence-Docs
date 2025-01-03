---
title: Non-deterministic errors, replayers and shadowers

date: 2023-08-27
authors: chopincode
tags:
  - deep-dive
  - testing
---

It is conceivable that developers constantly update their Cadence workflow code based upon new business use cases and needs. However,
the definition of a Cadence workflow must be deterministic because behind the scenes cadence uses event sourcing to construct
the workflow state by replaying the historical events stored for this specific workflow. Introducing components that are not compatible
with an existing running workflow will yield to non-deterministic errors and sometimes developers find it tricky to debug. Consider the
following workflow that executes two activities.

```go
func SampleWorkflow(ctx workflow.Context, data string) (string, error) {
    ao := workflow.ActivityOptions{
        ScheduleToStartTimeout: time.Minute,
        StartToCloseTimeout:    time.Minute,
    }
    ctx = workflow.WithActivityOptions(ctx, ao)
    var result1 string
    err := workflow.ExecuteActivity(ctx, ActivityA, data).Get(ctx, &result1)
    if err != nil {
        return "", err
    }
    var result2 string
    err = workflow.ExecuteActivity(ctx, ActivityB, result1).Get(ctx, &result2)
    return result2, err
}

```

<!-- truncate -->

In this example, the workflow will execute ActivityA and Activity B in sequence. These activities may have other logics in background, such as polling long running operations or manipulate database reads or writes. Now if the developer replaces ActivityA with another activity ActivityC, a non-deterministic error could happen for an existing workflow. It is because the workflow expects results from ActivityA but since the definition of the workflow has been changed to use results from ActivityC, the workflow will fail due to failure of identifying history data of ActivityA. Such issues can be detected by introducing replayers and shadowers to the workflow unit tests.

Cadence workflow replayer is a testing component for replaying existing workflow histories against a workflow definition. You may think of replayer as a mock which will rerun your workflow with exactly the same history as your real workflow. The replaying logic is the same as the one used for processing workflow tasks. If it detects any incompatible changes, the replay test will fail.
Workflow Replayer works well when verifying the compatibility against a small number of workflow histories. If there are lots of workflows in production that need to be verified, dumping all histories manually clearly won't work. Directly fetching histories from the cadence server might be a solution, but the time to replay all workflow histories might be too long for a test.

Workflow Shadower is built on top of Workflow Replayer to address this problem. The basic idea of shadowing is: scan workflows based on the filters you defined, fetch history for each workflow in the scan result from Cadence server and run the replay test. It can be run either as a test to serve local development purposes or as a workflow in your worker to continuously replay production workflows.

You may find detailed instructions on how to use replayers and shadowers on [our website](https://cadenceworkflow.io/docs/go-client/workflow-replay-shadowing/). We will introduce versioning in the next coming blogs.
