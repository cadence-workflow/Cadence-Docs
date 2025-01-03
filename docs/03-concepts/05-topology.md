---
layout: default
title: Deployment topology
permalink: /docs/concepts/topology
---

# Deployment topology

## Overview

Cadence is a highly scalable fault-oblivious stateful code platform. The fault-oblivious code is a next level of abstraction over commonly used techniques to achieve fault tolerance and durability.

A common Cadence-based application consists of a Cadence service, :workflow: and :activity_worker:activity_workers:, and external clients.
Note that both types of :worker:workers: as well as external clients are roles and can be collocated in a single application process if necessary.

## Cadence Service

![Cadence Architecture](https://user-images.githubusercontent.com/14902200/160308507-2854a98a-0582-4748-87e4-e0695d3b6e86.jpg)


At the core of Cadence is a highly scalable multitenant service. The service exposes all of its functionality through a strongly typed [gRPC API](https://github.com/cadence-workflow/cadence-idl/tree/master/proto/cadence-workflow/cadence/api/v1). A Cadence cluster include multiple services, each of which may run on multiple nodes for scalability and reliablity:
- Front End: which is a stateless service used to handle incoming requests from Workers. It is expected that an external load balancing mechanism is used to distribute load between Front End instances.
- History Service: where the core logic of orchestrating workflow steps and activities is implemented
- Matching Service: matches workflow/activity tasks that need to be executed to workflow/activity workers that are able to execute them. Matching is assigned task for execution by the history service
- Internal Worker Service: implements Cadence workflows and activities for internal requirements such as archiving
- Workers: are effectively the client apps for Cadence. This is where user created workflow and activity logic is executed

Internally it depends on a persistent store. Currently, Apache Cassandra, MySQL, PostgreSQL, CockroachDB ([PostgreSQL compatible](https://www.cockroachlabs.com/docs/stable/postgresql-compatibility.html)) and TiDB ([MySQL compatible](https://docs.pingcap.com/tidb/dev/mysql-compatibility)) stores are supported out of the box. For listing :workflow:workflows: using complex predicates, ElasticSearch and OpenSearch cluster can be used.

Cadence service is responsible for keeping :workflow: state and associated durable timers. It maintains internal queues (called :task_list:task_lists:) which are used to dispatch :task:tasks: to external :worker:workers:.

Cadence service is multitenant. Therefore it is expected that multiple pools of :worker:workers: implementing different use cases connect to the same service instance. For example, at Uber a single service is used by more than a hundred applications. At the same time some external customers deploy an instance of Cadence service per application. For local development, a local Cadence service instance configured through docker-compose is used.

![Cadence Overview](https://user-images.githubusercontent.com/14902200/160308592-400e11bc-0b21-4dd1-b568-8ac59005e6b7.svg)


## Workflow Worker

Cadence reuses terminology from _workflow automation_ :domain:. So fault-oblivious stateful code is called :workflow:.

The Cadence service does not execute :workflow: code directly. The :workflow: code is hosted by an external (from the service point of view) :workflow_worker: process. These processes receive _:decision_task:decision_tasks:_ that contain :event:events: that the :workflow: is expected to handle from the Cadence service, delivers them to the :workflow: code, and communicates :workflow: _:decision:decisions:_ back to the service.

As :workflow: code is external to the service, it can be implemented in any language that can talk service Thrift API. Currently Java and Go clients are production ready. While Python and C# clients are under development. Let us know if you are interested in contributing a client in your preferred language.

The Cadence service API doesn't impose any specific :workflow: definition language. So a specific :worker: can be implemented to execute practically any existing :workflow: specification. The model the Cadence team chose to support out of the box is based on the idea of durable function. Durable functions are as close as possible to application business logic with minimal plumbing required.

## Activity Worker

:workflow:Workflow: fault-oblivious code is immune to infrastructure failures. But it has to communicate with the imperfect external world where failures are common. All communication to the external world is done through :activity:activities:. :activity:Activities: are pieces of code that can perform any application-specific action like calling a service, updating a database record, or downloading a file from Amazon S3. Cadence :activity:activities: are very feature-rich compared to queuing systems. Example features are :task: routing to specific processes, infinite retries, heartbeats, and unlimited execution time.

:activity:Activities: are hosted by _:activity_worker:_ processes that receive _:activity_task:activity_tasks:_ from the Cadence service, invoke correspondent :activity: implementations and report back :task: completion statuses.

## External Clients

:workflow:Workflow: and :activity_worker:activity_workers: host :workflow: and :activity: code. But to create a :workflow: instance (an execution in Cadence terminology) the `StartWorkflowExecution` Cadence service API call should be used. Usually, :workflow:workflows: are started by outside entities like UIs, microservices or CLIs.

These entities can also:

- notify :workflow:workflows: about asynchronous external :event:events: in the form of :signal:signals:
- synchronously :query: :workflow: state
- synchronously wait for a :workflow: completion
- cancel, terminate, restart, and reset :workflow:workflows:
- search for specific :workflow:workflows: using list API
