---
layout: default
title: Schedules
description: How to create, manage, and backfill Cadence Schedules from Java using the ScheduleClient API.
keywords:
  - cadence java schedules
  - cadence java schedule workflow
  - cadence java recurring workflow
  - cadence java ScheduleClient
  - cadence java overlap policy
  - cadence java backfill schedule
  - cadence java pause schedule
  - cadence java schedules tutorial
permalink: /docs/java-client/schedules
---

# Schedules

:::note Not yet released
The Java `ScheduleClient` is code complete but has not been released yet. Until it is, you can still use Schedules with Java workflows through the Cadence CLI, which works with any workflow regardless of the client language. See the [CLI quick reference](/docs/concepts/schedules#cli-quick-reference) on the Schedules concept page.
:::

The Java client exposes schedule management through `ScheduleClient`, obtained from any `WorkflowClient` instance. For a full explanation of overlap policies, backfill, catch-up, and when to use Schedules over `CronSchedule`, see the [Schedules concept page](/docs/concepts/schedules).

## Getting the client

`ScheduleClient` is obtained from an already-initialized `WorkflowClient`. For the full client setup (service transport, domain, workers), see the [Workers](/docs/java-client/workers) page.

```java
WorkflowClient workflowClient = WorkflowClient.newInstance(service, options);
ScheduleClient sc = workflowClient.scheduleClient();
```

All `ScheduleClient` methods return `CompletableFuture<T>`. Call `.join()` to block synchronously, or compose with `.thenApply(...)` for non-blocking pipelines:

```java
// blocking
sc.createSchedule("daily-etl", spec, action, policies).join();

// non-blocking
sc.pauseSchedule("daily-etl", "maintenance").thenRun(() -> log.info("paused"));
```

## Creating a schedule

Java uses a builder pattern for all schedule types:

```java
import com.uber.cadence.client.schedule.*;
import com.uber.cadence.common.RetryOptions;
import java.time.Duration;

ScheduleSpec spec = ScheduleSpec.newBuilder()
    .setCronExpression("0 2 * * *")  // every day at 2 AM UTC
    .build();

ScheduleAction action = ScheduleAction.newBuilder()
    .setStartWorkflow(ScheduleAction.StartWorkflowAction.newBuilder()
        .setWorkflowType("RunETL")
        .setTaskList("etl-workers")
        .setExecutionStartToCloseTimeout(Duration.ofHours(2))
        .setRetryOptions(RetryOptions.newBuilder()
            .setMaximumAttempts(3)
            .build())
        .build())
    .build();

SchedulePolicies policies = SchedulePolicies.newBuilder()
    .setOverlapPolicy(ScheduleOverlapPolicy.SKIP_NEW)
    .build();

sc.createSchedule("daily-etl", spec, action, policies).join();
```

`createSchedule` is not idempotent. If the request succeeds on the server but you lose the response (e.g. a network timeout), call `describeSchedule` to check whether the schedule was actually created before retrying.

### Input payload

Pass serialized bytes as input to each triggered workflow. Use your configured `DataConverter` for custom types, or `ObjectMapper` for simple JSON:

```java
byte[] input = new ObjectMapper().writeValueAsBytes(new MyWorkflowInput("2026-06-01"));

ScheduleAction.StartWorkflowAction.newBuilder()
    .setWorkflowType("RunETL")
    .setTaskList("etl-workers")
    .setInput(input)
    ...
```

The same bytes are passed to every triggered workflow run.

### Workflow ID prefix

By default the scheduler generates workflow IDs using the schedule ID as a prefix. Override with `setWorkflowIdPrefix`:

```java
ScheduleAction.StartWorkflowAction.newBuilder()
    .setWorkflowType("RunETL")
    .setTaskList("etl-workers")
    .setWorkflowIdPrefix("etl-run-")  // generates IDs like "etl-run-2026-06-01T02:00:00Z"
    ...
```

### Overlap policies

| Constant | Behavior |
|---|---|
| `ScheduleOverlapPolicy.SKIP_NEW` (default) | Skip the new fire if a previous run is still active. |
| `ScheduleOverlapPolicy.BUFFER` | Queue new fires and run them sequentially; depth-limited by `bufferLimit`. |
| `ScheduleOverlapPolicy.CONCURRENT` | Start every fire; use `concurrencyLimit` to cap simultaneous runs. |
| `ScheduleOverlapPolicy.CANCEL_PREVIOUS` | Cancel the active run gracefully, then start the new one. |
| `ScheduleOverlapPolicy.TERMINATE_PREVIOUS` | Terminate the active run immediately, then start the new one. |

### Bounded concurrency

```java
SchedulePolicies policies = SchedulePolicies.newBuilder()
    .setOverlapPolicy(ScheduleOverlapPolicy.CONCURRENT)
    .setConcurrencyLimit(5)  // at most 5 simultaneous runs; 0 = unlimited
    .build();
```

### Buffer depth

```java
SchedulePolicies policies = SchedulePolicies.newBuilder()
    .setOverlapPolicy(ScheduleOverlapPolicy.BUFFER)
    .setBufferLimit(10)  // queue up to 10 pending fires; 0 = server default cap
    .build();
```

### Catch-up policy and window

`setCatchUpPolicy` sets the default behavior when the schedule resumes from pause. `setCatchUpWindow` limits how far back the server looks for missed fires:

```java
SchedulePolicies policies = SchedulePolicies.newBuilder()
    .setOverlapPolicy(ScheduleOverlapPolicy.SKIP_NEW)
    .setCatchUpPolicy(ScheduleCatchUpPolicy.ONE)
    .setCatchUpWindow(Duration.ofHours(2))  // look back at most 2 hours for missed fires on resume
    .build();
```

| Constant | Behavior |
|---|---|
| `ScheduleCatchUpPolicy.SKIP` (default) | Resume from now; all missed fires are dropped. |
| `ScheduleCatchUpPolicy.ONE` | Dispatch at most one missed fire, then resume from now. |
| `ScheduleCatchUpPolicy.ALL` | Dispatch all missed fires within the catch-up window. |

### Auto-pause on failure

```java
SchedulePolicies policies = SchedulePolicies.newBuilder()
    .setOverlapPolicy(ScheduleOverlapPolicy.SKIP_NEW)
    .setPauseOnFailure(true)
    .build();
```

When `pauseOnFailure` is set, the schedule pauses automatically the first time a triggered workflow run fails. Unpause it with `sc.unpauseSchedule(...)` once the issue is resolved.

### Jitter

```java
ScheduleSpec spec = ScheduleSpec.newBuilder()
    .setCronExpression("0 0 * * *")
    .setJitter(Duration.ofMinutes(10))  // random delay up to 10 minutes after midnight
    .build();
```

### Bounded schedule window

Use `setStartTime` and `setEndTime` to restrict when the schedule is active:

```java
ScheduleSpec spec = ScheduleSpec.newBuilder()
    .setCronExpression("0 9 * * 1-5")  // weekdays at 9 AM
    .setStartTime(Instant.parse("2026-07-01T00:00:00Z"))
    .setEndTime(Instant.parse("2026-12-31T00:00:00Z"))
    .build();
```

The schedule fires only within the `[startTime, endTime]` window. `null` values mean no bound.

### Timezone

Embed the timezone directly in the cron expression using a `CRON_TZ=` prefix:

```java
ScheduleSpec spec = ScheduleSpec.newBuilder()
    .setCronExpression("CRON_TZ=America/New_York 0 9 * * 1-5")  // 9 AM Eastern on weekdays
    .build();
```

If no timezone prefix is provided, UTC is assumed.

### Create in a paused state

Pass a `ScheduleInitialState` to prevent the schedule from firing before a worker deployment or other dependency is ready:

```java
sc.createSchedule(
    "daily-etl",
    spec,
    action,
    policies,
    new ScheduleInitialState(true, "waiting for worker deployment", "release-pipeline")
).join();
```

## Describing a schedule

```java
ScheduleDescription desc = sc.describeSchedule("daily-etl").join();

System.out.println("Paused: "      + desc.getState().isPaused());
System.out.println("Pause reason: " + desc.getState().getPauseReason());
System.out.println("Paused at: "   + desc.getState().getPausedAt());
System.out.println("Paused by: "   + desc.getState().getPausedBy());
System.out.println("Next run: "    + desc.getInfo().getNextRunTime());
System.out.println("Last run: "    + desc.getInfo().getLastRunTime());
System.out.println("Total runs: "  + desc.getInfo().getTotalRuns());
System.out.println("Created: "     + desc.getInfo().getCreateTime());
System.out.println("Last updated: "+ desc.getInfo().getLastUpdateTime());
System.out.println("Missed runs: " + desc.getInfo().getMissedRuns());
System.out.println("Skipped runs: "+ desc.getInfo().getSkippedRuns());
```

`getOngoingBackfills()` returns a list of `ScheduleInfo.BackfillInfo` for any backfill operations currently in progress:

```java
for (ScheduleInfo.BackfillInfo bf : desc.getInfo().getOngoingBackfills()) {
    System.out.printf("backfill %s: %d/%d runs completed%n",
        bf.getBackfillId(), bf.getRunsCompleted(), bf.getRunsTotal());
}
```

## Pause and unpause

```java
// Pause with a reason
sc.pauseSchedule("daily-etl", "INFRA-4421: cluster maintenance").join();

// Unpause using the catch-up policy configured in the schedule's SchedulePolicies
sc.unpauseSchedule("daily-etl", "maintenance complete").join();

// Unpause and override the catch-up policy for this resume only
sc.unpauseSchedule("daily-etl", "maintenance complete", ScheduleCatchUpPolicy.ALL).join();
```

The `ScheduleCatchUpPolicy` passed to `unpauseSchedule` overrides the default set in `SchedulePolicies` for that single resume event.

## Updating a schedule

### Callback update (recommended)

Pass a callback that receives the current `ScheduleDescription` and returns the desired one. The client fetches the current configuration, then sends only the `spec`, `action`, and `policies` fields your callback replaced, so you don't need to carry over fields you aren't changing:

```java
sc.updateSchedule("daily-etl", current ->
    current.toBuilder()
        .setSpec(current.getSpec().toBuilder()
            .setCronExpression("0 3 * * *")  // move to 3 AM
            .build())
        .build()
).join();
```

This is a read-then-write operation, not an atomic transaction. Concurrent updates to the same schedule are last-write-wins, with no conflict detection.

### Full replace

The other `updateSchedule` overloads are a full replace: any field omitted from the request is cleared on the server. Call `describeSchedule` first to read the current configuration, then supply all fields you want to keep:

```java
// Read current state
ScheduleDescription current = sc.describeSchedule("daily-etl").join();

// Build updated spec, reusing other fields from current
ScheduleSpec newSpec = current.getSpec().toBuilder()
    .setCronExpression("0 3 * * *")  // move to 3 AM
    .build();

SchedulePolicies newPolicies = current.getPolicies().toBuilder()
    .setOverlapPolicy(ScheduleOverlapPolicy.BUFFER)
    .build();

sc.updateSchedule("daily-etl", newSpec, current.getAction(), newPolicies).join();
```

Changes apply to future fires only. In-flight workflow runs are not affected.

## Backfill

Java accepts a `List<ScheduleBackfill>`, allowing multiple time ranges in a single call:

```java
import com.uber.cadence.client.ScheduleBackfill;
import java.time.Instant;
import java.util.List;

sc.backfillSchedule(
    "daily-etl",
    List.of(
        new ScheduleBackfill(
            Instant.parse("2026-06-20T00:00:00Z"),
            Instant.parse("2026-06-23T00:00:00Z"),
            ScheduleOverlapPolicy.CONCURRENT  // optional: override for this range
        )
    )
).join();
```

The `overlapPolicy` argument is optional. Use `new ScheduleBackfill(startTime, endTime)` to inherit the schedule's configured overlap policy. Backfill fires are tagged with `CadenceScheduleIsBackfill=true` search attribute.

## Listing schedules

`listSchedules` returns `ListSchedulesResponse` (the Thrift-generated type) with explicit pagination. Both Java and Go require a manual token loop; Python is the only client that auto-paginates:

```java
import com.uber.cadence.ListSchedulesResponse;
import com.uber.cadence.ScheduleListEntry;

byte[] token = null;
do {
    ListSchedulesResponse result = sc.listSchedules(100, token).join();
    for (ScheduleListEntry entry : result.getSchedules()) {
        System.out.printf("%s: paused=%b cron=%s%n",
            entry.getScheduleId(),
            entry.getState().isPaused(),
            entry.getCronExpression());
    }
    token = result.getNextPageToken();
} while (token != null && token.length > 0);
```

`ScheduleListEntry` returns data from the visibility store only. For full runtime info (policies, last run time, etc.), call `describeSchedule` on individual schedule IDs.

## Deleting a schedule

```java
sc.deleteSchedule("daily-etl").join();
```

Deleting a schedule does not cancel or terminate any workflows it already started.

## Schedule search attributes

Cadence sets search attributes on two different workflow types. Use them to filter and query via the visibility API.

### On each triggered workflow run

| Attribute | Type | Value |
|---|---|---|
| `CadenceScheduleID` | Keyword | The schedule ID |
| `CadenceScheduleTime` | Datetime | The nominal scheduled fire time (not actual start time) |
| `CadenceScheduleIsBackfill` | Bool | `true` if started by a backfill request |
| `CadenceScheduleBackfillID` | Keyword | The backfill ID, if provided; absent on normal fires |

`CadenceScheduleTime` is the time the schedule intended to fire, not when the workflow actually started. Use it to determine which time window a triggered run should process.

### On the scheduler workflow itself

These are set on the internal scheduler workflow (not on triggered runs) so that `listSchedules` can surface schedule state without querying each scheduler workflow individually.

| Attribute | Type | Value |
|---|---|---|
| `CadenceScheduleState` | Keyword | `"active"` or `"paused"` |
| `CadenceScheduleCron` | Keyword | The current cron expression |
| `CadenceScheduleWorkflowType` | Keyword | The target workflow type name |

## Differences from Go and Python clients

| Aspect | Java | Go | Python |
|---|---|---|---|
| **Client access** | `workflowClient.scheduleClient()` → `ScheduleClient` | `cadenceClient.ScheduleClient()` | Methods directly on `Client` |
| **API style** | Builder pattern; all methods return `CompletableFuture` | Struct literals; blocking calls | Keyword args; `async`/`await` |
| **Backfill** | `List<ScheduleBackfill>`: multiple ranges per call | Single range per call | Single range per call |
| **Update** | Callback overload (SDK fetches current state and sends only changed fields), or full replace where the caller must call `describeSchedule` first | Callback: SDK fetches current state, passes mutable view to callback, sends only changed fields | Same callback pattern as Go |
| **List pagination** | Explicit token loop | Explicit token loop | Auto-paginated async generator |
| **Timezone** | `CRON_TZ=` prefix embedded in cron string | `CRON_TZ=` prefix in cron string | Set in spec fields |
| **`ScheduleInfo` fields** | `ongoingBackfills`, `missedRuns`, `skippedRuns` | Same, plus `bufferedFireCount` and `runningWorkflowCount` | Same as Go (raw proto fields) |
