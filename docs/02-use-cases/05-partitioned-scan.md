---
layout: default
title: Storage scan
description: This page explains how Cadence enables scalable and resilient full scans of large partitioned datasets or object storage using activities with heartbeating progress tracking.
keywords:
  - cadence storage scan
  - cadence partitioned scan
  - cadence S3 scan
  - cadence large dataset
  - cadence heartbeat progress
  - cadence activity scan
  - cadence use case
permalink: /docs/use-cases/partitioned-scan
---

It is common to have large data sets partitioned across a large number of hosts or databases, or having billions of files in an Amazon S3 bucket.
Cadence is an ideal solution for implementing the full scan of such data in a scalable and resilient way. The standard pattern
is to run an :activity: (or multiple parallel :activity:activities: for partitioned data sets) that performs the scan and heartbeats its progress
back to Cadence. In the case of a host failure, the :activity: is retried on a different host and continues execution from the last reported progress.

## Samples

Runnable samples covering the pieces of this pattern:

| Sample | Description | Code |
|--------|-------------|------|
| **Split and merge** | Fans out parallel activities per partition and merges their results | [Go](https://github.com/cadence-workflow/cadence-samples/tree/master/new_samples/splitmerge) |
| **Bounded concurrency** | Processes many items with a fixed number of parallel workers | [Go](https://github.com/cadence-workflow/cadence-samples/tree/master/new_samples/concurrency) |
| **Heartbeat progress and resume** | Activity reports progress via heartbeat and resumes from the last checkpoint after a failure | [Go](https://github.com/cadence-workflow/cadence-samples/tree/master/new_samples/retryactivity) |

---

A real-world example:

* Cadence internal system :workflow: that performs periodic scan of all :workflow_execution: records
