---
layout: default
title: Worker service
permalink: /docs/java-client/workers
---

# Worker service

A :worker: or *:worker: service* is a service that hosts the :workflow: and :activity: implementations. The :worker: polls the *Cadence service* for :task:tasks:, performs those :task:tasks:, and communicates :task: execution results back to the *Cadence service*. :worker:Worker: services are developed, deployed, and operated by Cadence customers.

You can run a Cadence :worker: in a new or an existing service. Use the framework APIs to start the Cadence :worker: and link in all :activity: and :workflow: implementations that you require the service to execute.

```java
  WorkerFactory factory = WorkerFactory.newInstance(workflowClient,
          WorkerFactoryOptions.newBuilder()
                  .setMaxWorkflowThreadCount(1000)
                  .setStickyCacheSize(100)
                  .setDisableStickyExecution(false)
                  .build());
  Worker worker = factory.newWorker(TASK_LIST,
          WorkerOptions.newBuilder()
                  .setMaxConcurrentActivityExecutionSize(100)
                  .setMaxConcurrentWorkflowExecutionSize(100)
                  .build());

    // Workflows are stateful. So you need a type to create instances.
    worker.registerWorkflowImplementationTypes(GreetingWorkflowImpl.class);
    // Activities are stateless and thread safe. So a shared instance is used.
    worker.registerActivitiesImplementations(new GreetingActivitiesImpl());
    // Start listening to the workflow and activity task lists.
    factory.start();
```

The code is slightly different if you are using client version prior to 3.0.0:
```java
Worker.Factory factory = new Worker.Factory(DOMAIN,
            new Worker.FactoryOptions.Builder()
                    .setMaxWorkflowThreadCount(1000)
                    .setCacheMaximumSize(100)
                    .setDisableStickyExecution(false)
                    .build());
    Worker worker = factory.newWorker(TASK_LIST,
            new WorkerOptions.Builder()
                    .setMaxConcurrentActivityExecutionSize(100)
                    .setMaxConcurrentWorkflowExecutionSize(100)
                    .build());
    // Workflows are stateful. So you need a type to create instances.
    worker.registerWorkflowImplementationTypes(GreetingWorkflowImpl.class);
    // Activities are stateless and thread safe. So a shared instance is used.
    worker.registerActivitiesImplementations(new GreetingActivitiesImpl());
    // Start listening to the workflow and activity task lists.
    factory.start();
```

The [WorkerFactoryOptions](https://www.javadoc.io/static/com.uber.cadence/cadence-client/2.7.9-alpha/com/cadence-workflow/cadence/worker/WorkerFactoryOptions.html) includes those that need to be shared across workers on the hosts like thread pool, sticky cache.

In [WorkerOptions](https://www.javadoc.io/static/com.uber.cadence/cadence-client/2.7.9-alpha/com/cadence-workflow/cadence/worker/WorkerOptions.Builder.html) you can customize things like pollerOptions, activities per second.
