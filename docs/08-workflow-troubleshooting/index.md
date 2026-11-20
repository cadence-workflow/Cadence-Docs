---
layout: default
title: Overview
description: This page provides an overview of the Cadence workflow troubleshooting guide, which helps developers identify and resolve common issues with workflow and activity execution, and links to Workflow Diagnostics, which finds these issues automatically.
keywords:
  - cadence workflow troubleshooting
  - workflow issues
  - activity failures
  - workflow timeouts
  - cadence debugging
  - workflow problems
  - cadence workflow diagnostics
permalink: /docs/workflow-troubleshooting
---

This guide helps you find out why a workflow failed, timed out, or is at risk of doing so, and how to fix it. Each page covers one kind of issue, how it shows up in workflow history, and how to mitigate it.

| Page | Covers |
|---|---|
| [Timeouts](/docs/workflow-troubleshooting/timeouts) | Common causes of timeouts: missing pollers, a task list backlog, and heartbeat timeout and retry policy settings |
| [Activity and Workflow Failures](/docs/workflow-troubleshooting/activity-failures) | Panics, custom and generic errors, and blob size or history size limits |
| [Retries](/docs/workflow-troubleshooting/retries) | How retries show up in history, retry policies that never retry, and heartbeat timeouts that do not help |
| [Antipatterns](/docs/workflow-troubleshooting/antipatterns) | Bursts of activity scheduling, and Continue-As-New in cron workflows |
| [Timeout Risks](/docs/workflow-troubleshooting/timeout-risks) | Activity timeout settings that put the workflow at risk before anything times out |

## Workflow Diagnostics

You do not have to read the history yourself to find these issues. [Workflow Diagnostics](/docs/workflow-troubleshooting/workflow-diagnostics) checks a workflow execution's history for timeouts, failures, retry misconfigurations, timeout risks, and antipatterns. It reports the issues it finds, suggests a root cause where it can, and links each issue to the page above that explains the fix. You can run it from Cadence Web, the CLI, or the frontend API.
