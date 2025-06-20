---
layout: default
title: Versioning
permalink: /docs/go-client/workflow-versioning
---

# Versioning

The definition code of a Cadence :workflow: must be deterministic because Cadence uses :event: sourcing
to reconstruct the :workflow: state by replaying the saved history :event: data on the :workflow:
definition code. This means that any incompatible update to the :workflow: definition code could cause
a non-deterministic issue if not handled correctly.

## workflow.GetVersion()

Consider the following :workflow: definition:

```go
func MyWorkflow(ctx workflow.Context, data string) (string, error) {
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
Now let's say we have replaced ActivityA with ActivityC, and deployed the updated code. If there
is an existing :workflow_execution: that was started by the original version of the :workflow: code, where
ActivityA had already completed and the result was recorded to history, the new version of the :workflow:
code will pick up that :workflow_execution: and try to resume from there. However, the :workflow: will fail
because the new code expects a result for ActivityC from the history data, but instead it gets the
result for ActivityA. This causes the :workflow: to fail on the non-deterministic error.

Thus we use `workflow.GetVersion().`

```go
var err error
v := workflow.GetVersion(ctx, "Step1", workflow.DefaultVersion, 1)
if v == workflow.DefaultVersion {
    err = workflow.ExecuteActivity(ctx, ActivityA, data).Get(ctx, &result1)
} else {
    err = workflow.ExecuteActivity(ctx, ActivityC, data).Get(ctx, &result1)
}
if err != nil {
    return "", err
}

