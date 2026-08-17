---
layout: default
title: Task lists
description: This page explains Cadence task lists, the internal queues used to dispatch activity and decision tasks to workers, including their advantages over direct RPC calls.
keywords:
  - cadence task lists
  - cadence task queue
  - cadence activity task list
  - cadence decision task list
  - cadence worker routing
  - cadence concepts
  - cadence task dispatch
permalink: /docs/concepts/task-lists
---

When a :workflow: invokes an :activity:, it sends the ```ScheduleActivityTask``` :decision: to the
Cadence service. As a result, the service updates the :workflow: state and dispatches
an :activity_task: to a :worker: that implements the :activity:.
Instead of calling the :worker: directly, an intermediate queue is used. So the service adds an _:activity_task:_ to this
queue and a :worker: receives the :task: using a long poll request.
Cadence calls this queue used to dispatch :activity_task:activity_tasks: an *:activity_task_list:*.

Similarly, when a :workflow: needs to handle an external :event:, a :decision_task: is created.
A :decision_task_list: is used to deliver it to the :workflow_worker: (also called _decider_).

While Cadence :task_list:task_lists: are queues, they have some differences from commonly used queuing technologies.
The main one is that they do not require explicit registration and are created on demand. The number of :task_list:task_lists:
is not limited. A common use case is to have a :task_list: per :worker: process and use it to deliver :activity_task:activity_tasks:
to the process. Another use case is to have a :task_list: per pool of :worker:workers:.

## Samples

Runnable samples that show task lists in use:

| Sample | Description | Code |
|--------|-------------|------|
| **Host-specific task lists** | Routes activities to a specific host through its own task list | [Go](https://github.com/cadence-workflow/cadence-samples/tree/master/cmd/samples/fileprocessing) · [Java](https://github.com/cadence-workflow/cadence-java-samples/tree/master/src/main/java/com/uber/cadence/samples/fileprocessing) |
| **Basic task list usage** | Worker and workflow starter sharing a single task list | [Go](https://github.com/cadence-workflow/cadence-samples/tree/master/new_samples/hello_world) · [Python](https://github.com/cadence-workflow/cadence-samples/blob/master/python_sdk_samples/schedule_samples/run_worker.py) |

---

There are multiple advantages of using a :task_list: to deliver :task:tasks: instead of invoking an :activity_worker: through a synchronous RPC:

* :worker:Worker: doesn't need to have any open ports, which is more secure.
* :worker:Worker: doesn't need to advertise itself through DNS or any other network discovery mechanism.
* When all :worker:workers: are down, messages are persisted in a :task_list: waiting for the :worker:workers: to recover.
* A :worker: polls for a message only when it has spare capacity, so it never gets overloaded.
* Automatic load balancing across a large number of :worker:workers:.
* :task_list:Task_lists: support server side throttling. This allows you to limit the :task: dispatch rate to the pool of :worker:workers: and still supports adding a :task: with a higher rate when spikes happen.
* :task_list:Task_lists: can be used to route a request to specific pools of :worker:workers: or even a specific process.
