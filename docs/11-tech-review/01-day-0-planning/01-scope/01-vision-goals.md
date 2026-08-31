---
layout: default
title: Vision & Goals
description: Cadence's project vision and long-term goals.
keywords:
  - cadence vision
  - cadence goals
  - cadence mission
---

Cadence is an open-source, fault-tolerant workflow orchestration engine for building durable distributed applications.

## Vision

**Orchestrate with confidence: make complex distributed systems as easy to build as single-process applications.**

Cadence exists so that teams can express multi-step business logic in ordinary application code (Go, Java, Python, and other supported languages) while the platform handles durability, retries, timers, state recovery, and failure isolation. Developers should not have to stitch together databases, message queues, cron jobs, and bespoke retry loops to coordinate work that spans seconds or years.

Cadence was created at Uber to power mission-critical workflows at massive scale. Since joining the [CNCF as a Sandbox project](https://cadenceworkflow.io/blog/2025/10/06/cadence-joins-cncf-cloud-native-computing-foundation) in 2025, the project is governed openly under the Linux Foundation with the goal of making that same production-grade reliability available to any organization building cloud native software.

## Mission

Cadence's mission is to **simplify distributed service development while delivering production-grade reliability at scale**.

Concretely, Cadence:

- **Replaces fragile coordination infrastructure** with durable workflow functions that survive process crashes, network partitions, and downstream outages.
- **Keeps business logic in one place** so teams can reason about, test, and evolve long-running processes without scattering state across tables and queues.
- **Runs anywhere adopters need it** (laptop, Docker, Kubernetes, or managed offerings) under the [Apache 2.0 license](https://github.com/cadence-workflow/cadence/blob/master/LICENSE), with no vendor lock-in on workflow data or execution semantics.
- **Grows through open, merit-based governance** where adopters and contributors can advance to maintainer and [Technical Steering Committee (TSC)](https://cadenceworkflow.io/community/governance) roles based on sustained technical contribution.

## Strategic goals

The Cadence project pursues the following long-term goals. These reflect investments visible in production at Uber and across the broader adopter community, and they guide roadmap and engineering priorities.

### 1. Production reliability at extreme scale

Cadence must remain trustworthy for tier-0 and tier-1 workloads. The project invests deeply in reliability, scalability, multitenancy, and cost efficiency rather than optimizing for demo-friendly features alone.

Cadence targets environments where a single cluster can host **2,000+ domains** with isolation guarantees that matter for platform teams and internal developer platforms.

### 2. Developer productivity through code-first workflows

Cadence is a **code-driven orchestration framework**. Workflows are durable functions written in native programming languages such as Go, Java, and Python. Starting from code gives teams the most flexible foundation: full language features, familiar tooling, testability, and the ability to grow from a small service into a complex production system without hitting the limits of a fixed DSL or config format.

That foundation is what makes Cadence well suited for **production-grade services**. Engineers keep business logic in ordinary code while Cadence handles durability, retries, timers, and recovery. The goal is to cover as much orchestration and distributed-systems overhead as possible (retries, timers, sagas, visibility, batch operations) so teams focus on domain logic. This applies across [orchestration](/docs/use-cases/orchestration), [event-driven](/docs/use-cases/event-driven), [periodic execution](/docs/use-cases/periodic-execution), [operational management](/docs/use-cases/operational-management), [batch processing](/docs/use-cases/batch-job), and emerging areas such as **AI and agent orchestration**.

Cadence is not opposed to low-code or DSL-based experiences. Many teams need visual tools or domain-specific languages for certain users or legacy process definitions. Those layers can be built **on top of** Cadence using Cadence SDKs as presentation or UX layers. They can then naturally inherit fault tolerance, scalability, and durability from the engine underneath. See [DSL workflows](/docs/use-cases/dsl) for an example of this pattern. Cadence starts at the code layer so that both direct SDK adoption and higher-level abstractions remain viable paths.

### 3. Cloud native operability and portability

Cadence aligns with cloud native adoption patterns:

- Deploy from **SQLite** (local dev) through **Docker Compose** to **Kubernetes (Helm)** and production persistence backends (Cassandra, MySQL, PostgreSQL).
- Integrate with standard observability stacks including **Prometheus**, **Grafana**, structured logging, and visibility stores (OpenSearch, Elasticsearch, Pinot).
- Support multi-region and multi-cluster topologies for organizations with sovereignty, residency, and high-availability requirements.

The project aims to be a neutral, self-hostable foundation that platform engineering teams can embed in internal developer platforms without per-execution SaaS pricing or opaque managed-only features.

### 4. Open ecosystem and sustainable governance

Cadence is building a diverse maintainer base beyond any single company. Goals include:

- Transparent roadmaps published on [GitHub Projects](https://github.com/orgs/cadence-workflow/projects).
- Regular community meetings, meetups, and open decision-making documented in [governance](https://cadenceworkflow.io/community/governance).
- Growing the [ADOPTERS](https://github.com/cadence-workflow/cadence/blob/master/ADOPTERS.md) list and contributor pipeline so that companies using Cadence in production can shape its direction.
- Community support through [CNCF Slack `#cadence-users`](https://inviter.co/cncf), GitHub Issues, and maintainer office hours.

Over **150 companies** participate in the Cadence ecosystem today, and partners already offer managed Cadence deployments. The project is committed to supporting end users and to working with companies that want to offer managed Cadence services. Maintainers provide community support for self-hosted adopters and partner with vendors offering managed deployments. See [Contact us](https://cadenceworkflow.io/community/contact-us) for help getting started.

### 5. Long-term project health

Cadence is built to remain a dependable foundation for years, not a short-term experiment. Ongoing priorities include:

- Growing a broad adopter base with production deployments across industries.
- Maintaining clear documentation, operational guidance, and security practices.
- Supply-chain hygiene, dependency management, and responsive security reporting.
- A healthy contributor and maintainer ladder so roadmap work has sustained ownership.

These investments matter whether you are evaluating Cadence for the first time or planning to run it as core infrastructure.

### 6. Durable orchestration for the next generation of workloads

Distributed systems are becoming more dynamic, spanning microservices, event streams, ML pipelines, and AI agents that all need reliable coordination. Cadence aims to be the **durable execution layer** for these workloads: long-running, failure-prone, and stateful by nature.

## What success looks like

Cadence will consider its vision achieved when:

| Stakeholder | Success indicator |
| --- | --- |
| **Application developers** | Can implement multi-step, long-running logic in plain code without building custom durability, retry, or recovery infrastructure. |
| **Platform / SRE teams** | Can operate multi-tenant Cadence clusters predictably, with clear observability, isolation, and cost controls. |
| **Organizations** | Can adopt workflow orchestration without vendor lock-in, with auditable open-source code and multiple deployment and support options. |
| **Contributors** | Can join an active open-source community with transparent governance and a clear path from first PR to maintainer roles. |

## Related documentation

- [Governance](https://cadenceworkflow.io/community/governance): roles, decision-making, and how technical vision is set by the TSC.
- [Cadence joins CNCF](https://cadenceworkflow.io/blog/2025/10/06/cadence-joins-cncf-cloud-native-computing-foundation): announcement and community changes.
- [Cadence in 2025](https://cadenceworkflow.io/blog/2026/01/13/2026-01-13-cadence-in-2025/cadence-in-2025): recent engineering investments aligned with these goals.
