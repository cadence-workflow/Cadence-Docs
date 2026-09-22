---
layout: default
title: Architecture
description: The general architecture of Shard Manager, dependencies, how it works and limitations.
keywords:
  - shard manager architecture
  - shard distributor
  - etcd leader election
  - shard rebalancing
  - load balancer
  - executor heartbeat
  - etcd
  - shard
  - shards
---

import ArchitectureDiagram from './ArchitectureDiagram';

Shard Manager consists of four parts:

1. The **Shard Manager** service (in some places referred to as the Shard Distributor service), which is the central service doing shard assignments and load balancing, and which acts as the source of truth.
2. An **etcd** instance that persists the assignments, backs the leader election, and notifies the Shard Manager service of changes.
3. The **clients** the applications embed. The clients wrap the interaction with the Shard Manager service. Clients are split into two categories:
    1. **Spectators** are clients that _need to know who owns a shard_. In Cadence an example is Frontend, which proxies requests to the matching and history hosts that own the shard.
    2. **Executors** are clients that _process_ the shards. In Cadence the example is Matching.
4. Lastly **smctl**, our CLI for operating and inspecting Shard Manager.

Everything is scoped to a **namespace**: a named set of shards with its own configuration, its own leader, and its own rebalancing. A namespace is either `fixed`, with a static set of shards sized by `shardNum`, or `ephemeral`, where a shard is created the first time someone asks who owns it.

A service can be _both_ an executor and a spectator, e.g. Cadence Matching is an executor for the task lists it owns, _and_ a spectator when a request arrives for a task list owned by another host.

<ArchitectureDiagram />

From the diagram above we see two important things. First, the client application never interacts with etcd, enabling schema changes, and potentially other persistence stores, without upgrading clients. Second, the Shard Manager service is not in the request path the spectator caches the shard-to-owner mappings and sends the message directly.

## The service

The Shard Manager service is a stateless gRPC service that scales horizontally.

It manages CRUD to the database, as well as caching shard assignments to alleviate pressure on the database. It coalesces writes, and it pushes new shard assignments to spectators via gRPC streams.

It exposes two APIs. `ShardDistributorAPI` handles routing and operations: `GetShardOwner` for lookups, `WatchNamespaceState` for streaming updates to spectators, plus draining and inspection for `smctl`. `ShardDistributorExecutorAPI` is for executors. It has one method, `Heartbeat`: the executor reports status, metadata, and per-shard status; the response carries the current shard assignment of the executor.

The IDLs are found in the [shard-manager repository](https://github.com/cadence-workflow/shard-manager), in [`executor.proto`](https://github.com/cadence-workflow/shard-manager/blob/master/proto/internal/uber/cadence/sharddistributor/v1/executor.proto) and [`service.proto`](https://github.com/cadence-workflow/shard-manager/blob/master/proto/internal/uber/cadence/sharddistributor/v1/service.proto).

## Leader election and the rebalancing loop

Every namespace elects a leader, using etcd. Leadership is deliberately short-lived: a leader holds it for `leaderPeriod` (60s in the shipped development config) and then resigns, so leadership circulates around the instances.

The leader only has one responsibility: it runs the rebalancing loop for its namespace. The loop has two triggers — an etcd watch event telling it the namespace state changed, and a timer.

Each pass the leader:

1. Marks executors whose last heartbeat is older than `heartbeatTTL` as stale. Their shards become eligible for reassignment.
2. Collects shards from draining and lost executors.
3. Reassigns the shards that need new owners, and make necessary load balancing moves.
4. Writes the new assignment to etcd in a single transaction.

We currently provide two load balancers, `NAIVE` and `GREEDY`, selected per namespace. We have seen the best results using the greedy load balancer.

## Draining

The Shard Manager supports draining shards and hosts to operate your system.

**Shard drain** marks specific shards as bad. A drained shard is never assigned, which limits the blast radius of a single bad shard to that shard instead of the whole system.

**Host drain** marks a host as bad. All shards will be removed from the drained host and no new shards will be assigned. This allows the operator to quickly drain a bad host.

## State in etcd

State lives under a configurable prefix, split into a leader store and a main store. The two can point at different etcd clusters.

Per namespace Shard Manager stores executor heartbeats and status, each executor's shard set, per-shard statistics, and the drained shard and host sets.

Write rate scales with executors, not application traffic: one write per executor per `heartbeat_interval`. Data volume scales with the number of shards and executors.

Executor count has a hard limit. The leader writes a rebalance as one etcd transaction, and it compares the `ModRevision` of every executor in the namespace, so the transaction is sized by the total number of executors, not by how many shards moved. etcd's `--max-txn-ops` (default 128) therefore caps a namespace at roughly `--max-txn-ops` executors; a rebalance past that fails.

## Configuration

The service's static configuration lives under `shardDistribution` in its YAML config, e.g:

```yaml
shardDistribution:
  election:
    leaderPeriod: 60s # The time before the leader resigns
    maxRandomDelay: 1s # Max random delay before campaigning
    failedElectionCooldown: 1s # The time to wait after an election attempt errors
  namespaces:
    - name: my-fixed-namespace # Namespace name
      type: fixed # Namespace type
      shardNum: 32 # Number of shards in the fixed namespace
    - name: my-ephemeral-namespace # Namespace name
      type: ephemeral # Namespace type
  leaderStore:
    storageParams:
      endpoints: [localhost:2379] # The etcd endpoint of the leader store
      dialTimeout: 1s # Timeout on connecting
      prefix: "leader" # The prefix to use for the etcd keys
  store:
    storageParams:
      endpoints: [localhost:2379] # The etcd endpoint of the main store
      dialTimeout: 1s # Timeout on connecting
      prefix: "store" # The prefix to use for the etcd keys
  process:
    period: 1s # Max time between rebalances, a state change triggers one sooner
    heartbeatTTL: 2s # The time before a heartbeat is considered stale
```
