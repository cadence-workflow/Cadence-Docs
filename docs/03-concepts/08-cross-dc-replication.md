---
layout: default
title: Cross DC replication
description: This page explains Cadence Global Domains and cross-datacenter replication, enabling workflows to continue in a different cluster during a datacenter failover.
keywords:
  - cadence cross dc replication
  - cadence global domain
  - cadence failover
  - cadence multi-cluster
  - cadence xdc
  - cadence datacenter replication
  - cadence concepts
  - cadence disaster recovery
permalink: /docs/concepts/cross-dc-replication
---

The Cadence Global :domain:Domain: feature provides clients with the capability to continue their :workflow_execution: from another
cluster in the event of a datacenter failover. Although you can configure a Global :domain:Domain: to be replicated to any number of
clusters, it is only considered active in a single cluster.

## Global Domains Architecture
Cadence has introduced a new top level entity, Global :domain:Domains:, which provides support for replication of :workflow:
execution across clusters. A global domain can be configured with more than one clusters, but can only be `active` in one of the clusters at any point of time.
We call it `passive` or `standby` when not active in other clusters.

The number of standby clusters can be zero, if a global domain only configured to one cluster. This is preferred/recommended.

Any workflow of a global domain can only make progress in its `active` cluster. And the workflow progress is replicated to other `standby` clusters. For example,
starting workflow by calling `StartWorkflow`, or starting activity(by `PollForActivityTask` API), can only be processed in its active cluster. After active cluster made progress,
standby clusters (if any) will poll the history from active to replicate the workflow states.

