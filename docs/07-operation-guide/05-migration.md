---
layout: default
title: Cluster Migration
permalink: /docs/operation-guide/migration
---

There could be some reasons that you need to migrate Cadence clusters:
* Migrate to different storage, for example from Postgres/MySQL to Cassandra, or using multiple SQL database as a sharded SQL cluster for Cadence
* Split traffic
* Datacenter migration
* Scale up -- to change numOfHistoryShards.

Below are two different approaches for migrating a cluster.

## Migrate with naive approach

1. Set up a new Cadence cluster
2. Connect client workers to both old and new clusters
3. Change workflow code to start new workflows only in the new cluster
4. Wait for all old workflows to finish in the old cluster
5. Shutdown the old Cadence cluster and stop the client workers from connecting to it.

NOTE 1: With this approach, workflow history/visibility will not be migrated to new cluster.

NOTE 2: This is the only way to migrate a local domain, because a local domain cannot be converted to a global domain, even after a cluster enables XDC feature.

NOTE 3: Starting from [version 0.22.0](https://github.com/cadence-workflow/cadence/releases/tag/v0.22.0), global domain is preferred/recommended. Please ensure you create and use global domains only.
If you are using local domains, an easy way is to create a global domain and migrate to the new global domain using the above steps.

## Migrate with [Global Domain Replication](/docs/concepts/cross-dc-replication/#running-in-production) feature
NOTE 1: If a domain are NOT a global domain, you cannot use the XDC feature to migrate. The only way is to migrate in a [naive approach](migration#migrate-with-naive-approach)

NOTE 2: Only migrating to the same numHistoryShards is allowed.

### Step 0 - Verify clusters' setup is correct

* Make sure the new cluster doesn’t already have the domain names that needs to be migrated (otherwise domain replication would fail).

To get all the domains from current cluster:
```bash
cadence --address <currentClusterAddress> admin domain list
```

Then
For each global domain
```bash
cadence --address <newClusterAddress> --do <domain_name> domain describe
```
to make sure it doesn't exist in the new cluster.

* Target replication cluster should have numHistoryShards >= source cluster

* Target cluster should have the same search attributes enabled in dynamic configuration and in ElasticSearch.

  * Check the dynamic configuration to see if they have the same list of `frontend.validSearchAttributes`. If any is missing in the new cluster, update the dynamic config for the new cluster.

  * Check results of the below command to make sure that the ES fields matched with the dynamic configuration
```bash
curl -u <UNAME>:<PW> -X GET https://<ES_HOST_OF_NEW_CLUSTER>/cadence-visibility-index  -H 'Content-Type: application/json'| jq .
```
If any search attribute is missing, add the missing search attributes to target cluster.
```bash
cadence --address <newClusterAddress> adm cluster add-search-attr --search_attr_key <> --search_attr_type <>
```

### Step 1 - Connect the two clusters using global domain(replication) feature
Include the Cluster Information for both the old and new clusters in the ClusterMetadata config of both clusters.
Example config for currentCluster
```yaml
dcRedirectionPolicy:
  policy: "all-domain-apis-forwarding" # use selected-apis-forwarding if using older versions don't support this policy

clusterMetadata:
  enableGlobalDomain: true
  failoverVersionIncrement: 10
  masterClusterName: "<newClusterName>"
  currentClusterName: "<currentClusterName>"
  clusterInformation:
    <currentClusterName>:
      enabled: true
      initialFailoverVersion: 1
      rpcName: "cadence-frontend"
      rpcAddress: "<currentClusterAddress>"
    <newClusterName>:
      enabled: true
      initialFailoverVersion: 0
      rpcName: "cadence-frontend"
      rpcAddress: "<newClusterAddress>"
```
for newClusterName:
```yaml
dcRedirectionPolicy:
  policy: "all-domain-apis-forwarding"

clusterMetadata:
  enableGlobalDomain: true
  failoverVersionIncrement: 10
  masterClusterName: "<newClusterName>"
  currentClusterName: "<newClusterName>"
  clusterInformation:
    <currentClusterName>:
      enabled: true
      initialFailoverVersion: 1
      rpcName: "cadence-frontend"
      rpcAddress: "<currentClusterAddress>"
    <newClusterName>:
      enabled: true
      initialFailoverVersion: 0
      rpcName: "cadence-frontend"
      rpcAddress: "<newClusterAddress>"
```

Deploy the config.
In older versions(`<= v0.22`), only `selected-apis-forwarding` is supported. This would require you to deploy a different set of workflow/activity connected to the new Cadence cluster during migration, if high availability/seamless migration is required. Because `selected-apis-forwarding` only forwarding the non-worker APIs.

With `all-domain-apis-forwarding` policy, all worker + non-worker APIs are forwarded by Cadence cluster. You don't need to make any deployment change to your workflow/activity workers during migration. Once migration, let all workers connect to the new Cadence cluster before removing/shutdown the old cluster.

Therefore, it's recommended to upgrade your Cadence cluster to a higher version with `all-domain-apis-forwarding` policy supported. The below steps assuming you are using this policy.


### Step 2 - Test Replicating one domain

First of all, try replicating a single domain to make sure everything work. Here uses `domain update` to failover, you can also use `managed failover` feature to failover. You may use some testing domains for this like `cadence-canary`.

* 2.1 Assuming the domain only contain `currentCluster` in the cluster list, let's add the new cluster to the domain.
```bash
cadence --address <currentClusterAddress> --do <domain_name> domain update --clusters <currentClusterName>,<newClusterName>
```

Run the command below to refresh the domain after adding a new cluster to the cluster list; we need to update the active_cluster to the same value that it appears to be.

```bash
cadence --address <currentClusterAddress> --do <domain_name> domain update --active_cluster <currentClusterName>
```


* 2.2 failover the domain to be active in new cluster
```bash
cadence --address <currentClusterAddress> --do workflow-prototype domain update --active_cluster <newClusterName>
```

Use the domain describe command to verify the entire domain is replicated to the new cluster.

```bash
cadence --address <newClusterAddress> --do <domain_name> domain describe
```
Find an open workflowID that we want to replicate (you can get it from the UI). Use this command to describe it to make sure it’s open and running:

```bash
cadence --address <initialClusterAddress> --do <domain_name> workflow describe --workflow_id <wfID>
```
Run a signal command against any workflow and check that it was replicated to the new cluster. Example:

```bash
cadence --address <initialClusterAddress> --do <domain_name> workflow signal --workflow_id <wfID> --name <anything not functional, e.g. replicationTriggeringSignal>
```
This command will send a noop signal to workflows to trigger a decision, which will trigger history replication if needed.


Verify the workflow is replicated in the new cluster
```bash
cadence --address <newClusterAddress> --st <adminOperationToken> --do <domain_name> workflow describe --workflow_id <wfID>
```
Also compare the history between the two clusters:
```bash
cadence --address <newClusterAddress> --do <domain_name> workflow show --workflow_id <wfID>
```

```bash
cadence --address <initialClusterAddress> --do <domain_name> workflow show --workflow_id <wfID>
```


### Step 3 - Start to replicate all domains

You can repeat Step 2 for all the domains. Or you can use the managed failover feature to failover all the domains in the cluster with a single command. See more details in the [global domain documentation](/docs/concepts/cross-dc-replication).

Because replication cannot be triggered without a decision. Again best way is to send a garbage signal to all the workflows.

If advanced visibility is enabled, then use batch signal command to start a batch job to trigger replication for all open workflows:
```bash
cadence --address <initialClusterAddress> --do <domain_name> workflow batch start --batch_type signal --query “CloseTime = missing” --signal_name <anything, e.g. xdcTest> --reason <anything> --input <anything> --yes
```

Watch metrics & dashboard while this is happening. Also observe the signal batch job to make sure it's completed.

### Step 4 - Complete the migration

After a few days, make sure everything is stable on the new cluster. The old cluster should only be forwarding requests to new cluster.

A few things need to do in order to shutdown the old cluster.

* Migrate all applications to connect to the frontend of new cluster instead of relying on the forwarding
* Watch metric dashboard to make sure no any traffic is happening on the old cluster
* Delete the old cluster from domain cluster list. This needs to be done for every domain.
```bash
cadence --address <newHostAddress> --do <domain_name> domain update --clusters <newClusterName>
```
* Delete the old cluster from the configuration of the new cluster.

Once above is done, you can shutdown the old cluster safely.
