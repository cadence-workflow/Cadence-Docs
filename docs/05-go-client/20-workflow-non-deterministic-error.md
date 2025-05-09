---
layout: default
title: Workflow Non-deterministic errors
permalink: /docs/go-client/workflow-non-deterministic-error
---

# Workflow Non-deterministic errors

## Root cause of non-deterministic errors
Cadence workflows are designed as long-running operations, and therefore the workflow code you write must be deterministic so that no matter how many time it is executed it always produce the same results.

In production environment, your workflow code will run on a distributed system orchestrated by clusters of machines. However, machine failures are inevitable and can happen anytime to your workflow host. If you have a workflow running for long period of time, maybe months even years, and it fails due to loss of a host, it will be resumed on another machine and continue the rest of its execution.

Consider the following diagram where `Workflow A` is running on `Host A` but suddenly it crashes.

![change-workflow-ownership](./img/change-workflow-ownership.png)

Workflow A then will be picked up by Host B and continues its execution. This process is called <b>change of workflow ownership</b>. However, after Host B gains ownership of the Workflow A, it does not have any information about its historical executions. For example, Workflow A may have executed many activities and it fails. Host B needs to redo all its history until the moment of failure. The process of reconstructing history of a workflow is called <b>history replay</b>.

In general, any errors occurs during the replay process are called <b>non-deterministic errors</b>. We will explore different types of non-deterministic errors in sections below but first let's try to understand how Cadence is able to perform the replay of workflow in case of failure.

## Decision tasks of workflow

In the previous section, we learned that Cadence is able to replay workflow histories in case of failure. We will learn exactly how Cadence keeps track of histories and how they get replayed when necessary.

Workflow histories are built based on event-sourcing, and each history event are persisted in Cadence storage. In Cadence, we call these history events <b>decision tasks</b>, the foundation of history replay. Most decision tasks have three status - <b>Scheduled</b>, <b>Started</b>, <b>Completed</b> and we will go over decision tasks produced by each Cadence operation in section below.

When changing a workflow ownership of host and replaying a workflow, the decision tasks are downloaded from database and persisted in memory. Then during the workflow replaying process, if Cadence finds a decision task already exists for a particular step, it will immediately return the value of a decision task instead of rerunning the whole workflow logic. Let's take a look at the following simple workflow implementation and explicitly list all decision tasks produced by this workflow.

```go
func SimpleWorkflow(ctx workflow.Context) error {
	ao := workflow.ActivityOptions{
		...
	}
	ctx = workflow.WithActivityOptions(ctx, ao)

	var a int
	err := workflow.ExecuteActivity(ctx, ActivityA).Get(ctx, &a)
	if err != nil {
		return err
	}

	workflow.Sleep(time.Minute)

	err = workflow.ExecuteActivity(ctx, ActivityB, a).Get(ctx, nil)
	if err != nil {
		return err
	}

	workflow.Sleep(time.Hour)
	return nil
}
```

In this workflow, when it starts, it first execute ActivityA and then assign the result to an integer. It sleeps for one minute and then use the integer as an input argument to execute ActivityB. Finally it sleeps for one hour and completes.

The following table lists the decision tasks stack produced by this workflow. It may look overwhelming first but if you associate each decision task with its corresponding Cadence operation, it becomes self-explanatory.
| ID | Decision Task Type | Explanation
| -------- | ------- | -------------- |
| 1 | WorkflowStarted | the recorded StartWorkflow call's data, which usually schedules a new decision task immediately
| 2 | DecisionTaskScheduled  | workflow worker polling for work
| 3 | DecisionTaskStarted    | worker gets the type `SimpleWorkflow`, lookup registred funcs, deserialize input, call it
| 4 | DecisionTaskCompleted  | worker finishes
| 5 | ActivityTaskScheduled  | activity available for a worker
| 6 | ActivityTaskStarted    | activity worker polls and gets type `ActivityA` and do the job
| 7 | ActivityTaskCompleted  | activity work completed with result of var a
| 8 | DecisionTaskScheduled  | triggered by ActivityCompleted. server schedule next task
| 9 | DecisionTaskStarted    |
| 10 | DecisionTaskCompleted |
| 11 | TimerStarted          | decision scheduled a timer for 1 minute
| 12 | TimerFired            | fired after 1 minute
| 13 | DecisionTaskScheduled | triggered by TimerFired
| 14 | DecisionTaskStarted   |
| 15 | DecisionTaskCompleted |
| 16 | ActivityTaskScheduled | `ActivityB` scheduled by decision with param a
| 17 | ActivityTaskStarted   | started by worker
| 18 | ActivityTaskCompleted | completed with nil
| 19 | DecisionTaskScheduled | triggered by ActivityCompleted
| 20 | DecisionTaskStarted   |
| 21 | DecisionTaskCompleted |
| 22 | TimerStarted          | decision scheduled a timer for 1 hour
| 23 | TimerFired            | fired after 1 hour
| 24 | DecisionTaskScheduled | triggered by TimerFired
| 25 | DecisionTaskStarted   |
| 26 | DecisionTaskCompleted |
| 27 | WorkflowCompleted     | completed by decision (the function call returned)

As you may observe that this stack has strict orders. The whole point of the table above is that if the code you write involves some orchestration by Cadence, either your worker or Cadence server, they produce decision tasks. When your workflow gets replayed, it will strive to reconstruct this stack. Therefore, code changes to your workflow needs to make sure that they do not mess up with these decision tasks, which trigger non-deterministic errors. Then let's explore different types of non-deterministic errors and their root causes.

