---
id: domain-isolation
title: Domain Isolation Configuration
sidebar_label: Domain Isolation
description: Configure History Queue V2 and Task Scheduler features for domain-level isolation in Cadence clusters
---

Domain isolation features in Cadence help eliminate noisy neighbor problems by providing stronger isolation between domains at the history task processing level. This guide covers the configuration and deployment of History Queue V2 and the domain-aware Task Scheduler.

:::info Background
For the story behind these features and performance improvements observed at Uber, see the [Eliminating Noisy Neighbors blog post](/blog/2026/09/28/2026-09-28-eliminating-noisy-neighbors/eliminating-noisy-neighbors).
:::

## Prerequisites

To use these features, upgrade Cadence Server to [v1.4.1 or later](https://github.com/cadence-workflow/cadence/releases/tag/v1.4.1).

:::note
History Queue V2 is available starting from v1.4.0, but some additional metrics like `task_latency_per_domain_ns` were added in v1.4.1.
:::

## Configuration

### History Queue V2

History Queue V2 provides domain-level isolation through virtual queues and prevents one slow domain from blocking others.

**Feature Flags:**

* `history.enableTransferQueueV2`
  - **Description**: Enables History Queue V2 for the transfer queue
  - **Type**: Bool
  - **Default**: `false`
  - **Requires restart**: Yes
  - **Filters**: `ShardID`

* `history.enableTimerQueueV2`
  - **Description**: Enables History Queue V2 for the timer queue
  - **Type**: Bool
  - **Default**: `false`
  - **Requires restart**: Yes
  - **Filters**: `ShardID`

* `history.enableTransferQueueV2PendingTaskCountAlert`
  - **Description**: Enables virtual queue splitting for the transfer queue when the pending task count exceeds the configured threshold
  - **Type**: Bool
  - **Default**: `false`
  - **Filters**: `ShardID`

* `history.enableTimerQueueV2PendingTaskCountAlert`
  - **Description**: Enables virtual queue splitting for the timer queue when the pending task count exceeds the configured threshold
  - **Type**: Bool
  - **Default**: `false`
  - **Filters**: `ShardID`

* `history.queueMaxPendingTaskCount`
  - **Description**: Defines the maximum number of pending tasks allowed in a history queue per shard. Once this limit is reached, the queue stops reading additional tasks from the database until the pending task count decreases.
  - **Type**: Int
  - **Default**: `10000`

* `history.queueCriticalPendingTaskCount`
  - **Description**: Defines the pending task count threshold that triggers a virtual queue split. Must be less than `history.queueMaxPendingTaskCount`.
  - **Type**: Int
  - **Default**: `9000`

### History Task Scheduler

The Task Scheduler provides domain-level rate limiting and fair scheduling across domains.

**Feature Flags:**

* `history.taskSchedulerGlobalDomainRPS`
  - **Description**: Defines the global task processing rate limit, in requests per second (RPS), for each domain
  - **Type**: Int
  - **Default**: `1000`
  - **Filters**: `DomainName`

* `history.taskSchedulerEnableRateLimiter`
  - **Description**: Enables rate limiting in the History Task Scheduler. When enabled, task processing is throttled according to the configured domain-level rate limits.
  - **Type**: Bool
  - **Default**: `false`

* `history.taskSchedulerEnableRateLimiterShadowMode`
  - **Description**: Enables shadow mode for the History Task Scheduler rate limiter. In shadow mode, rate-limit decisions are evaluated and recorded for observability, but tasks are not actually throttled.
  - **Type**: Bool
  - **Default**: `true`
  - **Filters**: `DomainName`

* `history.taskSchedulerDomainRoundRobinWeight`
  - **Description**: Defines a per-domain map from numeric task priorityID to the weight used by the task scheduler's weighted round-robin algorithm. By default, tasks with the same priority but from different domains have the same weight.
  - **Type**: Map
  - **Default**: `{"1": 500, "9": 20, "17": 5}`
  - **Filters**: `DomainName`

## Step-by-Step Enablement

### 1. Update Cadence Server

Deploy Cadence Server v1.4.1 or later to your cluster.

### 2. Enable History Queue V2

Set the following dynamic configuration values and restart the `cadence-history` service:

```yaml
history.enableTransferQueueV2:
  - value: true
    constraints: {}

history.enableTimerQueueV2:
  - value: true
    constraints: {}
```

:::warning Important
These flags require a service restart to take effect. Plan your deployment accordingly.
:::

### 3. Enable Virtual Queue Splitting

Once you are confident that History Queue V2 is operating as expected, enable virtual queue splitting:

```yaml
history.enableTransferQueueV2PendingTaskCountAlert:
  - value: true
    constraints: {}

history.enableTimerQueueV2PendingTaskCountAlert:
  - value: true
    constraints: {}
```

### 4. Enable Task Scheduler Rate Limiter (Shadow Mode)

Enable the task scheduler rate limiter in shadow mode to start collecting metrics:

```yaml
history.taskSchedulerEnableRateLimiter:
  - value: true
    constraints: {}
```

With shadow mode enabled by default (`history.taskSchedulerEnableRateLimiterShadowMode: true`), rate-limit decisions are evaluated and logged, but tasks are not actually throttled.

### 5. Tune Rate Limits Per Domain (Optional)

Monitor the metrics and adjust the rate limits for specific domains as needed:

```yaml
history.taskSchedulerGlobalDomainRPS:
  - value: 500
    constraints:
      domainName: latency-sensitive-domain
  - value: 2000
    constraints:
      domainName: high-throughput-domain
  - value: 1000
    constraints: {}
```

### 6. Disable Shadow Mode for Specific Domains (Optional)

Once you've validated the rate limits, you can disable shadow mode for specific domains to enforce actual throttling:

```yaml
history.taskSchedulerEnableRateLimiterShadowMode:
  - value: false
    constraints:
      domainName: noisy-domain
  - value: true
    constraints: {}
```

:::caution
Disabling shadow mode is not recommended for latency-sensitive domains, as active rate limiting may increase task processing latency.
:::

## Monitoring and Observability

### Key Metrics

#### Task Scheduler Metrics

These metrics become available after setting `history.taskSchedulerEnableRateLimiter` to `true`.

* `task_scheduler_allowed_counter_per_domain`
  - Measures the number of tasks per domain that are allowed to proceed by the task scheduler's rate limiter
  - **Use**: Monitor task scheduling QPS for each domain and tune `history.taskSchedulerGlobalDomainRPS` accordingly

* `task_scheduler_throttled_counter_per_domain`
  - Measures the number of tasks per domain that are throttled by the task scheduler's rate limiter
  - **Use**: Identify domains hitting rate limits

#### Task Processing Metrics

* `task_requests_per_domain`
  - Measures the QPS of task processing broken down by domain
  - **Use**: Monitor overall task processing load per domain

* `task_latency_per_domain`
  - Measures task processing latency broken down by domain
  - **Use**: Identify domains with high latency

* `task_latency_per_domain_ns`
  - Histogram of task processing latency broken down by domain (available in v1.4.1+)
  - **Use**: Detailed latency distribution analysis

* `task_latency`
  - Aggregated task processing latency across all domains
  - **Use**: Monitor overall cluster health

* `task_latency_ns`
  - Aggregated histogram of task processing latency across all domains (available in v1.4.1+)
  - **Use**: Monitor overall cluster health

:::tip Identifying Noisy Neighbors
A QPS spike in one domain accompanied by increased latency in other domains may indicate that a high-traffic domain is a noisy neighbor. Use the per-domain task latency metrics to identify such domains.
:::

### Log Messages

#### Queue Paused Due to Too Many Pending Tasks

```json
{
  "level": "warn",
  "msg": "Too many pending tasks, pause loading tasks for a while",
  "service": "cadence-history",
  "shard-id": "<shard-id>",
  ...
}
```

This indicates that the queue is paused because the pending task count exceeded `history.queueMaxPendingTaskCount` for that shard. The queue will resume once the pending task count decreases.

## Troubleshooting

### High Pending Task Count

**Symptom**: Frequent "Too many pending tasks" warnings in logs

**Possible Causes**:
- A domain is generating tasks faster than they can be processed
- Downstream services are slow or unavailable
- Insufficient worker capacity

**Solutions**:
1. Check if a specific domain is responsible using domain-level metrics
2. Enable virtual queue splitting if not already enabled
3. Consider adjusting `history.queueMaxPendingTaskCount` and `history.queueCriticalPendingTaskCount` based on your cluster's capacity
4. Scale up workers or optimize activity/workflow implementations

### Increased Latency After Disabling Shadow Mode

**Symptom**: Task processing latency increased after enabling rate limiting

**Possible Causes**:
- Rate limits are too conservative
- Shadow mode was disabled prematurely

**Solutions**:
1. Verify that shadow mode is enabled (`history.taskSchedulerEnableRateLimiterShadowMode: true`)
2. Ignore if the domain is latency insensitive, the rate limiter is doing the right thing
3. Review and adjust `history.taskSchedulerGlobalDomainRPS` based on actual workload
4. Consider keeping shadow mode enabled for latency-sensitive domains

## Best Practices

1. **Gradual Rollout**: Enable History Queue V2 on a subset of shards first (using `ShardID` filter) to validate behavior before rolling out cluster-wide.

2. **Monitor Before Tuning**: Collect metrics for at least a few days before adjusting rate limits to understand normal and peak traffic patterns.

3. **Enable in Shadow Mode First**: Always enable the task scheduler rate limiter in shadow mode first to collect baseline metrics before enforcing limits.

4. **Keep Shadow Mode for Critical Domains**: For latency-sensitive or business-critical domains, keep the rate limiter in shadow mode to maintain visibility without risking increased latency.

5. **Set Conservative Limits**: When disabling shadow mode, start with conservative rate limits and gradually increase based on observed metrics.

6. **Document Domain-Specific Limits**: Maintain documentation of which domains have custom rate limits and why, to help with troubleshooting and future tuning.

## Related Documentation

- [Monitoring Guide](/docs/operation-guide/monitoring): General monitoring and metrics documentation
- [Setup Guide](/docs/operation-guide/setup): Dynamic configuration setup
- [Eliminating Noisy Neighbors Blog Post](/blog/2026/09/28/2026-09-28-eliminating-noisy-neighbors/eliminating-noisy-neighbors): Background and performance improvements
