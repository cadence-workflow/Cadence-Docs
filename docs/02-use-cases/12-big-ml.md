---
layout: default
title: Big data and ML
description: This page explains how Cadence is used as a control plane for ETL pipelines and machine learning training and deployment workflows, including model routing to specific hosts.
keywords:
  - cadence big data
  - cadence machine learning
  - cadence ml workflow
  - cadence etl
  - cadence use case
  - cadence ml pipeline
  - cadence task routing
  - cadence big data ml tutorial
permalink: /docs/use-cases/big-ml
---

A lot of companies build custom ETL and ML training and deployment solutions. Cadence is a good fit for a control plane for such applications.

One important feature of Cadence is its ability to route :task: execution to a specific process or host. It is useful to control how ML models and other large files are allocated to hosts. For example, if an ML model is partitioned by city, the requests should be routed to hosts that contain the corresponding city model.

## Samples

Runnable samples related to big data and ML pipelines:

| Sample | Description | Code |
|--------|-------------|------|
| **Long-running optimization** | Particle swarm optimization loop that iterates using continue-as-new | [Go](https://github.com/cadence-workflow/cadence-samples/tree/master/cmd/samples/pso) |
| **Model-to-host routing** | Routes activities to a specific host, as needed for large model files | [Go](https://github.com/cadence-workflow/cadence-samples/tree/master/cmd/samples/fileprocessing) · [Java](https://github.com/cadence-workflow/cadence-java-samples/tree/master/src/main/java/com/uber/cadence/samples/fileprocessing) |
| **Automated research agent** | OpenAI agent workflow that researches a topic end to end | [Python](https://github.com/cadence-workflow/cadence-samples/tree/master/python_sdk_samples/openai_samples/auto-research) |
| **Multi-agent handoffs** | OpenAI agent workflow that hands work off between multiple agents | [Python](https://github.com/cadence-workflow/cadence-samples/tree/master/python_sdk_samples/openai_samples/agent_handoffs) |
