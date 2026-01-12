---
layout: default
title: Retries
permalink: /docs/workflow-troubleshooting/retries
---

Cadence has a retry feature where a retry policy can be configured so that an activity or a workflow will be retried when it fails or times out.

Read more about [activity retries](https://cadenceworkflow.io/docs/concepts/activities/#retries) and [workflow retries](https://cadenceworkflow.io/docs/concepts/workflows/#workflow-retries).

## Workflow execution history of retries

One thing to note is how activity retries and workflow retries are shown in the Cadence Web UI. Information about activity retries is not stored in Cadence. Only the last attempt is shown with the attempt number.

Moreover, attempt number starts from 0, so `Attempt: 0` refers to the first and original attempt, `Attempt: 1` refers to the second attempt or first retried attempt.

For workflow retries, when a workflow fails or times out and is retried, it completes the previous execution with a ContinuedAsNew event and a new execution is started with Attempt 1. The ContinuedAsNew event holds the details of the failure reason.

## Configuration of activity retries and workflow retries

Some of the configurable values could be misconfigured and as a result will not have the intended behaviour. These are listed here.

## MaximumAttempts set to 1

In both activity retries and workflow retries it is sufficient to mention a maximum number of attempts or an expiration interval. However, the maximum number of attempts counts the original attempt of the activity also. As a result, setting maximum number of attempts to 1 means the activity or workflow will not be retried.

## ExpirationIntervalInSeconds less than InitialIntervalInSeconds

In both activity retries and workflow retries it is sufficient to specify a maximum number of attempts or an expiration interval. The first retry attempt waits for the InitialIntervalInSeconds before starting and when an expiration interval is set lower than the initial interval, the retry policy becomes invalid and the activity or workflow will not be retried.

## Heartbeat timeout being equal or higher than StartToClose timeout

Heartbeat timeouts are used to detect when a worker died or restarted. With heartbeat timeout configured equal or higher than StartToClose timeout, cadence will timeout on the StartToClose timeout which essentially makes the configured heartbeat timeout to become useless. Ideally heartbeat timeouts should be configured to a few minutes so you can catch issues with the worker faster.

[Read more about long running activities](https://cadenceworkflow.io/docs/concepts/activities/#long-running-activities)