---
title: "Minimizing blast radius in Cadence: Introducing Workflow ID-based Rate Limits"

date: 2024-09-05
authors: jakobht
tags:
  - deep-dive
---

At Uber, we run several big multitenant Cadence clusters with hundreds of domains in each. The clusters being multi-tenant means potential [noisy neighbor](https://en.wikipedia.org/wiki/Cloud_computing_issues#Performance_interference_and_noisy_neighbors) effects between domains.

An essential aspect of avoiding this is managing how workflows interact with our infrastructure to prevent any single workflow from causing instability for the whole cluster. To this end, we are excited to introduce Workflow ID-based rate limits — a new feature designed to protect our clusters from problematic workflows and ensure stability across the board.

## Why Workflow ID-based Rate Limits?
We already have rate limits for how many requests can be sent to a domain. However, since Cadence is sharded on the workflow ID, a user-provided input, an overused workflow with a particular id might overwhelm a shard by making too many requests. There are two main ways this happens:

1. A user starts, or signals the same workflow ID too aggressively,
2. A workflow starts too many activities over a short period of time (e.g. thousands of activities in seconds).

<!-- truncate -->

For example, the following workflow would cause issues for Cadence. It would create huge amounts of traffic to a single shard in a very small time frame:

```go
func Workflow(ctx workflow.Context, input sampleInput) (string, error) {
	...
	for _, elem := range longList {
		err := workflow.ExecuteActivity(ctx, QuickActivity, elem).Get(ctx, nil)
	}
	...
}
```

This heavy load creates what we call _hot shards_. Hot shards degrade performance not just for the workflow causing the issue, but for all workflows that interact with the affected shard. This can grow to a point where the whole cluster becomes unstable.

Now, with Workflow ID-based rate limits, we limit the number of external calls and actions per second for each individual workflow, reducing the blast radius (impact on the cluster) of a badly behaved workflow to an absolute minimum where only the offending workflow is impacted.

## Why _not_ Shard Rate Limits?

An obvious question is “why don’t we rate limit the requests to the shard?”. After all, the shard is what we want to protect. We have several reasons for choosing to rate limit the workflow ID instead of the shard:

- __Hashing__ The workflow ID to shard is random. This means that rate limiting a workflow is a good proxy for rate limiting a shard. The likelihood that many requests from different workflows hit the same shard is very low.
- __Communication__ It is easy to explain to a user that their domain is rate limited because they are sending too many requests to a specific workflow ID. Shards are an internal implementation detail that users should not have to worry about.
- __Noisy neighbors__ Shards are shared across the different domains in a Cadence cluster. If a user is sending too many requests to a shard, we would choose to rate limit requests to that shard. Since other users in other domains are also using the shard, they will also be rate limited.
Rate limiting users of a healthy domain because of requests from a completely different domain goes against the isolation the domains are meant to ensure.

## How Does It Work?
Workflow ID-based rate limits are set for all workflow IDs in a domain. If the external limit for a domain is e.g. set to 100 it means that any single workflow ID in that domain can at most be signaled 100 times a second. The rate limits are implemented in two main areas:

1. __External Calls__ Cadence limits the number of requests per second for each workflow ID, which includes operations like starting, querying, or signaling a workflow. If this limit is exceeded, a ServiceBusyError with message “Too many requests for the workflow ID” is triggered, indicating that the rate limit for the workflow has been reached.

2. __Actions Within a Workflow__ This limit controls the number of tasks processed per second within a workflow, focusing on managing decision tasks and activity tasks. When these limits are reached, Cadence slows down task processing without requiring any intervention from the user, though they might notice an increase in task execution time, eventually causing timeouts.

### How do I Enable It?

The limits are controlled using six dynamic config properties, three for the internal limits, and a corresponding three for the external limits, all with a domain filter, so the limits can be controlled for each domain.

- history.workflowIDCacheInternalEnabled\
  history.workflowIDCacheExternalEnabled
    - Controls if the statistics needed to do the rate limiting should be collected. The feature keeps an in-memory record in the history service for each workflow ID.
- history.workflowIDInternalRPS\
  history.workflowIDExternalRPS
    - Sets the number of requests allowed per second per workflow in a particular domain.
- history.workflowIDExternalRateLimitEnabled\
  history.workflowIDInternalRateLimitEnabled
    - Set whether rate limiting should happen. Setting this to false allows us to see which domains _would have_ been rate limited and adjust them before enforcing the limits.

An example configuration using the file based dynamic configuration could look like this:

```yaml
history.workflowIDCacheExternalEnabled:
- value: true
  constraints: {}
history.workflowIDExternalRateLimitEnabled:
- value: false
  constraints:
    domainName: samples-domain
- value: true
  constraints: {}
history.workflowIDExternalRPS:
- value: 100
  constraints: {}
```

Here only the external rate limits are enabled. The internal rate limits have the same structure. We see that ‌the rate limiting is enabled for all domains, with a max RPS of 100. The domain samples-domain is however running in shadow mode, so its requests are not rate limited, but metrics and logs are still emitted.

The exact RPS to set for a specific domain and cluster, depends on many things, such as the number of shards, the selected persistent layer, the general load on the cluster etc.

## Monitoring and Troubleshooting

The new feature introduces both new metrics and new logs. The new logs help us find workflows that are being rate limited, while the new metrics let us see if domains are being rate limited, and how close to being rate limited they are.

There are four new metrics, two for internal limits and two corresponding metrics for external limits, all emitted from history.

- workflow_id_external_requests_ratelimited\
  workflow_id_internal_requests_ratelimited
    - This is a counter that counts the number of rate limited requests. The metric is tagged with the domain, so we can track the rate limiting per domain.
- workflow_id_external_requests_max_requests_per_second\
  workflow_id_internal_requests_max_requests_per_second
    - This is a timer metric. The upper series gives the max number of requests to a single workflow ID. This is again tagged with the domain, so we can for each domain see how close its workflows are to the limit.

These metrics let us monitor and alert on the new rate limits. Additionally, when breaking a rate limit, the history service will emit an info log with the message “Rate limiting workflowID”, these logs are tagged with the workflowID that is being limited, so it is easy to find the offending workflow. An example log would look like this:

```json
{
    "level":"info",
    "ts":"2024-09-02T08:47:12.843Z",
    "msg":"Rate limiting workflowID",
    "service":"cadence-history",
    "request-type":"external",
    "wf-domain-id":"fc0c7fcb-5796-4c80-b0d7-10bbbc66614e",
    "wf-domain-name":"samples-domain",
    "wf-id":"test",
    "logging-call-at":"cache.go:175"
}
```

## Conclusion

Implementing these rate limits highly improves the reliability of a Cadence cluster, as users now cannot send too many requests to a single shard. This fine-grained control helps in maintaining optimal performance and enhances the ability to forecast and mitigate potential issues before they impact the service.

Workflow ID-based rate limits are a significant step forward in our ongoing effort to provide a robust and efficient workflow management service. By preventing hot shards and ensuring equitable resource distribution, we can offer more reliable performance, even under peak loads. We encourage all Cadence users to familiarize themselves with these new limits and adjust their workflow configurations to achieve optimal results.
