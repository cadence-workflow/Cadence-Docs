---
layout: default
title: Target Organizations
description: Types of organizations that benefit most from adopting Cadence.
keywords:
  - cadence adopters
  - cadence organizations
  - cadence enterprise
  - cadence platform teams
---

Cadence is used by product companies, platform teams, data infrastructure vendors, and managed service providers. What they share is **long-running, failure-prone work** that must stay correct across restarts, outages, and human intervention, and teams that want that logic in **application code** rather than scattered scripts and tables.

This page describes **which organization types Cadence is designed for**, in order of fit. For the people inside those organizations, see [Target personas](/docs/tech-review/day-0-planning/scope/target-personas). For workload patterns, see [Primary use cases](/docs/tech-review/day-0-planning/scope/primary-use-cases).

## Organization types

_In order of fit_

### 1. Product engineering organizations

Product engineering companies build customer-facing or internal software where business processes run for minutes, days, or longer. Typical examples include marketplaces, on-demand services, fintech, subscriptions, logistics, and SaaS platforms.

These organizations adopt Cadence when coordination logic (retries, timers, sagas, signals, visibility into in-flight work) would otherwise spread across databases, message queues, cron jobs, and one-off admin tools. Application teams write workflows in Go, Java, or Python; a central platform or SRE team often runs the shared Cadence cluster.

**Why Cadence fits:** durable execution for tier-1 product flows, searchable workflow history for support and ops, and a path from a single service to hundreds of independent workflow domains on one platform.

**Start here:** [Primary use cases](/docs/tech-review/day-0-planning/scope/primary-use-cases), [Use cases](/docs/use-cases/), [Get started](/docs/get-started/).

### 2. Platform and internal developer platform (IDP) teams

Platform teams make Cadence **available and usable** for many application squads. Some run Cadence themselves: install, operate, define domain boundaries, wire observability, and onboard new teams. Others **consume managed Cadence from a vendor** and focus on internal tooling that bridges Cadence to the rest of the company (developer portals, CI/CD, identity, service catalogs, SDK templates, and domain provisioning workflows).

This pattern is common in mid-size and large companies where an **SRE or platform group provides Cadence as an internal service**, regardless of who hosts the underlying cluster. One environment may host hundreds or thousands of domains with isolation and capacity guardrails.

**Why Cadence fits:** Cadence is self-hostable under Apache 2.0 when teams want full control, and its open APIs and clients also support **managed deployments** where platform engineers add the internal integration layer. See [Vision & Goals](/docs/tech-review/day-0-planning/scope/vision-goals) for multitenancy and scale targets.

**Start here:** [Server installation](/docs/get-started/server-installation), [Operation guide](/docs/operation-guide/), [Open source workflow engine](/docs/concepts/open-source-workflow-engine).

### 3. Data, ML, and AI platform teams

Data and ML platform groups orchestrate **long-running control-plane and pipeline work**: infrastructure provisioning, training jobs, agent workflows, backup and restore, migrations, and fleet maintenance. Cadence coordinates steps across services; it does not replace Spark, Flink, or dedicated analytics engines for bulk data processing.

Organizations in this category often run Cadence alongside Cassandra, Kafka, OpenSearch, and cloud storage. They value fault tolerance, observability, and the ability to resume or inspect multi-hour operations after partial failure.

**Why Cadence fits:** proven patterns for [orchestration](/docs/use-cases/orchestration), [batch jobs](/docs/use-cases/batch-job), [provisioning](/docs/use-cases/provisioning), and emerging AI or agent coordination workloads.

**Start here:** [Orchestration](/docs/use-cases/orchestration), [Batch job](/docs/use-cases/batch-job), [Big data / ML](/docs/use-cases/big-ml).

### 4. Regulated and sovereignty-sensitive enterprises

Enterprises with strict **data residency, audit, or compliance** requirements need a workflow engine they can run entirely inside their boundary. Cadence stores workflow history in the customer's chosen persistence and visibility backends and exposes operational actions through documented APIs and CLI tools.

These organizations often require encryption at rest, access control integration, retention policies, and evidence for security review before production rollout. Self-hosting avoids per-execution SaaS lock-in and keeps workflow payloads in the customer's VPC or region.

**Why Cadence fits:** open-source auditability, multiple persistence options, documented [operation](/docs/operation-guide/) and [security](/docs/tech-review/day-0-planning/security/security-self-assessment) guidance, and deployment from laptop through production Kubernetes.

**Start here:** [Open source workflow engine](/docs/concepts/open-source-workflow-engine), [Vision & Goals](/docs/tech-review/day-0-planning/scope/vision-goals).

### 5. Managed service and cloud infrastructure providers

Vendors that operate **managed platforms for other companies** use Cadence in their control planes and may offer **managed Cadence** as a product. Examples include data platform providers that automate fleet maintenance across tens of thousands of hosts, or vendors packaging Cadence with Cassandra, Kafka, and search infrastructure.

