---
layout: default
title: Cluster Troubleshooting
permalink: /docs/operation-guide/troubleshooting
---
# Cluster Troubleshooting

This section is to cover some common operation issues as a RunBook. Feel free to add more, or raise issues in the to ask for more in [cadence-docs](https://github.com/cadence-workflow/Cadence-Docs/issues) project.Or talk to us in Slack support channel!

We will keep adding more stuff. Any contribution is very welcome.

## Errors
* `Persistence Max QPS Reached for List Operations`
  * Check metrics to see how many List operations are performed per second on the domain. Alternatively you can enable `debug` log level to see more details of how a List request is ratelimited, if it's a staging/QA cluster.
  * Raise the ratelimiting for the domain if you believe the default ratelimit is too low
* `Failed to lock shard. Previous range ID: 132; new range ID: 133` and `Failed to update shard. Previous range ID: 210; new range ID: 212`
  * When this keep happening, it's very likely a critical configuration error. Either there are two clusters using the same database, or two clusters are using the same ringpop(bootstrap hosts).

## API high latency, timeout, Task disptaching slowness Or Too many operations onto DB and timeouts
* If it happens after you attemped to truncate tables inorder to reuse the same database/keyspace for a new cluster, it's possible that the data is not deleted completely. You should make sure to shutdown the Cadence when trucating, and make sure the database is cleaned. Alternatively, use a different keyspace/database is a safer way.

* Timeout pushing task to matching engine, e.g. `"Fail to process task","service":"cadence-history","shard-id":431,"address":"172.31.48.64:7934","component":"transfer-queue-processor","cluster-name":"active","shard-id":431,"queue-task-id":590357768,"queue-task-visibility-timestamp":1637356594382077880,"xdc-failover-version":-24,"queue-task-type":0,"wf-domain-id":"f4d6824f-9d24-4a82-81e0-e0e080be4c21","wf-id":"55d64d58-e398-4bf5-88bc-a4696a2ba87f:63ed7cda-afcf-41cd-9d5a-ee5e1b0f2844","wf-run-id":"53b52ee0-3218-418e-a9bf-7768e671f9c1","error":"code:deadline-exceeded message:timeout","lifecycle":"ProcessingFailed","logging-call-at":"task.go:331"`
  * If this happens after traffic increased for a certain domain, it's likely that a tasklist is overloaded. Consider [scale up the tasklist](/docs/operation-guide/maintain/#scale-up-a-tasklist-using-scalable-tasklist-feature)

* If the request volume aligned with the traffic increased on all domain, consider [scale up the cluster](/docs/operation-guide/maintain/#scale-up--down-cluster)
