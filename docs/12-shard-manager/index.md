---
layout: default
title: Introduction
description: Shard Manager is an independent service that assigns shards to the hosts of a sharded application and keeps that assignment balanced as hosts come and go.
keywords:
  - cadence shard manager
  - shard distributor
  - sharding
  - shard assignment
  - consistent hashing alternative
  - cadence matching
  - shards
permalink: /docs/shard-manager
---

:::note Experimental
Shard Manager is a new service. It runs the sharding of Cadence Matching at Uber. It is still pre version 1, so breaking changes may occur.
:::

Shard Manager manages the shards of an application, such as Cadence Matching. It owns the shard-to-owner mapping, and load balances on top of it.

## Why Shard Manager
Cadence historically used [Ringpop](https://github.com/uber/ringpop-go) to manage shards. Ringpop is a traditional [consistent hash ring](https://en.wikipedia.org/wiki/Consistent_hashing). While mathematically and theoretically beautiful, consistent hashing gives a set of problems:

1. **Load Balancing** - A ring balances by shard count, never by shard load. Moving a shard means every host changing its view of the ring at the same instant, and nothing coordinates that. Methods such as virtual nodes make it possible to shuffle the shards, but do not allow fine-grained control.
2. **Graceful Handovers** - When a shard moves in a traditional consistent hash ring, requests will simultaneously go to both owners, causing availability drops. With a centralized Shard Manager we let the old owner drain before the new one takes over. It also opens the door to warming caches on the new owner before the handover, and truly zero-downtime transfers. That is not implemented yet.
3. **Debuggability and Introspection** - In a traditional consistent hash ring the state of the shard assignments is spread across all participants, and there is no authority on what the correct state is. A single misbehaving instance can therefore cause issues across the cluster, and shard assignment issues are extremely hard to debug. With central assignment the mapping is a record we can inspect with `smctl`, the Shard Manager CLI.
4. **Operability** - A ring cannot be steered. There is no way to take a single hot shard off a host, or to empty a host ahead of a deploy, without changing the membership list itself.

Shard Manager solves all of these problems by centralizing the assignment decision: balancing by real load, graceful handovers, introspection with `smctl`, and operability such as [draining shards and hosts](01-architecture.md#draining).

## Running it

Shard Manager needs etcd. The [repository](https://github.com/cadence-workflow/shard-manager) ships a compose file:

```console
docker compose -f docker/github_actions/docker-compose.yml up -d etcd
make bins
./shard-manager-server start --services shard-distributor
```

It reads `config/development.yaml` by default, which points at `localhost:2379`, defines a few development namespaces, and serves gRPC on port `7943`.

To watch it do something, run the canary. It starts executors and a pinger against a fixed and an ephemeral namespace. It is also a good example of how integration with Shard Manager looks:

```console
make start-shard-manager-canary
```


## Where to go next

- [Architecture](01-architecture.md). How the service, etcd, leader election, and rebalancing fit together.
- [cadence-workflow/shard-manager](https://github.com/cadence-workflow/shard-manager). The source, the client libraries, and `smctl`.
