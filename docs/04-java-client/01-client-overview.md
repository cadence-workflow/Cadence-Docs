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

While many features are already supported in the Cadence Golang client, some features are still missing in the Java client. The Cadence development team aims for feature parity between the two clients, with new features typically being implemented in Golang first.

### Feature Comparison

| Feature                                                   | Go Client      | Java Client   | Priority |
|-----------------------------------------------------------|----------------|---------------|----------|
| **Shadow tests**                                           | Supported      | No            | P0       |
| **Async APIs**                                             | Supported      | Supported     | P0       |
| **Up to Date Samples**                                    | Supported      | No            | P0       |
| **SonarQube integration for Java client library**         | Supported      | No            | P0       |
| **Client emitted metrics**                                | Supported      | No            | P0       |
| **Same request ID for retries**                           | Supported      | No            | P0       |
| **Cadence canary alerting**                               | Supported      | No            | P0       |
| **Context propagator**                                    | Supported      | No            | P1       |
| **Customer provided context propagator**                  | Supported      | No            | P1       |
| **Poller autoscale**                                       | Supported      | No            | P2       |
| **Auto heartbeat**                                         | Supported      | No            | -        |
| **Jitter start**                                           | Supported      | No            | -        |
| **Migrate from tchannel to gRPC**                         | Supported      | No            | P2       |
| **Missing methods**                                        | Supported      | No            | P2       |
| **Sessions (sticky activity workers)**                    | Supported      | No            | P4       |
| **List all queries supported for a given workflow**       | Supported      | No            | P2       |

### Notes:

1. **P0 (Critical)**: These features are crucial for the Java client and should be prioritized.
2. **P1 (High)**: These features are important for enhancing the Java client.
3. **P2 (Medium)**: Features that would improve the experience but are not critical.
4. **P4 (Low)**: These features have lower priority for now.

### Additional Notes:
- The Java client lacks several advanced features, such as shadow tests and client-emitted metrics, which are currently only supported in the Go client.
- Some features, like "Async APIs" are already supported in the Java client.
- Sessions (sticky activity workers) is currently deprioritized
