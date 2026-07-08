---
layout: default
title: Periodic execution
description: This page describes how Cadence supports periodic execution use cases, including distributed cron jobs at massive scale with guaranteed execution, retries, and full visibility.
keywords:
  - cadence periodic execution
  - cadence cron job
  - distributed cron
  - cadence scheduled workflow
  - cadence recurring workflow
  - cadence cron use case
permalink: /docs/use-cases/periodic-execution
---

Periodic execution, frequently referred to as distributed cron, is when you execute business logic periodically. The advantage of Cadence for these scenarios is that it guarantees execution, sophisticated error handling, retry policies, and visibility into execution history.

Another important dimension is scale. Some use cases require periodic execution for a large number of entities.
At Uber, there are applications that create periodic :workflow:workflows: per customer.
Imagine 100+ million parallel cron jobs that don't require a separate batch processing framework.

Periodic execution is often part of other use cases. For example, once a month report generation is a periodic service orchestration. Or an event-driven :workflow: that accumulates loyalty points for a customer and applies those points once a month.

There are many real-world examples of Cadence periodic executions. Such as the following:

 * An Uber backend service that recalculates various statistics for each [hex](https://www.uber.com/blog/h3/) in each city once a minute.
 * Monthly Uber for Business report generation.

## How to implement periodic execution in Cadence

Cadence offers two approaches:

**[Schedules](/docs/concepts/schedules)** — the recommended approach for new code. A Schedule is a first-class server-side object that you create, pause, update, and backfill independently of your workflow. It supports overlap policies, catch-up windows, and full observability without modifying your workflow code. Use the `ScheduleClient` in the Go SDK to manage schedules programmatically.

**[Distributed Cron](/docs/go-client/distributed-cron)** — the older approach using `CronSchedule` on `StartWorkflowOptions`. Simpler to set up but less flexible: you cannot pause, update, or backfill a cron workflow without restarting it, and overlap is always skip-new.
