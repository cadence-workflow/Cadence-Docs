---
layout: default
title: Introduction to Shard Manager
sidebar_label: Introduction
description: Shard Manager is an open-source, general-purpose sharding service that assigns shards to hosts and keeps them balanced by load as hosts come and go.
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

import ArchitectureDiagram from './ArchitectureDiagramImage';

Shard Manager is an open-source, general-purpose sharding service. It assigns the shards of any sharded application to its hosts, and keeps that assignment balanced by load as hosts come and go. It runs as its own service, backed by etcd, and applications integrate through its Go clients. Cadence Matching is one of the services that uses it.

## Why Shard Manager
A common way to assign shards to hosts is a [consistent hash ring](https://en.wikipedia.org/wiki/Consistent_hashing). Cadence, for example, has long used [Ringpop](https://github.com/uber/ringpop-go). While mathematically and theoretically beautiful, consistent hashing gives a set of problems:

1. **Load Balancing** - A ring balances by shard count, never by shard load. Moving a shard means every host changing its view of the ring at the same instant, and nothing coordinates that. Methods such as virtual nodes make it possible to shuffle the shards, but do not allow fine-grained control.
2. **Graceful Handovers** - When a shard moves in a traditional consistent hash ring, requests will simultaneously go to both owners, causing availability drops. With a centralized Shard Manager we let the old owner drain before the new one takes over. It also opens the door to warming caches on the new owner before the handover, and truly zero-downtime transfers. Graceful handover is not implemented yet.
3. **Debuggability and Introspection** - In a traditional consistent hash ring the state of the shard assignments is spread across all participants, and there is no authority on what the correct state is. A single misbehaving instance can therefore cause issues across the cluster, and shard assignment issues are extremely hard to debug. With central assignment the mapping is a record we can inspect with `smctl`, the Shard Manager CLI.
4. **Operability** - A ring cannot be steered. There is no way to take a single hot shard off a host, or to empty a host ahead of a deploy, without changing the membership list itself.

Shard Manager solves all of these problems by centralizing the assignment decision: balancing by real load, introspection with `smctl`, and operability such as [draining shards and hosts](01-architecture.md#draining).

The diagram below shows how Shard Manager works, with executors processing the shards and spectators routing requests to them.

<ArchitectureDiagram compact />

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
- [Service Integration](03-integration.md). How to add Shard Manager to your own service.
- [cadence-workflow/shard-manager](https://github.com/cadence-workflow/shard-manager). The source, the client libraries, and `smctl`.
