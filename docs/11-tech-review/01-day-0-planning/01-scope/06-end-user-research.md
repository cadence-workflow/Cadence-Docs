---
layout: default
title: End User Research
description: Completed end user research and reports related to Cadence adoption.
keywords:
  - cadence user research
  - cadence adoption research
  - cadence end user feedback
---

Cadence completed three public community survey rounds released from 2023 through 2025. This page aggregates the questions that remained comparable across those rounds: how people use Cadence, the scale of that work, and where users want improvement.

## How Cadence is used

Each survey asked about common Cadence use cases. People could select more than one.

| Use case | Selected |
| --- | ---: |
| Long-running workflows | 68% |
| Microservices orchestration | 42% |
| Batch processing | 42% |
| Distributed cron | 42% |
| Synchronous interactions | 32% |
| Singleton systems | 13% |

Among answers that named an activity scale, 81% reported 1,000 or more activities per month. Twenty-two percent reported at least 10 million activities per month, including 6% at 1 billion or more.

## What users want improved

The wording of the improvement question changed between survey rounds. The table combines labels only where they described the same theme. People could select more than one.

| Improvement area | Selected |
| --- | ---: |
| Documentation | 61% |
| Observability or monitoring | 39% |
| Diagnosing or debugging workflows | 39% |
| Onboarding or getting started | 32% |
| Community support and participation | 29% |

## How the research is used

Survey results are one input to project planning, alongside production usage and direct meetings with open-source users. The [roadmap process](/docs/tech-review/day-0-planning/scope/roadmap-process) describes how the Technical Steering Committee uses those inputs when setting annual scope and accepting projects.

Current work in the recurring feedback areas includes [getting-started guidance](/docs/get-started), [monitoring documentation](/docs/operation-guide/monitoring), and [workflow troubleshooting](/docs/workflow-troubleshooting). These resources address areas identified by the surveys. Survey answers do not map directly to individual project changes.

## Method and limits

The percentages pool individual answers across all three survey rounds and include only people who answered that question. Use-case and improvement questions allowed multiple selections, so their percentages do not total 100%.

Labels were normalized only where their meanings remained comparable. Percentages are rounded to whole numbers. Questions asked in only one or two rounds, including databases, AI agents, CNCF confidence, ratings, workflow-writing experience, testing, and security, are not included in the aggregate tables.

The surveys were voluntary. Their results show the priorities and usage reported by participants, not estimates for every Cadence user.

Raw survey exports are not published because they contain personal and free-text data. An anonymized dataset can be provided on request.

## Related reports and documentation

The [2023 Cadence Community Survey Results](https://github.com/cadence-workflow/Cadence-Docs/blob/master/blog/2023-06-08-survey-results/2023-06-08-survey-results.md) is the previously published year-specific report. The aggregate values on this page were calculated from all three survey rounds.

- [Roadmap process](/docs/tech-review/day-0-planning/scope/roadmap-process)
- [Target personas](/docs/tech-review/day-0-planning/scope/target-personas)
- [Target organizations](/docs/tech-review/day-0-planning/scope/target-organizations)
- [Primary use cases](/docs/tech-review/day-0-planning/scope/primary-use-cases)

