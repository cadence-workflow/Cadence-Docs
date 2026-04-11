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
permalink: /docs/use-cases/big-ml
---

A lot of companies build custom ETL and ML training and deployment solutions. Cadence is a good fit for a control plane for such applications.

One important feature of Cadence is its ability to route :task: execution to a specific process or host. It is useful to control how ML models and other large files are allocated to hosts. For example, if an ML model is partitioned by city, the requests should be routed to hosts that contain the corresponding city model.
