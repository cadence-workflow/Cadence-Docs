---
layout: default
title: Sovereignty
description: How Cadence addresses data sovereignty requirements.
keywords:
  - cadence sovereignty
  - cadence data sovereignty
  - cadence data residency
  - cadence data ownership
  - cadence self-hosted
---

Cadence is a self-hosted engine. Every component that stores workflow data runs on infrastructure the adopter provisions, in a location the adopter chooses, and the project operates nothing in the data path. Sovereignty in Cadence is therefore mostly a question of which controls exist to constrain where data goes, and where the adopter's own responsibility begins.

This page covers both. Related pages: [Architecture requirements](/docs/tech-review/day-0-planning/design/architecture-requirements) for the components involved, [Identity and access management](/docs/tech-review/day-0-planning/design/iam) for who can reach them, and [Compliance requirements](/docs/tech-review/day-0-planning/design/compliance-requirements) for regulatory posture.

## What Cadence stores, and where

| Data | Where it lives | Placed by |
| --- | --- | --- |
| Workflow execution history and mutable state | Core datastore (Cassandra, MySQL, or PostgreSQL) | Adopter |
| Workflow and activity inputs, outputs, signal payloads, query results | Serialized inside the execution history | Adopter |
| Visibility records, including memo and search attribute values | Visibility store (the same database, or Elasticsearch, OpenSearch, or Pinot) | Adopter |
| Archived histories and visibility records | Blobstore (filestore, S3, or GCS) | Adopter |
| Web UI | Nothing persisted. It queries Frontend per request | Adopter |
| CLI | Nothing, unless an output file is requested explicitly | Adopter |

Cadence serializes every workflow input, output, activity parameter, signal payload, and query response into workflow history, and those payloads are stored as written and readable by anyone with history access. See [Data converter](/docs/concepts/data-converter) for how to change that, covered below.

There is no project-operated service anywhere in this list. A Cadence cluster is the adopter's servers writing to the adopter's databases.

## No runtime dependency on the project

