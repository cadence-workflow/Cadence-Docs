---
layout: default
title: Target Persona Interactions
description: How target personas should interact with Cadence.
keywords:
  - cadence user interaction
  - cadence developer experience
  - cadence persona
---

Cadence exposes different interfaces depending on what you are trying to do. Application developers spend most of their time in SDKs and tests. Platform engineers and SREs work through deployment manifests, configuration, and observability tools. Workflow operators use the Web UI and CLI to inspect and act on **product workflows** (business processes in flight), whether they are responding to an issue, checking status, or collecting data.

This page describes **how each [persona](/docs/tech-review/day-0-planning/scope/target-personas) interacts with Cadence** and how those roles collaborate across a typical adoption lifecycle.

## Cadence surfaces by persona

| Persona | Primary interfaces | Typical cadence |
| --- | --- | --- |
| Application developer | Language SDKs, unit/replay tests, worker processes | Daily during feature work |
| Platform engineer | Helm charts, static/dynamic config, admin CLI, persistence tooling | Weekly during rollout; ad hoc for domain setup |
| SRE | Prometheus/Grafana (or equivalent), alerts, runbooks, upgrade playbooks | Continuous in production |
| Workflow operator | Cadence Web UI, `cadence` CLI workflow commands | During incidents, support tickets, or routine inspection |
| Architect | Docs, local quickstart, POC clusters | During evaluation and standards definition |

Conceptual background: [Topology](/docs/concepts/topology), [Workflow engine concepts](/docs/concepts/workflow-engine).

## How personas work together

Most successful deployments separate **who writes workflow code** from **who runs the Cadence cluster**. Application teams own business logic and worker deployments; a platform, SRE, or infrastructure team owns the shared Cadence service, persistence, and baseline observability.

In many companies the **SRE team fills both the platform and SRE personas**: they install Cadence, offer it as an internal service to dev teams, and stay on call for production health.

```mermaid
flowchart LR
  A[Architect / evaluator] --> B[Platform engineer]
  B --> C[Application developer]
  C --> D[Workflow operator]
  B --> E[SRE]
  E --> D
  C --> D
```

### Phase 1: Evaluation

An **architect or senior developer** reads [primary use cases](/docs/tech-review/day-0-planning/scope/primary-use-cases) and runs the [local quickstart](/docs/get-started/). The goal is to validate that Cadence's programming model fits the target problem (long-running logic, retries, signals, visibility) better than queues and cron alone.

Deliverables: a short recommendation, a reference workflow for the hardest use case, and a rough sense of domain and worker topology.

### Phase 2: Platform bootstrap

A **platform engineer or SRE team** provisions the first shared cluster (or approves a managed offering), creates domains, configures persistence and visibility stores, and wires metrics into the org monitoring stack. They document naming conventions, domain request process, and resource expectations for new teams.

Deliverables: a production or staging cluster, domain templates, and a "hello workflow" path for onboarding application teams.

### Phase 3: Application onboarding

**Application developers** implement workflows and activities, register workers against agreed task lists, and use SDK testing tools before merging. They rely on the platform team for domain credentials, cluster endpoints, and observability dashboards, not for writing business logic.

Deliverables: worker services in the application's deployment pipeline, integration tests, and runbooks for worker scaling.

### Phase 4: Production operations

**SREs** monitor Cadence service health, persistence latency, and cross-domain isolation. **Workflow operators** (often support, business ops, or application on-call) use the Web UI or CLI to inspect **product workflows**, collect status via queries, or take approved actions (signals, resets, batch operations) when something is wrong or when runbooks call for it. **Application developers** are pulled in when failures indicate a code bug, versioning issue, or non-deterministic change.

Deliverables: alert thresholds, escalation paths, and documented break-glass procedures for operational workflow actions.

### Smaller teams

In startups or single-service organizations, one engineer may cover architect, developer, and operator roles. Cadence still separates **worker code** from **server operations**, but the same person may manage both until the deployment grows.

Mid-size companies often consolidate server operations under an **SRE team** that installs Cadence once and supports many application teams as an internal platform.

## Interaction details by persona

### Application developer

**Goals:** implement durable business processes in ordinary code; ship confidently with tests.

**Typical tasks:**

- Define workflow and activity functions in the [Go](/docs/go-client), [Java](/docs/java-client/client-overview), or [Python client](/docs/python-client/workers) SDK.
- Register workers and poll the task lists assigned by the platform team.
- Use [workflow replay and testing](/docs/codelabs/workflow-tests-go-replayer-shadower) to catch incompatible code changes.
- Start workflows from application services via SDK or gRPC APIs.

**Usually delegated elsewhere:** Cassandra/MySQL/Postgres schema management, Cadence server upgrades, cluster-wide dynamic config.

