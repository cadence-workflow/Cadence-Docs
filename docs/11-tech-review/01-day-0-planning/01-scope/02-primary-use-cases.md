---
layout: default
title: Primary Use Cases
description: Primary, additional, and out-of-scope use cases for Cadence.
keywords:
  - cadence use cases
  - cadence applications
  - cadence out of scope
---

Cadence is a general-purpose durable execution engine for work that spans more than a single request-response cycle. This page summarizes **where Cadence is used in production** at a high level.

For pattern descriptions, runnable samples, and implementation guidance, use the main **[Use cases](/docs/use-cases/)** section. That documentation goes deep on each pattern; this page does not repeat it.

## When Cadence is a good fit

Cadence is worth evaluating when your application needs durability across failures, long runtimes, reliable calls to other services, external events (signals), coordination at scale, or visibility into in-flight work. See [Vision & Goals](/docs/tech-review/day-0-planning/scope/vision-goals) for how Cadence approaches these problems through code-first workflows.

## Primary patterns and production examples

The table below groups common **production examples** under the **patterns** teams use most often. Each pattern links to the corresponding guide in [Use cases](/docs/use-cases/).

| Pattern | Production examples | Learn more |
| --- | --- | --- |
| **Long-running processes** | Background checks, onboarding incentives, subscription management, storage provisioning, catalog or merchant enablement | [Operational management](/docs/use-cases/operational-management), [Provisioning](/docs/use-cases/provisioning), [Orchestration](/docs/use-cases/orchestration) |
| **Synchronous interactions** | Order flows, customer support routing, marketplace configuration | [Interactive applications](/docs/use-cases/interactive), [Event-driven](/docs/use-cases/event-driven) |
| **Microservices orchestration** | Money movements, region or zone infrastructure bring-up, service deployments | [Orchestration](/docs/use-cases/orchestration), [Deployment](/docs/use-cases/deployment) |
| **Batch processing** | Monthly reports, data aggregation | [Batch job](/docs/use-cases/batch-job), [Storage scan](/docs/use-cases/partitioned-scan) |
| **Distributed cron** | Per-customer schedules, recurring business or infra jobs | [Periodic execution](/docs/use-cases/periodic-execution) |
| **Singleton in distributed environments** | One active workflow per resource, mutex-style coordination | [Provisioning](/docs/use-cases/provisioning) (locking by workflow ID) |

Many applications combine several patterns. The [Use cases overview](/docs/use-cases/) lists additional guides, including [polling](/docs/use-cases/polling), [DSL workflows](/docs/use-cases/dsl), and [big data / ML](/docs/use-cases/big-ml).

## Who runs Cadence in production?

Cadence runs in production across finance, delivery, data infrastructure, and platform engineering at organizations listed in [ADOPTERS](https://github.com/cadence-workflow/cadence/blob/master/ADOPTERS.md). See [Workflow engine concepts](/docs/concepts/workflow-engine) for how the engine works under the hood.

## Not sure if Cadence fits?

The examples above reflect common production patterns, not every valid use case. If your scenario is not listed, or you are unsure whether Cadence is the right fit, please reach out. Maintainers and adopters can help map your problem to workflow patterns or suggest alternatives.

- [Contact us](https://cadenceworkflow.io/community/contact-us)
- [CNCF Slack `#cadence-users`](https://inviter.co/cncf)
- [GitHub Issues](https://github.com/cadence-workflow/cadence/issues)

## Related documentation

- **[Use cases](/docs/use-cases/)** (detailed pattern guides and samples)
- [Vision & Goals](/docs/tech-review/day-0-planning/scope/vision-goals)
- [ADOPTERS](https://github.com/cadence-workflow/cadence/blob/master/ADOPTERS.md)