## Categories of non-deterministic errors
Programmatically, Cadence surfaces 4 categories of non-deterministic errors. With understanding of decision tasks in the previous section and combining the error messages, you should be able to pinpoint what code changes may yield to non-deterministic errors.

### 1. Missing decisions
```go
fmt.Errorf("nondeterministic workflow: missing replay decision for %s", util.HistoryEventToString(e))
```
For source code click [here](https://github.com/cadence-workflow/cadence-go-client/blob/e5081b085b0333bac23f198e57959681e0aee987/internal/internal_task_handlers.go#L1206)

This means after replay code, the decision is scheduled less than history events. Using the previous history as an example, when the workflow is waiting at the one hour timer(event ID 22), if we delete the line of :
```go
workflow.Sleep(time.Hour)
```
and restart worker, then it will run into this error. Because in the history, the workflow has a timer event that is supposed to fire in one hour. However, during replay, there is no logic to schedule that timer.

### 2. Extra decisions
```go
fmt.Errorf("nondeterministic workflow: extra replay decision for %s", util.DecisionToString(d))
```
For source code click [here](https://github.com/cadence-workflow/cadence-go-client/blob/e5081b085b0333bac23f198e57959681e0aee987/internal/internal_task_handlers.go#L1210)

This is basically the opposite of the previous case, which means that during replay, Cadence generates more decisions than those in history events. Using the previous history as an example, when the workflow is waiting at the one hour timer(event ID 22), if we change the line of:
```go
err = workflow.ExecuteActivity(ctx, activityB, a).Get(ctx, nil)
```
to
```go
fb := workflow.ExecuteActivity(ctx, activityB, a)
fc := workflow.ExecuteActivity(ctx, activityC, a)
err = fb.Get(ctx,nil)
if err != nil {
	return err
}
err = fc.Get(ctx,nil)
if err != nil {
	return err
}
```
And restart worker, then it will run into this error. Because in the history, the workflow has scheduled only activityB after the one minute timer, however, during replay, there are two activities scheduled in a decision (in parallel).

### 3. Mismatched decisions
```go
fmt.Errorf("nondeterministic workflow: history event is %s, replay decision is %s",util.HistoryEventToString(e), util.DecisionToString(d))
```
For source code click [here](https://github.com/cadence-workflow/cadence-go-client/blob/e5081b085b0333bac23f198e57959681e0aee987/internal/internal_task_handlers.go#L1214)

This means after replay code, the decision scheduled is different than the one in history. Using the previous history as an example, when the workflow is waiting at the one hour timer(event ID 22),
if we change the line of :
```go
err = workflow.ExecuteActivity(ctx, ActivityB, a).Get(ctx, nil)
```
to
```go
err = workflow.ExecuteActivity(ctx, ActivityC, a).Get(ctx, nil)
```
And restart worker, then it will run into this error. Because in the history, the workflow has scheduled ActivityB with input a, but during replay, it schedules ActivityC.

### 4. Decision state machine panic
```go
fmt.Sprintf("unknown decision %v, possible causes are nondeterministic workflow definition code"+" or incompatible change in the workflow definition", id)
```
For source code click [here](https://github.com/cadence-workflow/cadence-go-client/blob/e5081b085b0333bac23f198e57959681e0aee987/internal/internal_decision_state_machine.go#L693)

This usually means workflow history is corrupted due to some bug. For example, the same activity can be scheduled and differentiated by activityID. So ActivityIDs for different activities are supposed to be unique in workflow history. If however we have an ActivityID collision, replay will run into this error.

## Common Q&A

### I want to change my workflow implementation. What code changes may produce non-deterministic errors?

As we discussed in previous sections, if your changes change decision tasks, then they will probably lead to non-deterministic errors.
These are some common changes that can be categorized by these previous 4 types mentioned above.

1. Changing the order of executing Cadence defined operations, such as activities, timer, child workflows, signals, cancelRequest.
2. Change the duration of a timer
3. Use build-in goroutine of golang instead of using `workflow.Go`
4. Use build-in channel of golang instead of using `workflow.Channel`
5. Use build-in sleep function instead of using `workflow.Sleep`

### What are some changes that will NOT trigger non-deterministic errors?

Code changes that are free of non-deterministic erorrs normally do not involve decision tasks in Cadence.

1. Activity input and output changes do not directly cause non-deterministic errors because the contents are not checked.  However, changes may produce serialization errors based on your data converter implementation (type or number-of-arg changes are particularly prone to problems, so we recommend you always use a single struct).  Cadence uses `json.Marshal` and `json.Unmarshal` (with `Decoder.UseNumber()`) by default.
2. Code changes that does not modify history events are safe to be checked in. For example, logging or metrics implementations.
3. Change of retry policies, as these are not compared.  Adding or removing retry policies is also safe.  Changes will only take effect on new calls however, not ones that have already been scheduled.

### I want to check if my code change will produce non-deterministic errors, how can I debug?

Cadence provides replayer test, which functions as an unit test on your local machine to replay your workflow history comparing to your potential code change. If you introduce a non-deterministic change and your history triggers it, the test should fail. Check out [this page](./19-workflow-replay-shadowing.md) for more details.
