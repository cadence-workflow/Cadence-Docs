---
layout: default
title: Schedules
description: How to create, manage, and backfill Cadence Schedules from Go using the ScheduleClient API.
keywords:
  - cadence go schedules
  - cadence go schedule workflow
  - cadence go recurring workflow
  - cadence go ScheduleClient
  - cadence go overlap policy
  - cadence go backfill schedule
  - cadence go pause schedule
permalink: /docs/go-client/schedules
---

# Schedules

The Go client exposes schedule management through `ScheduleClient`, obtained from any `cadence.Client` instance. For a full explanation of overlap policies, backfill, catch-up, and when to use Schedules over `CronSchedule`, see the Schedules concept page under Concepts in the sidebar.

## Getting the client

`ScheduleClient` is obtained from an already-initialized `client.Client`. For the full client setup (service transport, domain, yarpc dispatcher), see the [Workers](/docs/go-client/workers) page.

```go
// cadenceClient is a client.Client initialized for your domain
sc := cadenceClient.ScheduleClient()
```

## Creating a schedule

```go
import "encoding/json"

input, _ := json.Marshal(MyWorkflowInput{Date: "2026-06-01"})

scheduleID, err := sc.Create(ctx, &client.CreateScheduleRequest{
    ScheduleID: "daily-etl",
    Spec: &client.ScheduleSpec{
        CronExpression: "0 2 * * *", // Every day at 2 AM UTC
    },
    Action: &client.ScheduleAction{
        StartWorkflow: &client.ScheduleStartWorkflowAction{
            WorkflowType:                 "RunETL",
            TaskList:                     "etl-workers",
            Input:                        input,
            ExecutionStartToCloseTimeout: 2 * time.Hour,
        },
    },
    Policies: &client.SchedulePolicies{
        OverlapPolicy: client.ScheduleOverlapPolicySkipNew,
    },
})
```

`Input` is a pre-encoded byte slice. Encode it with `json.Marshal` for simple types, or use your configured `DataConverter` for custom types. The same bytes are passed to every triggered workflow run.

`Create` is not idempotent. If the request succeeds on the server but you lose the response (e.g. a network timeout), call `Describe` to check whether the schedule was actually created before retrying.

### Overlap policies

| Constant | Behavior |
|---|---|
| `client.ScheduleOverlapPolicySkipNew` (default) | Skip the new fire if a previous run is still active. |
| `client.ScheduleOverlapPolicyBuffer` | Queue new fires and run them sequentially; depth limited by `BufferLimit`. |
| `client.ScheduleOverlapPolicyConcurrent` | Start every fire; use `ConcurrencyLimit` to cap simultaneous runs. |
| `client.ScheduleOverlapPolicyCancelPrevious` | Cancel the active run, then start the new one. |
| `client.ScheduleOverlapPolicyTerminatePrevious` | Terminate the active run immediately, then start the new one. |

### Bounded concurrency

```go
Policies: &client.SchedulePolicies{
    OverlapPolicy:    client.ScheduleOverlapPolicyConcurrent,
    ConcurrencyLimit: 5, // at most 5 simultaneous runs; 0 = unlimited
},
```

### Auto-pause on failure

```go
Policies: &client.SchedulePolicies{
    OverlapPolicy:  client.ScheduleOverlapPolicySkipNew,
    PauseOnFailure: true, // pause the schedule if a triggered run fails
},
```

When `PauseOnFailure` is set, the schedule pauses automatically the first time a triggered workflow run fails. Unpause it with `sc.Unpause(...)` once the issue is resolved.

### Jitter

```go
Spec: &client.ScheduleSpec{
    CronExpression: "0 0 * * *",
    Jitter:         10 * time.Minute, // random delay up to 10 minutes after midnight
},
```

### Bounded schedule window

Use `StartTime` and `EndTime` to restrict when the schedule is active:

