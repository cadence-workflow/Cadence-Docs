---
layout: default
title: Target Personas
description: The target users and personas for Cadence.
keywords:
  - cadence target users
  - cadence personas
  - cadence audience
---

Cadence is a platform service that sits between application teams and the infrastructure they run on. Different people interact with different parts of the system: some write workflow code, some operate clusters, and some inspect or remediate running executions without touching application repositories.

This page defines **who Cadence is designed for**, in order of priority. For how each role uses Cadence in practice, including handoffs between teams, see [Target persona interactions](/docs/tech-review/day-0-planning/usability/persona-interactions). For organization types, see [Target organizations](/docs/tech-review/day-0-planning/scope/target-organizations).

## Personas

_In order of priority_

### 1. Application developer

The application developer spends most of their time on business logic. They adopt Cadence when coordination code (retries, timers, state recovery, saga compensation) would otherwise sprawl across databases, queues, and cron jobs.

They need a **code-first SDK** (Go, Java, Python, and community clients) to define workflows and activities, register workers, and test changes safely before production traffic depends on them. They should not need deep knowledge of Cadence server internals to deliver durable applications.

**Core needs:** expressive SDKs, local development path, testing and replay tooling, clear patterns for [use cases](/docs/use-cases/).

**Start here:** [Get started](/docs/get-started/), [Go client](/docs/go-client), [Java client](/docs/java-client/client-overview).

### 2. Platform engineer

The platform engineer installs, configures, and operates Cadence as **shared infrastructure** for many application teams. They own cluster lifecycle, persistence backends, domain boundaries, capacity, upgrades, and baseline security configuration.

In many organizations this function is performed by an **SRE or infrastructure team** rather than a separate platform title. The responsibilities are the same: run Cadence as a service that application teams consume.

They support application developers by providing healthy domains, task lists, observability hooks, and guardrails (quotas, isolation, naming conventions). In mature deployments, one platform team may serve hundreds or thousands of independent workflow domains.

**Core needs:** repeatable install paths (Docker, Kubernetes, Helm), multitenancy, dynamic configuration, integration with org standards.

**Start here:** [Server installation](/docs/get-started/server-installation), [Operation guide](/docs/operation-guide/), [Open source workflow engine](/docs/concepts/open-source-workflow-engine).

### 3. Site reliability engineer (SRE)

The SRE keeps Cadence **reliable and observable in production**. They define SLOs for the control plane, tune alerts, run upgrades and rollbacks, respond to persistence or service incidents, and track resource cost as workflow cardinality grows.

In practice, SRE teams are often the group that **installs Cadence and provides it as an internal service** to application developers, especially in companies without a dedicated platform engineering org. The same team may own initial cluster bootstrap, ongoing operations, and on-call for the Cadence control plane.

They work closely with platform engineers (when those roles are distinct) on cluster health and with application teams when worker saturation, latency, or noisy-neighbor effects trace back to specific domains or task lists.

**Core needs:** metrics, dashboards, runbooks, failure modes, upgrade procedures.

**Start here:** [Monitoring](/docs/operation-guide/monitoring), [Troubleshooting](/docs/operation-guide/troubleshooting).

### 4. Workflow operator

The workflow operator runs **product workflows**: the business processes application teams modeled in Cadence (order flows, onboarding, approvals, batch jobs, and similar), not the Cadence server itself.

They use the **Cadence Web UI and CLI** to work with live executions day to day. That covers incident response as well as routine inspection and data collection. They take **workflow actions that Cadence exposes out of the box**: search and filter executions, read history, run queries, send signals, and perform controlled resets, cancels, or terminations when policy allows.

Common reasons to use these tools:

- **Issues:** investigate stuck, timed-out, or failed workflows and apply approved remediations
- **Inspection:** check progress, state, or milestones for a customer or internal process
- **Data collection:** pull workflow status or query results for reporting, audits, or downstream systems

They do not change workflow source code or deploy workers. They operate within the actions the application team designed into the workflow and documented in org runbooks.

This role is common in support organizations, business operations, customer success, and platform teams that offer self-service access to application owners. Application developers often act as workflow operators for their own domains as well.

**Core needs:** searchable visibility, first-class Web UI and CLI actions, safe operational APIs, audit-friendly actions, batch controls where needed.

**Start here:** [Cadence Web UI](https://github.com/cadence-workflow/cadence-web), [CLI](/docs/cli/), [Search workflows](/docs/concepts/search-workflows).

### 5. Architect / technical evaluator

The architect decides whether Cadence fits a problem space and how adoption should roll out across teams. They compare durable orchestration to ad hoc queues, cron, and state machines; estimate operational cost; and define standards for when new services should use Cadence versus simpler patterns.

**Core needs:** clear scope boundaries, production evidence, integration story, security and compliance pointers.

**Start here:** [Primary use cases](/docs/tech-review/day-0-planning/scope/primary-use-cases), [Vision & Goals](/docs/tech-review/day-0-planning/scope/vision-goals), [Workflow engine concepts](/docs/concepts/workflow-engine).

## Secondary personas

These stakeholders are not the day-to-day users of Cadence, but they influence whether and how it is adopted:

| Persona | Why they matter |
| --- | --- |
| **Security / compliance reviewer** | Approves data handling, encryption, access control, and audit logging before production use. |
| **FinOps / capacity planner** | Models persistence and compute cost for high-cardinality or multitenancy deployments. |
| **Open source contributor** | Extends Cadence, fixes bugs, improves docs, and may advance to [maintainer roles](/community/governance). |
| **Managed service provider** | Operates Cadence for customers; see [ADOPTERS](https://github.com/cadence-workflow/cadence/blob/master/ADOPTERS.md). |

## Persona summary

| Priority | Persona | Primary question |
| --- | --- | --- |
| 1 | Application developer | How do I write durable business logic in code? |
| 2 | Platform engineer | How do I run Cadence as shared infrastructure? |
| 3 | SRE | How do I keep the platform healthy at scale? |
| 4 | Workflow operator | How do I inspect and operate product workflows safely? |
| 5 | Architect | Should we adopt Cadence, and for which workloads? |

## Not sure which persona applies?

Many people span more than one role, especially in smaller teams. **SRE and platform engineer** often describe the same team in practice: the group that runs Cadence as a shared service for application developers. If you are unsure where you fit, reach out and we can point you to the right documentation path.

- [Contact us](https://cadenceworkflow.io/community/contact-us)
- [CNCF Slack `#cadence-users`](https://inviter.co/cncf)
- [GitHub Issues](https://github.com/cadence-workflow/cadence/issues)

## Related documentation

- [Target persona interactions](/docs/tech-review/day-0-planning/usability/persona-interactions)
- [Primary use cases](/docs/tech-review/day-0-planning/scope/primary-use-cases)
- [Target organizations](/docs/tech-review/day-0-planning/scope/target-organizations)