Cadence is [Apache 2.0 licensed](https://github.com/cadence-workflow/cadence/blob/master/LICENSE) with, as the [open source engine](/docs/concepts/open-source-workflow-engine) page puts it, no license key, no usage limits, and no vendor dependency. There is no activation step, no entitlement check, and no per-execution fee. Managed Cadence offerings from third parties run the same open source server, so moving between self-hosted and managed does not change the engine or the data model.

The server does not report usage, metrics, or workflow data to any endpoint the Cadence project controls. Two things are worth naming directly because they look like exceptions and are not:

- The server includes a **client version checker**. It compares a version supplied in the request header against values compiled into the binary. It performs no network call. The check validates compatibility among SDKs, Cadence services, and the database, and can turn off incompatible features to avoid outages.
- The worker service includes a **diagnostics usage emitter**. It publishes to a Kafka topic the adopter configures, for consumption by the adopter's own analytics, and it is skipped entirely when no messaging client is configured. Domain and workflow issues found by diagnostics are also surfaced in the Cadence Web UI so operators can fix them.

**Air-gapped environments.** Cadence can be deployed entirely within a customer's infrastructure using the documented local provisioning setup. For fully air-gapped environments, all required software artifacts and dependencies must be made available within the isolated environment. A dedicated, formally validated air-gapped deployment procedure is not currently documented. See [Get started](/docs/get-started/) and [Server installation](/docs/get-started/server-installation).

## Controlling where data lives

### Cluster placement

The coarsest and strongest control is where the cluster runs. Cadence does not pin itself to any region or provider, so a cluster deployed entirely within one jurisdiction keeps its execution data in that jurisdiction. Cassandra deployments can additionally constrain queries to a single datacenter.

Configuration is layered as `base.yaml`, then an environment file, then an availability zone file, which lets one build carry per-zone placement and endpoint differences. The [mutual TLS](/docs/concepts/mutual-tls) page shows the zone selection flag in use.

### Replication is scoped per domain

This is the most precise residency lever Cadence offers, because replication is a property of each [domain](/docs/concepts/topology) rather than of the cluster:

- Whether a domain is **global** (eligible for replication) or **local** is set when the domain is provisioned and cannot be changed afterward. Local domains cannot be converted to global domains.
- A global domain configured with a single cluster has no standby clusters, essentially making it behave like a local domain. Local domains are discouraged, and this is the preferred way to run a domain with no replication.
- Operators can **add or remove clusters** on a global domain after it exists, which starts or stops replication to those clusters. [Cluster migration](/docs/operation-guide/migration) uses `domain update --clusters` for this, including shrinking the list back to a single cluster.
- Failover changes which of those clusters is  **active**. Active and standby status is per domain, not per cluster. Within a domain, active and standby status can be configured [per-cluster-attribute](https://github.com/cadence-workflow/cadence-idl/blob/d6d4d81fa739ef001913af0060da4b79da56c87b/proto/uber/cadence/api/v1/common.proto#L171-L189) to operate in **active-active mode**. If no cluster attribute is specified, the domain's active cluster is used for processing.

An adopter can therefore run a single cluster serving both replicated and jurisdiction-locked workloads. When registering domains through the CLI, the global domain flag defaults to enabled, so residency-sensitive domains should keep a one-cluster list unless they intend to replicate.

### Archival destinations

Archival is configured per domain, and each domain has its own destination: one URI for history and one for visibility. Different domains can archive to different buckets, regions, or storage providers. Archival can be disabled at the cluster level and independently per domain.

One constraint matters for planning: once a domain enables archival, its URI is set permanently and cannot be changed. See [Archival](/docs/concepts/archival).

### Domains are a logical boundary, not a physical one

Domains isolate names, configuration, retention, and access, but domains in the same cluster share the same physical datastores. When a requirement is that two workloads' data must not reside in the same storage system or jurisdiction, the mechanism is **separate clusters**, not separate domains.

## Keeping sensitive data out of Cadence

Adopters do not have to send payloads to Cadence in readable form. A custom [data converter](/docs/concepts/data-converter) intercepts serialization on the client side, before data reaches the server, and the docs cover three patterns with working samples:

| Pattern | Effect on sovereignty |
| --- | --- |
| Encryption | Payloads can be encrypted client side with any encryption method. Without the key, payloads stored by the server are unreadable to operators browsing history. |
| Claim-check | Payloads can be stored in the adopter's own blob store and only a reference travels through Cadence. The sensitive data never enters the cluster. This is also a useful method for large payloads. |
| Compression | Reduces payload size and storage cost. |

The claim-check pattern is the answer for data that must not leave a specific system at all. Interfaces are documented for the Go and Java clients.

A data converter is not a blanket guarantee, and the boundary is documented: it does **not** cover search attribute values, memo, workflow IDs, run IDs, task list names, timer durations, application logs, or metrics. Anything used for search or routing is stored in the clear by design. Archival guidance makes the same point, advising that workflows should not operate on clear text personally identifiable information, since archived histories can be retained indefinitely.

## Encryption

**In transit.** TLS is configurable on every connection Cadence opens, including client to Frontend (with mutual TLS available), traffic between services, cross-cluster replication traffic, and connections to datastores with CA bundles, client certificates, and hostname verification.

**At rest.** Cadence implements no encryption at rest of its own. Encryption of stored data is delegated to the datastore and blobstore, where it is the adopter's configuration. Payload-level protection is available only client side, through a data converter. Adopters with at-rest requirements should plan to satisfy them in the database and object storage layers.

## Retention and deletion

Each domain has a retention period, bounded by cluster dynamic configuration that defaults to a minimum of 1 day and a maximum of 30. When retention expires, Cadence deletes the execution, its history, its current execution record, and its visibility record. If archival is enabled for both the cluster and the domain, the history and visibility record are archived first.

Targeted deletion, for a single execution rather than by retention, is available through administrative tooling, and its scope should be understood precisely:

| Operation | Removes | Does not remove |
| --- | --- | --- |
| Admin workflow delete (`--remote`) | History branches, mutable state, current execution record, and the visibility record (visibility is deleted only after the execution records succeed) | Already archived blobs |
| Admin workflow delete (direct to the database, no `--remote`) | History branches, mutable state, current execution record | Visibility records, already archived blobs |
| Admin Elasticsearch delete | Visibility documents for supplied executions | Execution history, archives |
| Domain delete | The domain metadata record | Workflow executions, histories, visibility records |

Cadence provides deletion primitives per store rather than a single erasure operation. The server-side admin delete (`--remote`) is the path that also removes visibility. The direct-to-database path does not, which is why a separate Elasticsearch delete command exists. Already archived copies are out of Cadence's hands either way. An adopter satisfying an erasure request today composes these steps, including any archived copies, and should treat that as a runbook they own.

Archival is [documented as best effort](/docs/concepts/archival): a history or visibility record can be removed from primary storage without a corresponding archive copy. That is not the common path, but it is possible under these conditions:

- **Archival was not enabled** for both the cluster and the domain when retention expired. Retention then deletes without attempting to archive. 
- **Admin delete** removes primary records directly and does not run archival.
- **Persistent failures to write the blobstore.** Most of the time Cadence archives **inline**: it writes the record to the blobstore immediately as part of the retention path. If that write fails or takes too long, the history service starts an archival workflow on Cadence workers to retry the upload. That workflow eventually gives up. Primary storage can then be cleaned up without a durable archive copy.

Cadence does not currently guarantee "no delete from primary until archived." That guarantee is listed as planned work on the archival page.

Cadence does not take responsibility for GDPR, EU digital sovereignty, sovereign cloud programs, FIPS, or right-to-erasure. It supplies the controls on this page. Adopters encrypt, place, and delete their data to meet those requirements.

## Related documentation

- [Architecture requirements](/docs/tech-review/day-0-planning/design/architecture-requirements)
- [Production integrations](/docs/tech-review/day-0-planning/usability/production-integrations)
- [Data converter](/docs/concepts/data-converter)
- [Archival](/docs/concepts/archival)
- [Cross-DC replication](/docs/concepts/cross-dc-replication)
- [Mutual TLS](/docs/concepts/mutual-tls)
- [Open source workflow engine](/docs/concepts/open-source-workflow-engine)
- [Topology](/docs/concepts/topology)