var result2 string
err = workflow.ExecuteActivity(ctx, ActivityB, result1).Get(ctx, &result2)
return result2, err
```
When `workflow.GetVersion()` is run for the new :workflow_execution:, it records a marker in the :workflow:
history so that all future calls to `GetVersion` for this change ID--`Step 1` in the example--on this
:workflow_execution: will always return the given version number, which is `1` in the example.

If you make an additional change, such as replacing ActivityC with ActivityD, you need to
add some additional code:

```go
v := workflow.GetVersion(ctx, "Step1", workflow.DefaultVersion, 2)
if v == workflow.DefaultVersion {
    err = workflow.ExecuteActivity(ctx, ActivityA, data).Get(ctx, &result1)
} else if v == 1 {
    err = workflow.ExecuteActivity(ctx, ActivityC, data).Get(ctx, &result1)
} else {
    err = workflow.ExecuteActivity(ctx, ActivityD, data).Get(ctx, &result1)
}
```
Note that we have changed `maxSupported` from 1 to 2. A :workflow: that had already passed this
`GetVersion()` call before it was introduced will return `DefaultVersion`. A :workflow: that was run
with `maxSupported` set to 1, will return 1. New :workflow:workflows: will return 2.

After you are sure that all of the :workflow_execution:workflow_executions: prior to version 1 have completed, you can
remove the code for that version. It should now look like the following:

```go
v := workflow.GetVersion(ctx, "Step1", 1, 2)
if v == 1 {
    err = workflow.ExecuteActivity(ctx, ActivityC, data).Get(ctx, &result1)
} else {
    err = workflow.ExecuteActivity(ctx, ActivityD, data).Get(ctx, &result1)
}
```
You'll note that `minSupported` has changed from `DefaultVersion` to `1`. If an older version of the
:workflow_execution: history is replayed on this code, it will fail because the minimum expected version
is 1. After you are sure that all of the :workflow_execution:workflow_executions: for version 1 have completed, then you
can remove 1 so that your code would look like the following:

```go
_ := workflow.GetVersion(ctx, "Step1", 2, 2)
err = workflow.ExecuteActivity(ctx, ActivityD, data).Get(ctx, &result1)
```
Note that we have preserved the call to `GetVersion()`. There are two reasons to preserve this call:

1. This ensures that if there is a :workflow_execution: still running for an older version, it will
fail here and not proceed.
2. If you need to make additional changes for `Step1`, such as changing ActivityD to ActivityE, you
only need to update `maxVersion` from 2 to 3 and branch from there.

You only need to preserve the first call to `GetVersion()` for each `changeID`. All subsequent calls to
`GetVersion()` with the same change ID are safe to remove. If necessary, you can remove the first
`GetVersion()` call, but you need to ensure the following:

* All executions with an older version are completed.
* You can no longer use `Step1` for the changeID. If you need to make changes to that same part in
the future, such as change from ActivityD to ActivityE, you would need to use a different changeID
like `Step1-fix2`, and start minVersion from DefaultVersion again. The code would look like the
following:

```go
v := workflow.GetVersion(ctx, "Step1-fix2", workflow.DefaultVersion, 1)
if v == workflow.DefaultVersion {
    err = workflow.ExecuteActivity(ctx, ActivityD, data).Get(ctx, &result1)
} else {
    err = workflow.ExecuteActivity(ctx, ActivityE, data).Get(ctx, &result1)
}
```
Upgrading a :workflow: is straightforward if you don't need to preserve your currently running
:workflow_execution:workflow_executions:. You can simply terminate all of the currently running :workflow_execution:workflow_executions: and
suspend new ones from being created while you deploy the new version of your :workflow: code, which does
not use `GetVersion()`, and then resume :workflow: creation. However, that is often not the case, and
you need to take care of the currently running :workflow_execution:workflow_executions:, so using `GetVersion()` to update
your code is the method to use.

However, if you want your currently running :workflow:workflows: to proceed based on the current :workflow: logic,
but you want to ensure new :workflow:workflows: are running on new logic, you can define your :workflow: as a
new `WorkflowType`, and change your start path (calls to `StartWorkflow()`) to start the new :workflow:
type.

## Safe Deployment of Versioned Workflows

When deploying workflow changes in production environments, you may want to separate the versioning of the workflow code from the activation of new logic to ensure ability to roll back changes safely. The `ExecuteWithVersion`  and `ExecuteWithMinVersion` options provides this capability by allowing you to control which version is returned when `GetVersion()` is executed for the first time.

### Step 1: Deploy with Compatibility

Initially, your workflow has the following code:

```go
err = workflow.ExecuteActivity(ctx, FooActivity).Get(ctx, nil)
```

To safely roll out changes that replace `FooActivity` with `BarActivity`, you need both versions of your workflow code to be compatible with each other. Use `GetVersion` with the `ExecuteWithMinVersion` option:

```go
v := workflow.GetVersion(ctx, "fooToBarChange", workflow.DefaultVersion, 1, workflow.ExecuteWithMinVersion())
// equalent to
// v := workflow.GetVersion(ctx, "fooToBarChange", workflow.DefaultVersion, 1, workflow.ExecuteWithVersion(workflow.DefaultVersion))
if v == workflow.DefaultVersion {
    err = workflow.ExecuteActivity(ctx, FooActivity).Get(ctx, nil)
} else {
    err = workflow.ExecuteActivity(ctx, BarActivity).Get(ctx, nil)
}
```

At this step:
- The previous version of the code supports only `DefaultVersion`
- The new version of the code supports both `DefaultVersion` and `1`
- The new version of the code is not yet activated, so workflows started on the new code will still execute the `FooActivity` (previous version)
- This makes it possible to safely roll back your changes if needed, as the previous code supports `DefaultVersion` only

### Step 2: Activate New Logic

When the previous version of the code is no longer running, you can activate the new code by removing the `ExecuteWithMinVersion` option:

```go
v := workflow.GetVersion(ctx, "fooToBarChange", workflow.DefaultVersion, 1)
if v == workflow.DefaultVersion {
    err = workflow.ExecuteActivity(ctx, FooActivity).Get(ctx, nil)
} else {
    err = workflow.ExecuteActivity(ctx, BarActivity).Get(ctx, nil)
}
```

At this step:
- Both versions of the code support both `DefaultVersion` and `1`
- The new version of the code is activated, so workflows started on the new code will execute the `BarActivity` (new version)
- This still allows safe rollback because both versions of the code support both `DefaultVersion` and `1`

### Step 3: Clean Up Old Code

When there are no running workflows using `DefaultVersion`, you can remove the corresponding branch:

```go
_ := workflow.GetVersion(ctx, "fooToBarChange", 1, 1)
err = workflow.ExecuteActivity(ctx, BarActivity).Get(ctx, nil)
```

`ExecuteWithMinVersion` and `ExecuteWithVersion` options are particularly useful when you want to ensure that your changes can be safely rolled back if needed, as both versions of the workflow code remain compatible with each other throughout the deployment process.

## Sanity checking

The Cadence client SDK performs a sanity check to help prevent obvious incompatible changes.
The sanity check verifies whether a :decision: made in replay matches the :event: recorded in history,
in the same order. The :decision: is generated by calling any of the following methods:

* workflow.ExecuteActivity()
* workflow.ExecuteChildWorkflow()
* workflow.NewTimer()
* workflow.Sleep()
* workflow.SideEffect()
* workflow.RequestCancelWorkflow()
* workflow.SignalExternalWorkflow()
* workflow.UpsertSearchAttributes()

Adding, removing, or reordering any of the above methods triggers the sanity check and results in
a non-deterministic error.

The sanity check does not perform a thorough check. For example, it does not check on the :activity:'s
input arguments or the timer duration. If the check is enforced on every property, then it becomes
too restricted and harder to maintain the :workflow: code. For example, if you move your :activity: code
from one package to another package, that changes the `ActivityType`, which technically becomes a different
:activity:. But, we don't want to fail on that change, so we only check the function name part of the
`ActivityType`.