These organizations contribute upstream, appear in [ADOPTERS](https://github.com/cadence-workflow/cadence/blob/master/ADOPTERS.md), and often need predictable upgrade paths, multitenancy, and operational runbooks at scale.

**Why Cadence fits:** neutral OSS foundation vendors can build on, partner ecosystem described in [Vision & Goals](/docs/tech-review/day-0-planning/scope/vision-goals), and production evidence from existing adopters.

**Start here:** [ADOPTERS](https://github.com/cadence-workflow/cadence/blob/master/ADOPTERS.md), [Contact us](https://cadenceworkflow.io/community/contact-us).

### 6. Startups and small engineering teams

Startups and small teams adopt Cadence when a **single product** already needs durable workflows and simpler tools (cron plus queues) are becoming unmaintainable. One engineer may act as developer, operator, and cluster owner as the company grows.

These organizations usually start with the [local quickstart](/docs/get-started/) or Docker, then move to a small Kubernetes cluster or a managed offering as traffic and team size increase.

**Why Cadence fits:** low barrier to evaluation, code-first SDKs familiar to application engineers, and a growth path to shared platform ownership without rewriting workflows.

**Start here:** [Get started](/docs/get-started/), [Target persona interactions](/docs/tech-review/day-0-planning/usability/persona-interactions) (smaller teams section).

## How organizations adopt Cadence

Most deployments follow one of these models:

| Model | Typical owner | When it fits |
| --- | --- | --- |
| **Self-hosted cluster** | Platform or SRE team | Full control, multitenancy, predictable cost at scale, custom compliance |
| **Managed Cadence offering** | Vendor hosts cluster; **platform team integrates internally** | Faster time to production; internal team builds tooling, onboarding, and company-specific guardrails |
| **Team-local / dev cluster** | Application team | Evaluation, POC, or a single service before central platform rollout |

With a managed offering, the vendor typically operates the Cadence cluster and bundled persistence. A **platform engineering team inside the customer organization** still often owns how Cadence is exposed to developers: credentials, domain standards, CI/CD hooks, and operational runbooks.

Regardless of model, successful organizations usually **separate worker code** (owned by product teams) from **cluster operations** (owned by platform or SRE). See [Target persona interactions](/docs/tech-review/day-0-planning/usability/persona-interactions) for how those roles collaborate.

## Industries and production evidence

Cadence runs in production across finance, on-demand services, data infrastructure, and platform engineering. Public adopters and use-case summaries are listed in [ADOPTERS](https://github.com/cadence-workflow/cadence/blob/master/ADOPTERS.md). Industry labels vary, but recurring themes include:

| Theme | Example workload areas |
| --- | --- |
| **Consumer and marketplace products** | Order flows, fulfillment, catalog, onboarding, promotions |
| **Finance and payments** | Money movement, disputes, verification, billing |
| **Infrastructure and platform** | Deployments, region bring-up, maintenance, backup and restore |
| **ML / AI** | Training orchestration, agent workflows, data pipelines |

This list is illustrative, not exhaustive. Many organizations combine several themes on one shared Cadence platform.

## Secondary organization types

These groups are not always Cadence **operators**, but they shape adoption:

| Organization type | Relationship to Cadence |
| --- | --- |
| **Systems integrators and consultancies** | Help customers evaluate, deploy, and harden Cadence in enterprise environments. |
| **Security and compliance functions** | Review data handling, encryption, and access control before org-wide rollout. |

## Organization summary

| Priority | Organization type | Primary question |
| --- | --- | --- |
| 1 | Product engineering | How do we run durable product workflows in code at scale? |
| 2 | Platform / IDP team | How do we make workflow orchestration easy for every team to consume? |
| 3 | Data / ML / AI platform | How do we orchestrate long-running platform and pipeline work reliably? |
| 4 | Regulated enterprise | Can we meet residency and audit needs with a self-hosted engine? |
| 5 | Managed service provider | Can we build or operate Cadence for customers on an OSS foundation? |
| 6 | Startup / small team | Can we start simple and grow without re-platforming later? |

## Not sure if your organization is a fit?

Describe your workload and operating model. Maintainers and adopters can help map your scenario to workflow patterns or suggest alternatives.

- [Contact us](https://cadenceworkflow.io/community/contact-us)
- [CNCF Slack `#cadence-users`](https://inviter.co/cncf)
- [GitHub Issues](https://github.com/cadence-workflow/cadence/issues)

## Related documentation

- [Target personas](/docs/tech-review/day-0-planning/scope/target-personas)
- [Target persona interactions](/docs/tech-review/day-0-planning/usability/persona-interactions)
- [Primary use cases](/docs/tech-review/day-0-planning/scope/primary-use-cases)
- [Vision & Goals](/docs/tech-review/day-0-planning/scope/vision-goals)
- [ADOPTERS](https://github.com/cadence-workflow/cadence/blob/master/ADOPTERS.md)
