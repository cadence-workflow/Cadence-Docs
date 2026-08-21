---
layout: default
title: Polling
description: This page explains how Cadence handles polling use cases such as monitoring external APIs, S3 buckets, or network hosts using long-running activities and unlimited retries.
keywords:
  - cadence polling
  - cadence long running activity
  - cadence external API polling
  - cadence S3 polling
  - cadence monitoring use case
  - cadence heartbeat
permalink: /docs/use-cases/polling
---

Polling is executing a periodic action checking for a state change. Examples are pinging a host, calling a REST API, or listing an Amazon S3 bucket for newly uploaded files.

Cadence support for long running :activity:activities: and unlimited retries makes it a good fit.

## Samples

Runnable samples covering the building blocks of polling:

| Sample | Description | Code |
|--------|-------------|------|
| **Activity retry with heartbeat** | Long-running activity that heartbeats progress and retries without limit | [Go](https://github.com/cadence-workflow/cadence-samples/tree/master/new_samples/retryactivity) · [Java](https://github.com/cadence-workflow/cadence-java-samples/blob/master/src/main/java/com/uber/cadence/samples/hello/HelloActivityRetry.java) |
| **Durable timer** | Fires a durable timer to take action when an operation runs too long | [Go](https://github.com/cadence-workflow/cadence-samples/tree/master/new_samples/timer) |

---

Some real-world use cases:

* Network, host and service monitoring
* Processing files uploaded to FTP or S3
* [Cadence Polling Cookbook by Instaclustr: Polling an external API for a specific resource to become available](https://github.com/instaclustr/cadence-cookbooks-instafood/blob/main/cookbooks/polling/polling-megafood.md)
