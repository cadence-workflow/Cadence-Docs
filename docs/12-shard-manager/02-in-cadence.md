---
layout: default
title: Cadence Integration
description: How Cadence Matching uses Shard Manager to own task lists, how requests are routed to the owner, and the dynamic config that controls the rollout.
keywords:
  - cadence matching shard manager
  - shard distributor cadence
  - task list ownership
  - matching rollout
  - percentage onboarded
  - shard distributor resolver
permalink: /docs/shard-manager/in-cadence
---

Matching is the only Cadence service whose shards are managed by Shard Manager today. It can be rolled out gradually and is off by default.

## The shard is the task list name

In Matching the shards are the task list names, and the name is the only key used for the lookup. All task lists sharing a name belong to the same shard, across domains and task types.

Matching reports the number of queries per second to the shard, as the _load_ of the shard. This is the load Shard Manager uses to balance the shards across the Matching instances.

Matching's namespace is `ephemeral`, as defined in the [Shard Manager config](https://github.com/cadence-workflow/shard-manager/blob/0887404e2ee97c5ec792fa7311141bc053a3ee15/config/development.yaml#L106-L107). A shard appears the first time someone asks who owns that task list, so there is no fixed shard count to configure.

## Matching as an executor and a spectator

Matching is an example of a service that takes both client roles of the Shard Manager. It executes shards, and it is a spectator, so it is able to send requests to owners of shards the current instance does not know.

As an executor, Matching heartbeats to Shard Manager and runs a shard processor per owned task list name. Stopping a processor shuts down the task list managers for that name, which is how a host gives up a shard. Each executor publishes `tchannel`, `grpc` and `hostIP` in its [heartbeat metadata](https://github.com/cadence-workflow/cadence/blob/68a7c58b827ce1e2fb2b2eeb80faf343d0b138d6/service/matching/handler/engine.go#L263-L267), so callers can reach it.

Frontend, History and Matching all act as spectators. They resolve a task list owner through the [shard distributor resolver](https://github.com/cadence-workflow/cadence/blob/68a7c58b827ce1e2fb2b2eeb80faf343d0b138d6/common/membership/sharddistributorresolver.go#L86-L101), which handles the gradual onboarding. The resolver uses the Matching hash ring for excluded task lists, and when no spectator is configured.

## Configuration

Matching needs the address of the Shard Manager service and a namespace block. From [`config/development.yaml`](https://github.com/cadence-workflow/cadence/blob/68a7c58b827ce1e2fb2b2eeb80faf343d0b138d6/config/development.yaml#L136-L144):

```yaml
shardDistributorClient:
  hostPort: "localhost:7943" # Address of the Shard Manager

shard-distributor-matching:
  namespaces:
    - namespace: cadence-matching-dev # The namespace declared in the Shard Manager config
      heartbeat_interval: 1s # How often the executor heartbeats
      ttl_shard: 5m # How long an unused shard processor is kept
      ttl_report: 1m # How long a shard load report stays valid
```

[`heartbeat_interval`](https://github.com/cadence-workflow/shard-manager/blob/0887404e2ee97c5ec792fa7311141bc053a3ee15/service/sharddistributor/client/clientcommon/config.go#L13) has to be consistent with [`process.heartbeatTTL`](https://github.com/cadence-workflow/shard-manager/blob/0887404e2ee97c5ec792fa7311141bc053a3ee15/service/sharddistributor/config/config.go#L104-L107) on the Shard Manager service. An executor whose last heartbeat is older than `heartbeatTTL` is marked stale and its shards are handed to another host, so the interval has to leave room for a missed heartbeat. The development config pairs a 1s interval with a [2s TTL](https://github.com/cadence-workflow/shard-manager/blob/0887404e2ee97c5ec792fa7311141bc053a3ee15/config/development.yaml#L118-L120).

When `shard-distributor-matching.namespaces` is empty Matching builds a no-op executor and uses the hash ring for everything.

## Controlling the rollout

Two operational dynamic config keys decide whether the ownership of a given task list is decided by Shard Manager or the hash ring.

- [`matching.percentageOnboardedToShardManager`](https://github.com/cadence-workflow/cadence/blob/68a7c58b827ce1e2fb2b2eeb80faf343d0b138d6/common/dynamicconfig/dynamicproperties/constants.go#L4030-L4034)
    - Percentage of task lists routed through Shard Manager. Defaults to `0`.
- [`matching.excludeShortLivedTaskListsFromShardManager`](https://github.com/cadence-workflow/cadence/blob/68a7c58b827ce1e2fb2b2eeb80faf343d0b138d6/common/dynamicconfig/dynamicproperties/constants.go#L5312-L5316)
    - Keeps task lists with a UUID in the name on the ring. Defaults to `true`. Most task lists with UUIDs in them are short lived and low load. This option makes it possible to onboard only the long lived ones.

Operational dynamic config is held in a [config store backed by the primary persistence store](https://github.com/cadence-workflow/cadence/blob/68a7c58b827ce1e2fb2b2eeb80faf343d0b138d6/common/dynamicconfig/dynamicconfigfx/fx.go#L159-L178), separate from the dynamic config, and is updated at runtime with the `cadence admin config` CLI.

To onboard 10 percent of task lists:

```console
cadence admin config operational-update \
    --name matching.percentageOnboardedToShardManager \
    --value '{"Value":10,"Filters":[]}'
```

Use `operational-get` to read the current value, and `operational-restore` to put a key back to its default.

The percentage is applied per task list, using a hash of the name. The same task list always lands on the same side, so raising the percentage adds task lists without moving the ones already onboarded. The logic is in [`tasklist_differentiator.go`](https://github.com/cadence-workflow/cadence/blob/68a7c58b827ce1e2fb2b2eeb80faf343d0b138d6/common/membership/tasklist_differentiator.go#L13-L27).

The percentage also gates the executor. It is read on every heartbeat, so setting it to `0` stops the host heartbeating and hands everything back to the ring.

Each lookup emits the counter [`shard_distributor_resolver_lookups`](https://github.com/cadence-workflow/cadence/blob/68a7c58b827ce1e2fb2b2eeb80faf343d0b138d6/common/metrics/defs.go#L3602), tagged `routing_path` with either `hash_ring` or `shard_distributor`. That is the metric to watch during a rollout.

## Automatic draining

Matching passes a [drain observer](https://github.com/cadence-workflow/cadence/blob/68a7c58b827ce1e2fb2b2eeb80faf343d0b138d6/common/resource/params.go#L110-L114) to the executor client. When the observer signals, the instance heartbeats as draining and Shard Manager transfers its shards to other hosts. The signal is reversible, so when an instance comes back it picks its shards up again.

This is important when an instance is removed from service discovery while the process keeps running. Traffic is routed away from it but it keeps heartbeating. Without a drain signal it will keep owning its shards, even if all other services on the rack are drained.

This is separate from the [operator drains](01-architecture.md#draining) issued with `smctl`. Those mark a shard or a host as drained in etcd, and the mark stays until it is removed by the operator. For the observer the signal is transient. It lives in the executor's heartbeat and clears as soon as the instance is back in service discovery.

The observer is an optional hook. Nothing in the Cadence repository implements it, so a deployment can supply one that watches its own service discovery, following the [`DrainSignalObserver`](https://github.com/cadence-workflow/shard-manager/blob/0887404e2ee97c5ec792fa7311141bc053a3ee15/service/sharddistributor/client/clientcommon/drain_observer.go#L12-L20) interface.
