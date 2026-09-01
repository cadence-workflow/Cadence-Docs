---
layout: default
title: Workflow interface
description: This page explains how to define a Cadence workflow interface in Java using @WorkflowMethod, @SignalMethod, and @QueryMethod annotations.
keywords:
  - cadence java workflow interface
  - WorkflowMethod annotation
  - SignalMethod java
  - QueryMethod java
  - cadence java workflow definition
  - java workflow annotations
  - cadence workflow interface java
  - cadence java workflow interface tutorial
permalink: /docs/java-client/workflow-interface
---

:workflow:Workflow: encapsulates the orchestration of :activity:activities: and child :workflow:workflows:.
It can also answer synchronous :query:queries: and receive external :event:events: (also known as :signal:signals:).

## Samples

Runnable workflow-interface samples:

| Sample | Description | Code |
|--------|-------------|------|
| **File processing** | Interface with signal and query methods | [FileProcessingWorkflow.java](https://github.com/cadence-workflow/cadence-java-samples/blob/master/src/main/java/com/uber/cadence/samples/fileprocessing/FileProcessingWorkflow.java) |
| **Signal and query methods** | Workflow interfaces that define signal or query methods | [HelloSignal.java](https://github.com/cadence-workflow/cadence-java-samples/blob/master/src/main/java/com/uber/cadence/samples/hello/HelloSignal.java) · [HelloQuery.java](https://github.com/cadence-workflow/cadence-java-samples/blob/master/src/main/java/com/uber/cadence/samples/hello/HelloQuery.java) |
| **Separate interface and implementation** | Workflow interface and implementation in separate files | [calculation](https://github.com/cadence-workflow/cadence-java-samples/tree/master/src/main/java/com/uber/cadence/samples/calculation) |

---

A :workflow: must define an interface class. All of its methods must have one of the following annotations:

- **@WorkflowMethod** indicates an entry point to a :workflow:. It contains parameters such as timeouts and a :task_list:.
  Required parameters (such as `executionStartToCloseTimeoutSeconds`) that are not specified through the annotation must be provided at runtime.
- **@SignalMethod** indicates a method that reacts to external :signal:signals:. It must have a `void` return type.
- **@QueryMethod** indicates a method that reacts to synchronous :query: requests.

You can have more than one method with the same annotation (except @WorkflowMethod). For example:
```java
public interface FileProcessingWorkflow {

    @WorkflowMethod(executionStartToCloseTimeoutSeconds = 10, taskList = "file-processing")
    String processFile(Arguments args);

    @QueryMethod(name="history")
    List<String> getHistory();

    @QueryMethod(name="status")
    String getStatus();

    @SignalMethod
    void retryNow();

    @SignalMethod
    void abandon();
}
```

We recommended that you use a single value type argument for :workflow: methods. In this way, adding new arguments as fields to the value type is a backwards-compatible change.
