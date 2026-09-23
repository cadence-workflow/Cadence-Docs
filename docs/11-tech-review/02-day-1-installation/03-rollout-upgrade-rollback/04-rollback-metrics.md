---
layout: default
title: Rollback Metrics
description: Specific metrics that should inform a rollback decision in Cadence.
keywords:
  - cadence rollback metrics
  - cadence monitoring rollback
  - cadence slo rollback
---

During a server rollout, compare each metric with its pre-rollout level. If a metric worsens and stays worse after the new version starts serving traffic, that can be a reason to pause the rollout and investigate. If the evidence points to the new version, roll back.

Start with what applications see when they call Cadence. Then check whether workflows are progressing and whether persistence and replication are keeping up.

## Frontend requests

Check whether Cadence is serving requests successfully. In the [frontend availability example](https://cadenceworkflow.io/docs/operation-guide/monitoring#service-availabilityserver-metrics), `cadence_requests` counts incoming requests and `cadence_errors` counts internal service errors. If errors rise relative to requests after the rollout begins, check which frontend operations are failing.

Next, use [`cadence_latency`](https://cadenceworkflow.io/docs/operation-guide/monitoring#frontend-regular-api-latency) to see whether the frontend requests your applications make have gotten slower since the rollout. For example, look at requests to start a workflow. If those calls consistently take longer than before, that may be a sign the rollout introduced a problem.

## Canary workflows

If the canary is running, monitor [`workflow_success` for `workflow.sanity`](https://cadenceworkflow.io/docs/operation-guide/monitoring#periodical-test-suite-successaka-canary). Each successful run increments the counter. If scheduled runs stop succeeding during a rollout, check which test failed or whether the canary stopped starting runs.

## History tasks

Watch `task_latency` for transfer and timer tasks. A sustained increase can mean task dispatch or timers are falling behind. Also watch `task_latency_queue`. The [monitoring guide](https://cadenceworkflow.io/docs/operation-guide/monitoring#note-task-queue-latency-vs-executing-latency-vs-processing-latency-in-transfer--timer-task-latency-metrics) notes that it can spike during deployment when metrics are re-emitted, even if actual task delay remains low.

## Persistence

Cadence stores workflow state in its persistence database. Compare [`persistence_errors` with `persistence_requests`](https://cadenceworkflow.io/docs/operation-guide/monitoring#persistence-availability) to see whether database operations are failing more often. Check [`persistence_latency` by operation](https://cadenceworkflow.io/docs/operation-guide/monitoring#persistence-by-operation-latency) to find reads or writes that have slowed down. If either worsens, check which database operations are affected and whether the change began during the Cadence rollout.

## Replication

In a [multi-cluster setup](https://cadenceworkflow.io/docs/concepts/cross-dc-replication), watch `replication_tasks_lag_gauge` during the rollout. If it keeps rising after the new version is deployed, investigate whether the rollout is slowing replication.

