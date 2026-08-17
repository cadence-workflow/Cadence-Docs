---
layout: default
title: Interactive application
description: This page explains how Cadence can power interactive applications by tracking UI session state and running background operations concurrently within a single workflow.
keywords:
  - cadence interactive application
  - cadence ui session
  - cadence use case
  - interactive workflow
  - cadence background task
  - cadence session state
permalink: /docs/use-cases/interactive
---

Cadence is performant and scalable enough to support interactive applications. It can be used to track UI session state and
at the same time execute background operations. For example, while placing an order a customer might need to go through several screens while a background :task: evaluates the customer for fraudulent :activity:.

## Samples

Runnable interactive-application samples:

| Sample | Description | Code |
|--------|-------------|------|
| **Query workflow state** | Exposes in-progress workflow state to synchronous queries | [Go](https://github.com/cadence-workflow/cadence-samples/tree/master/new_samples/query) · [Java](https://github.com/cadence-workflow/cadence-java-samples/tree/master/src/main/java/com/uber/cadence/samples/query) |
| **Consistent query** | Strongly consistent reads of workflow state | [Go](https://github.com/cadence-workflow/cadence-samples/tree/master/new_samples/consistentquery) |
| **Signal and response** | UI-style interaction: send a signal, then read the workflow's response | [Java](https://github.com/cadence-workflow/cadence-java-samples/blob/master/src/main/java/com/uber/cadence/samples/hello/HelloSignalAndResponse.java) |
| **Human-in-the-loop agent** | Agent workflow that pauses for human approval and answers queries about pending interruptions | [Python](https://github.com/cadence-workflow/cadence-samples/tree/master/python_sdk_samples/openai_samples/human_in_the_loop) |
