---
layout: default
title: Cluster Maintenance
permalink: /docs/operation-guide/maintain
---

# Cluster Maintenance
This includes how to use and maintain a Cadence cluster for both clients and server clusters.

## Scale up & down Cluster
* When CPU/Memory is getting bottleneck on Cadence instances, you may scale up or add more instances.
* Watch [Cadence metrics](/docs/operation-guide/monitoring/)
  * See if the external traffic to frontend is normal
  * If the slowness is due to too many tasks on a tasklist, you may need to [scale up the tasklist](/docs/operation-guide/maintain/#scale-up-a-tasklist-using-scalable-tasklist-feature)
  * If persistence latency is getting too high, try scale up your DB instance
* Never change the [`numOfShards` of a cluster](/docs/operation-guide/setup/#static-configuration). If you need that because the current one is too small, follow the instructions to [migrate your cluster to a new one](migration).

## Scale up a tasklist using `Scalable tasklist` feature
By default a tasklist is not scalable enough to support hundreds of tasks per second. That’s mainly because each tasklist is assigned to a Matching service node, and dispatching tasks in a tasklist is in sequence.

In the past, Cadence recommended using multiple tasklists to start workflow/activity. You need to make a list of tasklists and randomly pick one when starting workflows. And then when starting workers, let them listen to all the tasklists.

Nowadays, Cadence has a feature called “Scalable tasklist”. It will divide a tasklist into multiple logical partitions, which can distribute tasks to multiple Matching service nodes. By default this feature is not enabled because there is some performance penalty on the server side, plus it’s not common that a tasklist needs to support more than hundreds tasks per second.

You must make a dynamic configuration change in Cadence server to use this feature:

**matching.numTasklistWritePartitions**

and

**matching.numTasklistReadPartitions**

matching.numTasklistWritePartitions is the number of partitions when a Cadence server sends a task to the tasklist.
matching.numTasklistReadPartitions is the number of partitions when your worker accepts a task from the tasklist.

There are a few things to know when using this feature:
* Always make sure `matching.numTasklistWritePartitions <= matching.numTasklistReadPartitions` . Otherwise there may be some tasks that are sent to a tasklist partition but no poller(worker) will be able to pick up.
* Because of above, when scaling down the number of partitions, you must decrease the WritePartitions first, to wait for a certain time to ensure that tasks are drained, and then decrease ReadPartitions.
* Both domain names and taskListName should be specified in the dynamic config. An example of using this feature. See more details about dynamic config format using file based [dynamic config](/docs/operation-guide/setup/#static-configuration).

```yaml
matching.numTasklistWritePartitions:
  - value: 10
    constraints:
      domainName: "samples-domain"
      taskListName: "aScalableTasklistName"
matching.numTasklistReadPartitions:
  - value: 10
    constraints:
      domainName: "samples-domain"
      taskListName: "aScalableTasklistName"
```

NOTE: the value must be integer without double quotes.

## Restarting Cluster
Make sure rolling restart to keep high availability.

## Optimize SQL Persistence
* Connection is shared within a Cadence server host
* For each host, The max number of connections it will consume is maxConn of defaultStore + maxConn of visibilityStore.
* The total max number of connections your Cadence cluster will consume is the summary from all hosts(from Frontend/Matching/History/SysWorker services)
* Frontend and history nodes need both default and visibility Stores, but matching and sys workers only need default Stores, they don't need to talk to visibility DBs.
* For default Stores, history service will take the most connection, then Frontend/Matching. SysWorker will use much less than others
* Default Stores is for Cadence’ core data model, which requires strong consistency. So it cannot use replicas.  VisibilityStore is not for core data models. It’s recommended to use a separate DB for visibility store if using DB based visibility.
* Visibility Stores usually take much less connection as the workload is much lightweight(less QPS and no explicit transactions).
* Visibility Stores require eventual consistency for read. So it can use replicas.
* MaxIdelConns should be less than MaxConns, so that the connections can be distributed better across hosts.


## Upgrading Server

To get notified about release, please subscribe the release of project by : Go to https://github.com/cadence-workflow/cadence -> Click the right top "Watch" button -> Custom -> "Release".

It's recommended to upgrade one minor version at a time. E.g, if you are at 0.10, you should upgrade to 0.11, stabilize it with running some normal workload to make sure that the upgraded server is happy with the schema changes. After ~1 hour, then upgrade to 0.12. then 0.13. etc.

The reason is that for each minor upgrade, you should be able to follow the release notes about what you should do for upgrading. The release notes may require you to run some commands. This will also help to narrow down the cause when something goes wrong.


### How to upgrade:
Things that you may need to do for upgrading a minor version(patch version upgrades should not need it):
* Schema(DB/ElasticSearch) changes
* Configuration format/layout changes
* Data migration -- this is very rare. For example, [upgrading from 0.15.x to 0.16.0 requires a data migration](https://github.com/cadence-workflow/cadence/releases/tag/v0.16.0).

You should read through the release instruction for each minor release to understand what needs to be done.

* Schema changes need to be applied before upgrading server
  * Upgrade MySQL/Postgres schema if applicable
  * Upgrade Cassandra schema if applicable
  * Upgrade ElasticSearch schema if applicable
* Usually schema change is backward compatible. So rolling back usually is not a problem. It also means that Cadence allows running a mixed version of schema, as long as they are all greater than or equal to the required version of the server.
Other requirements for upgrading should be found in the release notes. It may contain information about config changes, or special rollback instructions if normal rollback may cause problems.
* Similarly, data migration should be done before upgrading the server binary.


NOTE: Do not use “auto-setup” images to upgrade your schema. It's mainly for development. At most for initial setup only.


### How to apply DB schema changes
For how to apply database schema, refer to this doc: [SQL tool README](https://github.com/cadence-workflow/cadence/tree/master/tools/sql)
[Cassandra tool README](https://github.com/cadence-workflow/cadence/tree/master/tools/cassandra)

The tool makes use of a table called “schema_versions” to keep track of upgrading History. But there is no transaction guarantee for cross table operations. So in case of some error, you may need to fix or apply schema change manually.
Also, the schema tool by default will upgrade schema to the latest, so no manual is required. ( you can also specify to let it upgrade to any place, like 0.14).

Database schema changes are versioned in the folders: [Versioned Schema Changes](https://github.com/cadence-workflow/cadence/tree/master/schema/mysql/v57/cadence/versioned) for Default Store
and [Versioned Schema Changes](https://github.com/cadence-workflow/cadence/tree/master/schema/mysql/v57/visibility/versioned) for Visibility Store if you use database for basic visibility instead of ElasticSearch.

If you use homebrew, the schema files are located at `/usr/local/etc/cadence/schema/`.

Alternatively, you can checkout the [repo](https://github.com/cadence-workflow/cadence) and the release tag. E.g. `git checkout v0.21.0` and then the schema files is at `./schema/`
