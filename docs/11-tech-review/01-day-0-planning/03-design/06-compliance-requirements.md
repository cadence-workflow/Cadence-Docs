---
layout: default
title: Compliance Requirements
description: Compliance requirements addressed by the Cadence project.
keywords:
  - cadence compliance
  - cadence regulatory
  - cadence gdpr
  - cadence audit
  - cadence retention
---

Cadence does not address specific compliance regimes such as GDPR, HIPAA, SOC 2, PCI, FedRAMP, or FIPS, and it is not certified against them. It does supply **technical prerequisites** that adopters use to build a compliant deployment: encryption in transit, an append-only execution history, domain-level retention and archival, payload controls, and access controls. Certifications, evidence packages, and legal determinations sit with the adopter or with a vendor who operates Cadence for them.

This page maps those prerequisites. Placement, residency, and data ownership are on [Sovereignty](/docs/tech-review/day-0-planning/design/sovereignty). Who can call which APIs is on [Identity and access management](/docs/tech-review/day-0-planning/design/iam). License notices and third-party attribution belong in Day 2 [third-party attribution](/docs/tech-review/day-2-operations/compliance/third-party-attribution), not here.

## How Cadence maps to common program needs

| What programs typically require | What Cadence supplies |
| --- | --- |
| Encryption of data in transit | TLS on client, inter-service, replication, and datastore connections, including [mutual TLS](/docs/concepts/mutual-tls) |
| Encryption of data at rest | Datastore and blobstore configuration owned by the adopter; optional client-side [data converter](/docs/concepts/data-converter) encryption or claim-check |
| Audit trail of what a process did | Append-only [workflow event history](/docs/concepts/workflows), searchable through visibility |
| Audit trail of domain changes | Domain audit records for create, update, failover, deprecate, and delete; failover history is listed in Cadence Web and the CLI when that logging is enabled |
| Retention and long-term evidence | Per-domain retention; optional [archival](/docs/concepts/archival) to S3, GCS, or filestore |
| Isolation between teams or applications | [Domains](/docs/concepts/topology) as logical namespaces; separate clusters when data must not share physical storage |
| Access control | Domain-scoped operations, JWT on the [CLI](/docs/cli), mTLS for clients |
| Data residency | Cluster placement and per-domain replication, described on [Sovereignty](/docs/tech-review/day-0-planning/design/sovereignty) |

Cadence is used in regulated industries because those controls can be configured inside the adopter's boundary. Meeting a named framework remains a property of the deployment, not of the project.

## Execution history as an audit trail

Every workflow records an append-only history of events: inputs, activity results, timers, signals, and decisions. That history is the source of truth for what the workflow did and when. Operators inspect it in the Web UI or CLI. Application teams can replay it in tests. After retention, it can be moved to archival storage for longer-lived evidence.

History is an audit of **workflow execution**, not a substitute for an organization-wide audit log of every human or machine that touched the cluster. Signals, terminate, and reset appear in that history. When domain audit logging is enabled, domain create, update, failover, deprecate, and delete are recorded separately as domain audit entries, with the domain state before and after the change. Failover history, the case operators need most often, is queryable through Cadence Web and the CLI. A broader record of who authenticated and which administrative RPC ran is an adopter concern; Day 2 [audit logging](/docs/tech-review/day-2-operations/observability/audit-logging) is the operational counterpart to this page.

Payloads in history, including memo values started from the Go, Java, and Python clients, are stored as written unless a [data converter](/docs/concepts/data-converter) encrypts or offloads them. Search attributes, workflow IDs, run IDs, and task list names do not go through a custom data converter and remain in the clear. Archival guidance is that workflows should not operate on clear text personally identifiable information, because archived histories can be kept indefinitely.

## Retention, archival, and deletion

Each domain has a retention period (cluster defaults bound it between 1 and 30 days). When retention expires, Cadence deletes the execution from primary storage, including its visibility record. History and visibility archival are enabled separately at both the cluster and the domain level, and they run at different points: visibility is archived when the workflow closes, history when retention expires. Archival is [best effort](/docs/concepts/archival): persistent blobstore failures can mean primary data is removed without a durable archive copy.

Targeted deletion of a single execution is available through administrative tooling. The server-side path (`cadence admin workflow delete --remote`) removes history, mutable state, and visibility. Already archived blobs are not deleted. The full sequence and limits are on [Sovereignty](/docs/tech-review/day-0-planning/design/sovereignty#retention-and-deletion).

Adopters who need a defined retention or erasure process compose these primitives, including copies in their own blobstore, and own that runbook.

## Encryption and access

**In transit.** TLS is configurable on every connection Cadence opens. Mutual TLS is documented for clients. Cross-cluster replication traffic can be TLS-wrapped as well.

**At rest.** Cadence does not encrypt the datastore itself. Disk and bucket encryption are configured on Cassandra, MySQL, PostgreSQL, Elasticsearch or OpenSearch, and object storage. Client-side encryption and claim-check keep readable payloads out of Cadence when that is required.

**Access.** Domains bound which workflows and task lists a team operates on. The CLI accepts JWT credentials for authorized administrative commands. Details belong on the [IAM](/docs/tech-review/day-0-planning/design/iam) page.

## Related documentation

- [Sovereignty](/docs/tech-review/day-0-planning/design/sovereignty)
- [Identity and access management](/docs/tech-review/day-0-planning/design/iam)
- [Architecture requirements](/docs/tech-review/day-0-planning/design/architecture-requirements)
- [Archival](/docs/concepts/archival)
- [Data converter](/docs/concepts/data-converter)
- [Mutual TLS](/docs/concepts/mutual-tls)
- [Workflows](/docs/concepts/workflows)
