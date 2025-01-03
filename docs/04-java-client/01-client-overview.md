---
layout: default
title: Client SDK Overview
permalink: /docs/java-client/client-overview
---

# Client SDK Overview

- Samples: [https://github.com/cadence-workflow/cadence-java-samples](https://github.com/cadence-workflow/cadence-java-samples)
- JavaDoc documentation: [https://www.javadoc.io/doc/com.uber.cadence/cadence-client](https://www.javadoc.io/doc/com.uber.cadence/cadence-client)

## [JavaDoc Packages](https://www.javadoc.io/doc/com.uber.cadence/cadence-client/latest/index.html)
### com.uber.cadence.activity
APIs to implement activity: accessing activity info, or sending heartbeat.

### com.uber.cadence.client
APIs for external application code to interact with Cadence workflows: start workflows, send signals or query workflows.

### com.uber.cadence.workflow
APIs to implement workflows.

### com.uber.cadence.worker
APIs to configure and start workers.

### com.uber.cadence.testing
APIs to write unit tests for workflows.

## [Samples](https://github.com/cadence-workflow/cadence-java-samples/tree/master/src/main/java/com/uber/cadence/samples)
### com.uber.cadence.samples.hello
Samples of how to use the basic feature: activity, local activity, ChildWorkflow, Query, etc.
This is the most important package you need to start with.
### com.uber.cadence.samples.bookingsaga
An end-to-end example to write workflow using SAGA APIs.
### com.uber.cadence.samples.fileprocessing
An end-to-end example to write workflows to download a file, zips it, and uploads it to a destination.

 An important requirement for such a workflow is that while a first activity can run
on any host, the second and third must run on the same host as the first one. This is achieved
 through use of a host specific task list. The first activity returns the name of the host
  specific task list and all other activities are dispatched using the stub that is configured with
 it. This assumes that FileProcessingWorker has a worker running on the same task list.
