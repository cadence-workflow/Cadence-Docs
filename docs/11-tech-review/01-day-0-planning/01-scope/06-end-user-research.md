---
layout: default
title: End User Research
description: Completed end user research and reports related to Cadence adoption.
keywords:
  - cadence user research
  - cadence adoption research
  - cadence end user feedback
---

Cadence has run three public community surveys: 2023 (15 responses), 2024 (18 responses), and 2025 (6 responses). That is 39 responses in total. The project has not published formal usability studies or user interviews. The sanitized response files are the reports for this question.

## The surveys

| Survey | Responses | Topics asked |
| --- | --- | --- |
| Cadence Community Survey 2023 | 15 | Role, usage stage, activity scale, use cases, improvement areas, support channels |
| Cadence Workflow OSS Community feedback 2024 | 18 | Role, region, languages, usage stage, activity scale, use cases, improvement areas, ratings |
| Cadence Community Survey 2025 | 6 | Languages, usage stage, activity scale, use cases, database, improvement areas, CNCF confidence, AI agents |

The questions changed each year. Counts below are from the [sanitized files](pathname:///data/end-user-research/README.md). Each table lists how many people answered that question.

## Role

| | 2023 (13 of 15) | 2024 (17 of 18) |
| --- | --- | --- |
| Software engineer | 10 | 10 |
| Engineering manager or leader | 2 | 5 |
| SRE | not asked | 2 |
| Developer advocate | 1 | 0 |

The 2025 survey did not ask for role. Two 2023 respondents and one 2024 respondent used a free-text role and are not in this table.

## Usage stage

The 2023 survey used different options from 2024 and 2025. The rows are not the same measure.

**2023 (15 of 15)**

| Option | Count |
| --- | --- |
| Already using | 9 |
| Considering, evaluating | 2 |
| Planning to migrate to Cadence | 2 |
| Onboarding | 1 |
| Testing | 1 |
| Planning to migrate away from Cadence | 0 |

**2024 (18 of 18) and 2025 (6 of 6)**

| Option | 2024 | 2025 |
| --- | --- | --- |
| Using for more than one year | 9 | 2 |
| Started within the last year | 4 | 1 |
| Currently onboarding | 1 | 1 |
| Not using, currently evaluating | 2 | 1 |
| Used to be a user, not using anymore | 2 | 1 |

## Activity scale

Approximate activities per month. The 2023 labels differ slightly from later years (`Up to 1K` versus `Upto 1k`).

| Scale | 2023 (14 of 15) | 2024 (17 of 18) | 2025 (6 of 6) |
| --- | --- | --- | --- |
| Up to 1K | 3 | 1 | 2 |
| 1K to 100K | 5 | 4 | 2 |
| 100K to 10M | 2 | 4 | 2 |
| 10M to 1B | 3 | 2 | 0 |
| 1B+ | 1 | 1 | 0 |
| I don't know | not asked | 5 | 0 |

## Use cases

Respondents could pick more than one.

| Use case | 2023 (14 of 15) | 2024 (17 of 18) | 2025 (6 of 6) |
| --- | --- | --- | --- |
| Long running workflows | 11 | 11 | 4 |
| Batch processing | 8 | 6 | 2 |
| Microservices orchestration | 7 | 7 | 2 |
| Distributed cron | 7 | 6 | 3 |
| Synchronous interactions | 7 | 3 | 2 |
| Singleton in distributed systems | 3 | 2 | 0 |

## Where Cadence needs the most improvement

Respondents could pick more than one. Documentation is at or near the top in every year that asked this question.

| Area | 2023 (15 of 15) | 2024 (7 of 18) | 2025 (5 of 6) |
| --- | --- | --- | --- |
| Documentation | 10 | 4 | 3 |
| Monitoring or observability | 6 | 4 | 1 |
| Debugging | 6 | 4 | 1 |
| Getting started or onboarding | 5 | 1 | 2 |
| Testing | not asked | 4 | 1 |
| Writing workflows | not asked | 1 | 3 |
| Community | 3 | 3 | 2 |

In 2025, all 6 respondents also selected documentation when asked where onboarding needs the most improvement.

## Single-year questions

**Languages.** 2024 (17 of 18): Go 13, Java 7, TypeScript or JavaScript 5, Python 4, .NET 1. 2025 (5 of 6): Java or other JVM 4, Go 2, TypeScript or JavaScript 2, Python 1.

**Region.** Asked in 2024 only (17 of 18): Europe and Middle East 9, Asia Pacific 5, America and Canada 3.

**Database.** Asked in 2025 only (6 of 6): PostgreSQL 6, Cassandra 0, MySQL 0.

**CNCF confidence.** Asked in 2025 only (6 of 6): significantly increased 2, slightly increased 2, no change 2, decreased 0.

**AI or LLM agents.** Asked in 2025 only (6 of 6): none in production or development, 3 interested, 3 no.

**Software rating.** Asked in 2024 only (8 of 18). The eight scores were 2, 7, 9, 9, 9, 9, excellent, excellent. This page does not compute an average from eight answers.

## Limitations

- 39 responses across three years is a small sample. 2025 has 6 responses.
- The surveys were voluntary. These counts do not show how common each answer is among Cadence users.
- Questions and options changed each year, so the tables are three snapshots, not a trend.
- Several 2024 questions were answered by 3 to 8 of 18 people. Those rows include the answered count.

## Reports and data

The published reports are the sanitized CSVs and the README that lists removed columns:

- [Data README](pathname:///data/end-user-research/README.md)
- [2023.csv](pathname:///data/end-user-research/2023.csv)
- [2024.csv](pathname:///data/end-user-research/2024.csv)
- [2025.csv](pathname:///data/end-user-research/2025.csv)

After those files are committed, pin the folder in the CNCF questionnaire with a commit hash:

```text
https://github.com/cadence-workflow/Cadence-Docs/blob/<commit>/static/data/end-user-research/
```

Replace `<commit>` with the hash of the commit that added `static/data/end-user-research/`.

## Related documentation

- [Target personas](/docs/tech-review/day-0-planning/scope/target-personas)
- [Target organizations](/docs/tech-review/day-0-planning/scope/target-organizations)
- [Primary use cases](/docs/tech-review/day-0-planning/scope/primary-use-cases)
