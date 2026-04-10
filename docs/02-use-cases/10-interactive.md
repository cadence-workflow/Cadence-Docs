---
layout: default
title: Interactive application
permalink: /docs/use-cases/interactive
description: This page explains how Cadence can power interactive applications by tracking UI session state and running background operations concurrently within a single workflow.
keywords:
  - cadence interactive application
  - cadence ui session
  - cadence use case
  - interactive workflow
  - cadence background task
  - cadence session state
---

Cadence is performant and scalable enough to support interactive applications. It can be used to track UI session state and
at the same time execute background operations. For example, while placing an order a customer might need to go through several screens while a background :task: evaluates the customer for fraudulent :activity:.
