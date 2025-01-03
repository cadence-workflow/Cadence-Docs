---
layout: default
title: Timeouts
permalink: /docs/workflow-troubleshooting/timeouts
---

#  Timeouts

A workflow could fail if an activity times out and will timeout when the entire workflow execution times out. Workflows or activities time out when their time to execute or time to start has been longer than their configured timeout. Some of the common causes for timeouts have been listed here.

## Missing Pollers

Cadence workers are part of the service that hosts and executes the workflow. They are of two types: activity worker and workflow worker. Each of these workers are responsible for having pollers which are go-routines that poll for activity tasks and decision tasks respectively from the Cadence server. Without pollers, the workflow cannot proceed with the execution.

Mitigation: Make sure these workers are configured with the task lists that are used in the workflow and activities so the server can dispatch tasks to the cadence workers.

[Worker setup example](https://github.com/uber-common/cadence-samples/blob/master/cmd/samples/pageflow/main.go#L18)

## Tasklist backlog despite having pollers

If a tasklist has pollers but the backlog continues to grow then it is a supply-demand issue. The workflow is growing faster than what the workers can handle. The server wants to dispatch more tasks to the workers but they are not able to keep up.

Mitigation: Increase the number of cadence workers by horizontally scaling up the instances where the workflow is running.

Optionally you can also increase the number of pollers per worker by providing this via worker options.

[Link to options in go client](https://pkg.go.dev/go.uber.org/cadence@v1.2.9/internal#WorkerOptions)
[Link to options in java client](https://github.com/uber/cadence-java-client/blob/master/src/main/java/com/uber/cadence/internal/worker/PollerOptions.java#L124)

## No heartbeat timeout or retry policy configured

Activities time out StartToClose or ScheduleToClose if the activity took longer than the configured timeout.

[Link to description of timeouts](https://cadenceworkflow.io/docs/concepts/activities/#timeouts)

For long running activities, while the activity is executing, the worker can die due to regular deployments or host restarts or failures. Cadence doesn't know about this and will wait for StartToClose or ScheduleToClose timeouts to kick in.

Mitigation: Consider configuring heartbeat timeout and a retry policy

[Example](https://github.com/uber-common/cadence-samples/blob/df6f7bdba978d6565ad78e9f86d9cd31dfac9f78/cmd/samples/expense/workflow.go#L23)
[Check retry policy for activity](https://cadenceworkflow.io/docs/concepts/activities/#retries)

For short running activities, heart beating is not required but maybe consider increasing the timeout value to suit the actual activity execution time.

## Retry policy configured without setting heartbeat timeout

Retry policies are configured so activities can be retried after timeouts or failures. For long-running activities, the worker can die while the activity is executing, e.g. due to regular deployments or host restarts or failures. Cadence doesn't know about this and will wait for StartToClose or ScheduleToClose timeouts to kick in. The retry is attempted only after this timeout. Configuring heartbeat timeout would cause the activity to timeout earlier so it can be retried on another worker.

Mitigation: Consider configuring heartbeat timeout

[Example](https://github.com/uber-common/cadence-samples/blob/df6f7bdba978d6565ad78e9f86d9cd31dfac9f78/cmd/samples/expense/workflow.go#L23)

## Heartbeat timeout configured without a retry policy

Heartbeat timeouts are used to detect when a worker died or restarted. With heartbeat timeout configured, the activity will timeout faster. But without a retry policy, it will not be scheduled again on a healthy worker.

Mitigation: Consider adding retry policy to an activity

[Check retry policy for activity](https://cadenceworkflow.io/docs/concepts/activities/#retries)

## Heartbeat timeout seen after configuring heartbeat timeout

Activity has configured heartbeat timeout and the activity timed out with heart beat timeout. This is because the server did not receive a heart beat in the time interval configured as the heart beat timeout. This could happen if the activity is actually not executing or the activity is not sending periodic heartbeats. The first case is good since the activity now times out instead of being stuck until startToClose or scheduleToClose kicks in. The second case needs a fix.

Mitigation: Once heartbeat timeout is configured in activity options, you need to make sure the activity periodically sends a heart beat to the server to make sure the server is aware of the activity being alive.

[Example to send periodic heart beat](https://github.com/uber-common/cadence-samples/blob/df6f7bdba978d6565ad78e9f86d9cd31dfac9f78/cmd/samples/fileprocessing/activities.go#L111)

In go client, there is an option to register the activity with auto heart beating so that it is done automatically

[Configuring auto heart beat during activity registration example](https://pkg.go.dev/go.uber.org/cadence@v1.2.9/internal#WorkerOptions)
