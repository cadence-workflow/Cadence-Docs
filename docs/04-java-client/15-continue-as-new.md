---
layout: default
title: Continue As New
description: This page explains how to use ContinueAsNew in Cadence Java workflows to reset execution history for long-running periodic workflows and avoid hitting history size limits.
keywords:
  - cadence continue as new java
  - ContinueAsNew java
  - cadence long running workflow java
  - cadence history size limit
  - cadence workflow reset java
  - cadence periodic workflow java
  - cadence java continueAsNew example
permalink: /docs/java-client/continue-as-new
---

:workflow:Workflows: that need to rerun periodically could naively be implemented as a big **for** loop with
a sleep where the entire logic of the :workflow: is inside the body of the **for** loop. The problem
with this approach is that the history for that :workflow: will keep growing to a point where it
reaches the maximum size enforced by the service.

[**ContinueAsNew**](https://www.javadoc.io/static/com.uber.cadence/cadence-client/2.7.9-alpha/com/cadence-workflow/cadence/workflow/Workflow.html#continueAsNew-java.lang.Object...-)
is the low level construct that enables implementing such :workflow:workflows: without the
risk of failures down the road. The operation atomically completes the current execution and starts
a new execution of the :workflow: with the same **:workflow_ID:**. The new execution will not carry
over any history from the old execution.

```java
@Override
public void greet(String name) {
  activities.greet("Hello " + name + "!");
  Workflow.continueAsNew(name);
}

```
