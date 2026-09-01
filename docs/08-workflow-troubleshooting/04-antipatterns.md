---
layout: default
title: Antipatterns
description: This page explains common workflow implementation antipatterns in Cadence, including scheduling large bursts of activities that can cause hot shards and using Continue-As-New inside cron workflows, and how to mitigate each issue.
keywords:
  - cadence antipatterns
  - hot shard
  - activity burst
  - activity fan-out
  - batch future
  - continue as new
  - distributed cron
  - cron workflow
  - schedules
  - cadence troubleshooting antipatterns
permalink: /docs/workflow-troubleshooting/antipatterns
---

Antipatterns are workflow patterns that are not failures on their own, but often cause operational problems: slower performance, uneven load on the Cadence cluster, or schedules that do not fire when expected. These workflows usually look fine in testing and only cause trouble at scale. Some of the common antipatterns have been listed here.

## Many activities scheduled in quick succession

Every workflow execution is owned by a single history shard on the Cadence server. Scheduling a large burst of activities in a short time (for example, 50 or more ActivityTaskScheduled events within 10 seconds) puts all the history writes and task dispatch on that one shard. The shard becomes a hot shard. Latency gets worse for that workflow and for every other workflow on the same shard. The activity tasklist can also accumulate a backlog faster than workers can drain it.

Mitigations:

- Use BatchFuture (or `workflow.NewBatchFuture`) instead of starting all activities at once. BatchFuture is a primitive in the Cadence Go client. You pass the full list of work and a concurrency limit. It starts activities only up to that limit, then starts more as earlier ones complete. The scheduling rate stays bounded no matter how large the input is. See [BatchFuture](/docs/go-client/batch-future).
- Combine the work into fewer, larger activities. Each activity processes a chunk of items instead of one item per activity. This cuts the number of history events and the scheduling pressure on the shard.
- If a large fan-out is truly needed, spread it across [child workflows](/docs/go-client/child-workflows). Each child has its own workflow ID and lands on its own shard, so load is spread across the cluster instead of one shard.

## Continue-As-New used in a workflow with a cron schedule

Distributed cron is implemented by the Cadence server. When a cron workflow run closes, the server starts the next run at the next scheduled interval, using the cron schedule set when the workflow was started. If the workflow code also calls Continue-As-New, the two mechanisms conflict. The run started by the workflow code begins immediately instead of at the next cron fire time. Depending on timing, the schedule can drift, fire early, or skip intervals.

Mitigations:

- Let each cron run do one unit of work and return. The server schedules the next run. Do not call Continue-As-New from workflow code. See [distributed cron](/docs/go-client/distributed-cron).
- If state must be carried from one run to the next, return it as the workflow result. Read it in the next run with HasLastCompletionResult and GetLastCompletionResult. Do not pass it through Continue-As-New.
- Consider using the [Schedules](/docs/concepts/schedules) feature instead of distributed cron. A Schedule lives outside any workflow execution and starts a new workflow on each fire. Workflow code, including Continue-As-New, cannot interfere with the schedule. Schedules also support overlap policies (skip, buffer, run concurrently, or cancel/terminate the previous run), plus pausing, updating, and backfilling, none of which cron workflows support.
- If a single cron run accumulates too much history to finish in one execution, move the looping work into a child workflow. The child can use Continue-As-New to bound its history. The parent cron workflow keeps the schedule intact by waiting for the child and returning.
