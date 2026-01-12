---
layout: default
title: HTTP API
permalink: /docs/concepts/http-api
---

## Introduction

From **version 1.2.0** onwards, Cadence has introduced HTTP API support, which allows you to interact with the Cadence server
using the HTTP protocol. To put this into perspective, HTTP/JSON communication is a flexible method for server interaction.
In the context of Cadence, this implies that a range of RPC methods can be exposed and invoked using the HTTP protocol.
This enhancement broadens the scope of interaction with the Cadence server, enabling the use of any programming language that supports HTTP.
Consequently, you can leverage this functionality to initiate or terminate workflows from your bash scripts, monitor the
status of your cluster, or execute any other operation that the Cadence RPC declaration supports.

## Setup

### Updating Cadence configuration files

To enable “start workflow” HTTP API, add `http` section to Cadence RPC configuration settings (e.g., in `base.yaml` or `development.yaml`):

```yaml
services:
  frontend:
    rpc:
      # ...
      http:
        port: 8800
        procedures:
          - uber.cadence.api.v1.WorkflowAPI::StartWorkflowExecution
```

Then you can run Cadence server in the following ways to use HTTP API.

### Using local binaries

Build and run `./cadence-server` as described in [Developing Cadence](https://github.com/cadence-workflow/cadence/blob/master/CONTRIBUTING.md).

### Using “docker run” command

Refer to instructions described
in [Using docker image for production](https://github.com/cadence-workflow/cadence/tree/master/docker#using-docker-image-for-production).

Additionally add two more environment variables:

```bash
docker run
<...>
    -e FRONTEND_HTTP_PORT=8800                          -- HTTP PORT TO LISTEN
    -e FRONTEND_HTTP_PROCEDURES=uber.cadence.api.v1.WorkflowAPI::StartWorkflowExecution  -- List of API methods exposed
    ubercadence/server:<tag>
```

### Using docker-compose

Add HTTP environment variables to `docker/docker-compose.yml` configuration:

```yaml
cadence:
  image: ubercadence/server:master-auto-setup
  ports:
    - "8000:8000"
    - "8001:8001"
    - "8002:8002"
    - "8003:8003"
    - "7933:7933"
    - "7934:7934"
    - "7935:7935"
    - "7939:7939"
    - "7833:7833"
    - "8800:8800"
  environment:
    - "CASSANDRA_SEEDS=cassandra"
    - "PROMETHEUS_ENDPOINT_0=0.0.0.0:8000"
    - "PROMETHEUS_ENDPOINT_1=0.0.0.0:8001"
    - "PROMETHEUS_ENDPOINT_2=0.0.0.0:8002"
    - "PROMETHEUS_ENDPOINT_3=0.0.0.0:8003"
    - "DYNAMIC_CONFIG_FILE_PATH=config/dynamicconfig/development.yaml"
    - "FRONTEND_HTTP_PORT=8800"
    - "FRONTEND_HTTP_PROCEDURES=uber.cadence.api.v1.WorkflowAPI::StartWorkflowExecution"
```

## Using HTTP API

Start a workflow using curl command

```bash
curl -X POST http://0.0.0.0:8800 \
    -H 'context-ttl-ms: 2000' \
    -H 'rpc-caller: rpc-client-name' \
    -H 'rpc-service: cadence-frontend' \
    -H 'rpc-encoding: json' \
    -H 'rpc-procedure: uber.cadence.api.v1.WorkflowAPI::StartWorkflowExecution' \
    -d @data.json
```

Where `data.json` content looks something like this:

```json
{
  "domain": "sample-domain",
  "workflowId": "workflowid123",
  "execution_start_to_close_timeout": "11s",
  "task_start_to_close_timeout": "10s",
  "workflowType": {
    "name": "workflow_type"
  },
  "taskList": {
    "name": "tasklist-name"
  },
  "identity": "My custom caller identity",
  "requestId": "4D1E4058-6FCF-4BA8-BF16-8FA8B02F9651"
}
```

## HTTP API Reference

### Admin API

------------------------------------------------------------------------------------------

<details>
<summary><code>POST</code> <code><b>uber.cadence.admin.v1.AdminAPI::AddSearchAttribute</b></code></summary>

#### Add search attributes to whitelist

##### Headers

| name           | example                                            |
|----------------|----------------------------------------------------|
| context-ttl-ms | 2000                                               |
| rpc-caller     | curl-client                                        |
| rpc-service    | cadence-frontend                                   |
| rpc-encoding   | json                                               |
| rpc-procedure  | uber.cadence.admin.v1.AdminAPI::AddSearchAttribute |

##### Example payload

```json
{
  "search_attribute": {
    "custom_key": 1
  }
}
```

Search attribute types

| type     | value |
|----------|-------|
| String   | 1     |
| Keyword  | 2     |
| Int      | 3     |
| Double   | 4     |
| DateTime | 5     |

##### Example cURL

```bash
curl -X POST http://0.0.0.0:8800 \
    -H 'context-ttl-ms: 2000' \
    -H 'rpc-caller: curl-client' \
    -H 'rpc-service: cadence-frontend' \
    -H 'rpc-encoding: json' \
    -H 'rpc-procedure: uber.cadence.admin.v1.AdminAPI::AddSearchAttribute' \
    -d \
    '{
      "search_attribute": {
        "custom_key": 1
      }
    }'
```

##### Example successful response

HTTP code: 200

```json
{}
```

</details>

------------------------------------------------------------------------------------------

<details>
<summary><code>POST</code> <code><b>uber.cadence.admin.v1.AdminAPI::CloseShard</b></code></summary>

#### Close a shard given a shard ID

##### Headers

| name           | example                                    |
|----------------|--------------------------------------------|
| context-ttl-ms | 2000                                       |
| rpc-caller     | curl-client                                |
| rpc-service    | cadence-frontend                           |
| rpc-encoding   | json                                       |
| rpc-procedure  | uber.cadence.admin.v1.AdminAPI::CloseShard |

##### Example payload

```json
{
  "shard_id": 0
}
```

##### Example cURL

```bash
curl -X POST http://0.0.0.0:8800 \
    -H 'context-ttl-ms: 2000' \
    -H 'rpc-caller: curl-client' \
    -H 'rpc-service: cadence-frontend' \
    -H 'rpc-encoding: json' \
    -H 'rpc-procedure: uber.cadence.admin.v1.AdminAPI::CloseShard' \
    -d \
    '{
      "shard_id": 0
    }'
```

##### Example successful response

HTTP code: 200

```json
{}
```

</details>

------------------------------------------------------------------------------------------

<details>
<summary><code>POST</code> <code><b>uber.cadence.admin.v1.AdminAPI::CountDLQMessages</b></code></summary>

#### Count DLQ messages

##### Headers

| name           | example                                          |
|----------------|--------------------------------------------------|
| context-ttl-ms | 2000                                             |
| rpc-caller     | curl-client                                      |
| rpc-service    | cadence-frontend                                 |
| rpc-encoding   | json                                             |
| rpc-procedure  | uber.cadence.admin.v1.AdminAPI::CountDLQMessages |

##### Example payload

None

##### Example cURL

```bash
curl -X POST http://0.0.0.0:8800 \
    -H 'context-ttl-ms: 2000' \
    -H 'rpc-caller: curl-client' \
    -H 'rpc-service: cadence-frontend' \
    -H 'rpc-encoding: json' \
    -H 'rpc-procedure: uber.cadence.admin.v1.AdminAPI::CountDLQMessages'
```

##### Example successful response

HTTP code: 200

```json
{
  "history": []
}
```

</details>

------------------------------------------------------------------------------------------

<details>
<summary><code>POST</code> <code><b>uber.cadence.admin.v1.AdminAPI::DescribeCluster</b></code></summary>

#### Describe cluster information

##### Headers

| name           | example                                         |
|----------------|-------------------------------------------------|
| context-ttl-ms | 2000                                            |
| rpc-caller     | curl-client                                     |
| rpc-service    | cadence-frontend                                |
| rpc-encoding   | json                                            |
| rpc-procedure  | uber.cadence.admin.v1.AdminAPI::DescribeCluster |

##### Example payload

None

##### Example cURL

```bash
curl -X POST http://0.0.0.0:8800 \
    -H 'context-ttl-ms: 2000' \
    -H 'rpc-caller: curl-client' \
    -H 'rpc-service: cadence-frontend' \
    -H 'rpc-encoding: json' \
    -H 'rpc-procedure: uber.cadence.admin.v1.AdminAPI::DescribeCluster'
```

##### Example successful response

HTTP code: 200

```json
{
  "supportedClientVersions": {
    "goSdk": "1.7.0",
    "javaSdk": "1.5.0"
  },
  "membershipInfo": {
    "currentHost": {
      "identity": "127.0.0.1:7933"
    },
    "reachableMembers": [
      "127.0.0.1:7933",
      "127.0.0.1:7934",
      "127.0.0.1:7935",
      "127.0.0.1:7939"
    ],
    "rings": [
      {
        "role": "cadence-frontend",
        "memberCount": 1,
        "members": [
          {
            "identity": "127.0.0.1:7933"
          }
        ]
      },
      {
        "role": "cadence-history",
        "memberCount": 1,
        "members": [
          {
            "identity": "127.0.0.1:7934"
          }
        ]
      },
      {
        "role": "cadence-matching",
        "memberCount": 1,
        "members": [
          {
            "identity": "127.0.0.1:7935"
          }
        ]
      },
      {
        "role": "cadence-worker",
        "memberCount": 1,
        "members": [
          {
            "identity": "127.0.0.1:7939"
          }
        ]
      }
    ]
  },
  "persistenceInfo": {
    "historyStore": {
      "backend": "shardedNosql"
    },
    "visibilityStore": {
      "backend": "cassandra",
      "features": [
        {
          "key": "advancedVisibilityEnabled"
        }
      ]
    }
  }
}
```

</details>

------------------------------------------------------------------------------------------

<details>
<summary><code>POST</code> <code><b>uber.cadence.admin.v1.AdminAPI::DescribeHistoryHost</b></code></summary>

#### Describe internal information of history host

##### Headers

| name           | example                                             |
|----------------|-----------------------------------------------------|
| context-ttl-ms | 2000                                                |
| rpc-caller     | curl-client                                         |
| rpc-service    | cadence-frontend                                    |
| rpc-encoding   | json                                                |
| rpc-procedure  | uber.cadence.admin.v1.AdminAPI::DescribeHistoryHost |

##### Example payload

```json
{
  "host_address": "127.0.0.1:7934"
}
```

##### Example cURL

```bash
curl -X POST http://0.0.0.0:8800 \
    -H 'context-ttl-ms: 2000' \
    -H 'rpc-caller: curl-client' \
    -H 'rpc-service: cadence-frontend' \
    -H 'rpc-encoding: json' \
    -H 'rpc-procedure: uber.cadence.admin.v1.AdminAPI::DescribeHistoryHost' \
    -d \
    '{
      "host_address": "127.0.0.1:7934"
    }'
```

##### Example successful response

HTTP code: 200

```json
{
  "numberOfShards": 4,
  "domainCache": {
    "numOfItemsInCacheByID": 5,
    "numOfItemsInCacheByName": 5
  },
  "shardControllerStatus": "started",
  "address": "127.0.0.1:7934"
}
```

</details>

------------------------------------------------------------------------------------------

<details>
<summary><code>POST</code> <code><b>uber.cadence.admin.v1.AdminAPI::DescribeShardDistribution</b></code></summary>

#### List shard distribution

##### Headers

| name           | example                                                   |
|----------------|-----------------------------------------------------------|
| context-ttl-ms | 2000                                                      |
| rpc-caller     | curl-client                                               |
| rpc-service    | cadence-frontend                                          |
| rpc-encoding   | json                                                      |
| rpc-procedure  | uber.cadence.admin.v1.AdminAPI::DescribeShardDistribution |

##### Example payload

```json
{
  "page_size": 100,
  "page_id": 0
}
```

##### Example cURL

```bash
curl -X POST http://0.0.0.0:8800 \
    -H 'context-ttl-ms: 2000' \
    -H 'rpc-caller: curl-client' \
    -H 'rpc-service: cadence-frontend' \
    -H 'rpc-encoding: json' \
    -H 'rpc-procedure: uber.cadence.admin.v1.AdminAPI::DescribeShardDistribution' \
    -d \
    '{
      "page_size": 100,
      "page_id": 0
    }'
```

##### Example successful response

HTTP code: 200

```json
{
  "numberOfShards": 4,
  "shards": {
    "0": "127.0.0.1:7934",
    "1": "127.0.0.1:7934",
    "2": "127.0.0.1:7934",
    "3": "127.0.0.1:7934"
  }
}
```

</details>

------------------------------------------------------------------------------------------

<details>
<summary><code>POST</code> <code><b>uber.cadence.admin.v1.AdminAPI::DescribeWorkflowExecution</b></code></summary>

#### Describe internal information of workflow execution

##### Headers

| name           | example                                                   |
|----------------|-----------------------------------------------------------|
| context-ttl-ms | 2000                                                      |
| rpc-caller     | curl-client                                               |
| rpc-service    | cadence-frontend                                          |
| rpc-encoding   | json                                                      |
| rpc-procedure  | uber.cadence.admin.v1.AdminAPI::DescribeWorkflowExecution |

##### Example payload

```json
{
  "domain": "sample-domain",
  "workflow_execution": {
    "workflow_id": "sample-workflow-id",
    "run_id": "cc09d5dd-b2fa-46d8-b426-54c96b12d18f"
  }
}
```

`run_id` is optional and allows to describe a specific run.

##### Example cURL

```bash
curl -X POST http://0.0.0.0:8800 \
    -H 'context-ttl-ms: 2000' \
    -H 'rpc-caller: curl-client' \
    -H 'rpc-service: cadence-frontend' \
    -H 'rpc-encoding: json' \
    -H 'rpc-procedure: uber.cadence.admin.v1.AdminAPI::DescribeWorkflowExecution' \
    -d \
    '{
      "domain": "sample-domain",
      "workflow_execution": {
        "workflow_id": "sample-workflow-id",
        "run_id": "cc09d5dd-b2fa-46d8-b426-54c96b12d18f"
      }
    }' | tr -d '\'
```

##### Example successful response

HTTP code: 200

```json
{
  "shardId": 3,
  "historyAddr": "127.0.0.1:7934",
  "mutableStateInDatabase": {
    "ActivityInfos": {},
    "TimerInfos": {},
    "ChildExecutionInfos": {},
    "RequestCancelInfos": {},
    "SignalInfos": {},
    "SignalRequestedIDs": {},
    "ExecutionInfo": {
      "DomainID": "d7aff879-f524-43a8-b340-5a223a69d75b",
      "WorkflowID": "sample-workflow-id",
      "RunID": "cc09d5dd-b2fa-46d8-b426-54c96b12d18f",
      "FirstExecutionRunID": "cc09d5dd-b2fa-46d8-b426-54c96b12d18f",
      "ParentDomainID": "",
      "ParentWorkflowID": "",
      "ParentRunID": "",
      "InitiatedID": -7,
      "CompletionEventBatchID": 3,
      "CompletionEvent": null,
      "TaskList": "sample-task-list",
      "WorkflowTypeName": "sample-workflow-type",
      "WorkflowTimeout": 11,
      "DecisionStartToCloseTimeout": 10,
      "ExecutionContext": null,
      "State": 2,
      "CloseStatus": 6,
      "LastFirstEventID": 3,
      "LastEventTaskID": 8388614,
      "NextEventID": 4,
      "LastProcessedEvent": -23,
      "StartTimestamp": "2023-09-08T05:13:04.24Z",
      "LastUpdatedTimestamp": "2023-09-08T05:13:15.247Z",
      "CreateRequestID": "8049b932-6c2f-415a-9bb2-241dcf4cfc9c",
      "SignalCount": 0,
      "DecisionVersion": 0,
      "DecisionScheduleID": 2,
      "DecisionStartedID": -23,
      "DecisionRequestID": "emptyUuid",
      "DecisionTimeout": 10,
      "DecisionAttempt": 0,
      "DecisionStartedTimestamp": 0,
      "DecisionScheduledTimestamp": 1694149984240504000,
      "DecisionOriginalScheduledTimestamp": 1694149984240503000,
      "CancelRequested": false,
      "CancelRequestID": "",
      "StickyTaskList": "",
      "StickyScheduleToStartTimeout": 0,
      "ClientLibraryVersion": "",
      "ClientFeatureVersion": "",
      "ClientImpl": "",
      "AutoResetPoints": {},
      "Memo": null,
      "SearchAttributes": null,
      "PartitionConfig": null,
      "Attempt": 0,
      "HasRetryPolicy": false,
      "InitialInterval": 0,
      "BackoffCoefficient": 0,
      "MaximumInterval": 0,
      "ExpirationTime": "0001-01-01T00:00:00Z",
      "MaximumAttempts": 0,
      "NonRetriableErrors": null,
      "BranchToken": null,
      "CronSchedule": "",
      "IsCron": false,
      "ExpirationSeconds": 0
    },
    "ExecutionStats": null,
    "BufferedEvents": [],
    "VersionHistories": {
      "CurrentVersionHistoryIndex": 0,
      "Histories": [
        {
          "BranchToken": "WQsACgAAACRjYzA5ZDVkZC1iMmZhLTQ2ZDgtYjQyNi01NGM5NmIxMmQxOGYLABQAAAAkYWM5YmIwMmUtMjllYy00YWEyLTlkZGUtZWQ0YWU1NWRhMjlhDwAeDAAAAAAA",
          "Items": [
            {
              "EventID": 3,
              "Version": 0
            }
          ]
        }
      ]
    },
    "ReplicationState": null,
    "Checksum": {
      "Version": 0,
      "Flavor": 0,
      "Value": null
    }
  }
}
```

</details>

------------------------------------------------------------------------------------------

### Domain API

------------------------------------------------------------------------------------------

<details>
<summary><code>POST</code> <code><b>uber.cadence.api.v1.DomainAPI::DescribeDomain</b></code></summary>

#### Describe existing workflow domain

##### Headers

| name           | example                                       |
|----------------|-----------------------------------------------|
| context-ttl-ms | 2000                                          |
| rpc-caller     | curl-client                                   |
| rpc-service    | cadence-frontend                              |
| rpc-encoding   | json                                          |
| rpc-procedure  | uber.cadence.api.v1.DomainAPI::DescribeDomain |

##### Example payload

```json
{
  "name": "sample-domain",
  "uuid": "d7aff879-f524-43a8-b340-5a223a69d75b"
}
```

`uuid` of the domain is optional.

##### Example cURL

```bash
curl -X POST http://0.0.0.0:8800 \
    -H 'context-ttl-ms: 2000' \
    -H 'rpc-caller: curl-client' \
    -H 'rpc-service: cadence-frontend' \
    -H 'rpc-encoding: json' \
    -H 'rpc-procedure: uber.cadence.api.v1.DomainAPI::DescribeDomain' \
    -d \
    '{
      "name": "sample-domain"
    }'
```

##### Example successful response

HTTP code: 200

```json
{
  "domain": {
    "id": "d7aff879-f524-43a8-b340-5a223a69d75b",
    "name": "sample-domain",
    "status": "DOMAIN_STATUS_REGISTERED",
    "data": {},
    "workflowExecutionRetentionPeriod": "259200s",
    "badBinaries": {
      "binaries": {}
    },
    "historyArchivalStatus": "ARCHIVAL_STATUS_ENABLED",
    "historyArchivalUri": "file:///tmp/cadence_archival/development",
    "visibilityArchivalStatus": "ARCHIVAL_STATUS_ENABLED",
    "visibilityArchivalUri": "file:///tmp/cadence_vis_archival/development",
    "activeClusterName": "cluster0",
    "clusters": [
      {
        "clusterName": "cluster0"
      }
    ],
    "isGlobalDomain": true,
    "isolationGroups": {}
  }
}
```

</details>

------------------------------------------------------------------------------------------

<details>
<summary><code>POST</code> <code><b>uber.cadence.api.v1.DomainAPI::ListDomains</b></code></summary>

#### List all domains in the cluster

##### Headers

| name           | example                                    |
|----------------|--------------------------------------------|
| context-ttl-ms | 2000                                       |
| rpc-caller     | curl-client                                |
| rpc-service    | cadence-frontend                           |
| rpc-encoding   | json                                       |
| rpc-procedure  | uber.cadence.api.v1.DomainAPI::ListDomains |

##### Example payload

```json
{
  "page_size": 100
}
```

##### Example cURL

```bash
curl -X POST http://0.0.0.0:8800 \
    -H 'context-ttl-ms: 2000' \
    -H 'rpc-caller: curl-client' \
    -H 'rpc-service: cadence-frontend' \
    -H 'rpc-encoding: json' \
    -H 'rpc-procedure: uber.cadence.api.v1.DomainAPI::ListDomains' \
    -d \
    '{
      "page_size": 100
    }'
```

##### Example successful response

HTTP code: 200

```json
{
  "domains": [
    {
      "id": "3116607e-419b-4783-85fc-47726a4c3fe9",
      "name": "cadence-batcher",
      "status": "DOMAIN_STATUS_REGISTERED",
      "description": "Cadence internal system domain",
      "data": {},
      "workflowExecutionRetentionPeriod": "604800s",
      "badBinaries": {
        "binaries": {}
      },
      "historyArchivalStatus": "ARCHIVAL_STATUS_DISABLED",
      "visibilityArchivalStatus": "ARCHIVAL_STATUS_DISABLED",
      "activeClusterName": "cluster0",
      "clusters": [
        {
          "clusterName": "cluster0"
        }
      ],
      "failoverVersion": "-24",
      "isolationGroups": {}
    },
    {
      "id": "59c51119-1b41-4a28-986d-d6e377716f82",
      "name": "cadence-shadower",
      "status": "DOMAIN_STATUS_REGISTERED",
      "description": "Cadence internal system domain",
      "data": {},
      "workflowExecutionRetentionPeriod": "604800s",
      "badBinaries": {
        "binaries": {}
      },
      "historyArchivalStatus": "ARCHIVAL_STATUS_DISABLED",
      "visibilityArchivalStatus": "ARCHIVAL_STATUS_DISABLED",
      "activeClusterName": "cluster0",
      "clusters": [
        {
          "clusterName": "cluster0"
        }
      ],
      "failoverVersion": "-24",
      "isolationGroups": {}
    },
    {
      "id": "32049b68-7872-4094-8e63-d0dd59896a83",
      "name": "cadence-system",
      "status": "DOMAIN_STATUS_REGISTERED",
      "description": "cadence system workflow domain",
      "ownerEmail": "cadence-dev-group@uber.com",
      "data": {},
      "workflowExecutionRetentionPeriod": "259200s",
      "badBinaries": {
        "binaries": {}
      },
      "historyArchivalStatus": "ARCHIVAL_STATUS_DISABLED",
      "visibilityArchivalStatus": "ARCHIVAL_STATUS_DISABLED",
      "activeClusterName": "cluster0",
      "clusters": [
        {
          "clusterName": "cluster0"
        }
      ],
      "failoverVersion": "-24",
      "isolationGroups": {}
    },
    {
      "id": "d7aff879-f524-43a8-b340-5a223a69d75b",
      "name": "sample-domain",
      "status": "DOMAIN_STATUS_REGISTERED",
      "data": {},
      "workflowExecutionRetentionPeriod": "259200s",
      "badBinaries": {
        "binaries": {}
      },
      "historyArchivalStatus": "ARCHIVAL_STATUS_ENABLED",
      "historyArchivalUri": "file:///tmp/cadence_archival/development",
      "visibilityArchivalStatus": "ARCHIVAL_STATUS_ENABLED",
      "visibilityArchivalUri": "file:///tmp/cadence_vis_archival/development",
      "activeClusterName": "cluster0",
      "clusters": [
        {
          "clusterName": "cluster0"
        }
      ],
      "isGlobalDomain": true,
      "isolationGroups": {}
    }
  ],
  "nextPageToken": ""
}
```

</details>

------------------------------------------------------------------------------------------

### Meta API

------------------------------------------------------------------------------------------

<details>
<summary><code>POST</code> <code><b>uber.cadence.api.v1.MetaAPI::Health</b></code></summary>

#### Health check

##### Headers

| name           | example                             |
|----------------|-------------------------------------|
| context-ttl-ms | 2000                                |
| rpc-caller     | curl-client                         |
| rpc-service    | cadence-frontend                    |
| rpc-encoding   | json                                |
| rpc-procedure  | uber.cadence.api.v1.MetaAPI::Health |

##### Example payload

None

##### Example cURL

```bash
curl -X POST http://0.0.0.0:8800 \
  -H 'context-ttl-ms: 2000' \
  -H 'rpc-caller: curl-client' \
  -H 'rpc-service: cadence-frontend' \
  -H 'rpc-encoding: json' \
  -H 'rpc-procedure: uber.cadence.api.v1.MetaAPI::Health'
```

##### Example successful response

HTTP code: 200

```json
{
  "ok": true,
  "message": "OK"
}
```

</details>

------------------------------------------------------------------------------------------

### Visibility API

------------------------------------------------------------------------------------------

<details>
<summary><code>POST</code> <code><b>uber.cadence.api.v1.VisibilityAPI::GetSearchAttributes</b></code></summary>

#### Get search attributes

##### Headers

| name           | example                                                |
|----------------|--------------------------------------------------------|
| context-ttl-ms | 2000                                                   |
| rpc-caller     | curl-client                                            |
| rpc-service    | cadence-frontend                                       |
| rpc-encoding   | json                                                   |
| rpc-procedure  | uber.cadence.api.v1.VisibilityAPI::GetSearchAttributes |

##### Example payload

None

##### Example cURL

```bash
curl -X POST http://0.0.0.0:8800 \
  -H 'context-ttl-ms: 2000' \
  -H 'rpc-caller: curl-client' \
  -H 'rpc-service: cadence-frontend' \
  -H 'rpc-encoding: json' \
  -H 'rpc-procedure: uber.cadence.api.v1.VisibilityAPI::GetSearchAttributes'
```

##### Example successful response

HTTP code: 200

```json
{
  "keys": {
    "BinaryChecksums": "INDEXED_VALUE_TYPE_KEYWORD",
    "CadenceChangeVersion": "INDEXED_VALUE_TYPE_KEYWORD",
    "CloseStatus": "INDEXED_VALUE_TYPE_INT",
    "CloseTime": "INDEXED_VALUE_TYPE_INT",
    "CustomBoolField": "INDEXED_VALUE_TYPE_BOOL",
    "CustomDatetimeField": "INDEXED_VALUE_TYPE_DATETIME",
    "CustomDomain": "INDEXED_VALUE_TYPE_KEYWORD",
    "CustomDoubleField": "INDEXED_VALUE_TYPE_DOUBLE",
    "CustomIntField": "INDEXED_VALUE_TYPE_INT",
    "CustomKeywordField": "INDEXED_VALUE_TYPE_KEYWORD",
    "CustomStringField": "INDEXED_VALUE_TYPE_STRING",
    "DomainID": "INDEXED_VALUE_TYPE_KEYWORD",
    "ExecutionTime": "INDEXED_VALUE_TYPE_INT",
    "HistoryLength": "INDEXED_VALUE_TYPE_INT",
    "IsCron": "INDEXED_VALUE_TYPE_KEYWORD",
    "NewKey": "INDEXED_VALUE_TYPE_KEYWORD",
    "NumClusters": "INDEXED_VALUE_TYPE_INT",
    "Operator": "INDEXED_VALUE_TYPE_KEYWORD",
    "Passed": "INDEXED_VALUE_TYPE_BOOL",
    "RolloutID": "INDEXED_VALUE_TYPE_KEYWORD",
    "RunID": "INDEXED_VALUE_TYPE_KEYWORD",
    "ShardID": "INDEXED_VALUE_TYPE_INT",
    "StartTime": "INDEXED_VALUE_TYPE_INT",
    "TaskList": "INDEXED_VALUE_TYPE_KEYWORD",
    "TestNewKey": "INDEXED_VALUE_TYPE_STRING",
    "UpdateTime": "INDEXED_VALUE_TYPE_INT",
    "WorkflowID": "INDEXED_VALUE_TYPE_KEYWORD",
    "WorkflowType": "INDEXED_VALUE_TYPE_KEYWORD",
    "addon": "INDEXED_VALUE_TYPE_KEYWORD",
    "addon-type": "INDEXED_VALUE_TYPE_KEYWORD",
    "environment": "INDEXED_VALUE_TYPE_KEYWORD",
    "project": "INDEXED_VALUE_TYPE_KEYWORD",
    "service": "INDEXED_VALUE_TYPE_KEYWORD",
    "user": "INDEXED_VALUE_TYPE_KEYWORD"
  }
}
```

</details>

------------------------------------------------------------------------------------------

<details>
<summary><code>POST</code> <code><b>uber.cadence.api.v1.VisibilityAPI::ListClosedWorkflowExecutions</b></code></summary>

#### List closed workflow executions in a domain

##### Headers

| name           | example                                                         |
|----------------|-----------------------------------------------------------------|
| context-ttl-ms | 2000                                                            |
| rpc-caller     | curl-client                                                     |
| rpc-service    | cadence-frontend                                                |
| rpc-encoding   | json                                                            |
| rpc-procedure  | uber.cadence.api.v1.VisibilityAPI::ListClosedWorkflowExecutions |

##### Example payloads

`startTimeFilter` is required while `executionFilter` and `typeFilter` are optional.

```json
{
  "domain": "sample-domain",
  "start_time_filter": {
    "earliest_time": "2023-01-01T00:00:00Z",
    "latest_time": "2023-12-31T00:00:00Z"
  }
}
```

```json
{
  "domain": "sample-domain",
  "start_time_filter": {
    "earliest_time": "2023-01-01T00:00:00Z",
    "latest_time": "2023-12-31T00:00:00Z"
  },
  "execution_filter": {
    "workflow_id": "sample-workflow-id",
    "run_id": "71c3d47b-454a-4315-97c7-15355140094b"
  }
}
```

```json
{
  "domain": "sample-domain",
  "start_time_filter": {
    "earliest_time": "2023-01-01T00:00:00Z",
    "latest_time": "2023-12-31T00:00:00Z"
  },
  "type_filter": {
    "name": "sample-workflow-type"
  }
}
```

##### Example cURL

```bash
curl -X POST http://0.0.0.0:8800 \
    -H 'context-ttl-ms: 2000' \
    -H 'rpc-caller: curl-client' \
    -H 'rpc-service: cadence-frontend' \
    -H 'rpc-encoding: json' \
    -H 'rpc-procedure: uber.cadence.api.v1.VisibilityAPI::ListClosedWorkflowExecutions' \
    -d \
    '{
      "domain": "sample-domain",
      "start_time_filter": {
        "earliest_time": "2023-01-01T00:00:00Z",
        "latest_time": "2023-12-31T00:00:00Z"
      }
    }'
```

##### Example successful response

HTTP code: 200

```json
{
  "executions": [
    {
      "workflowExecution": {
        "workflowId": "sample-workflow-id",
        "runId": "71c3d47b-454a-4315-97c7-15355140094b"
      },
      "type": {
        "name": "sample-workflow-type"
      },
      "startTime": "2023-09-08T06:31:18.778Z",
      "closeTime": "2023-09-08T06:32:18.782Z",
      "closeStatus": "WORKFLOW_EXECUTION_CLOSE_STATUS_TIMED_OUT",
      "historyLength": "5",
      "executionTime": "2023-09-08T06:31:18.778Z",
      "memo": {},
      "searchAttributes": {
        "indexedFields": {}
      },
      "taskList": "sample-task-list"
    }
  ],
  "nextPageToken": ""
}
```

</details>

------------------------------------------------------------------------------------------

<details>
<summary><code>POST</code> <code><b>uber.cadence.api.v1.VisibilityAPI::ListOpenWorkflowExecutions</b></code></summary>

#### List open workflow executions in a domain

##### Headers

| name           | example                                                       |
|----------------|---------------------------------------------------------------|
| context-ttl-ms | 2000                                                          |
| rpc-caller     | curl-client                                                   |
| rpc-service    | cadence-frontend                                              |
| rpc-encoding   | json                                                          |
| rpc-procedure  | uber.cadence.api.v1.VisibilityAPI::ListOpenWorkflowExecutions |

##### Example payloads

`startTimeFilter` is required while `executionFilter` and `typeFilter` are optional.

```json
{
  "domain": "sample-domain",
  "start_time_filter": {
    "earliest_time": "2023-01-01T00:00:00Z",
    "latest_time": "2023-12-31T00:00:00Z"
  }
}
```

```json
{
  "domain": "sample-domain",
  "start_time_filter": {
    "earliest_time": "2023-01-01T00:00:00Z",
    "latest_time": "2023-12-31T00:00:00Z"
  },
  "execution_filter": {
    "workflow_id": "sample-workflow-id",
    "run_id": "71c3d47b-454a-4315-97c7-15355140094b"
  }
}
```

```json
{
  "domain": "sample-domain",
  "start_time_filter": {
    "earliest_time": "2023-01-01T00:00:00Z",
    "latest_time": "2023-12-31T00:00:00Z"
  },
  "type_filter": {
    "name": "sample-workflow-type"
  }
}
```

##### Example cURL

```bash
curl -X POST http://0.0.0.0:8800 \
  -H 'context-ttl-ms: 2000' \
  -H 'rpc-caller: curl-client' \
  -H 'rpc-service: cadence-frontend' \
  -H 'rpc-encoding: json' \
  -H 'rpc-procedure: uber.cadence.api.v1.VisibilityAPI::ListOpenWorkflowExecutions' \
  -d \
  '{
    "domain": "sample-domain",
    "start_time_filter": {
      "earliest_time": "2023-01-01T00:00:00Z",
      "latest_time": "2023-12-31T00:00:00Z"
    }
  }'
```

##### Example successful response

HTTP code: 200

```json
{
  "executions": [
    {
      "workflowExecution": {
        "workflowId": "sample-workflow-id",
        "runId": "5dbabeeb-82a2-41ed-bf55-dc732a4d46ce"
      },
      "type": {
        "name": "sample-workflow-type"
      },
      "startTime": "2023-09-12T02:17:46.596Z",
      "executionTime": "2023-09-12T02:17:46.596Z",
      "memo": {},
      "searchAttributes": {
        "indexedFields": {}
      },
      "taskList": "sample-task-list"
    }
  ],
  "nextPageToken": ""
}
```

</details>

------------------------------------------------------------------------------------------

### Workflow API

------------------------------------------------------------------------------------------

<details>
<summary><code>POST</code> <code><b>uber.cadence.api.v1.WorkflowAPI::DescribeTaskList</b></code></summary>

#### Describe pollers info of tasklist

##### Headers

| name           | example                                           |
|----------------|---------------------------------------------------|
| context-ttl-ms | 2000                                              |
| rpc-caller     | curl-client                                       |
| rpc-service    | cadence-frontend                                  |
| rpc-encoding   | json                                              |
| rpc-procedure  | uber.cadence.api.v1.WorkflowAPI::DescribeTaskList |

##### Example payload

```json
{
  "domain": "sample-domain",
  "task_list": {
    "name": "sample-task-list",
    "kind": 1
  },
  "task_list_type": 1,
  "include_task_list_status": true
}
```

`task_list` kind is optional.

Task list kinds

| type               | value |
|--------------------|-------|
| TaskListKindNormal | 1     |
| TaskListKindSticky | 2     |

Task list types

| type                 | value |
|----------------------|-------|
| TaskListTypeDecision | 1     |
| TaskListTypeActivity | 2     |

##### Example cURL

```bash
curl -X POST http://0.0.0.0:8800 \
    -H 'context-ttl-ms: 2000' \
    -H 'rpc-caller: curl-client' \
    -H 'rpc-service: cadence-frontend' \
    -H 'rpc-encoding: json' \
    -H 'rpc-procedure: uber.cadence.api.v1.WorkflowAPI::DescribeTaskList' \
    -d \
    '{
      "domain": "sample-domain",
      "task_list": {
        "name": "sample-task-list",
        "kind": 1
      },
      "task_list_type": 1,
      "include_task_list_status": true
    }'
```

##### Example successful response

HTTP code: 200

```json
{
  "taskListStatus": {
    "readLevel": "200000",
    "ratePerSecond": 100000,
    "taskIdBlock": {
      "startId": "200001",
      "endId": "300000"
    }
  }
}
```

</details>

------------------------------------------------------------------------------------------

<details>
<summary><code>POST</code> <code><b>uber.cadence.api.v1.WorkflowAPI::DescribeWorkflowExecution</b></code></summary>

#### Describe a workflow execution

##### Headers

| name           | example                                                    |
|----------------|------------------------------------------------------------|
| context-ttl-ms | 2000                                                       |
| rpc-caller     | curl-client                                                |
| rpc-service    | cadence-frontend                                           |
| rpc-encoding   | json                                                       |
| rpc-procedure  | uber.cadence.api.v1.WorkflowAPI::DescribeWorkflowExecution |

##### Example payload

```json
{
  "domain": "sample-domain",
  "workflow_execution": {
    "workflow_id": "sample-workflow-id",
    "run_id": "5dbabeeb-82a2-41ed-bf55-dc732a4d46ce"
  }
}
```

`run_id` is optional and allows to describe a specific run.

##### Example cURL

```bash
curl -X POST http://0.0.0.0:8800 \
  -H 'context-ttl-ms: 2000' \
  -H 'rpc-caller: curl-client' \
  -H 'rpc-service: cadence-frontend' \
  -H 'rpc-encoding: json' \
  -H 'rpc-procedure: uber.cadence.api.v1.WorkflowAPI::DescribeWorkflowExecution' \
  -d \
  '{
    "domain": "sample-domain",
    "workflow_execution": {
      "workflow_id": "sample-workflow-id",
      "run_id": "5dbabeeb-82a2-41ed-bf55-dc732a4d46ce"
    }
  }'
```

##### Example successful response

HTTP code: 200

```json
{
  "executionConfiguration": {
    "taskList": {
      "name": "sample-task-list"
    },
    "executionStartToCloseTimeout": "11s",
    "taskStartToCloseTimeout": "10s"
  },
  "workflowExecutionInfo": {
    "workflowExecution": {
      "workflowId": "sample-workflow-id",
      "runId": "5dbabeeb-82a2-41ed-bf55-dc732a4d46ce"
    },
    "type": {
      "name": "sample-workflow-type"
    },
    "startTime": "2023-09-12T02:17:46.596Z",
    "closeTime": "2023-09-12T02:17:57.602707Z",
    "closeStatus": "WORKFLOW_EXECUTION_CLOSE_STATUS_TIMED_OUT",
    "historyLength": "3",
    "executionTime": "2023-09-12T02:17:46.596Z",
    "memo": {},
    "searchAttributes": {},
    "autoResetPoints": {}
  },
  "pendingDecision": {
    "state": "PENDING_DECISION_STATE_SCHEDULED",
    "scheduledTime": "2023-09-12T02:17:46.596982Z",
    "originalScheduledTime": "2023-09-12T02:17:46.596982Z"
  }
}
```

</details>

------------------------------------------------------------------------------------------

<details>
<summary><code>POST</code> <code><b>uber.cadence.api.v1.WorkflowAPI::GetClusterInfo</b></code></summary>

#### Get supported client versions for the cluster

##### Headers

| name           | example                                         |
|----------------|-------------------------------------------------|
| context-ttl-ms | 2000                                            |
| rpc-caller     | curl-client                                     |
| rpc-service    | cadence-frontend                                |
| rpc-encoding   | json                                            |
| rpc-procedure  | uber.cadence.api.v1.WorkflowAPI::GetClusterInfo |

##### Example payload

None

##### Example cURL

```bash
curl -X POST http://0.0.0.0:8800 \
  -H 'context-ttl-ms: 2000' \
  -H 'rpc-caller: curl-client' \
  -H 'rpc-service: cadence-frontend' \
  -H 'rpc-encoding: json' \
  -H 'rpc-procedure: uber.cadence.api.v1.WorkflowAPI::GetClusterInfo'
```

##### Example successful response

HTTP code: 200

```json
{
  "supportedClientVersions": {
    "goSdk": "1.7.0",
    "javaSdk": "1.5.0"
  }
}
```

</details>

------------------------------------------------------------------------------------------

<details>
<summary><code>POST</code> <code><b>uber.cadence.api.v1.WorkflowAPI::GetTaskListsByDomain</b></code></summary>

#### Get the task lists in a domain

##### Headers

| name           | example                                               |
|----------------|-------------------------------------------------------|
| context-ttl-ms | 2000                                                  |
| rpc-caller     | curl-client                                           |
| rpc-service    | cadence-frontend                                      |
| rpc-encoding   | json                                                  |
| rpc-procedure  | uber.cadence.api.v1.WorkflowAPI::GetTaskListsByDomain |

##### Example payload

```json
{
  "domain": "sample-domain"
}
```

##### Example cURL

```bash
curl -X POST http://0.0.0.0:8800 \
    -H 'context-ttl-ms: 2000' \
    -H 'rpc-caller: curl-client' \
    -H 'rpc-service: cadence-frontend' \
    -H 'rpc-encoding: json' \
    -H 'rpc-procedure: uber.cadence.api.v1.WorkflowAPI::GetTaskListsByDomain' \
    -d \
    '{
      "domain": "sample-domain"
    }'
```

##### Example successful response

HTTP code: 200

```json
{
  "decisionTaskListMap": {},
  "activityTaskListMap": {}
}
```

</details>

------------------------------------------------------------------------------------------

<details>
<summary><code>POST</code> <code><b>uber.cadence.api.v1.WorkflowAPI::GetWorkflowExecutionHistory</b></code></summary>

#### Get the history of workflow executions

##### Headers

| name           | example                                                      |
|----------------|--------------------------------------------------------------|
| context-ttl-ms | 2000                                                         |
| rpc-caller     | curl-client                                                  |
| rpc-service    | cadence-frontend                                             |
| rpc-encoding   | json                                                         |
| rpc-procedure  | uber.cadence.api.v1.WorkflowAPI::GetWorkflowExecutionHistory |

##### Example payload

```json
{
  "domain": "sample-domain",
  "workflow_execution": {
    "workflow_id": "sample-workflow-id"
  }
}
```

##### Example cURL

```bash
curl -X POST http://0.0.0.0:8800 \
    -H 'context-ttl-ms: 2000' \
    -H 'rpc-caller: curl-client' \
    -H 'rpc-service: cadence-frontend' \
    -H 'rpc-encoding: json' \
    -H 'rpc-procedure: uber.cadence.api.v1.WorkflowAPI::GetWorkflowExecutionHistory' \
    -d \
    '{
      "domain": "sample-domain",
      "workflow_execution": {
        "workflow_id": "sample-workflow-id"
      }
    }'
```

##### Example successful response

HTTP code: 200

```json
{
  "history": {
    "events": [
      {
        "eventId": "1",
        "eventTime": "2023-09-12T05:34:46.107550Z",
        "taskId": "9437321",
        "workflowExecutionStartedEventAttributes": {
          "workflowType": {
            "name": "sample-workflow-type"
          },
          "taskList": {
            "name": "sample-task-list"
          },
          "input": {
            "data": "IkN1cmwhIg=="
          },
          "executionStartToCloseTimeout": "61s",
          "taskStartToCloseTimeout": "60s",
          "originalExecutionRunId": "fd7c2283-79dd-458c-8306-e2d1d8217613",
          "identity": "client-name-visible-in-history",
          "firstExecutionRunId": "fd7c2283-79dd-458c-8306-e2d1d8217613",
          "firstDecisionTaskBackoff": "0s"
        }
      },
      {
        "eventId": "2",
        "eventTime": "2023-09-12T05:34:46.107565Z",
        "taskId": "9437322",
        "decisionTaskScheduledEventAttributes": {
          "taskList": {
            "name": "sample-task-list"
          },
          "startToCloseTimeout": "60s"
        }
      },
      {
        "eventId": "3",
        "eventTime": "2023-09-12T05:34:59.184511Z",
        "taskId": "9437330",
        "workflowExecutionCancelRequestedEventAttributes": {
          "cause": "dummy",
          "identity": "client-name-visible-in-history"
        }
      },
      {
        "eventId": "4",
        "eventTime": "2023-09-12T05:35:47.112156Z",
        "taskId": "9437332",
        "workflowExecutionTimedOutEventAttributes": {
          "timeoutType": "TIMEOUT_TYPE_START_TO_CLOSE"
        }
      }
    ]
  }
}
```

</details>

------------------------------------------------------------------------------------------

<details>
<summary><code>POST</code> <code><b>uber.cadence.api.v1.WorkflowAPI::ListTaskListPartitions</b></code></summary>

#### List all the task list partitions and the hostname for partitions

##### Headers

| name           | example                                                 |
|----------------|---------------------------------------------------------|
| context-ttl-ms | 2000                                                    |
| rpc-caller     | curl-client                                             |
| rpc-service    | cadence-frontend                                        |
| rpc-encoding   | json                                                    |
| rpc-procedure  | uber.cadence.api.v1.WorkflowAPI::ListTaskListPartitions |

##### Example payload

```json
{
  "domain": "sample-domain",
  "task_list": {
    "name": "sample-task-list"
  }
}
```

##### Example cURL

```bash
curl -X POST http://0.0.0.0:8800 \
    -H 'context-ttl-ms: 2000' \
    -H 'rpc-caller: curl-client' \
    -H 'rpc-service: cadence-frontend' \
    -H 'rpc-encoding: json' \
    -H 'rpc-procedure: uber.cadence.api.v1.WorkflowAPI::ListTaskListPartitions' \
    -d \
    '{
      "domain": "sample-domain",
      "task_list": {
        "name": "sample-task-list"
      }
    }'
```

##### Example successful response

HTTP code: 200

```json
{
  "activityTaskListPartitions": [
    {
      "key": "sample-task-list",
      "ownerHostName": "127.0.0.1:7935"
    }
  ],
  "decisionTaskListPartitions": [
    {
      "key": "sample-task-list",
      "ownerHostName": "127.0.0.1:7935"
    }
  ]
}
```

</details>

------------------------------------------------------------------------------------------

<details>
<summary><code>POST</code> <code><b>uber.cadence.api.v1.WorkflowAPI::RefreshWorkflowTasks</b></code></summary>

#### Refresh all the tasks of a workflow

##### Headers

| name           | example                                               |
|----------------|-------------------------------------------------------|
| context-ttl-ms | 2000                                                  |
| rpc-caller     | curl-client                                           |
| rpc-service    | cadence-frontend                                      |
| rpc-encoding   | json                                                  |
| rpc-procedure  | uber.cadence.api.v1.WorkflowAPI::RefreshWorkflowTasks |

##### Example payload

```json
{
  "domain": "sample-domain",
  "workflow_execution": {
    "workflow_id": "sample-workflow-id",
    "run_id": "b7973fb8-2229-4fe7-ad70-c919c1ae8774"
  }
}
```

##### Example cURL

```bash
curl -X POST http://0.0.0.0:8800 \
    -H 'context-ttl-ms: 2000' \
    -H 'rpc-caller: curl-client' \
    -H 'rpc-service: cadence-frontend' \
    -H 'rpc-encoding: json' \
    -H 'rpc-procedure: uber.cadence.api.v1.WorkflowAPI::RefreshWorkflowTasks' \
    -d \
    '{
      "domain": "sample-domain",
      "workflow_execution": {
        "workflow_id": "sample-workflow-id",
        "run_id": "b7973fb8-2229-4fe7-ad70-c919c1ae8774"
      }
    }'
```

##### Example successful response

HTTP code: 200

```json
{}
```

</details>

------------------------------------------------------------------------------------------

<details>
<summary><code>POST</code> <code><b>uber.cadence.api.v1.WorkflowAPI::RequestCancelWorkflowExecution</b></code></summary>

#### Cancel a workflow execution

##### Headers

| name           | example                                                         |
|----------------|-----------------------------------------------------------------|
| context-ttl-ms | 2000                                                            |
| rpc-caller     | curl-client                                                     |
| rpc-service    | cadence-frontend                                                |
| rpc-encoding   | json                                                            |
| rpc-procedure  | uber.cadence.api.v1.WorkflowAPI::RequestCancelWorkflowExecution |

##### Example payload

```json
{
  "domain": "sample-domain",
  "workflow_execution": {
    "workflow_id": "sample-workflow-id",
    "run_id": "b7973fb8-2229-4fe7-ad70-c919c1ae8774"
  },
  "request_id": "8049B932-6C2F-415A-9BB2-241DCF4CFC9C",
  "cause": "dummy",
  "identity": "client-name-visible-in-history",
  "first_execution_run_id": "b7973fb8-2229-4fe7-ad70-c919c1ae8774"
}
```

##### Example cURL

```bash
curl -X POST http://0.0.0.0:8800 \
    -H 'context-ttl-ms: 2000' \
    -H 'rpc-caller: curl-client' \
    -H 'rpc-service: cadence-frontend' \
    -H 'rpc-encoding: json' \
    -H 'rpc-procedure: uber.cadence.api.v1.WorkflowAPI::RequestCancelWorkflowExecution' \
    -d \
    '{
      "domain": "sample-domain",
      "workflow_execution": {
        "workflow_id": "sample-workflow-id",
        "run_id": "fd7c2283-79dd-458c-8306-e2d1d8217613"
      },
      "request_id": "8049B932-6C2F-415A-9BB2-241DCF4CFC9C",
      "cause": "dummy",
      "identity": "client-name-visible-in-history",
      "first_execution_run_id": "fd7c2283-79dd-458c-8306-e2d1d8217613"
    }'
```

##### Example successful response

HTTP code: 200

```json
{}
```

</details>

------------------------------------------------------------------------------------------

<details>
<summary><code>POST</code> <code><b>uber.cadence.api.v1.WorkflowAPI::RestartWorkflowExecution</b></code></summary>

#### Restart a previous workflow execution

##### Headers

| name           | example                                                   |
|----------------|-----------------------------------------------------------|
| context-ttl-ms | 2000                                                      |
| rpc-caller     | curl-client                                               |
| rpc-service    | cadence-frontend                                          |
| rpc-encoding   | json                                                      |
| rpc-procedure  | uber.cadence.api.v1.WorkflowAPI::RestartWorkflowExecution |

##### Example payload

```json
{
  "domain": "sample-domain",
  "workflow_execution": {
    "workflow_id": "sample-workflow-id",
    "run_id": "0f95ad5b-03bc-4c6b-8cf0-1f3ea08eb86a"
  },
  "identity": "client-name-visible-in-history",
  "reason": "dummy"
}
```

##### Example cURL

```bash
curl -X POST http://0.0.0.0:8800 \
    -H 'context-ttl-ms: 2000' \
    -H 'rpc-caller: curl-client' \
    -H 'rpc-service: cadence-frontend' \
    -H 'rpc-encoding: json' \
    -H 'rpc-procedure: uber.cadence.api.v1.WorkflowAPI::RestartWorkflowExecution' \
    -d \
    '{
      "domain": "sample-domain",
      "workflow_execution": {
        "workflow_id": "sample-workflow-id",
        "run_id": "0f95ad5b-03bc-4c6b-8cf0-1f3ea08eb86a"
      },
      "identity": "client-name-visible-in-history",
      "reason": "dummy"
    }'
```

##### Example successful response

HTTP code: 200

```json
{
  "runId": "82914458-3221-42b4-ae54-2e66dff864f7"
}
```

</details>

------------------------------------------------------------------------------------------

<details>
<summary><code>POST</code> <code><b>uber.cadence.api.v1.WorkflowAPI::SignalWithStartWorkflowExecution</b></code></summary>

#### Signal the current open workflow if one exists, or attempt to start a new run based on IDReusePolicy and signal it

##### Headers

| name           | example                                                           |
|----------------|-------------------------------------------------------------------|
| context-ttl-ms | 2000                                                              |
| rpc-caller     | curl-client                                                       |
| rpc-service    | cadence-frontend                                                  |
| rpc-encoding   | json                                                              |
| rpc-procedure  | uber.cadence.api.v1.WorkflowAPI::SignalWithStartWorkflowExecution |

##### Example payload

```json
{
  "start_request": {
    "domain": "sample-domain",
    "workflow_id": "sample-workflow-id",
    "execution_start_to_close_timeout": "61s",
    "task_start_to_close_timeout": "60s",
    "workflow_type": {
      "name": "sample-workflow-type"
    },
    "task_list": {
      "name": "sample-task-list"
    },
    "identity": "client-name-visible-in-history",
    "request_id": "8049B932-6C2F-415A-9BB2-241DCF4CFC9C",
    "input": {
      "data": "IkN1cmwhIg=="
    }
  },
  "signal_name": "channelA",
  "signal_input": {
    "data": "MTA="
  }
}
```

##### Example cURL

```bash
curl -X POST http://0.0.0.0:8800 \
    -H 'context-ttl-ms: 2000' \
    -H 'rpc-caller: curl-client' \
    -H 'rpc-service: cadence-frontend' \
    -H 'rpc-encoding: json' \
    -H 'rpc-procedure: uber.cadence.api.v1.WorkflowAPI::SignalWithStartWorkflowExecution' \
    -d \
    '{
      "start_request": {
        "domain": "sample-domain",
        "workflow_id": "sample-workflow-id",
        "execution_start_to_close_timeout": "61s",
        "task_start_to_close_timeout": "60s",
        "workflow_type": {
          "name": "sample-workflow-type"
        },
        "task_list": {
          "name": "sample-task-list"
        },
        "identity": "client-name-visible-in-history",
        "request_id": "8049B932-6C2F-415A-9BB2-241DCF4CFC9C",
        "input": {
          "data": "IkN1cmwhIg=="
        }
      },
      "signal_name": "channelA",
      "signal_input": {
        "data": "MTA="
      }
    }'
```

##### Example successful response

HTTP code: 200

```json
{
  "runId": "cc09d5dd-b2fa-46d8-b426-54c96b12d18f"
}
```

</details>

------------------------------------------------------------------------------------------

<details>
<summary><code>POST</code> <code><b>uber.cadence.api.v1.WorkflowAPI::SignalWorkflowExecution</b></code></summary>

#### Signal a workflow execution

##### Headers

| name           | example                                                  |
|----------------|----------------------------------------------------------|
| context-ttl-ms | 2000                                                     |
| rpc-caller     | curl-client                                              |
| rpc-service    | cadence-frontend                                         |
| rpc-encoding   | json                                                     |
| rpc-procedure  | uber.cadence.api.v1.WorkflowAPI::SignalWorkflowExecution |

##### Example payload

```json
{
  "domain": "sample-domain",
  "workflow_execution": {
    "workflow_id": "sample-workflow-id",
    "run_id": "cc09d5dd-b2fa-46d8-b426-54c96b12d18f"
  },
  "signal_name": "channelA",
  "signal_input": {
    "data": "MTA="
  }
}
```

`run_id` is optional and allows to signal a specific run.

##### Example cURL

```bash
curl -X POST http://0.0.0.0:8800 \
    -H 'context-ttl-ms: 2000' \
    -H 'rpc-caller: curl-client' \
    -H 'rpc-service: cadence-frontend' \
    -H 'rpc-encoding: json' \
    -H 'rpc-procedure: uber.cadence.api.v1.WorkflowAPI::SignalWorkflowExecution' \
    -d \
    '{
      "domain": "sample-domain",
      "workflow_execution": {
        "workflow_id": "sample-workflow-id"
      },
      "signal_name": "channelA",
      "signal_input": {
        "data": "MTA="
      }
    }'
```

##### Example successful response

HTTP code: 200

```json
{}
```

</details>

------------------------------------------------------------------------------------------

<details>
<summary><code>POST</code> <code><b>uber.cadence.api.v1.WorkflowAPI::StartWorkflowExecution</b></code></summary>

#### Start a new workflow execution

##### Headers

| name           | example                                                 |
|----------------|---------------------------------------------------------|
| context-ttl-ms | 2000                                                    |
| rpc-caller     | curl-client                                             |
| rpc-service    | cadence-frontend                                        |
| rpc-encoding   | json                                                    |
| rpc-procedure  | uber.cadence.api.v1.WorkflowAPI::StartWorkflowExecution |

##### Example payload

```json
{
  "domain": "sample-domain",
  "workflow_id": "sample-workflow-id",
  "execution_start_to_close_timeout": "61s",
  "task_start_to_close_timeout": "60s",
  "workflow_type": {
    "name": "sample-workflow-type"
  },
  "task_list": {
    "name": "sample-task-list"
  },
  "identity": "client-name-visible-in-history",
  "request_id": "8049B932-6C2F-415A-9BB2-241DCF4CFC9C",
  "input": {
    "data": "IkN1cmwhIg=="
  }
}
```

##### Example cURL

```bash
curl -X POST http://0.0.0.0:8800 \
    -H 'context-ttl-ms: 2000' \
    -H 'rpc-caller: curl-client' \
    -H 'rpc-service: cadence-frontend' \
    -H 'rpc-encoding: json' \
    -H 'rpc-procedure: uber.cadence.api.v1.WorkflowAPI::StartWorkflowExecution' \
    -d \
    '{
      "domain": "sample-domain",
      "workflow_id": "sample-workflow-id",
      "execution_start_to_close_timeout": "61s",
      "task_start_to_close_timeout": "60s",
      "workflow_type": {
        "name": "sample-workflow-type"
      },
      "task_list": {
        "name": "sample-task-list"
      },
      "identity": "client-name-visible-in-history",
      "request_id": "8049B932-6C2F-415A-9BB2-241DCF4CFC9C",
      "input": {
        "data": "IkN1cmwhIg=="
      }
    }'
```

##### Example successful response

HTTP code: 200

```json
{
  "runId": "cc09d5dd-b2fa-46d8-b426-54c96b12d18f"
}
```

</details>

------------------------------------------------------------------------------------------

<details>
<summary><code>POST</code> <code><b>uber.cadence.api.v1.WorkflowAPI::TerminateWorkflowExecution</b></code></summary>

#### Terminate a new workflow execution

##### Headers

| name           | example                                                     |
|----------------|-------------------------------------------------------------|
| context-ttl-ms | 2000                                                        |
| rpc-caller     | curl-client                                                 |
| rpc-service    | cadence-frontend                                            |
| rpc-encoding   | json                                                        |
| rpc-procedure  | uber.cadence.api.v1.WorkflowAPI::TerminateWorkflowExecution |

##### Example payloads

```json
{
  "domain": "sample-domain",
  "workflow_execution": {
    "workflow_id": "sample-workflow-id"
  }
}
```

```json
{
  "domain": "sample-domain",
  "workflow_execution": {
    "workflow_id": "sample-workflow-id",
    "run_id": "0f95ad5b-03bc-4c6b-8cf0-1f3ea08eb86a"
  },
  "reason": "dummy",
  "identity": "client-name-visible-in-history",
  "first_execution_run_id": "0f95ad5b-03bc-4c6b-8cf0-1f3ea08eb86a"
}
```

##### Example cURL

```bash
curl -X POST http://0.0.0.0:8800 \
    -H 'context-ttl-ms: 2000' \
    -H 'rpc-caller: curl-client' \
    -H 'rpc-service: cadence-frontend' \
    -H 'rpc-encoding: json' \
    -H 'rpc-procedure: uber.cadence.api.v1.WorkflowAPI::TerminateWorkflowExecution' \
    -d \
    '{
      "domain": "sample-domain",
      "workflow_execution": {
        "workflow_id": "sample-workflow-id"
      }
    }'
```

##### Example successful response

HTTP code: 200

```json
{}
```

</details>

------------------------------------------------------------------------------------------
