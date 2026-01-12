---
layout: default
title: Starting workflows
permalink: /docs/java-client/starting-workflow-executions
---

## Creating a WorkflowClient

A :workflow: interface that executes a :workflow: requires initializing a `WorkflowClient` instance, creating
a client side stub to the :workflow:, and then calling a method annotated with @WorkflowMethod.

A simple `WorkflowClient` instance that utilizes the :tchannel: communication protocol can be initialized as follows:

```java
WorkflowClient workflowClient =
        WorkflowClient.newInstance(
            new WorkflowServiceTChannel(
                ClientOptions.newBuilder().setHost(cadenceServiceHost).setPort(cadenceServicePort).build()),
            WorkflowClientOptions.newBuilder().setDomain(domain).build());
// Create a workflow stub.
FileProcessingWorkflow workflow = workflowClient.newWorkflowStub(FileProcessingWorkflow.class);
```

Alternatively, if wishing to create a `WorkflowClient` that uses TLS, we can initialise a client that uses the gRPC communication protocol instead. First, additions will need to be made to the project's *pom.xml*:

    <dependency>
        <groupId>io.grpc</groupId>
        <artifactId>grpc-netty</artifactId>
        <version>LATEST.RELEASE.VERSION</version>
    </dependency>
    <dependency>
        <groupId>io.netty</groupId>
        <artifactId>netty-all</artifactId>
        <version>LATEST.RELEASE.VERSION</version>
    </dependency>

Then, use the following client implementation; provide a TLS certificate with which the cluster has also been configured (replace `"/path/to/cert/file"` in the sample):

```java
WorkflowClient workflowClient =
        WorkflowClient.newInstance(
            new Thrift2ProtoAdapter(
                IGrpcServiceStubs.newInstance(
                    ClientOptions.newBuilder().setGRPCChannel(
                        NettyChannelBuilder.forAddress(cadenceServiceHost, cadenceServicePort)
                            .useTransportSecurity()
                            .defaultLoadBalancingPolicy("round_robin")
                            .sslContext(GrpcSslContexts.forClient()
                                .trustManager(new File("/path/to/cert/file"))
                                .build()).build()).build())),
            WorkflowClientOptions.newBuilder().setDomain(domain).build());
// Create a workflow stub.
FileProcessingWorkflow workflow = workflowClient.newWorkflowStub(FileProcessingWorkflow.class);
```

Or, if you are using version prior to 3.0.0, a `WorkflowClient` can be created as follows:

```java
WorkflowClient workflowClient = WorkflowClient.newClient(cadenceServiceHost, cadenceServicePort, domain);
// Create a workflow stub.
FileProcessingWorkflow workflow = workflowClient.newWorkflowStub(FileProcessingWorkflow.class);
```

## Executing Workflows

There are two ways to start :workflow_execution:: asynchronously and synchronously. Asynchronous start initiates a :workflow_execution: and immediately returns to the caller. This is the most common way to start :workflow:workflows: in production code. Synchronous invocation starts a :workflow:
and then waits for its completion. If the process that started the :workflow: crashes or stops waiting, the :workflow: continues executing.
Because :workflow:workflows: are potentially long running, and crashes of clients happen, this is not very commonly found in production use.

Asynchronous start:
```java
// Returns as soon as the workflow starts.
WorkflowExecution workflowExecution = WorkflowClient.start(workflow::processFile, workflowArgs);

System.out.println("Started process file workflow with workflowId=\"" + workflowExecution.getWorkflowId()
                    + "\" and runId=\"" + workflowExecution.getRunId() + "\"");
```

Synchronous start:
```java
// Start a workflow and then wait for a result.
// Note that if the waiting process is killed, the workflow will continue execution.
String result = workflow.processFile(workflowArgs);
```

If you need to wait for a :workflow: completion after an asynchronous start, the most straightforward way
is to call the blocking version again. If `WorkflowOptions.WorkflowIdReusePolicy` is not `AllowDuplicate`, then instead
of throwing `DuplicateWorkflowException`, it reconnects to an existing :workflow: and waits for its completion.
The following example shows how to do this from a different process than the one that started the :workflow:. All this process
needs is a `WorkflowID`.

```java
WorkflowExecution execution = new WorkflowExecution().setWorkflowId(workflowId);
FileProcessingWorkflow workflow = workflowClient.newWorkflowStub(execution);
// Returns result potentially waiting for workflow to complete.
String result = workflow.processFile(workflowArgs);
```
