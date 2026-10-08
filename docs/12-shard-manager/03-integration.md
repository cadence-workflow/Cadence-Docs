---
layout: default
title: Service Integration
description: How to integrate a new service with Shard Manager as an executor, a spectator, or both, including the client config and routing with YARPC.
keywords:
  - shard manager integration
  - shard distributor client
  - executor client
  - spectator client
  - shard processor
  - yarpc peer chooser
permalink: /docs/shard-manager/integration
---

Integrating a service with Shard Manager means embedding one or both of the Go clients from the [shard-manager repository](https://github.com/cadence-workflow/shard-manager).

- **Executors** are services that own and process shards.
- **Spectators** are services that need to know the owner of a shard.

Generally both roles need to exist in a complete system. Often the same service will assume both roles. The [canary](https://github.com/cadence-workflow/shard-manager/tree/master/service/sharddistributor/canary) assumes both roles, and is a working example of everything on this page.

The examples on this page wire the clients with [fx](https://github.com/uber-go/fx) modules, which is the shortest way to do it. The canary's [fx setup](https://github.com/cadence-workflow/shard-manager/blob/0887404e2ee97c5ec792fa7311141bc053a3ee15/service/sharddistributor/canary/module.go#L30-L98) puts all of it together in one place. The constructors can also be called directly. Matching builds [`executorclient.Params` by hand and calls `NewExecutor`](https://github.com/cadence-workflow/cadence/blob/68a7c58b827ce1e2fb2b2eeb80faf343d0b138d6/service/matching/handler/engine.go#L255-L272).

## Shard Manager config

The namespace for the service needs to be declared in the Shard Manager service config before a client can use it. The canary declares [a fixed and an ephemeral namespace](https://github.com/cadence-workflow/shard-manager/blob/0887404e2ee97c5ec792fa7311141bc053a3ee15/config/development.yaml#L101-L105). A fixed namespace looks like this:

```yaml
shardDistribution:
  namespaces:
    - name: my-service
      type: fixed
      shardNum: 32
```

Fixed namespaces have a fixed set of shards that should always be assigned to an executor, meant for services with a known shard count, such as Cadence History. In an `ephemeral` namespace shards are created on demand. When executors die, their shards are reassigned to active executors. An ephemeral shard leaves the namespace when it reports `DONE`. [Cadence Matching](02-in-cadence.md) uses an ephemeral namespace, with one shard per task list name. `fixed` namespaces require a `shardNum`, `ephemeral` does not.

## Executor integration

### The shard processor

Implement [`ShardProcessor`](https://github.com/cadence-workflow/shard-manager/blob/0887404e2ee97c5ec792fa7311141bc053a3ee15/service/sharddistributor/client/executorclient/client.go#L43-L48). The executor client for Shard Manager creates one `ShardProcessor` per shard assigned to the host. It also manages the life cycle of these using the `Start` and `Stop` methods.

```go
type ShardProcessor interface {
	Start(ctx context.Context) error
	Stop()
	GetShardReport() ShardReport
	SetShardStatus(types.ShardStatus)
}
```

`GetShardReport` returns the load of the shard. The leader balances on that number, so report something that reflects real work, such as requests per second.

The status a processor reports decides whether its shard stays in the namespace. A shard reported as `DONE` [leaves the namespace's active set](https://github.com/cadence-workflow/shard-manager/blob/0887404e2ee97c5ec792fa7311141bc053a3ee15/service/sharddistributor/leader/process/processor.go#L360-L365), so the leader stops assigning it. That is how an ephemeral shard is retired. The executor client marks a shard `DONE` on its own [once it has been idle longer than `ttl_shard`](https://github.com/cadence-workflow/shard-manager/blob/0887404e2ee97c5ec792fa7311141bc053a3ee15/service/sharddistributor/client/executorclient/clientimpl.go#L414-L423).

`SetShardStatus` and the `Status` field of `GetShardReport` are a pair. The processor holds the status, the client writes it, and it should be included on the next heartbeat. Most implementations look like this:

```go
func (p *MyShardProcessor) SetShardStatus(status types.ShardStatus) {
	p.status.Store(int32(status))
}

func (p *MyShardProcessor) GetShardReport() executorclient.ShardReport {
	return executorclient.ShardReport{
		ShardLoad: p.load(),
		Status:    types.ShardStatus(p.status.Load()),
	}
}
```

The ephemeral canary [calls `SetShardStatus(DONE)` on itself](https://github.com/cadence-workflow/shard-manager/blob/0887404e2ee97c5ec792fa7311141bc053a3ee15/service/sharddistributor/canary/processorephemeral/shardprocessor.go#L124-L133) when its work finishes, which is how an application retires a shard of its own accord.

### The shard processor factory

The Executor client needs a `ShardProcessorFactory` that it can use to build a `ShardProcessor` for a given shard ID. The fx module for a single namespace is:

```go
executorclient.ModuleWithNamespace[*MyShardProcessor]("my-service")
```

The `executorclient.Module` fx module works when the config has exactly one namespace. For several namespaces, construct one executor per namespace with `NewExecutorWithNamespace`.

### Using the executor

To serve requests, get the `ShardProcessor` from the executor. The executor is generic, so the returned processor will be your type and you can call your custom methods on it:

```go
proc, err := executor.GetShardProcess(ctx, shardKey)
if errors.Is(err, executorclient.ErrShardProcessNotFound) {
	// this host does not own the shard
	return nil, err
}
if err != nil {
	return nil, err
}

// proc is *MyShardProcessor, so your own methods are available
return proc.HandleRequest(ctx, req)
```

The canary uses it only to [check ownership](https://github.com/cadence-workflow/shard-manager/blob/0887404e2ee97c5ec792fa7311141bc053a3ee15/service/sharddistributor/canary/handler/ping_handler.go#L81-L84) and discards the processor.

Every `GetShardProcess` call [records the shard as used](https://github.com/cadence-workflow/shard-manager/blob/0887404e2ee97c5ec792fa7311141bc053a3ee15/service/sharddistributor/client/executorclient/clientimpl.go#L124-L125), which resets the `ttl_shard` clock. Services should not cache the processor handle. Keep the `GetShardProcess` call on the request path, otherwise the shard will look idle and be retired while it is still working.

`executorclient.Params` has three optional fields. `Metadata` is the map the executor publishes with its heartbeat, typically containing routing information so the callers can find the executor. `Enabled` is read on every heartbeat, which gives you a runtime switch for rolling the executor in and out. `DrainObserver` ties the executor to service discovery, so the host heartbeats as draining when it is pulled out and resumes when it comes back. Matching uses it this way, described under [automatic draining](02-in-cadence.md#automatic-draining).

## Spectator integration

A spectator answers who owns a shard, without processing any:

```go
owner, err := spectator.GetShardOwner(ctx, shardKey)
```

It returns the executor ID and the metadata that executor published. The spectator serves this from a cached view, kept up to date by a gRPC stream, so the lookup is local.

Add the [`spectatorclient.Module()`](https://github.com/cadence-workflow/shard-manager/blob/0887404e2ee97c5ec792fa7311141bc053a3ee15/service/sharddistributor/client/spectatorclient/client.go#L128-L134) fx module to get one spectator per configured namespace. The module also starts and stops them. A spectator built from the constructor needs [starting by hand](https://github.com/cadence-workflow/cadence/blob/68a7c58b827ce1e2fb2b2eeb80faf343d0b138d6/cmd/server/cadence/server.go#L224-L227) before a lookup will work, since the cached view is filled by the stream it opens on start.

## Routing to the owner

If you use YARPC, `SpectatorPeerChooser` does the lookup and the dialing for you. Each call needs a shard key and a namespace header:

```go
client.Ping(ctx, req,
	yarpc.WithShardKey(shardKey),
	yarpc.WithHeader(spectatorclient.NamespaceHeader, "my-service"))
```

The chooser reads `grpc_address` from the owner's metadata, so every executor has to publish it:

```go
executorMetadata := executorclient.ExecutorMetadata{
	clientcommon.GrpcAddressMetadataKey: myGRPCAddress,
}
```

The map reaches the executor through `Params.Metadata`. Under fx, supply it as the canary does with [`fx.Supply`](https://github.com/cadence-workflow/shard-manager/blob/0887404e2ee97c5ec792fa7311141bc053a3ee15/cmd/sharddistributor-canary/main.go#L76-L87). Without it the chooser has no address to dial and the call fails.

A drained shard comes back as `FailedPrecondition`. Retrying will not find an owner, so handle it separately from `Unavailable` in your retry policy.

The spectator and the chooser depend on each other through the YARPC dispatcher. Break the cycle by calling `chooser.SetSpectators` once both exist, as the canary does in [`module.go`](https://github.com/cadence-workflow/shard-manager/blob/0887404e2ee97c5ec792fa7311141bc053a3ee15/service/sharddistributor/canary/module.go#L92-L96).

## Client configuration

Both clients read the same block. The canary [builds it in Go](https://github.com/cadence-workflow/shard-manager/blob/0887404e2ee97c5ec792fa7311141bc053a3ee15/cmd/sharddistributor-canary/main.go#L59-L64) instead of YAML, with one entry for each of its two namespaces:

```yaml
namespaces:
  - namespace: my-service
    heartbeat_interval: 1s # How often the executor heartbeats, and so the write rate to etcd.
    ttl_shard: 5m # How long an unused shard processor is kept before it is marked done
    ttl_report: 1m # How long a shard load report stays valid. Applied by your own GetShardReport
peer_ttl: 2m # How long the peer chooser keeps an idle connection. Defaults to 2m
```

`ttl_report` is used by your processor. The client reads `heartbeat_interval` and `ttl_shard`. For `ttl_report` it is the responsibility of your `GetShardReport` function to respect it. Matching does that by [recomputing the load](https://github.com/cadence-workflow/cadence/blob/68a7c58b827ce1e2fb2b2eeb80faf343d0b138d6/service/matching/tasklist/shard_processor.go#L71-L83) once the previous report is older than the TTL.

Set `heartbeat_interval` against the service's `heartbeatTTL`. An executor whose last heartbeat is older than `heartbeatTTL` is treated as stale and loses its shards, so the interval has to leave room for a missed beat.
