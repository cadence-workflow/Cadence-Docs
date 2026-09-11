---
layout: default
title: High Availability
description: Cadence high availability requirements and design.
keywords:
  - cadence high availability
  - cadence ha
  - cadence fault tolerance
  - cadence replication
---

To run Cadence in a highly available configuration, an adopter must provide: a replicated, quorum-configured datastore; enough nodes per service role to survive losing one; network reachability between all nodes of all roles, so that the membership and shard-assignment layer can form; and, for cross-region survivability, a second cluster with replication enabled plus their own failover detection. The sections below describe what Cadence provides against each of those requirements.

## Single-cluster resilience

All Cadence service instances are stateless. Durable state lives in the database, so any instance can be replaced without data loss and capacity scales by adding instances. Production guidance recommends at least 4 nodes for each of Frontend, History, and Matching, spread across availability zones. See [Architecture requirements](/docs/tech-review/day-0-planning/design/architecture-requirements) and [Cluster configuration](/docs/operation-guide/setup).

If any node fails, remaining nodes continue serving. For History specifically, shard ownership is reassigned to surviving nodes automatically, without operator intervention. [Architecture requirements](/docs/tech-review/day-0-planning/design/architecture-requirements) notes the membership and shard ownership mechanisms, including the ongoing move of shard assignment to [Shard Manager](https://github.com/cadence-workflow/shard-manager). The recommended SLO targets for a healthy cluster are documented in [Cluster monitoring](/docs/operation-guide/monitoring#cadence-service-slo-recommendation).

## Multi-cluster disaster recovery

[Cross-datacenter replication](/docs/concepts/cross-dc-replication) replicates workflow state between clusters. Replication is scoped per domain, not per cluster: a global domain is active in one cluster at a time, and operator-initiated failover moves it to another. Different domains can be active in different clusters simultaneously, and operators can add or remove clusters on a global domain after creation. An active-active mode is also available, where cluster attributes divide work so that multiple clusters process concurrently. Cadence does not trigger failover automatically; detection and automation of failover triggers is the adopter's responsibility.

API-forwarding policies allow standby clusters to forward requests to the active cluster, making failover seamless from the client's perspective. Because replication is asynchronous, the recovery point during failover is bounded by replication lag. See [Cross-DC replication](/docs/concepts/cross-dc-replication) for forwarding policies, conflict resolution, consistency semantics, and production configuration.

## Datastore availability

Cadence delegates datastore availability to the adopter's infrastructure. The execution store requires strong consistency and cannot be served from replicas, which constrains the replication topologies available to it. See [Architecture requirements](/docs/tech-review/day-0-planning/design/architecture-requirements#production) for the execution and visibility store split, and [Cluster maintenance](/docs/operation-guide/maintain) for operating them.

## Related documentation

- [Cross-DC replication](/docs/concepts/cross-dc-replication)
- [Architecture requirements](/docs/tech-review/day-0-planning/design/architecture-requirements)
- [Sovereignty](/docs/tech-review/day-0-planning/design/sovereignty)
- [Cluster configuration](/docs/operation-guide/setup)
- [Cluster maintenance](/docs/operation-guide/maintain)
- [Cluster monitoring](/docs/operation-guide/monitoring)
- [Cluster migration](/docs/operation-guide/migration)