```go
Spec: &client.ScheduleSpec{
    CronExpression: "0 9 * * 1-5", // weekdays at 9 AM
    StartTime:      time.Date(2026, 7, 1, 0, 0, 0, 0, time.UTC),
    EndTime:        time.Date(2026, 12, 31, 0, 0, 0, 0, time.UTC),
},
```

The schedule fires only within the `[StartTime, EndTime]` window. Zero values mean no bound.

## Describing a schedule

```go
resp, err := sc.Describe(ctx, "daily-etl")
if err != nil {
    return err
}

fmt.Printf("Paused: %v\n", resp.State.Paused)
fmt.Printf("Next run: %v\n", resp.Info.NextRunTime)
fmt.Printf("Last run: %v\n", resp.Info.LastRunTime)
```

## Pause and unpause

```go
// Pause with a reason
err = sc.Pause(ctx, "daily-etl", "INFRA-4421: cluster maintenance")

// Unpause - resume from now, skip missed fires
err = sc.Unpause(ctx, "daily-etl", "maintenance complete", client.ScheduleCatchUpPolicySkip)

// Unpause - catch up on all missed fires within the catch-up window
err = sc.Unpause(ctx, "daily-etl", "maintenance complete", client.ScheduleCatchUpPolicyAll)
```

Catch-up policies:

| Constant | Behavior |
|---|---|
| `client.ScheduleCatchUpPolicySkip` (default) | Resume from now; all missed fires are dropped. |
| `client.ScheduleCatchUpPolicyOne` | Dispatch at most one missed fire, then resume from now. |
| `client.ScheduleCatchUpPolicyAll` | Dispatch all missed fires within the catch-up window. |

## Updating a schedule

`Update` follows a read-modify-write pattern. The SDK fetches the current state, passes it to your callback as a `*client.ScheduleUpdate`, and sends only the fields you mutate:

```go
err = sc.Update(ctx, "daily-etl", func(u *client.ScheduleUpdate) error {
    // Change the cron expression
    u.Spec.CronExpression = "0 3 * * *" // move to 3 AM

    // Change the overlap policy
    u.Policies.OverlapPolicy = client.ScheduleOverlapPolicyBuffer

    return nil
})
```

Changes apply to future fires only. In-flight runs are not affected.

## Backfill

```go
err = sc.Backfill(ctx, "daily-etl", &client.BackfillRequest{
    BackfillID: "backfill-june-gap",
    StartTime:  time.Date(2026, 6, 20, 0, 0, 0, 0, time.UTC),
    EndTime:    time.Date(2026, 6, 23, 0, 0, 0, 0, time.UTC),
})
```

Backfill fires are tagged with `CadenceScheduleIsBackfill=true` and `CadenceScheduleBackfillID` search attributes. They respect the schedule's configured overlap policy.

## Listing schedules

```go
var nextPageToken []byte
for {
    resp, err := sc.List(ctx, 100, nextPageToken)
    if err != nil {
        return err
    }
    for _, entry := range resp.Schedules {
        fmt.Printf("%s: paused=%v cron=%s\n",
            entry.ScheduleID, entry.State.Paused, entry.CronExpression)
    }
    if len(resp.NextPageToken) == 0 {
        break
    }
    nextPageToken = resp.NextPageToken
}
```

## Deleting a schedule

```go
err = sc.Delete(ctx, "daily-etl")
```

Deleting a schedule does not cancel or terminate any workflows it already started.

## Schedule search attributes

Every workflow run triggered by a schedule is automatically tagged with the following search attributes, which you can use to filter runs via the Cadence visibility API (e.g. `ListWorkflowExecutions`):

| Attribute | Type | Value |
|---|---|---|
| `CadenceScheduleID` | string | The schedule ID |
| `CadenceScheduleTime` | datetime | The nominal scheduled fire time (not actual start time) |
| `CadenceScheduleIsBackfill` | bool | `true` if started by a backfill request |
| `CadenceScheduleBackfillID` | string | The backfill ID, if provided |

`CadenceScheduleTime` is the time the schedule intended to fire, not when the workflow actually started. Use it to determine which time window a triggered run should process.