**Hands off to:** platform engineer (capacity, new domains), workflow operator (production execution issues that need signals/resets without a code deploy).

### Platform engineer

**Goals:** offer Cadence as a dependable internal platform with clear boundaries between teams.

In many organizations an **SRE team performs this role** end to end: installing Cadence, running the cluster, and onboarding application teams. Larger orgs may split platform engineering and SRE into separate groups.

**Typical tasks:**

- Install and upgrade Cadence using [Docker](/docs/get-started/server-installation), [Helm](/docs/get-started/grafana-helm-setup), or vendor-managed options.
- Create and govern **domains** (tenancy boundaries) and advise teams on task list layout.
- Tune [dynamic configuration](/docs/operation-guide/setup) for rate limits, visibility, and multitenancy.
- Integrate Cadence metrics with org-standard dashboards.

**Usually delegated elsewhere:** individual workflow business logic, per-workflow debugging in application code.

**Hands off to:** application developers (worker deployment and workflow definitions), SREs (ongoing alert response and capacity planning at scale).

### Site reliability engineer (SRE)

**Goals:** meet availability and latency targets for the shared Cadence platform; contain blast radius across domains.

At many companies SREs are also the team that **bootstraps Cadence and offers it as a service** to application developers, not only the team that responds to alerts after go-live.

**Typical tasks:**

- Install and upgrade Cadence using [Docker](/docs/get-started/server-installation), [Helm](/docs/get-started/grafana-helm-setup), or vendor-managed options (often owned by the same SRE team that runs production).
- Define SLIs/SLOs on history, matching, and frontend services using [monitoring](/docs/operation-guide/monitoring) signals.
- Run upgrade and rollback procedures documented in the [operation guide](/docs/operation-guide/maintain).
- Investigate persistence saturation, noisy-neighbor domains, and worker backlog growth.
- Partner with FinOps on database and storage cost trends.

**Hands off to:** platform engineer (config or topology changes), application teams (worker scaling or hot task lists tied to a specific service).

### Workflow operator

**Goals:** operate product workflows safely through Cadence's built-in tools, without redeploying application code.

Workflow operators work on **business workflows** (what the product team shipped), not Cadence cluster internals. They may be fixing a production issue, doing a spot check on an execution, or gathering workflow state for reporting. All of this goes through actions readily available in the **Cadence Web UI and CLI**.

**Typical tasks:**

- Search and filter executions in the Web UI or via [CLI](/docs/cli/) (`workflow list`, `workflow show`, history views).
- Run **queries** to read workflow state for inspection or data collection.
- Send **signals** to nudge or unblock a workflow when runbooks allow it.
- Apply approved remediations: reset, terminate, cancel, or batch operations across many executions.
- Escalate to developers when history indicates a code, versioning, or non-determinism defect.

**Usually delegated elsewhere:** changing workflow definitions, deploying new worker binaries, cluster or persistence changes.

**Hands off to:** application developer (bug fix or versioning change), SRE (cluster-wide outage or persistence failure).

### Architect / technical evaluator

**Goals:** decide fit, set adoption standards, and avoid using Cadence where simpler tools suffice.

**Typical tasks:**

- Map candidate workloads to [primary use cases](/docs/tech-review/day-0-planning/scope/primary-use-cases).
- Define when new services should use Cadence versus synchronous APIs or message queues only.
- Review security, data residency, and operational ownership before wide rollout.

**Hands off to:** platform engineer (build vs buy, cluster strategy), application teams (POC implementation).

## Common handoffs

| From | To | Typical trigger |
| --- | --- | --- |
| Architect | Platform engineer | Decision to pilot or standardize on Cadence |
| Platform engineer | Application developer | Domain and cluster ready for worker registration |
| Application developer | Workflow operator | Production workflow stuck, needs signal or inspection |
| Workflow operator | Application developer | Non-deterministic error or logic bug in workflow code |
| SRE | Platform engineer | Cluster config change needed (shards, limits, isolation) |
| Any persona | Maintainers / community | Product question, bug report, or feature gap |

## Getting help

Documentation is organized by task and persona on [cadenceworkflow.io](https://cadenceworkflow.io). When docs are not enough:

- [Contact us](https://cadenceworkflow.io/community/contact-us)
- [CNCF Slack `#cadence-users`](https://inviter.co/cncf) for questions and discussion
- [GitHub Issues](https://github.com/cadence-workflow/cadence/issues) for defects and feature requests
- [Community meetups](/community/meetup) for live Q&A with maintainers

## Related documentation

- [Target personas](/docs/tech-review/day-0-planning/scope/target-personas)
- [UX & UI](/docs/tech-review/day-0-planning/usability/ux-ui)
- [Production integrations](/docs/tech-review/day-0-planning/usability/production-integrations)
- [Use cases](/docs/use-cases/)
