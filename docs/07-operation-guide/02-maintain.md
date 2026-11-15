---
layout: default
title: Cluster Maintenance
description: This page covers how to maintain a Cadence cluster, including scaling up and down, using scalable tasklists, upgrading server versions, and optimizing SQL persistence.
keywords:
  - cadence cluster maintenance
  - cadence scale up
  - scalable tasklist
  - cadence upgrade server
  - cadence maintenance
  - DB schema upgrade
  - cadence-server update-schema
  - tasklist partitions
  - cadence rolling restart
permalink: /docs/operation-guide/maintain
---

This includes how to use and maintain a Cadence cluster for both clients and server clusters.

## Scale up & down Cluster
* When CPU/Memory is getting bottleneck on Cadence instances, you may scale up or add more instances.
* Watch [Cadence metrics](/docs/operation-guide/monitoring/)
  * See if the external traffic to frontend is normal
  * If the slowness is due to too many tasks on a tasklist, you may need to [scale up the tasklist](/docs/operation-guide/maintain/#scale-up-a-tasklist-using-scalable-tasklist-feature)
  * If persistence latency is getting too high, try scale up your DB instance
* Never change the [`numHistoryShards` of an existing cluster](/docs/operation-guide/setup/#static-configuration). If the current value is too small, follow the instructions to [migrate to a new cluster](/docs/operation-guide/migration).

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
* MaxIdleConns should be less than MaxConns, so that the connections can be distributed better across hosts.


## Upgrading Server

To get notified about release, please subscribe the release of project by : Go to https://github.com/cadence-workflow/cadence -> Click the right top "Watch" button -> Custom -> "Release".

Upgrade one minor version at a time. For example, upgrade from version N to N+1 and run a representative workload while the cluster stabilizes. Continue to N+2 only after confirming that the server and the upgraded schema are healthy.

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
* Schema changes are usually backward compatible, so the previous server binary can normally run against the upgraded schema. During a rolling deployment, old and new server binaries can share the cluster after the schema is at least as new as every running binary requires.
Other requirements for upgrading should be found in the release notes. It may contain information about config changes, or special rollback instructions if normal rollback may cause problems.
* Similarly, data migration should be done before upgrading the server binary.


NOTE: Do not use “auto-setup” images to upgrade your schema. It's mainly for development. At most for initial setup only.


### How to apply DB schema changes
There are two ways to apply schema changes:
* `cadence-server update-schema`, available from v1.4.2, updates every configured store with one command. It reads the same configuration as the server.
* The schema tools, `cadence-sql-tool` and `cadence-cassandra-tool`, update one database or keyspace at a time. They remain supported.

Both record the schema version in the same `schema_version` table, so you can use the schema tools for one upgrade and `update-schema` for the next.

#### Using `cadence-server update-schema`
Run the `cadence-server` binary from the release you are about to deploy, with the configuration of your deployment:

```bash
cadence-server --root /etc/cadence --config config --env production update-schema
```

`--root`, `--config`, `--env` and `--zone` must come before `update-schema`. They select the configuration files the same way they do for `cadence-server start`; see [Combining Configuration Files](/docs/operation-guide/setup#combining-configuration-files). You can also set them with `CADENCE_ROOT`, `CADENCE_CONFIG_DIR`, `CADENCE_ENVIRONMENT` and `CADENCE_AVAILABILITY_ZONE`.

The command handles every store in the `persistence` section: the default store, the visibility store when it is a database, and the Elasticsearch or OpenSearch advanced visibility store when one is configured. Pinot is not supported, so keep managing a Pinot schema yourself. For each store, the command:
1. Connects to the store. It retries for up to 90 seconds in total (30 seconds in v1.4.2) so that it can start alongside a database that is still coming up.
2. Creates the database or keyspace if it does not exist. For SQL databases, the configured user needs permission to create databases in that case.
3. Updates the schema to the latest version bundled with the binary. A store without the `schema_version` table gets the latest schema in one step. A store that already has a schema gets each pending versioned update in order.

Elasticsearch and OpenSearch stores have no schema version. For them, the command creates the visibility index from the index template bundled with the binary, or adds the fields that are missing from an existing index. The configured index name must start with `cadence-visibility-`.

The schema files are compiled into the binary, so the command does not need the `schema/` directory. Running it again when every store is up to date changes nothing.

Like the schema tools, `update-schema` should run before you deploy the new server binaries. It is safe to run while the previous version is serving traffic.

If you deploy with the `ubercadence/server` image and the config template it ships, render the configuration the same way the image's start script does, then run the command. Use the image tag of the release you are deploying. Here `cadence.env` holds the environment variables your server containers use, such as `DB` and `POSTGRES_SEEDS`:

```bash
docker run --rm --env-file cadence.env ubercadence/server:v1.4.5 \
  sh -c 'dockerize -template /etc/cadence/config_template.yaml:/etc/cadence/config/docker.yaml && cadence-server --env docker update-schema'
```

From v1.4.5, `update-schema` accepts two options. Each can also be set with an environment variable.

| Option | Environment variable | Description |
|--------|----------------------|-------------|
| `--setup-option key=value` | `CADENCE_SETUP_OPTION_<KEY>=value` | An option used when the command creates a database or keyspace. Repeat the flag to pass more than one option. Only Cassandra reads an option, `replication_factor`, which defaults to `3`. The keyspace uses `NetworkTopologyStrategy` in the configured `datacenter` if one is set, and `SimpleStrategy` otherwise. |
| `--resume` | `CADENCE_SETUP_RESUME=true` | Resume an update that stopped partway through. See below. |

For example, to create a Cassandra keyspace with a replication factor of 1 on a single-node test cluster:

```bash
cadence-server --env development update-schema --setup-option replication_factor=1
```

#### Resuming an interrupted schema update
Schema updates are not transactional. If the process stops after some statements of an update have run, the schema version still points at the previous version. When `update-schema` runs again, it re-applies that update and fails when it reaches a table, column or index that the earlier attempt already created. The error looks like this:

```log
update schema: failed applying schema update v0.8 to postgres/default/localhost:5432/cadence (a previous update may have been interrupted; retry with resume enabled to skip already applied statements): ...
```

From v1.4.5, run the command again with `--resume`. It skips the statements whose schema element already exists, applies the rest and records the new version. Resume only applies to the first pending update of each store, so it can't hide a conflicting statement in a later update. Earlier versions, and the schema tools, require manual repair instead.

#### Schema verification on startup
From v1.4.2, the server also checks every configured store on startup, including the advanced visibility store. A store fails the check if it doesn't exist or its schema is older than the latest schema bundled with the binary. By default, a failed check only logs a `SchemaVerificationV2 failed` warning, and the existing Cassandra and SQL version checks still decide whether the server starts. Set the dynamic config `system.enforceSchemaVerificationV2` to `true` to stop the server from starting when this check fails.

#### Using the schema tools
For how to apply database schema, refer to this doc: [SQL tool README](https://github.com/cadence-workflow/cadence/tree/master/tools/sql)
[Cassandra tool README](https://github.com/cadence-workflow/cadence/tree/master/tools/cassandra)

Use the schema tools and files shipped with the server release you are deploying. Run `cadence-sql-tool` or `cadence-cassandra-tool` for each configured default and visibility store.

The tools use the `schema_version` and `schema_update_history` tables to track schema upgrades. There is no transaction guarantee across all DDL statements and version-table updates, so a partial failure can require manual repair before retrying.

By default, the schema tool upgrades to the latest schema included with the checked-out release. You can also specify a target schema version.

Database schema changes are versioned in the folders: [Versioned Schema Changes](https://github.com/cadence-workflow/cadence/tree/master/schema/mysql/v8/cadence/versioned) for Default Store
and [Versioned Schema Changes](https://github.com/cadence-workflow/cadence/tree/master/schema/mysql/v8/visibility/versioned) for Visibility Store if you use database for basic visibility instead of ElasticSearch.

If you use homebrew, the schema files are located at `/usr/local/etc/cadence/schema/`.

Alternatively, you can checkout the [repo](https://github.com/cadence-workflow/cadence) and the release tag. E.g. `git checkout v0.21.0` and then the schema files is at `./schema/`
