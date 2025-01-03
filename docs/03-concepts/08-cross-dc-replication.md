---
layout: default
title: Cross DC replication
permalink: /docs/concepts/cross-dc-replication
---

# Cross-DC replication
The Cadence Global :domain:Domain: feature provides clients with the capability to continue their :workflow_execution: from another
cluster in the event of a datacenter failover. Although you can configure a Global :domain:Domain: to be replicated to any number of
clusters, it is only considered active in a single cluster.

## Global Domains Architecture
Cadence has introduced a new top level entity, Global :domain:Domains:, which provides support for replication of :workflow:
execution across clusters. A global domain can be configured with more than one clusters, but can only be `active` in one of the clusters at any point of time.
We call it `passive` or `standby` when not active in other clusters.

The number of standby clusters can be zero, if a global domain only configured to one cluster. This is preferred/recommended.

Any workflow of a global domain can only make make progress in its `active` cluster. And the workflow progress is replicated to other `standby` clusters. For example,
starting workflow by calling `StartWorkflow`, or starting activity(by `PollForActivityTask` API), can only be processed in its active cluster. After active cluster made progress,
standby clusters (if any) will poll the history from active to replicate the workflow states.

However, standby clusters can also receive the requests, e.g. for starting workflows or starting activities. They know which cluster the domain is active at.
So the requests can be routed to the active clusters. This is called `api-forwarding` in Cadence. `api-forwarding` makes it possible to have no downtime during failover.
There are two `api-forwarding` policy: `selected-api-forwarding` and `all-domain-api-forwarding` policy.

When using `selected-api-forwarding`, applications need to run different set of activity & workflow :worker:workers: polling on every cluster.
Cadence will only dispatch tasks on the current active cluster; :worker:workers: on the standby cluster will sit idle
until the Global :domain:Domain: is failed over. This is recommended if XDC is being used in multiple clusters running in very remote data centers(regions), which forwarding is expensive to do.

When using `all-domain-api-forwarding`, applications only need to run activity & workflow :worker:workers: polling on one cluster. This makes it easier for the application setup. This is recommended
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
This is also a read-only setting that can only be set when the :domain: is provisioned. A re-replication feature on the
roadmap will allow updating this config to add/remove clusters in the future.

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

#### Failover Global Domain using domain update command(being deprecated in favor of managed graceful failover)
The following command can be used to failover Global :domain:Domain: *my-domain-global* to the *dc2* cluster:

```bash
$ cadence --do my-domain-global d up --ac dc2
```

#### Failover Global Domain using Managed Graceful Failover

First of all, update the domain to enable this feature for the domain
```bash
$ cadence --do test-global-domain-0 d update --domain_data IsManagedByCadence:true
$ cadence --do test-global-domain-1 d update --domain_data IsManagedByCadence:true
$ cadence --do test-global-domain-2 d update --domain_data IsManagedByCadence:true
...
```

Then you can start failover the those global domains using managed failover:
```bash
cadence admin cluster failover start --source_cluster dc1 --target_cluster dc2
```
This will failover all the domains with `IsManagedByCadence:true` from dc1 to dc2.

You can provide more detailed options when using the command, and also watch the progress of the failover.
Feel free to explore the `cadence admin cluster failover` tab.

## Running Locally

The best way is to use Cadence [docker-compose](https://github.com/cadence-workflow/cadence/tree/master/docker):
`docker-compose -f docker-compose-multiclusters.yml up`


## Running in Production

Enable global domain feature needs to be enabled in [static config](/docs/operation-guide/setup/#static-configuration).

Here we use clusterDCA and clusterDCB as an example. We pick clusterDCA as the primary(used to called "master") cluster.
The only difference of being a primary cluster is that it is responsible for domain registration. Primary can be changed later but it needs to be the same across all clusters.

The ClusterMeta config of clusterDCA should be

```yaml
dcRedirectionPolicy:
  policy: "selected-apis-forwarding"

clusterMetadata:
  enableGlobalDomain: true
  failoverVersionIncrement: 10
  masterClusterName: "clusterDCA"
  currentClusterName: "clusterDCA"
  clusterInformation:
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

And ClusterMeta config of clusterDCB should be

```yaml
dcRedirectionPolicy:
  policy: "selected-apis-forwarding"

clusterMetadata:
  enableGlobalDomain: true
  failoverVersionIncrement: 10
  masterClusterName: "clusterDCA"
  currentClusterName: "clusterDCB"
  clusterInformation:
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

After the configuration is deployed:

1. Register a global domain
`cadence --do <domain_name> domain register --global_domain true  --clusters clusterDCA clusterDCB --active_cluster clusterDCA`


2. Run some workflow and failover domain from one to another
`cadence --do <domain_name> domain update  --active_cluster clusterDCB`

Then the domain should be failed over to clusterDCB. Now worklfows are read-only in clusterDCA. So your workers polling tasks from clusterDCA will become idle.

Note 1: that even though clusterDCA is standy/read-only for this domain, it can be active for another domain. So being active/standy is per domain basis not per clusters. In other words, for example if you use XDC in case of DC failure of clusterDCA, you need to failover all domains from clusterDCA to clusterDCB.

Note 2: even though a domain is standy/read-only in a cluster, say clusterDCA, sending write requests(startWF, signalWF, etc) could still work because there is a forwarding component in the Frontend service. It will try to re-route the requests to an active cluster for the domain.
