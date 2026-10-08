---
layout: default
title: Timeout Risks
description: This page explains activity configurations that put workflows at risk of timing out, including activity StartToClose timeouts silently capped at the workflow execution timeout and long-running activities missing heartbeat timeouts.
keywords:
  - cadence timeout risks
  - activity timeout cap
  - StartToClose capped
  - workflow execution timeout
  - missing heartbeat timeout
  - long-running activity
  - silent timeout cap
  - cadence troubleshooting
  - proactive timeout detection
permalink: /docs/workflow-troubleshooting/timeout-risks
---

The issues on the [Timeouts](/docs/workflow-troubleshooting/timeouts) page cover timeouts that have already occurred. This page covers activity configurations that put your workflow at risk of timing out, even when no timeout has happened yet. Fixing these early avoids hard-to-debug timeout failures later.

## Activity StartToClose timeout greater than workflow execution timeout

When an activity is scheduled, the Cadence server validates and adjusts the requested timeout values before recording them in the ActivityTaskScheduled event in workflow history. If the requested StartToClose timeout is larger than the workflow's execution timeout, the server silently lowers it to match. So the symptom you'll see in workflow history is an activity whose StartToClose timeout is exactly equal to the workflow execution timeout.

This usually means the original value was silently lowered by the server. Even if the value was intentionally set this way, the activity has zero headroom. It must complete before the workflow itself times out, leaving no time for retries or other activities.

Mitigations:

- Set the activity's StartToClose timeout to a value meaningfully lower than the workflow execution timeout, leaving room for retries and other work.
- If the activity genuinely needs a long timeout, consider increasing the workflow execution timeout to provide headroom.
- Review the [activity timeout documentation](/docs/concepts/activities#timeouts) to understand how the different timeout types interact.

## Long-running activity missing heartbeat timeout

An activity with a StartToClose timeout of 10 minutes or longer is considered long-running. If such an activity does not have a HeartbeatTimeout configured, a worker failure (crash, deployment, host restart) will go undetected until the full StartToClose timeout elapses. For a 30-minute activity, that means 30 minutes of silence before Cadence realizes the worker is gone and can retry or fail the activity.

Configuring a HeartbeatTimeout of a few minutes allows Cadence to detect a dead worker quickly and take action, either by retrying the activity on another worker (if a retry policy is configured) or by failing it promptly.

Mitigations:

- Add a HeartbeatTimeout to any long-running activity. A value of one to a few minutes is typical.
- Make sure the activity code sends periodic heartbeats using the Cadence client's heartbeat API ([example](https://github.com/cadence-workflow/cadence-samples/blob/df6f7bdba978d6565ad78e9f86d9cd31dfac9f78/cmd/samples/fileprocessing/activities.go#L111)).
- In the Go client, you can register the activity with auto-heartbeating so heartbeats are sent automatically ([worker options](https://pkg.go.dev/go.uber.org/cadence@v1.2.9/internal#WorkerOptions)).
- Consider pairing the heartbeat timeout with a [retry policy](/docs/concepts/activities#retries) so the activity is automatically retried on a healthy worker after a heartbeat timeout.

Read more about [long-running activities](/docs/concepts/activities#long-running-activities).
