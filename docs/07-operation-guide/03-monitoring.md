---
layout: default
title: Cluster Monitoring
permalink: /docs/operation-guide/monitor
---

## Instructions

Cadence emits metrics for both Server and client libraries:

* Follow this example to emit [client side metrics for Golang client](https://github.com/cadence-workflow/cadence-samples/pull/36)
  * You can use other metrics emitter like [M3](https://github.com/uber-go/tally/tree/master/m3)
  * Alternatively, you can implement the tally [Reporter interface](https://github.com/uber-go/tally/blob/master/reporter.go)

* Follow this example to emit [client side metrics for Java client](https://github.com/cadence-workflow/cadence-java-samples/blob/master/src/main/java/com/uber/cadence/samples/hello/HelloMetric.java) if using 3.x client, or [this example](https://github.com/longquanzheng/cadence-java-samples-1/pull/1) if using 2.x client.
  * You can use other metrics emitter like [M3](https://github.com/uber-java/tally/tree/master/m3)
  * Alternatively, you can implement the tally [Reporter interface](https://github.com/uber-java/tally/blob/master/core/src/main/java/com/uber/m3/tally/Scope.java)

* For running Cadence services in production, please follow this [example of Helm chart](https://github.com/banzaicloud/banzai-charts/blob/master/cadence/templates/server-service-monitor.yaml) to emit server side metrics. Or you can follow [the example of local environment](https://github.com/cadence-workflow/cadence/blob/master/config/development_prometheus.yaml#L40) to Prometheus. All services need to expose a HTTP port to provide metrics like below

```yaml
metrics:
  prometheus:
    timerType: "histogram"
    listenAddress: "0.0.0.0:8001"
```

The rest of the instruction uses local environment as an example.

For testing local server emitting metrics to Promethues, the easiest way is to use [docker-compose](https://github.com/cadence-workflow/cadence/blob/master/docker/) to start a local Cadence instance.

Make sure to update the `prometheus_config.yml` to add "host.docker.internal:9098" to the scrape list before starting the docker-compose:
```yaml
global:
  scrape_interval: 5s
  external_labels:
    monitor: 'cadence-monitor'
scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: # addresses to scrape
          - 'cadence:9090'
          - 'cadence:8000'
          - 'cadence:8001'
          - 'cadence:8002'
          - 'cadence:8003'
          - 'host.docker.internal:9098'
```

Note: `host.docker.internal` [may not work for some docker versions](https://docs.docker.com/docker-for-mac/networking/#use-cases-and-workarounds)

* After updating the prometheus_config.yaml as above, run `docker-compose up` to start the local Cadence instance

* Go the the sample repo, build the helloworld sample `make helloworld` and run the worker `./bin/helloworld -m worker`, and then in another Shell start a workflow `./bin/helloworld`

* Go to your [local Prometheus dashboard](http://localhost:9090/), you should be able to check the metrics emitted by handler from client/frontend/matching/history/sysWorker and confirm your services are healthy through [targets](http://localhost:9090/targets)
<img width="1192" alt="Screen Shot 2021-02-20 at 11 31 11 AM" src="https://user-images.githubusercontent.com/4523955/108606555-8d0dfb80-736f-11eb-968d-7678df37455c.png"></img>


* Go to [local Grafana](http://localhost:3000) , login as `admin/admin`.
* Configure Prometheus as datasource: use `http://host.docker.internal:9090` as URL of prometheus.
* Import the [Grafana dashboard template](monitoring#grafanaprometheus-dashboard-templates) as JSON files.

Client side dashboard looks like this:
<img width="1513" alt="Screen Shot 2021-02-20 at 12 32 23 PM" src="https://user-images.githubusercontent.com/4523955/108607838-b7fc4d80-7377-11eb-8fd9-edc0e58afaad.png"></img>

And server basic dashboard:
<img width="1514" alt="Screen Shot 2021-02-20 at 12 31 54 PM" src="https://user-images.githubusercontent.com/4523955/108607843-baf73e00-7377-11eb-9759-e67a1a00f442.png"></img>


<img width="1519" alt="Screen Shot 2021-02-20 at 11 06 54 AM" src="https://user-images.githubusercontent.com/4523955/108606577-b169d800-736f-11eb-8fcb-88801f23b656.png"></img>


## DataDog dashboard templates

This [package](https://github.com/cadence-workflow/Cadence-Docs/tree/master/src/datadog) contains examples of Cadence dashboards with DataDog.

* `Cadence-Client` is the dashboard that includes all the metrics to help you understand Cadence client behavior. Most of these metrics are emitted by the client SDKs, with a few exceptions from server side (for example, workflow timeout).

* `Cadence-Server` is the the server dashboard that you can use to monitor and undertand the health and status of your Cadence cluster.

To use DataDog with Cadence, follow [this instruction](https://docs.datadoghq.com/integrations/guide/prometheus-metrics/) to collect Prometheus metrics using DataDog agent.

NOTE1: don't forget to adjust `max_returned_metrics` to a higher number(e.g. 100000). Otherwise DataDog agent won't be able to [collect all metrics(default is 2000)](https://docs.datadoghq.com/integrations/guide/prometheus-host-collection/).

NOTE2: the template contains templating variables `$App` and `$Availability_Zone`. Feel free to remove them if you don't have them in your setup.

## Grafana+Prometheus dashboard templates

This [package](https://github.com/cadence-workflow/Cadence-Docs/tree/master/src/grafana/prometheus) contains examples of Cadence dashboards with Prometheus.

* `Cadence-Client` is the dashboard of client metrics, and a few server side metrics that belong to client side but have to be emitted by server(for example, workflow timeout).

* `Cadence-Server-Basic` is the the basic server dashboard to monitor/navigate the health/status of a Cadence cluster.

* Apart from the basic server dashboard, it's recommended to set up dashboards on different components for Cadence server: Frontend, History, Matching, Worker, Persistence, Archival, etc. Any [contribution](https://github.com/cadence-workflow/Cadence-Docs) is always welcome to enrich the existing templates or new templates!


## Periodic tests(Canary) for health check

It's recommended that you run periodical tests to get signals on the health of your cluster. Please following instructions in [our canary package](https://github.com/cadence-workflow/cadence/tree/master/canary) to set these tests up.

## Cadence Frontend Monitoring
This section describes recommended dashboards for monitoring Cadence services in your cluster. The structure mostly follows the DataDog dashboard template listed above.

### Service Availability(server metrics)
* Meaning: the availability of Cadence server using server metrics.
* Suggested monitor: below 95% > 5 min then alert, below 99% for > 5 min triggers a warning
* Monitor action: When fired, check if there is any persistence errors.  If so then check the healthness of the database(may need to restart or scale up). If not then check the error logs.
* Datadog query example
```dql
sum:cadence_frontend.cadence_errors{*}
sum:cadence_frontend.cadence_requests{*}
(1 - a / b) * 100
```

### StartWorkflow Per Second
* Meaning: how many workflows are started per second. This helps determine if your server is overloaded.
* Suggested monitor: This is a business metrics. No monitoring required.
* Datadog query example
```dql
sum:cadence_frontend.cadence_requests{(operation IN (startworkflowexecution,signalwithstartworkflowexecution))} by {operation}.as_rate()
```

### Activities Started Per Second
* Meaning: How many activities are started per second. Helps determine if the server is overloaded.
* Suggested monitor: This is a business metrics. No monitoring required.
* Datadog query example
```dql
sum:cadence_frontend.cadence_requests{operation:pollforactivitytask} by {operation}.as_rate()
```

### Decisions Started Per Second
* Meaning: How many workflow decisions are started per second. Helps determine if the server is overloaded.
* Suggested monitor: This is a business metrics. No monitoring required.
* Datadog query example
```dql
sum:cadence_frontend.cadence_requests{operation:pollfordecisiontask} by {operation}.as_rate()
```

### Periodical Test Suite Success(aka Canary)
* Meaning: The success counter of canary test suite
* Suggested monitor: Monitor needed. If fired, look at the failed canary test case and investigate the reason of failure.
* Datadog query example
```dql
sum:cadence_history.workflow_success{workflowtype:workflow_sanity} by {workflowtype}.as_count()
```

### Frontend all API per second
* Meaning: all API on frontend per second. Information only.
* Suggested monitor: This is a business metrics. No monitoring required.
* Datadog query example
```dql
sum:cadence_frontend.cadence_requests{*}.as_rate()
```

### Frontend API per second (breakdown per operation)
* Meaning: API on frontend per second. Information only.
* Suggested monitor: This is a business metrics. No monitoring required.
* Datadog query example
```dql
sum:cadence_frontend.cadence_requests{*} by {operation}.as_rate()
```

### Frontend API errors per second(breakdown per operation)
* Meaning: API error on frontend per second. Information only.
* Suggested monitor: This is to facilitate investigation. No monitoring required.
* Datadog query example
```dql
sum:cadence_frontend.cadence_errors{*} by {operation}.as_rate()
sum:cadence_frontend.cadence_errors_bad_request{*} by {operation}.as_rate()
sum:cadence_frontend.cadence_errors_domain_not_active{*} by {operation}.as_rate()
sum:cadence_frontend.cadence_errors_service_busy{*} by {operation}.as_rate()
sum:cadence_frontend.cadence_errors_entity_not_exists{*} by {operation}.as_rate()
sum:cadence_frontend.cadence_errors_workflow_execution_already_completed{*} by {operation}.as_rate()
sum:cadence_frontend.cadence_errors_execution_already_started{*} by {operation}.as_rate()
sum:cadence_frontend.cadence_errors_domain_already_exists{*} by {operation}.as_rate()
sum:cadence_frontend.cadence_errors_cancellation_already_requested{*} by {operation}.as_rate()
sum:cadence_frontend.cadence_errors_query_failed{*} by {operation}.as_rate()
sum:cadence_frontend.cadence_errors_limit_exceeded{*} by {operation}.as_rate()
sum:cadence_frontend.cadence_errors_context_timeout{*} by {operation}.as_rate()
sum:cadence_frontend.cadence_errors_retry_task{*} by {operation}.as_rate()
sum:cadence_frontend.cadence_errors_bad_binary{*} by {operation}.as_rate()
sum:cadence_frontend.cadence_errors_client_version_not_supported{*} by {operation}.as_rate()
sum:cadence_frontend.cadence_errors_incomplete_history{*} by {operation}.as_rate()
sum:cadence_frontend.cadence_errors_nondeterministic{*} by {operation}.as_rate()
sum:cadence_frontend.cadence_errors_unauthorized{*} by {operation}.as_rate()
sum:cadence_frontend.cadence_errors_authorize_failed{*} by {operation}.as_rate()
sum:cadence_frontend.cadence_errors_remote_syncmatch_failed{*} by {operation}.as_rate()
sum:cadence_frontend.cadence_errors_domain_name_exceeded_warn_limit{*} by {operation}.as_rate()
sum:cadence_frontend.cadence_errors_identity_exceeded_warn_limit{*} by {operation}.as_rate()
sum:cadence_frontend.cadence_errors_workflow_id_exceeded_warn_limit{*} by {operation}.as_rate()
sum:cadence_frontend.cadence_errors_signal_name_exceeded_warn_limit{*} by {operation}.as_rate()
sum:cadence_frontend.cadence_errors_workflow_type_exceeded_warn_limit{*} by {operation}.as_rate()
sum:cadence_frontend.cadence_errors_request_id_exceeded_warn_limit{*} by {operation}.as_rate()
sum:cadence_frontend.cadence_errors_task_list_name_exceeded_warn_limit{*} by {operation}.as_rate()
sum:cadence_frontend.cadence_errors_activity_id_exceeded_warn_limit{*} by {operation}.as_rate()
sum:cadence_frontend.cadence_errors_activity_type_exceeded_warn_limit{*} by {operation}.as_rate()
sum:cadence_frontend.cadence_errors_marker_name_exceeded_warn_limit{*} by {operation}.as_rate()
sum:cadence_frontend.cadence_errors_timer_id_exceeded_warn_limit{*} by {operation}.as_rate()
```
  * `cadence_errors` is internal service errors.
  * any `cadence_errors_*` is client side error


### Frontend Regular API Latency
* Meaning: The latency of regular core API -- excluding long-poll/queryWorkflow/getHistory/ListWorkflow/CountWorkflow API.
* Suggested monitor: 95% of all apis and of all operations that take over 1.5 seconds triggers a warning,  over 2 seconds triggers an alert
* Monitor action: If fired, investigate the database read/write latency. May need to throttle some spiky traffic from certain domains, or scale up the database
* Datadog query example
```dql
avg:cadence_frontend.cadence_latency.quantile{(operation NOT IN (pollfordecisiontask,pollforactivitytask,getworkflowexecutionhistory,queryworkflow,listworkflowexecutions,listclosedworkflowexecutions,listopenworkflowexecutions)) AND $pXXLatency} by {operation}
```

### Frontend ListWorkflow API Latency
* Meaning: The latency of ListWorkflow API.
* Monitor: 95% of all apis and of all operations that take over 2 seconds triggers a warning,  over 3 seconds triggers an alert
* Monitor action: If fired, investigate the ElasticSearch read latency. May need to throttle some spiky traffic from certain domains, or scale up ElasticSearch cluster.
* Datadog query example
```dql
avg:cadence_frontend.cadence_latency.quantile{(operation IN (listclosedworkflowexecutions,listopenworkflowexecutions,listworkflowexecutions,countworkflowexecutions)) AND $pXXLatency} by {operation}
```

### Frontend Long Poll API Latency
* Meaning: Long poll means that the worker is waiting for a task. The latency is an Indicator for how busy the worker is. Poll for activity task and poll for decision task are the types of long poll requests.The api call times out at 50 seconds if no task can be picked up.A very low latency could mean that more workers need to be added.
* Suggested monitor: No monitor needed as long latency is expected.
* Datadog query example
```dql
avg:cadence_frontend.cadence_latency.quantile{$pXXLatency,operation:pollforactivitytask} by {operation}
avg:cadence_frontend.cadence_latency.quantile{$pXXLatency,operation:pollfordecisiontask} by {operation}
```

### Frontend Get History/Query Workflow API Latency
* Meaning: GetHistory API acts like a long poll api, but there’s no explicit timeout. Long-poll of GetHistory is being used when WorkflowClient is waiting for the result of the workflow(essentially, WorkflowExecutionCompletedEvent).
This latency depends on the time it takes for the workflow to complete. QueryWorkflow API latency is also unpredictable as it depends on the availability and performance of workflow workers, which are owned by the application and workflow implementation(may require replaying history).
* Suggested monitor: No monitor needed
* Datadog query example
```dql
avg:cadence_frontend.cadence_latency.quantile{(operation IN (getworkflowexecutionhistory,queryworkflow)) AND $pXXLatency} by {operation}
```

### Frontend WorkflowClient API per seconds by domain
* Meaning: Shows which domains are making the most requests using WorkflowClient(excluding worker API like PollForDecisionTask and RespondDecisionTaskCompleted). Used for troubleshooting.
In the future it can be used to set some rate limiting per domain.
* Suggested monitor: No monitor needed.
* Datadog query example
```dql
sum:cadence_frontend.cadence_requests{(operation IN (signalwithstartworkflowexecution,signalworkflowexecution,startworkflowexecution,terminateworkflowexecution,resetworkflowexecution,requestcancelworkflowexecution,listworkflowexecutions))} by {domain,operation}.as_rate()
```

## Cadence Application Monitoring
This section describes the recommended dashboards for monitoring Cadence application using metrics emitted by SDK. See the `setup` section about how to collect those metrics.

### Workflow Start and Successful completion
* Workflow successfully started/signalWithStart and completed/canceled/continuedAsNew
* Monitor: not recommended
* Datadog query example
```dql
sum:cadence_client.cadence_workflow_start{$Domain,$Tasklist,$WorkflowType} by {workflowtype,env,domain,tasklist}.as_rate()
sum:cadence_client.cadence_workflow_completed{$Domain,$Tasklist,$WorkflowType} by {workflowtype,env,domain,tasklist}.as_rate()
sum:cadence_client.cadence_workflow_canceled{$Domain,$Tasklist,$WorkflowType} by {workflowtype,domain,env,tasklist}.as_rate()
sum:cadence_client.cadence_workflow_continue_as_new{$Domain,$Tasklist,$WorkflowType} by {workflowtype,domain,env,tasklist}.as_rate()
sum:cadence_client.cadence_workflow_signal_with_start{$Domain,$Tasklist,$WorkflowType} by {workflowtype,domain,env,tasklist}.as_rate()
```

### Workflow Failure
* Metrics for all types of failures, including workflow failures(throw uncaught exceptions), workflow timeout and termination.
* For timeout and termination, workflow worker doesn’t have a chance to emit metrics when it’s terminate, so the metric comes from the history service
* Monitor: application should set monitor on timeout and failure to make sure workflow are not failing. Cancel/terminate are usually triggered by human intentionally.
* When the metrics fire, go to Cadence UI to find the failed workflows and investigate the workflow history to understand the type of failure
* Datadog query example
```dql
sum:cadence_client.cadence_workflow_failed{$Domain,$Tasklist,$WorkflowType} by {workflowtype,domain,env}.as_count()
sum:cadence_history.workflow_failed{$Domain,$WorkflowType} by {domain,env,workflowtype}.as_count()
sum:cadence_history.workflow_terminate{$Domain,$WorkflowType} by {domain,env,workflowtype}.as_count()
sum:cadence_history.workflow_timeout{$Domain,$WorkflowType} by {domain,env,workflowtype}.as_count()
```

### Decision Poll Counters
* Indicates if the workflow worker is available and is polling tasks. If the worker is not available no counters will show.
Can also check if the worker is using the right task list.
“No task” poll type means that the worker exists and is idle.
The timeout for this long poll api is 50 seconds. If no task is received within 50 seconds, then an empty response will be returned and another long poll request will be sent.
* Monitor: application can should monitor on it to make sure workers are available
* When fires, investigate the worker deployment to see why they are not available, also check if they are using the right domain/tasklist
* Datadog query example
```dql
sum:cadence_client.cadence_decision_poll_total{$Domain,$Tasklist}.as_count()
sum:cadence_client.cadence_decision_poll_failed{$Domain,$Tasklist}.as_count()
sum:cadence_client.cadence_decision_poll_no_task{$Domain,$Tasklist}.as_count()
sum:cadence_client.cadence_decision_poll_succeed{$Domain,$Tasklist}.as_count()
```

### DecisionTasks Scheduled per second
* Indicate how many decision tasks are scheduled
* Monitor: not recommended -- Information only to know whether or not a tasklist is overloaded
* Datadog query example
```dql
sum:cadence_matching.cadence_requests_per_tl{*,operation:adddecisiontask,$Tasklist,$Domain} by {tasklist,domain}.as_rate()
```

### Decision Scheduled To Start Latency
* If this latency is too high then either:
The worker is not available or too busy after the task has been scheduled.
The task list is overloaded(confirmed by DecisionTaskScheduled per second widget). By default a task list only has one partition and a partition can only be owned by one host and so the throughput of a task list is limited. More task lists can be added to scale or a scalable task list can be used to add more partitions.
* Monitor: application can set monitor on it to make sure latency is tolerable
* When fired, check if worker capacity is enough, then check if tasklist is overloaded. If needed, contact the Cadence cluster Admin to enable scalable tasklist to add more partitions to the tasklist
* Datadog query example
```dql
avg:cadence_client.cadence_decision_scheduled_to_start_latency.avg{$Domain,$Tasklist} by {env,domain,tasklist}
max:cadence_client.cadence_decision_scheduled_to_start_latency.max{$Domain,$Tasklist} by {env,domain,tasklist}
max:cadence_client.cadence_decision_scheduled_to_start_latency.95percentile{$Domain,$Tasklist} by {env,domain,tasklist}
```

### Decision Execution Failure
* This means some critical bugs in workflow code causing decision task execution failure
* Monitor: application should set monitor on it to make sure no consistent failure
* When fired, you may need to terminate the problematic workflows to mitigate the issue. After you identify the bugs, you can fix the code and then reset the workflow to recover
* Datadog query example
```dql
sum:cadence_client.cadence_decision_execution_failed{$Domain,$Tasklist} by {tasklist,workflowtype}.as_count()
```

### Decision Execution Timeout
* This means some critical bugs in workflow code causing decision task execution timeout
* Monitor: application should set monitor on it to make sure no consistent timeout
* When fired, you may need to terminate the problematic workflows to mitigate the issue. After you identify the bugs, you can fix the code and then reset the workflow to recover
* Datadog query example
```dql
sum:cadence_history.start_to_close_timeout{operation:timeractivetaskdecision*,$Domain}.as_count()
```

### Workflow End to End Latency
* This is for the client application to track their SLOs
For example, if you expect a workflow to take duration d to complete, you can use this latency to set a monitor.
* Monitor: application can monitor this metrics if expecting workflow to complete within a certain duration.
* When fired, investigate the workflow history to see the workflow takes longer than expected to complete
* Datadog query example
```dql
avg:cadence_client.cadence_workflow_endtoend_latency.median{$Domain,$Tasklist,$WorkflowType} by {env,domain,tasklist,workflowtype}
avg:cadence_client.cadence_workflow_endtoend_latency.95percentile{$Domain,$Tasklist,$WorkflowType} by {env,domain,tasklist,workflowtype}
```

### Workflow Panic and NonDeterministicError
* These errors mean that there is a bug in the code and the deploy should be rolled back.
* A monitor should be set on this metric
* When fired, you may rollback the deployment to mitigate your issue. Usually this caused by bad (non-backward compatible) code change. After rollback, look at your worker error logs to see where the bug is.
* Datadog query example
```dql
sum:cadence_client.cadence_worker_panic{$Domain} by {env,domain}.as_rate()
sum:cadence_client.cadence_non_deterministic_error{$Domain} by {env,domain}.as_rate()
```

### Workflow Sticky Cache Hit Rate and Miss Count
* This metric can be used for performance optimization.
This can be improved by adding more worker instances, or adjust the workerOption(GoSDK) or WorkferFactoryOption(Java SDK).
CacheHitRate too low means workers will have to replay history to rebuild the workflow stack when executing a decision task. Depending on the the history size
  * If less than 1MB, then it’s okay to be lower than 50%
  * If greater than 1MB, then it’s okay to be greater than 50%
  * If greater than 5MB, , then it’s okay to be greater than 60%
  * If greater than 10MB , then it’s okay to be greater than 70%
  * If greater than 20MB , then it’s okay to be greater than 80%
  * If greater than 30MB , then it’s okay to be greater than 90%
  * Workflow history size should never be greater than 50MB.
* A monitor can be set on this metric, if performance is important.
* When fired, adjust the stickyCacheSize in the WorkerFactoryOption, or add more workers
* Datadog query example
```dql
sum:cadence_client.cadence_sticky_cache_miss{$Domain} by {env,domain}.as_count()
sum:cadence_client.cadence_sticky_cache_hit{$Domain} by {env,domain}.as_count()
(b / (a+b)) * 100
```

### Activity Task Operations
* Activity started/completed counters
* Monitor: not recommended
* Datadog query example
```dql
sum:cadence_client.cadence_activity_task_failed{$Domain,$Tasklist} by {activitytype}.as_rate()
sum:cadence_client.cadence_activity_task_completed{$Domain,$Tasklist} by {activitytype}.as_rate()
sum:cadence_client.cadence_activity_task_timeouted{$Domain,$Tasklist} by {activitytype}.as_rate()
```

### Local Activity Task Operations
* Local Activity execution counters
* Monitor: not recommended
* Datadog query example
```dql
sum:cadence_client.cadence_local_activity_total{$Domain,$Tasklist} by {activitytype}.as_count()
```

### Activity Execution Latency
* If it’s expected that an activity will take x amount of time to complete, a monitor on this metric could be helpful to enforce that expectation.
* Monitor: application can set monitor on it if expecting workflow start/complete activities with certain latency
* When fired, investigate the activity code and its dependencies
* Datadog query example
```dql
avg:cadence_client.cadence_activity_execution_latency.avg{$Domain,$Tasklist} by {env,domain,tasklist,activitytype}
max:cadence_client.cadence_activity_execution_latency.max{$Domain,$Tasklist} by {env,domain,tasklist,activitytype}
```

### Activity Poll Counters
* Indicates the activity worker is available and is polling tasks. If the worker is not available no counters will show.
Can also check if the worker is using the right task list.
“No task” poll type means that the worker exists and is idle.
The timeout for this long poll api is 50 seconds. If within that 50 seconds, no task is received then an empty response will be returned and another long poll request will be sent.
* Monitor: application can set monitor on it to make sure activity workers are available
* When fires, investigate the worker deployment to see why they are not available, also check if they are using the right domain/tasklist
* Datadog query example
```dql
sum:cadence_client.cadence_activity_poll_total{$Domain,$Tasklist} by {activitytype}.as_count()
sum:cadence_client.cadence_activity_poll_failed{$Domain,$Tasklist} by {activitytype}.as_count()
sum:cadence_client.cadence_activity_poll_succeed{$Domain,$Tasklist} by {activitytype}.as_count()
sum:cadence_client.cadence_activity_poll_no_task{$Domain,$Tasklist} by {activitytype}.as_count()
```

### ActivityTasks Scheduled per second
* Indicate how many activities tasks are scheduled
* Monitor: not recommended -- Information only to know whether or not a tasklist is overloaded
* Datadog query example
```dql
sum:cadence_matching.cadence_requests_per_tl{*,operation:addactivitytask,$Tasklist,$Domain} by {tasklist,domain}.as_rate()
```

### Activity Scheduled To Start Latency
* If the latency is too high either:
The worker is not available or too busy
There are too many activities scheduled into the same tasklist and the tasklist is not scalable. Same as Decision Scheduled To Start Latency
* Monitor: application Should set monitor on it
* When fired, check if workers are enough, then check if the tasklist is overloaded. If needed, contact the Cadence cluster Admin to enable scalable tasklist to add more partitions to the tasklist
* Datadog query example
```dql
avg:cadence_client.cadence_activity_scheduled_to_start_latency.avg{$Domain,$Tasklist} by {env,domain,tasklist,activitytype}
max:cadence_client.cadence_activity_scheduled_to_start_latency.max{$Domain,$Tasklist} by {env,domain,tasklist,activitytype}
max:cadence_client.cadence_activity_scheduled_to_start_latency.95percentile{$Domain,$Tasklist} by {env,domain,tasklist,activitytype}
```

### Activity Failure
* A monitor on this metric will alert the team that activities are failing
The activity timeout metrics are emitted by the history service, because a timeout causes a hard stop and the client doesn’t have time to emit metrics.
* Monitor: application can set monitor on it
* When fired, investigate the activity code and its dependencies
* `cadence_activity_execution_failed` vs `cadence_activity_task_failed`:
Only have different when using RetryPolicy
cadence_activity_task_failed counter increase per activity attempt
cadence_activity_execution_failed counter increase when activity fails after all attempts
* should only monitor on cadence_activity_execution_failed
* Datadog query example
```dql
sum:cadence_client.cadence_activity_execution_failed{$Domain} by {domain,env}.as_rate()
sum:cadence_client.cadence_activity_task_panic{$Domain} by {domain,env}.as_count()
sum:cadence_client.cadence_activity_task_failed{$Domain} by {domain,env}.as_rate()
sum:cadence_client.cadence_activity_task_canceled{$Domain} by {domain,env}.as_count()
sum:cadence_history.heartbeat_timeout{$Domain} by {domain,env}.as_count()
sum:cadence_history.schedule_to_start_timeout{$Domain} by {domain,env}.as_rate()
sum:cadence_history.start_to_close_timeout{$Domain} by {domain,env}.as_rate()
sum:cadence_history.schedule_to_close_timeout{$Domain} by {domain,env}.as_count()
```

### Service API success rate
* The client’s experience of the service availability. It encompasses many apis. Things that could affect the service’s API success rate are:
  * Service availability
  * The network could have issues.
  * A required api is not available.
  * Client side errors like EntityNotExists, WorkflowAlreadyStarted etc. This means that application code has potential bugs of calling Cadence service.
* Monitor: application can set monitor on it
* When fired, check application logs to see if the error is Cadence server error or client side error. Error like EntityNotExists/ExecutionAlreadyStarted/QueryWorkflowFailed/etc are client side error, meaning that the application is misusing the APIs. If most errors are server side errors(internalServiceError), you can contact Cadence admin.
* Datadog query example
```dql
sum:cadence_client.cadence_error{*} by {domain}.as_count()
sum:cadence_client.cadence_request{*} by {domain}.as_count()
(1 - a / b) * 100
```

### Service API Latency
* The latency of the API, excluding long poll APIs.
* Application can set monitor on certain APIs, if necessary.
* Datadog query example
```dql
avg:cadence_client.cadence_latency.95percentile{$Domain,!cadence_metric_scope:cadence-pollforactivitytask,!cadence_metric_scope:cadence-pollfordecisiontask} by {cadence_metric_scope}
```

### Service API Breakdown
* A counter breakdown by API to help investigate availability
* No monitor needed
* Datadog query example
```dql
sum:cadence_client.cadence_request{$Domain,!cadence_metric_scope:cadence-pollforactivitytask,!cadence_metric_scope:cadence-pollfordecisiontask} by {cadence_metric_scope}.as_count()
```

### Service API Error Breakdown
* A counter breakdown by API error to help investigate availability
* No monitor needed
* Datadog query example
```dql
sum:cadence_client.cadence_error{$Domain} by {cadence_metric_scope}.as_count()
```

### Max Event Blob size
* By default the max size is 2 MB. If the input is greater than the max size the server will reject the request.
The size of a single history event. This applies to any event input, like start workflow event, start activity event, or signal event.
It should never be greater than 2MB.
* A monitor should be set on this metric.
* When fired, please review the design/code ASAP to reduce the blob size. Reducing the input/output of workflow/activity/signal will help.
* Datadog query example
```dql
​​max:cadence_history.event_blob_size.quantile{!domain:all,$Domain} by {domain}
```

### Max History Size
* Workflow history cannot grow indefinitely. It will cause replay issues.
If the workflow exceeds the history’s max size the workflow will be terminate automatically. The max size by default is 200 megabytes.
As a suggestion for workflow design, workflow history should never grow greater than 50MB. Use continueAsNew to break long workflows into multiple runs.
* A monitor should be set on this metric.
* When fired, please review the design/code ASAP to reduce the history size. Reducing the input/output of workflow/activity/signal will help. Also you may need to use ContinueAsNew to break a single execution into smaller pieces.
* Datadog query example
```dql
​​max:cadence_history.history_size.quantile{!domain:all,$Domain} by {domain}
```



### Max History Length
* The number of events of workflow history.
It should never be greater than 50K(workflow exceeding 200K events will be terminated by server). Use continueAsNew to break long workflows into multiple runs.
* A monitor should be set on this metric.
* When fired, please review the design/code ASAP to reduce the history length. You may need to use ContinueAsNew to break a single execution into smaller pieces.
* Datadog query example
```dql
​​max:cadence_history.history_count.quantile{!domain:all,$Domain} by {domain}
```


## Cadence History Service Monitoring
History is the most critical/core service for cadence which implements the workflow logic.

### History shard movements
* Should only happen during deployment or when the node restarts.
If there’s shard movement without deployments then that’s unexpected and there’s probably a performance issue. The shard ownership is assigned by a particular history host, so if the shard is moving it’ll be hard for the frontend service to route a request to a particular history shard and to find it.
* A monitor can be set to be alerted on shard movements without deployment.
* Datadog query example
```dql
sum:cadence_history.membership_changed_count{operation:shardcontroller}
sum:cadence_history.shard_closed_count{operation:shardcontroller}
sum:cadence_history.sharditem_created_count{operation:shardcontroller}
sum:cadence_history.sharditem_removed_count{operation:shardcontroller}
```

### Transfer Tasks Per Second
* TransferTask is an internal background task that moves workflow state and transfers an action task from the history engine to another service(e.g. Matching service, ElasticSearch, etc)
* No monitor needed
* Datadog query example
```dql
sum:cadence_history.task_requests{operation:transferactivetask*} by {operation}.as_rate()
```

### Timer Tasks Per Second
* Timer tasks are tasks that are scheduled to be triggered at a given time in future. For example, workflow.sleep() will wait an x amount of time then the task will be pushed somewhere for a worker to pick up.
* Datadog query example
```dql
sum:cadence_history.task_requests{operation:timeractivetask*} by {operation}.as_rate()
```

### Transfer Tasks Per Domain
* Count breakdown by domain
* Datadog query example
```dql
sum:cadence_history.task_requests_per_domain{operation:transferactive*} by {domain}.as_count()
```

### Timer Tasks Per Domain
* Count breakdown by domain
* Datadog query example
```dql
sum:cadence_history.task_requests_per_domain{operation:timeractive*} by {domain}.as_count()
```

### Transfer Latency by Type
* If latency is too high then it’s an issue for a workflow. For example, if transfer task latency is 5 second, then it takes 5 second for activity/decision to actual receive the task.
* Monitor should be set on different types of latency. Note that `queue_latency` can go very high during deployment and it's expected. See below NOTE for explanation.
* When fired, check if it’s due to some persistence issue.
If so then investigate the database(may need to scale up)
If not then see if need to scale up Cadence deployment(K8s instance)
* Datadog query example
```dql
avg:cadence_history.task_latency.quantile{$pXXLatency,operation:transfer*} by {operation}
avg:cadence_history.task_latency_processing.quantile{$pXXLatency,operation:transfer*} by {operation}
avg:cadence_history.task_latency_queue.quantile{$pXXLatency,operation:transfer*} by {operation}
```

### Timer Task Latency by type
* If latency is too high then it’s an issue for a workflow. For example, if you set the workflow.sleep() for 10 seconds and the timer latency is 5 secs then the workflow will sleep for 15 seconds.
* Monitor should be set on different types of latency.
* When fired, check if it’s due to some persistence issue.
If so then investigate the database(may need to scale up) [Mostly]
If not then see if need to scale up Cadence deployment(K8s instance)
* Datadog query example
```dql
avg:cadence_history.task_latency.quantile{$pXXLatency,operation:timer*} by {operation}
avg:cadence_history.task_latency_processing.quantile{$pXXLatency,operation:timer*} by {operation}
avg:cadence_history.task_latency_queue.quantile{$pXXLatency,operation:timer*} by {operation}
```

### NOTE: Task Queue Latency vs Executing Latency vs Processing Latency In Transfer & Timer Task Latency Metrics
* `task_latency_queue`: “Queue Latency” is “end to end” latency for users. The latency could go to several minutes during deployment because of metrics being re-emitted (but the actual latency is not that high)
* `task_latency`: “Executing latency” is the time from submission to executing pool to completion. It includes scheduling, retry and processing time of the task.
* `task_latency_processing`: “Processing latency” is the processing time of the task of a single attempt(without retry)

### Transfer Task Latency Per Domain
* Latency breakdown by domain
* No monitor needed.
* Datadog query example: modify above queries to use domain tag.

### Timer Task Latency Per Domain
* Latency breakdown by domain
* No monitor needed.
* Datadog query example: modify above queries to use domain tag.


### History API per Second
Information about history API
Datadog query example
```dql
sum:cadence_history.cadence_requests{*} by {operation}.as_rate()
```


### History API Errors per Second
* Information about history API
* No monitor needed
* Datadog query example
```dql
sum:cadence_history.cadence_errors{*} by {operation}.as_rate()
sum:cadence_history.cadence_errors_bad_request{*} by {operation}.as_rate()
sum:cadence_history.cadence_errors_domain_not_active{*} by {operation}.as_rate()
sum:cadence_history.cadence_errors_service_busy{*} by {operation}.as_rate()
sum:cadence_history.cadence_errors_entity_not_exists{*} by {operation}.as_rate()
sum:cadence_history.cadence_errors_workflow_execution_already_completed{*} by {operation}.as_rate()
sum:cadence_history.cadence_errors_execution_already_started{*} by {operation}.as_rate()
sum:cadence_history.cadence_errors_domain_already_exists{*} by {operation}.as_rate()
sum:cadence_history.cadence_errors_cancellation_already_requested{*} by {operation}.as_rate()
sum:cadence_history.cadence_errors_query_failed{*} by {operation}.as_rate()
sum:cadence_history.cadence_errors_limit_exceeded{*} by {operation}.as_rate()
sum:cadence_history.cadence_errors_context_timeout{*} by {operation}.as_rate()
sum:cadence_history.cadence_errors_retry_task{*} by {operation}.as_rate()
sum:cadence_history.cadence_errors_bad_binary{*} by {operation}.as_rate()
sum:cadence_history.cadence_errors_client_version_not_supported{*} by {operation}.as_rate()
sum:cadence_history.cadence_errors_incomplete_history{*} by {operation}.as_rate()
sum:cadence_history.cadence_errors_nondeterministic{*} by {operation}.as_rate()
sum:cadence_history.cadence_errors_unauthorized{*} by {operation}.as_rate()
sum:cadence_history.cadence_errors_authorize_failed{*} by {operation}.as_rate()
sum:cadence_history.cadence_errors_remote_syncmatch_failed{*} by {operation}.as_rate()
sum:cadence_history.cadence_errors_domain_name_exceeded_warn_limit{*} by {operation}.as_rate()
sum:cadence_history.cadence_errors_identity_exceeded_warn_limit{*} by {operation}.as_rate()
sum:cadence_history.cadence_errors_workflow_id_exceeded_warn_limit{*} by {operation}.as_rate()
sum:cadence_history.cadence_errors_signal_name_exceeded_warn_limit{*} by {operation}.as_rate()
sum:cadence_history.cadence_errors_workflow_type_exceeded_warn_limit{*} by {operation}.as_rate()
sum:cadence_history.cadence_errors_request_id_exceeded_warn_limit{*} by {operation}.as_rate()
sum:cadence_history.cadence_errors_task_list_name_exceeded_warn_limit{*} by {operation}.as_rate()
sum:cadence_history.cadence_errors_activity_id_exceeded_warn_limit{*} by {operation}.as_rate()
sum:cadence_history.cadence_errors_activity_type_exceeded_warn_limit{*} by {operation}.as_rate()
sum:cadence_history.cadence_errors_marker_name_exceeded_warn_limit{*} by {operation}.as_rate()
sum:cadence_history.cadence_errors_timer_id_exceeded_warn_limit{*} by {operation}.as_rate()
```
  * `cadence_errors` is internal service errors.
  * any `cadence_errors_*` is client side error

### Max History Size
The history size of the workflow cannot be too large otherwise it will cause performance issue during replay. The soft limit is 200MB. If exceeding workflow will be terminated by server.
* No monitor needed
* Datadog query is same as the client section

### Max History Length
Similarly, the history length of the workflow cannot be too large otherwise it will cause performance issues during replay. The soft limit is 200K events. If exceeding, workflow will be terminated by server.
* No monitor needed
* Datadog query is same as the client section

### Max Event Blob Size
* The size of each event(e.g. Decided by input/output of workflow/activity/signal/chidlWorkflow/etc) cannot be too large otherwise it will also cause performance issue. The soft limit is 2MB. If exceeding, the requests will be rejected by server, meaning that workflow won’t be able to make any progress.
* No monitor needed
* Datadog query is same as the client section


## Cadence Matching Service Monitoring
Matching service is to match/assign tasks from cadence service to workers. Matching got the tasks from history service. If workers are active the task will be matched immediately , It’s called “sync match”. If workers are not available, matching will persist into database and then reload the tasks when workers are back(called “async match”)

### Matching APIs per Second
* API processed by matching service per second
* No monitor needed
* Datadog query example
```dql
sum:cadence_matching.cadence_requests{*} by {operation}.as_rate()
```

### Matching API Errors per Second
* API errors by matching service per second
* No monitor needed
* Datadog query example
```dql
sum:cadence_matching.cadence_errors_per_tl{*} by {operation,domain,tasklist}.as_rate()
sum:cadence_matching.cadence_errors_bad_request_per_tl{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_bad_request{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_domain_not_active_per_tl{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_domain_not_active{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_service_busy_per_tl{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_service_busy{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_entity_not_exists_per_tl{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_entity_not_exists{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_execution_already_started_per_tl{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_execution_already_started{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_domain_already_exists_per_tl{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_domain_already_exists{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_cancellation_already_requested_per_tl{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_cancellation_already_requested{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_query_failed_per_tl{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_query_failed{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_limit_exceeded_per_tl{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_limit_exceeded{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_context_timeout_per_tl{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_context_timeout{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_retry_task_per_tl{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_retry_task{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_bad_binary_per_tl{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_bad_binary{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_client_version_not_supported_per_tl{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_client_version_not_supported{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_incomplete_history_per_tl{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_incomplete_history{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_nondeterministic_per_tl{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_nondeterministic{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_unauthorized_per_tl{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_unauthorized{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_authorize_failed_per_tl{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_authorize_failed{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_remote_syncmatch_failed_per_tl{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_remote_syncmatch_failed{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_shard_ownership_lost{*} by {operation,domain,tasklist}
sum:cadence_matching.cadence_errors_event_already_started{*} by {operation,domain,tasklist}
```
  * `cadence_errors` is internal service errors.
  * any `cadence_errors_*` is client side error

### Matching Regular API Latency
* Regular APIs are the APIs excluding long polls
* No monitor needed
* Datadog query example
```dql
avg:cadence_matching.cadence_latency_per_tl.quantile{$pXXLatency,!operation:pollfor*,!operation:queryworkflow} by {operation,tasklist}
```

### Sync Match Latency:
* If the latency is too high, probably the tasklist is overloaded. Consider using multiple tasklist, or enable scalable tasklist feature by adding more partition to the tasklist(default is one)
To confirm if there are too many tasks being added to the tasklist, use “AddTasks per second - domain, tasklist breakdown”
* No monitor needed
* Datadog query example
```dql
sum:cadence_matching.syncmatch_latency_per_tl.quantile{$pXXLatency} by {operation,tasklist,domain}
```

### Async match Latency
* If a match is done asynchronously it writes a match to the db to use later. Measures the time when the worker is not actively looking for tasks. If this is high, more workers are needed.
* No monitor needed
* Datadog query example
```dql
sum:cadence_matching.asyncmatch_latency_per_tl.quantile{$pXXLatency} by {operation,tasklist,domain}
```

## Cadence Default Persistence Monitoring
The following monitors should be set up for Cadence persistence.

### Persistence Availability
* The availability of the primary database for your Cadence server
* Monitor required: Below 95% > 5min then alert, below 99% triggers a slack warning
* When fired, check if it’s due to some persistence issue.
If so then investigate the database(may need to scale up) [Mostly]
If not then see if need to scale up Cadence deployment(K8s instance)
* Datadog query example
```dql
sum:cadence_frontend.persistence_errors{*} by {operation}.as_count()
sum:cadence_frontend.persistence_requests{*} by {operation}.as_count()
sum:cadence_matching.persistence_errors{*} by {operation}.as_count()
sum:cadence_matching.persistence_requests{*} by {operation}.as_count()
sum:cadence_history.persistence_errors{*} by {operation}.as_count()
sum:cadence_history.persistence_requests{*} by {operation}.as_count()
sum:cadence_worker.persistence_errors{*} by {operation}.as_count()
sum:cadence_worker.persistence_requests{*} by {operation}.as_count()
(1 - a / b) * 100
(1 - c / d) * 100
(1 - e / f) * 100
(1 - g / h) * 100
```

### Persistence By Service TPS
* No monitor needed
* Datadog query example
```dql
sum:cadence_frontend.persistence_requests{*}.as_rate()
sum:cadence_history.persistence_requests{*}.as_rate()
sum:cadence_worker.persistence_requests{*}.as_rate()
sum:cadence_matching.persistence_requests{*}.as_rate()

```

### Persistence By Operation TPS
* No monitor needed
* Datadog query example
```dql
sum:cadence_frontend.persistence_requests{*} by {operation}.as_rate()
sum:cadence_history.persistence_requests{*} by {operation}.as_rate()
sum:cadence_worker.persistence_requests{*} by {operation}.as_rate()
sum:cadence_matching.persistence_requests{*} by {operation}.as_rate()

```

### Persistence By Operation Latency
* Monitor required, alert if 95% of all operation latency is greater than 1 second for 5mins, warning if greater than 0.5 seconds
* When fired, investigate the database(may need to scale up) [Mostly]
If there’s a high latency, then there could be errors or something wrong with the db
* Datadog query example
```dql
avg:cadence_matching.persistence_latency.quantile{$pXXLatency} by {operation}
avg:cadence_worker.persistence_latency.quantile{$pXXLatency} by {operation}
avg:cadence_frontend.persistence_latency.quantile{$pXXLatency} by {operation}
avg:cadence_history.persistence_latency.quantile{$pXXLatency} by {operation}
```

### Persistence Error By Operation Count
* It's to help investigate availability issue
* No monitor needed
* Datadog query example
```dql
sum:cadence_frontend.persistence_errors{*} by {operation}.as_count()
sum:cadence_history.persistence_errors{*} by {operation}.as_count()
sum:cadence_worker.persistence_errors{*} by {operation}.as_count()
sum:cadence_matching.persistence_errors{*} by {operation}.as_count()

sum:cadence_frontend.persistence_errors_shard_exists{*} by {operation}.as_count()
sum:cadence_frontend.persistence_errors_shard_ownership_lost{*} by {operation}.as_count()
sum:cadence_frontend.persistence_errors_condition_failed{*} by {operation}.as_count()
sum:cadence_frontend.persistence_errors_current_workflow_condition_failed{*} by {operation}.as_count()
sum:cadence_frontend.persistence_errors_timeout{*} by {operation}.as_count()
sum:cadence_frontend.persistence_errors_busy{*} by {operation}.as_count()
sum:cadence_frontend.persistence_errors_entity_not_exists{*} by {operation}.as_count()
sum:cadence_frontend.persistence_errors_execution_already_started{*} by {operation}.as_count()
sum:cadence_frontend.persistence_errors_domain_already_exists{*} by {operation}.as_count()
sum:cadence_frontend.persistence_errors_bad_request{*} by {operation}.as_count()

sum:cadence_history.persistence_errors_shard_exists{*} by {operation}.as_count()
sum:cadence_history.persistence_errors_shard_ownership_lost{*} by {operation}.as_count()
sum:cadence_history.persistence_errors_condition_failed{*} by {operation}.as_count()
sum:cadence_history.persistence_errors_current_workflow_condition_failed{*} by {operation}.as_count()
sum:cadence_history.persistence_errors_timeout{*} by {operation}.as_count()
sum:cadence_history.persistence_errors_busy{*} by {operation}.as_count()
sum:cadence_history.persistence_errors_entity_not_exists{*} by {operation}.as_count()
sum:cadence_history.persistence_errors_execution_already_started{*} by {operation}.as_count()
sum:cadence_history.persistence_errors_domain_already_exists{*} by {operation}.as_count()
sum:cadence_history.persistence_errors_bad_request{*} by {operation}.as_count()

sum:cadence_matching.persistence_errors_shard_exists{*} by {operation}.as_count()
sum:cadence_matching.persistence_errors_shard_ownership_lost{*} by {operation}.as_count()
sum:cadence_matching.persistence_errors_condition_failed{*} by {operation}.as_count()
sum:cadence_matching.persistence_errors_current_workflow_condition_failed{*} by {operation}.as_count()
sum:cadence_matching.persistence_errors_timeout{*} by {operation}.as_count()
sum:cadence_matching.persistence_errors_busy{*} by {operation}.as_count()
sum:cadence_matching.persistence_errors_entity_not_exists{*} by {operation}.as_count()
sum:cadence_matching.persistence_errors_execution_already_started{*} by {operation}.as_count()
sum:cadence_matching.persistence_errors_domain_already_exists{*} by {operation}.as_count()
sum:cadence_matching.persistence_errors_bad_request{*} by {operation}.as_count()

sum:cadence_worker.persistence_errors_shard_exists{*} by {operation}.as_count()
sum:cadence_worker.persistence_errors_shard_ownership_lost{*} by {operation}.as_count()
sum:cadence_worker.persistence_errors_condition_failed{*} by {operation}.as_count()
sum:cadence_worker.persistence_errors_current_workflow_condition_failed{*} by {operation}.as_count()
sum:cadence_worker.persistence_errors_timeout{*} by {operation}.as_count()
sum:cadence_worker.persistence_errors_busy{*} by {operation}.as_count()
sum:cadence_worker.persistence_errors_entity_not_exists{*} by {operation}.as_count()
sum:cadence_worker.persistence_errors_execution_already_started{*} by {operation}.as_count()
sum:cadence_worker.persistence_errors_domain_already_exists{*} by {operation}.as_count()
sum:cadence_worker.persistence_errors_bad_request{*} by {operation}.as_count()

```
  * `cadence_errors` is internal service errors.
  * any `cadence_errors_*` is client side error

## Cadence Advanced Visibility Persistence Monitoring(if applicable)
Kafka & ElasticSearch are only for visibility. Only applicable ​​if using advanced visibility.
For writing visibility records, Cadence history service will write down the records into Kafka, and then Cadence worker service will read from Kafka and write into ElasticSearch(in batch, for performance optimization)
For reading visibility records, Frontend service will query ElasticSearch directly.

### Persistence Availability
* The availability of Cadence server using database
* Monitor can be set
* Datadog query example
```dql
sum:cadence_frontend.elasticsearch_errors{*} by {operation}.as_count()
sum:cadence_frontend.elasticsearch_requests{*} by {operation}.as_count()
sum:cadence_history.elasticsearch_errors{*} by {operation}.as_count()
sum:cadence_history.elasticsearch_requests{*} by {operation}.as_count()
(1 - a / b) * 100
(1 - c / d) * 100
```

### Persistence By Service TPS
* The error of persistence API call by service
* No monitor needed
* Datadog query example
```dql
sum:cadence_frontend.elasticsearch_requests{*}.as_rate()
sum:cadence_history.elasticsearch_requests{*}.as_rate()
```

### Persistence By Operation TPS(read: ES, write: Kafka)
* The rate of persistence API call by API
* No monitor needed
* Datadog query example
```dql
sum:cadence_frontend.elasticsearch_requests{*} by {operation}.as_rate()
sum:cadence_history.elasticsearch_requests{*} by {operation}.as_rate()
```


### Persistence By Operation Latency(in seconds) (read: ES, write: Kafka)
* The latency of persistence API call
* No monitor needed
* Datadog query example
```dql
avg:cadence_frontend.elasticsearch_latency.quantile{$pXXLatency} by {operation}
avg:cadence_history.elasticsearch_latency.quantile{$pXXLatency} by {operation}
```

### Persistence Error By Operation Count (read: ES, write: Kafka)
* The error of persistence API call
* No monitor needed
* Datadog query example
```dql
sum:cadence_frontend.elasticsearch_errors{*} by {operation}.as_count()
sum:cadence_history.elasticsearch_errors{*} by {operation}.as_count()
```

### Kafka->ES processor counter
* This is the metrics of a background processing: consuming Kafka messages and then populate to ElasticSearch in batch
* Monitor on the running of the background processing(counter metrics is > 0)
* When fired, restart Cadence service first to mitigate. Then look at logs to see why the process is stopped(process panic/error/etc).
May consider add more pods (replicaCount) to sys-worker service for higher availability
* Datadog query example
```dql
sum:cadence_worker.es_processor_requests{*} by {operation}.as_count()
sum:cadence_worker.es_processor_retries{*} by {operation}.as_count()
```

### Kafka->ES processor error
* This is the error metrics of the above processing logic
Almost all errors are retryable errors so it’s not a problem.
* Need to monitor error
* When fired, Go to Kibana to find logs about the error details.
The most common error is missing the ElasticSearch index field -- an index field is added in dynamicconfig but not in ElasticSearch, or vice versa . If so, follow the runbook to add the field to ElasticSearch or dynamic config.
* Datadog query example
```dql
sum:cadence_worker.es_processor_error{*} by {operation}.as_count()
sum:cadence_worker.es_processor_corrupted_data{*} by {operation}.as_count()
```

### Kafka->ES processor latency
* The latency of the processing logic
* No monitor needed
* Datadog query example
```dql
sum:cadence_worker.es_processor_process_msg_latency.quantile{$pXXLatency} by {operation}.as_count()
```

## Cadence Dependency Metrics Monitor suggestion


### Computing platform metrics for Cadence deployment
Cadence server being deployed on any computing platform (e.g. Kubernetes) should be monitored on the below metrics:
* CPU
* Memory

### Database
Depends on which database, you should at least monitor on the below metrics
* Disk Usage
* CPU
* Memory
* Read API latency
* Write API Latency

### Kafka (if applicable)
* Disk Usage
* CPU
* Memory

### ElasticSearch (if applicable)
* Disk Usage
* CPU
* Memory


## Cadence Service SLO Recommendation
* Core API availability: `99.9%`
* Core API latency: `<1s`
* Overall task dispatch latency: `<2s` (queue_latency for transfer task and timer task)
