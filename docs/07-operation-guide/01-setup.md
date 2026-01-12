---
layout: default
title: Cluster Configuration
permalink: /docs/operation-guide/setup
---

This section will help to understand what you need for setting up a Cadence cluster.

You should understand some basic static configuration of Cadence cluster.

There are also many other configuration called "Dynamic Configuration" for fine tuning the cluster. The default values are good to go for small clusters.

Cadence’s minimum dependency is a database(Cassandra or SQL based like MySQL/Postgres). Cadence uses it for persistence. All instances of Cadence clusters are stateless.

For production you also need a metric server(Prometheus/Statsd/M3/etc).

For [advanced features](/docs/operation-guide/setup/#other-advanced-features) Cadence depends on others like Elasticsearch/OpenSearch+Kafka if you need [Advanced visibility feature to search workflows](/docs/concepts/search-workflows/). Cadence will depends on a blob store like S3 if you need to enable [archival feature](/docs/concepts/archival/).

## Static configuration

### Configuration Directory and Files
The default directory for configuration files is named **config/**. This directory contains various configuration files, but not all files will necessarily be used in every scenario.
#### Combining Configuration Files
* Base Configuration: The `base.yaml` file is always loaded first, providing a common configuration that applies to all environments.
* Runtime Environment File: The second file to be loaded is specific to the runtime environment. The environment name can be specified through the `$CADENCE_ENVIRONMENT` environment variable or passed as a command-line argument. If neither option is specified, `development.yaml` is used by default.
* Availability Zone File: If an availability zone is specified (either through the `$CADENCE_AVAILABILITY_ZONE` environment variable or as a command-line argument), a file named after the zone will be merged. For example, if you specify "az1" as the zone, `production_az1.yaml` will be used as well.

To merge `base.yaml`, `production.yaml`, and `production_az1.yaml` files, you need to specify "production" as the runtime environment and "az1" as the zone.
```log
// base.yaml -> production.yaml -> production_az1.yaml = final configuration
```

#### Using Environment Variables
Configuration values can be provided using environment variables with a specific syntax.
`$VAR`: This notation will be replaced with the value of the specified environment variable. If the environment variable is not set, the value will be left blank.
You can declare a default value using the syntax `{$VAR:default}`. This means that if the environment variable VAR is not set, the default value will be used instead.

Note: If you want to include the `$` symbol literally in your configuration file (without interpreting it as an environment variable substitution), escape it by using $$. This will prevent it from being replaced by an environment variable value.

### Understand the basic static configuration

There are quite many configs in Cadence. Here are the most basic configuration that you should understand.

|Config name|Explanation|Recommended value|
| --------- | --------- | ----------------- |
| numHistoryShards | This is the most important one in Cadence config.It will be a fixed number in the cluster forever. The only way to change it is to migrate to another cluster. Refer to Migrate cluster section. <br/>   <br/> Some facts about it: <br/> 1. Each workflow will be mapped to a single shard. Within a shard, all the workflow creation/updates are serialized.  <br/> 2. Each shard will be assigned to only one History node to own the shard, using a Consistent Hashing Ring. Each shard will consume a small amount of memory/CPU to do background processing. Therefore, a single History node cannot own too many shards. You may need to figure out a good number range based on your instance size(memory/CPU).  <br/> 3. Also, you can’t add an infinite number of nodes to a cluster because this config is fixed. When the number of History nodes is closed or equal to numHistoryShards, there will be some History nodes that have no shards assigned to it. This will be wasting resources.   <br/> <br/> Based on above, you don’t want to have a small number of shards which will limit the maximum size of your cluster. You also don’t want to have a too big number, which will require you to have a quite big initial size of the cluster.  <br/>  Also, typically a production cluster will start with a smaller number and then we add more nodes/hosts to it. But to keep high availability, it’s recommended to use at least 4 nodes for each service(Frontend/History/Matching) at the beginning.  | 1K~16K depending on the size ranges of the cluster you expect to run, and the instance size. **Typically 2K for SQL based persistence, and 8K for Cassandra based.**|
| ringpop | This is the config to let all nodes of all services connected to each other. ALL the bootstrap nodes MUST be reachable by ringpop when a service is starting up, within a MaxJoinDuration. defaultMaxJoinDuration is 2 minutes. <br/><br/> It’s not required that bootstrap nodes need to be Frontend/History or Matching. In fact, it can be running none of them as long as it runs Ringpop protocol.  | For dns mode: Recommended to put the DNS of Frontend service <br/><br/> For hosts or hostfile mode: A list of Frontend service node addresses if using hosts mode. Make sure all the bootstrap nodes are reachable at startup. |
| publicClient | The Cadence Frontend service addresses that internal Cadence system(like system workflows) need to talk to. <br/><br/> After connected, all nodes in Ringpop will form a ring with identifiers of what service they serve. Ideally Cadence should be able to get Frontend address from there. But Ringpop doesn’t expose this API yet. | Recommended be DNS of Frontend service, so that requests will be distributed to all Frontend nodes.  <br/><br/>Using localhost+Port or local container IP address+Port will not work if the IP/container is not running frontend |
| services.NAME.rpc | Configuration of how to listen to network ports and serve traffic. <br/><br/> bindOnLocalHost:true will bind on 127.0.0.1. It’s mostly for local development. In production usually you have to specify the IP that containers will use by using bindOnIP <br/><br/> NAME is the matter for the “--services” option in the server startup command.| Name: Use as recommended in development.yaml. bindOnIP : an IP address that the container will serve the traffic with |
| services.NAME.pprof | Golang profiling service , will bind on the same IP as RPC | a port that you want to serve pprof request |
| services.Name.metrics | See Metrics&Logging section | cc |
| clusterMetadata | Cadence cluster configuration. <br/><br/>enableGlobalDomain：true will enable Cadence Cross datacenter replication(aka XDC) feature.<br/><br/>failoverVersionIncrement: This decides the maximum clusters that you will have replicated to each other at the same time. For example 10 is sufficient for most cases.<br/><br/>masterClusterName: a master cluster must be one of the enabled clusters, usually the very first cluster to start. It is only meaningful for internal purposes.<br/><br/>currentClusterName: current cluster name using this config file. <br/><br/>clusterInformation is a map from clusterName to the cluster configure <br/><br/>initialFailoverVersion: each cluster must use a different value from 0 to failoverVersionIncrement-1. <br/><br/>rpcName: must be “cadence-frontend”. Can be improved in this issue. <br/><br/>rpcAddress: the address to talk to the Frontend of the cluster for inter-cluster replication. <br/><br/>Note that even if you don’t need XDC replication right now, if you want to migrate data stores in the future, you should enable xdc from every beginning. You just need to use the same name of cluster for both masterClusterName and  currentClusterName. <br/><br/> Go to [cross dc replication](/docs/concepts/cross-dc-replication/#running-in-production) for how to configure replication in production | As explanation. |
| dcRedirectionPolicy | For allowing forwarding frontend requests from passive cluster to active clusters.  | “selected-apis-forwarding” |
| archival | This is for archival history feature, skip if you don’t need it. Go to [workflow archival](/docs/concepts/archival/#running-in-production) for how to configure archival in production | N/A |
| blobstore | This is also for archival history feature Default cadence server is using file based blob store implementation.  | N/A |
| domainDefaults | default config for each domain. Right now only being used for Archival feature.  | N/A |
| dynamicconfig (previously known as dynamicConfigClient) | Dynamic config is a config manager that enables you to change configs without restarting servers. It’s a good way for Cadence to keep high availability and make things easy to configure. <br/><br/>By default Cadence server uses `filebased` client which allows you to override default configs using a YAML file. However, this approach can be cumbersome in production environment because it's the operator's responsibility to sync the YAML files across Cadence nodes. <br/><br/>Therefore, we provide another option, `configstore` client, that stores config changes in the persistent data store for Cadence (e.g., Cassandra database) rather than the YAML file. This approach shifts the responsibility of syncing config changes from the operator to Cadence service. You can use Cadence CLI commands to list/get/update/restore config changes. <br/><br/>You can also implement the dynamic config interface if you have a better way to manage configs. | Same as the sample development config |
| persistence | Configuration for data store / persistence layer. <br/><br/>Values of DefaultStore VisibilityStore AdvancedVisibilityStore should be keys of map DataStores. <br/><br/>DefaultStore is for core Cadence functionality. <br/><br/>VisibilityStore is for basic visibility feature <br/><br/>AdvancedVisibilityStore is for advanced visibility<br/><br/> Go to [advanced visibility](/docs/concepts/search-workflows/#running-in-production) for detailed configuration of advanced visibility. See [persistence documentation](https://github.com/cadence-workflow/cadence/blob/master/docs/persistence.md) about using different database for Cadence| As explanation |

### The full list of static configuration

Starting from v0.21.0, all the static configuration are defined by GoDocs in details.
|Version|GoDocs Link| Github Link |
| --------- | --------- | --------- |
| v0.21.0 | [Configuration Docs](https://pkg.go.dev/github.com/cadence-workflow/cadence@v0.21.0/common/config#Config) | [Configuration](https://github.com/cadence-workflow/cadence/blob/v0.21.0/common/config/config.go#L37)|
| ...[other higher versions](https://pkg.go.dev/github.com/cadence-workflow/cadence@v0.21.0?tab=versions) | ...Replace the version in the URL of v0.21.0| ...Replace the version in the URL of v0.21.0|


For earlier versions, you can find all the configurations similarly:
|Version|GoDocs Link| Github Link |
| --------- | --------- | --------- |
| v0.20.0 | [Configuration Docs](https://pkg.go.dev/github.com/cadence-workflow/cadence@v0.20.0/common/service/config#Config) | [Configuration](https://github.com/cadence-workflow/cadence/blob/v0.20.0/common/service/config/config.go#L37)|
| v0.19.2 | [Configuration Docs](https://pkg.go.dev/github.com/cadence-workflow/cadence@v0.19.2/common/service/config#Config) | [Configuration](https://github.com/cadence-workflow/cadence/blob/v0.19.2/common/service/config/config.go#L37)|
| v0.18.2 | [Configuration Docs](https://pkg.go.dev/github.com/cadence-workflow/cadence@v0.18.2/common/service/config#Config) | [Configuration](https://github.com/cadence-workflow/cadence/blob/v0.18.2/common/service/config/config.go#L37)|
| v0.17.0 | [Configuration Docs](https://pkg.go.dev/github.com/cadence-workflow/cadence@v0.17.0/common/service/config#Config) | [Configuration](https://github.com/cadence-workflow/cadence/blob/v0.17.0/common/service/config/config.go#L37)|
| ...[other lower versions](https://pkg.go.dev/github.com/cadence-workflow/cadence@v0.20.0?tab=versions) | ...Replace the version in the URL of v0.20.0| ...Replace the version in the URL of v0.20.0 |

## Dynamic Configuration

Dynamic configuration is for fine tuning a Cadence cluster.

There are a lot more dynamic configurations than static configurations. Most of the default values are good for small clusters. As a cluster is scaled up, you may look for tuning it for the optimal performance.

Starting from v0.21.0 with this [change](https://github.com/cadence-workflow/cadence/pull/4156/files), all the dynamic configuration are well defined by GoDocs.
|Version|GoDocs Link| Github Link |
| --------- | --------- | --------- |
| v0.21.0 | [Dynamic Configuration Docs](https://pkg.go.dev/github.com/cadence-workflow/cadence@v0.21.0/common/dynamicconfig#Key) | [Dynamic Configuration](https://github.com/cadence-workflow/cadence/blob/v0.21.0/common/dynamicconfig/constants.go#L58)|
| ...[other higher versions](https://pkg.go.dev/github.com/cadence-workflow/cadence@v0.21.0?tab=versions) | ...Replace the version in the URL of v0.21.0| ...Replace the version in the URL of v0.21.0|

For earlier versions, you can find all the configurations similarly:
|Version|GoDocs Link| Github Link |
| --------- | --------- | --------- |
| v0.20.0 | [Dynamic Configuration Docs](https://pkg.go.dev/github.com/cadence-workflow/cadence@v0.20.0/common/service/dynamicconfig#Key) | [Dynamic Configuration](https://github.com/cadence-workflow/cadence/blob/v0.20.0/common/service/dynamicconfig/constants.go#L53)|
| v0.19.2 | [Dynamic Configuration Docs](https://pkg.go.dev/github.com/cadence-workflow/cadence@v0.19.2/common/service/dynamicconfig#Key) | [Dynamic Configuration](https://github.com/cadence-workflow/cadence/blob/v0.19.2/common/service/dynamicconfig/constants.go#L53)|
| v0.18.2 | [Dynamic Configuration Docs](https://pkg.go.dev/github.com/cadence-workflow/cadence@v0.18.2/common/service/dynamicconfig#Key) | [Dynamic Configuration](https://github.com/cadence-workflow/cadence/blob/v0.18.2/common/service/dynamicconfig/constants.go#L53)|
| v0.17.0 | [Dynamic Configuration Docs](https://pkg.go.dev/github.com/cadence-workflow/cadence@v0.17.0/common/service/dynamicconfig#Key) | [Dynamic Configuration](https://github.com/cadence-workflow/cadence/blob/v0.17.0/common/service/dynamicconfig/constants.go#L53)|
| ...[other lower versions](https://pkg.go.dev/github.com/cadence-workflow/cadence@v0.20.0?tab=versions) | ...Replace the version in the URL of v0.20.0| ...Replace the version in the URL of v0.20.0 |

However, the GoDocs in earlier versions don't contain detailed information. You need to look it up the newer version of GoDocs.
For example, search for "EnableGlobalDomain" in Dynamic Configuration [Comments in v0.21.0](https://github.com/cadence-workflow/cadence/blob/667b7c68e67682a8d23f4b8f93e91a791313d8d6/common/dynamicconfig/constants.go) or [Docs of v0.21.0](https://pkg.go.dev/github.com/cadence-workflow/cadence@v0.21.0/common/dynamicconfig#Key), as the usage of DynamicConfiguration never changes.


* **KeyName** is the key that you will use in the dynamicconfig yaml content
* **Default value** is the default value
* **Value type** indicates the type that you should change the yaml value of:
  * Int should be integer like 123
  * Float should be number like 123.4
  * Duration should be Golang duration like: 10s, 2m, 5h for 10 seconds, 2 minutes and 5 hours.
  * Bool should be true or false
  * Map should be map of yaml
* **Allowed filters** indicates what kinds of filters you can set as constraints with the dynamic configuration.
  * `DomainName` can be used with `domainName`
  * `N/A` means no filters can be set. The config will be global.

For example, if you want to change the ratelimiting for List API, below is the config:
```clike
// FrontendVisibilityListMaxQPS is max qps frontend can list open/close workflows
// KeyName: frontend.visibilityListMaxQPS
// Value type: Int
// Default value: 10
// Allowed filters: DomainName
FrontendVisibilityListMaxQPS
```

Then you can add the config like:
```yaml
frontend.visibilityListMaxQPS:
  - value: 1000
  constraints:
    domainName: "domainA"
  - value: 2000
  constraints:
    domainName: "domainB"
```
You will expect to see `domainA` will be able to perform 1K List operation per second, while `domainB` can perform 2K per second.


NOTE 1: the size related configuration numbers are based on byte.

NOTE 2: for `<frontend,history,matching>.persistenceMaxQPS` versus `<frontend,history,matching>.persistenceGlobalMaxQPS` ---  persistenceMaxQPS is local for single node while persistenceGlobalMaxQPS is global for all node. persistenceGlobalMaxQPS is preferred if set as greater than zero. But by default it is zero so persistenceMaxQPS is being used.

### How to update Dynamic Configuration

#### File-based client

By default, Cadence uses file-based client to manage dynamic configurations. Following are the approaches to changing dynamic configs using a yaml file.

* Local docker-compose by mounting volume: 1. Change the dynamic configs in `cadence/config/dynamicconfig/development.yaml`. 2. Update the `cadence` section in the docker compose file and mount `dynamicconfig` folder to host machine like the following:
```yaml
cadence:
  image: ubercadence/server:master-auto-setup
  ports:
    # ...(don't change anything here)
  environment:
    # ...(don't change anything here)
    - "DYNAMIC_CONFIG_FILE_PATH=/etc/custom-dynamicconfig/development.yaml"
  volumes:
    - "/Users/<?>/cadence/config/dynamicconfig:/etc/custom-dynamicconfig"
```

* Local docker-compose by logging into the container: run `docker exec -it docker_cadence_1 /bin/bash` to login your container. Then `vi config/dynamicconfig/development.yaml` to make any change. After you changed the config, use `docker restart docker_cadence_1` to restart the cadence instance. Note that you can also use this approach to change static config, but it must be changed through `config/config_template.yaml` instead of `config/docker.yaml` because `config/docker.yaml` is generated on startup.


* In production cluster: Follow this example of Helm Chart to deploy Cadence, update dynamic config [here](https://github.com/banzaicloud/banzai-charts/blob/be57e81c107fd2ccdfc6cf95dccf6cbab226920c/cadence/templates/server-configmap.yaml#L170) and restart the cluster.


* DEBUG: How to make sure your updates on dynamicconfig is loaded? for example, if you added the following to `development.yaml`
```yaml
frontend.visibilityListMaxQPS:
  - value: 10000
```
After restarting Cadence instances, execute a command like this to let Cadence load the config(it's lazy loading when using it).
`cadence --domain <> workflow list`

Then you should see the logs like below
```log
cadence_1        | {"level":"info","ts":"2021-05-07T18:43:07.869Z","msg":"First loading dynamic config","service":"cadence-frontend","key":"frontend.visibilityListMaxQPS,domainName:sample,clusterName:primary","value":"10000","default-value":"10","logging-call-at":"config.go:93"}
```

#### Config store client

You can set the `dynamicconfig` client in the static configuration to `configstore` in order to store config changes in a database, as shown below.
```yaml
dynamicconfig:
  client: configstore
  configstore:
    pollInterval: "10s"
    updateRetryAttempts: 2
    FetchTimeout: "2s"
    UpdateTimeout: "2s"
```

If you are still using the deprecated config `dynamicConfigClient` like below, you need to replace it with the new `dynamicconfig` as shown above to use `configstore` client.
```yaml
dynamicConfigClient:
  filepath: "/etc/cadence/config/dynamicconfig/config.yaml"
  pollInterval: "10s"
```

After changing the client to `configstore` and restarting Cadence, you can manage dynamic configs using `cadence admin config` CLI commands. You may need to set your custom dynamic configs again as the previous configs are not automatically migrated from the YAML file to the database.
* `cadence admin config listdc` lists all dynamic config overrides
* `cadence admin config getdc --dynamic_config_name <dynamic config keyname>` gets the value of a specific dynamic config
* `cadence admin config updc --dynamic_config_name <dynamic config keyname> --dynamic_config_value '{"Value": <new value>}'` updates the value of a specific dynamic config
* `cadence admin config resdc --dynamic_config_name <dynamic config keyname>` restores a specific dynamic config to its default value

## Other Advanced Features
* Go to [advanced visibility](/docs/concepts/search-workflows/#running-in-production) for how to configure advanced visibility in production.

* Go to [workflow archival](/docs/concepts/archival/#running-in-production) for how to configure archival in production.

* Go to [cross dc replication](/docs/concepts/cross-dc-replication/#running-in-production) for how to configure replication in production.

## Deployment & Release
Kubernetes is the most popular way to deploy Cadence cluster. And easiest way is to use [Cadence Helm Charts](https://github.com/banzaicloud/banzai-charts/tree/master/cadence) that maintained by a community project.

If you are looking for deploying Cadence using other technologies, then it's recommended to use Cadence docker images. You can use offical ones, or you may customize it based on what you need. See [Cadence docker package](https://github.com/cadence-workflow/cadence/tree/master/docker#using-docker-image-for-production) for how to run the images.

It's always recommended to use the latest release. See [Cadence release pages](https://github.com/cadence-workflow/cadence/releases).

Please subscribe the release of project by :

Go to https://github.com/cadence-workflow/cadence -> Click the right top "Watch" button -> Custom -> "Release".

And see [how to upgrade a Cadence cluster](/docs/operation-guide/maintain/#upgrading-server)

## Stress/Bench Test a cluster

It's recommended to run bench test on your cluster following this [package](https://github.com/cadence-workflow/cadence/tree/master/bench) to see the maximum throughput that it can take, whenever you change some setup.
