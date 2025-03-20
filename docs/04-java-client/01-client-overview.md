---
layout: default
title: Client SDK Overview
permalink: /docs/java-client/client-overview
---

# Client SDK Overview

- [Cadence Java Samples](https://github.com/cadence-workflow/cadence-java-samples)
- [JavaDoc documentation](https://javadoc.io/doc/com.uber.cadence/cadence-client)

### [com.uber.cadence.activity](https://javadoc.io/doc/com.uber.cadence/cadence-client/latest/com/uber/cadence/activity/Activity.html)
APIs to implement activity: accessing activity info, or sending heartbeat.

### [com.uber.cadence.client](https://javadoc.io/doc/com.uber.cadence/cadence-client/latest/com/uber/cadence/client/package-summary.html)
Client to the Cadence service used to start and query workflows by external processes

### [com.uber.cadence.workflow](https://javadoc.io/doc/com.uber.cadence/cadence-client/latest/com/uber/cadence/workflow/Workflow.html)
APIs to implement workflows.

### [com.uber.cadence.worker](https://javadoc.io/doc/com.uber.cadence/cadence-client/latest/com/uber/cadence/worker/package-summary.html)
APIs to configure and start workers.

### [com.uber.cadence.testing](https://javadoc.io/doc/com.uber.cadence/cadence-client/latest/com/uber/cadence/testing/package-summary.html)
APIs to write unit tests for workflows.

## Cadence Java Samples
### [com.uber.cadence.samples.hello](https://github.com/cadence-workflow/cadence-java-samples/tree/master/src/main/java/com/uber/cadence/samples/hello)
Samples of how to use the basic feature: activity, local activity, ChildWorkflow, Query, etc.
This is the most important package you need to start with.
### [com.uber.cadence.samples.bookingsaga](https://github.com/cadence-workflow/cadence-java-samples/tree/master/src/main/java/com/uber/cadence/samples/bookingsaga)
An end-to-end example to write workflow using SAGA APIs.
### [com.uber.cadence.samples.fileprocessing](https://github.com/cadence-workflow/cadence-java-samples/tree/master/src/main/java/com/uber/cadence/samples/fileprocessing)
An end-to-end example to write workflows to download a file, zips it, and uploads it to a destination.

 An important requirement for such a workflow is that while a first activity can run
on any host, the second and third must run on the same host as the first one. This is achieved
 through use of a host specific task list. The first activity returns the name of the host
  specific task list and all other activities are dispatched using the stub that is configured with
 it. This assumes that FileProcessingWorker has a worker running on the same task list.


## Differences between Java and Golang Clients

While many features are already supported in the Cadence Golang client, some features are missing in the Java client. The Cadence development team aims for feature parity between the two clients, with new features typically being implemented in cadence-go-client first.

### Feature Comparison

| Feature                                                | Go Client | Java Client | Issue |
|--------------------------------------------------------|-----------|-------------|-------|
| **Up to Date Samples**                                 | Supported | No          | [Link](https://github.com/cadence-workflow/cadence-java-samples/issues) |
| **Customer provided context propagator**               | Supported | No          |       |
| **Poller autoscale**                                   | Supported | No          |       |
| **Auto heartbeat[^auto-heartbeat]**                    | Supported | No          |       |
| **Jitter start**                                       | Supported | No          |       |
| **Sessions (sticky activity workers)[^sticky]**        | Supported | No          |       |
| **List all queries supported for a given workflow**    | Supported | No          |       |


[^auto-heartbeat]: heartbeating in java is simple to implement and might be better for end user to determine which type of heart beating is better for the use case rather than add a generic auto-heartbeat mechanism to the client.
[^sticky]: feature needs more traction in order to prioritize