However, standby clusters can also receive the requests, e.g. for starting workflows or starting activities. They know which cluster the domain is active at.
So the requests can be routed to the active clusters. This is called `api-forwarding` in Cadence. `api-forwarding` makes it possible to have no downtime during failover.
There are four `api-forwarding` policies: `selected-apis-forwarding`, `selected-apis-forwarding-v2`, `all-domain-apis-forwarding`, and `all-domain-apis-forwarding-v2`
(see the [policy definitions](https://github.com/cadence-workflow/cadence/blob/c861d469a5efd3ee3460051b3ab119cb1a02f8f0/service/frontend/wrappers/clusterredirection/policy.go#L41-L79) in the server source).
The default when no policy is configured is `noop` (no forwarding).

When using `selected-apis-forwarding`, applications need to run different set of activity & workflow :worker:workers: polling on every cluster.
Cadence will only dispatch tasks on the current active cluster; :worker:workers: on the standby cluster will sit idle
until the Global :domain:Domain: is failed over. This is recommended if XDC is being used in multiple clusters running in very remote data centers(regions), which forwarding is expensive to do.

When using `all-domain-apis-forwarding`, applications only need to run activity & workflow :worker:workers: polling on one cluster. This makes it easier for the application setup. This is recommended
when clusters are all in local or nearby datacenters.  See more details in [discussion](https://github.com/cadence-workflow/cadence/discussions/4530).

### Conflict Resolution
Unlike local :domain:domains: which provide at-most-once semantics for :activity: execution, Global :domain:Domains: can only support at-least-once
semantics. Cadence global domain relies on asynchronous replication of :event:events: across clusters, so in the event of a failover
it is possible that :activity: gets dispatched again on the new active cluster due to a replication :task: lag. This also
means that whenever :workflow_execution: is updated after a failover by the new cluster, any previous replication :task:tasks:
for that execution cannot be applied. This results in loss of some progress made by the :workflow_execution: in the
previous active cluster. During such conflict resolution, Cadence re-injects any external :event:events: like :signal:Signals: to the
new history before discarding replication :task:tasks:. Even though some progress could rollback during failovers, Cadence
provides the guarantee that :workflow:workflows: won’t get stuck and will continue to make forward progress.

## Global Domain Concepts, Configuration and Operation

### Concepts
#### IsGlobal
This config is used to distinguish :domain:domains: local to the cluster from the global :domain:. It controls the creation of
replication :task:tasks: on updates allowing the state to be replicated across clusters. This is a read-only setting that can
only be set when the :domain: is provisioned.

#### Clusters
A list of clusters where the :domain: can fail over to, including the current active cluster.
The list can be changed after the :domain: is created. Clusters can be added and removed, but an update always sets
the full list, so it must name every cluster you want to keep. You cannot remove the cluster the :domain: is
currently active in, and the update only works when sent to the [primary cluster](#running-in-production).

#### Active Cluster Name
Name of the current active cluster for the Global :domain:Domain:. This config is updated each time the Global :domain:Domain: is failed over to
another cluster.

#### Failover Version
Unique failover version which also represents the current active cluster for Global :domain:Domain:. Cadence allows failover to
be triggered from any cluster, so failover version is designed in a way to not allow conflicts if failover is mistakenly
triggered simultaneously on two clusters.

### Operate by CLI
The Cadence :CLI: can also be used to :query: the :domain: config or perform failovers. Here are some useful commands.

#### Describe Global Domain
The following command can be used to describe Global :domain:Domain: metadata:

```bash
$ cadence --do cadence-canary-xdc d desc
Name: cadence-canary-xdc
Description: cadence canary cross dc testing domain
OwnerEmail: cadence-dev@cadenceworkflow.io
DomainData:
Status: REGISTERED
RetentionInDays: 7
EmitMetrics: true
ActiveClusterName: dc1
Clusters: dc1, dc2
```

#### Failover a Global Domain
The following command can be used to failover Global :domain:Domain: *my-domain-global* to the *dc2* cluster:

```bash
$ cadence --address <dc2-frontend> --do my-domain-global domain failover --active_cluster dc2
```

Run the command against the cluster that should become active, which is currently the passive cluster. Cadence also accepts the command on any other cluster in the group, including the primary cluster, but the intended target is the recommended place to issue it. Two optional flags are worth knowing:

- `--failover_timeout_seconds <seconds>` performs a graceful failover: the incoming active cluster waits up to this duration for pending replication :task:tasks: to drain before taking over, instead of switching immediately.
- `--reason "<text>"` records why the failover happened, for tracking and transparency. Read the recorded failovers back with `cadence --do my-domain-global domain list-failover-history`.

`domain failover` and `domain list-failover-history` were added in server v1.4.0. Older documentation and scripts use `domain update --active_cluster <cluster>` to fail over, which is what you need on earlier versions. Where `domain failover` is available, prefer it: it only changes the active cluster, so it cannot overwrite the rest of the :domain: configuration by accident, and some deployments restrict `domain update` to administrators while still allowing failover.

#### Failover many Global Domains with Managed Failover

Managed failover is an operational convenience for teams that own a large number of :domain:domains:. Rather than issuing one `domain failover` per :domain:, you mark the :domain:domains: a platform team is responsible for and move all of them with a single command. It does not replace the per-domain command above, and a :domain: that is not managed this way is failed over exactly as shown in the previous section.

First, mark each :domain: you want to include in managed failover:
```bash
$ cadence --do test-global-domain-0 domain update --domain_data IsManagedByCadence:true
$ cadence --do test-global-domain-1 domain update --domain_data IsManagedByCadence:true
$ cadence --do test-global-domain-2 domain update --domain_data IsManagedByCadence:true
...
```

Then fail over the whole set with one command:
```bash
cadence admin cluster failover start --source_cluster dc1 --target_cluster dc2
```
This fails over every :domain: with `IsManagedByCadence:true` from dc1 to dc2, in batches, as a workflow you can watch, pause, and resume.

The command accepts more options, including a graceful failover timeout, a batch size, an explicit :domain: list, and a failover drill mode for rehearsing without moving traffic. Run `cadence admin cluster failover --help` for the current set.

## Running Locally

The best way is to use Cadence [docker-compose](https://github.com/cadence-workflow/cadence/tree/master/docker):
`docker-compose -f docker-compose-multiclusters.yml up`


## Running in Production

Every cluster that participates in replication must be listed in the `clusterGroupMetadata` section of the [static config](/docs/operation-guide/setup/#static-configuration) of each cluster.

Here we use clusterDCA and clusterDCB as an example. We pick clusterDCA as the primary(used to called "master") cluster.
The only difference of being a primary cluster is that it is responsible for domain registration. Failover does not have to go through the primary cluster; run `domain failover` on the cluster that should become active. Primary can be changed later but it needs to be the same across all clusters.

The `clusterGroupMetadata` config of clusterDCA should be

```yaml
clusterGroupMetadata:
  failoverVersionIncrement: 10
  primaryClusterName: "clusterDCA"
  currentClusterName: "clusterDCA"
  clusterRedirectionPolicy:
    policy: "selected-apis-forwarding"
  clusterGroup:
    clusterDCA:
      enabled: true
      initialFailoverVersion: 1
      rpcName: "cadence-frontend"
      rpcAddress: "<>:<>"
    clusterDCB:
      enabled: true
      initialFailoverVersion: 0
      rpcName: "cadence-frontend"
      rpcAddress: "<>:<>"
```

And the `clusterGroupMetadata` config of clusterDCB should be

```yaml
clusterGroupMetadata:
  failoverVersionIncrement: 10
  primaryClusterName: "clusterDCA"
  currentClusterName: "clusterDCB"
  clusterRedirectionPolicy:
    policy: "selected-apis-forwarding"
  clusterGroup:
    clusterDCA:
      enabled: true
      initialFailoverVersion: 1
      rpcName: "cadence-frontend"
      rpcAddress: "<>:<>"
    clusterDCB:
      enabled: true
      initialFailoverVersion: 0
      rpcName: "cadence-frontend"
      rpcAddress: "<>:<>"
```

Only `currentClusterName` differs between the two files. The top-level `clusterMetadata` and `dcRedirectionPolicy` keys are the deprecated names for `clusterGroupMetadata` and its nested `clusterRedirectionPolicy`; the server still accepts them and logs a warning at startup, but new configuration should use the names above.

After the configuration is deployed:

1. Register a global domain
`cadence --do <domain_name> domain register --global_domain true  --clusters clusterDCA,clusterDCB --active_cluster clusterDCA`


2. Run some workflow and failover the domain from clusterDCA to clusterDCB. Issue the command against clusterDCB, the cluster that should become active:
`cadence --address <clusterDCB-frontend> --do <domain_name> domain failover --active_cluster clusterDCB`

Then the domain should be failed over to clusterDCB. Now workflows are read-only in clusterDCA. So your workers polling tasks from clusterDCA will become idle.

Note 1: that even though clusterDCA is standy/read-only for this domain, it can be active for another domain. So being active/standy is per domain basis not per clusters. In other words, for example if you use XDC in case of DC failure of clusterDCA, you need to failover all domains from clusterDCA to clusterDCB.

Note 2: even though a domain is standy/read-only in a cluster, say clusterDCA, sending write requests(startWF, signalWF, etc) could still work because there is a forwarding component in the Frontend service. It will try to re-route the requests to an active cluster for the domain.
