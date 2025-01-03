---
title: Implement a Cadence worker service from scratch

date: 2023-07-05
authors: chopincode
tags:
  - deep-dive
  - introduction-to-cadence
---

In the previous [blog](/blog/2023-06-28-components-of-cadence-application-setup.md), we have introduced three critical components for a Cadence application: the Cadence backend, domain, and worker. Among these, the worker service is the most crucial focus for developers as it hosts the activities and workflows of a Cadence application. In this blog, I will provide a short tutorial on how to implement a simple worker service from scratch in Go.

To finish this tutorial, there are two prerequisites you need to finish first
1. Register a Cadence domain for your worker. For this tutorial, I've already registered a domain named `test-domain`
2. Start the Cadence backend server in background.

To get started, let's simply use the native HTTP package built in Go to start a process listening to port 3000. You may customize the port for your worker, but the port you choose should not conflict with existing port for your Cadence backend.

```go
package main

import (
	"fmt"
	"net/http"
)

func main(){
	fmt.Println("Cadence worker started at port 3000")
	http.ListenAndServe(":3000", nil)
}
```
<!-- truncate -->

Next, let's define some basic configurations for the worker. In real production environment, you may need to implement them in configurational languages, but in this tutorial, let's just hard code them for now.

```go
var HostPort = "127.0.0.1:7933"
var Domain = "test-domain"
var TaskListName = "test-worker"
var ClientName = "test-worker"
var CadenceService = "cadence-frontend"
```

Note that the domain is what we've already registered in advance. We will need to use this domain to interact with Cadence CLI tool.

Then let's write a simple function to build a Cadence client on gRPC in your worker, which will communicate with the Cadence backend continuously.

```go
func buildCadenceClient() workflowserviceclient.Interface {
    dispatcher := yarpc.NewDispatcher(yarpc.Config{
		Name: ClientName,
		Outbounds: yarpc.Outbounds{
		  CadenceService: {Unary: grpc.NewTransport().NewSingleOutbound(HostPort)},
		},
	  })
	  if err := dispatcher.Start(); err != nil {
		panic("Failed to start dispatcher")
	  }

	  clientConfig := dispatcher.ClientConfig(CadenceService)

	  return compatibility.NewThrift2ProtoAdapter(
		apiv1.NewDomainAPIYARPCClient(clientConfig),
		apiv1.NewWorkflowAPIYARPCClient(clientConfig),
		apiv1.NewWorkerAPIYARPCClient(clientConfig),
		apiv1.NewVisibilityAPIYARPCClient(clientConfig),
	  )
}
```

Let's also build a logger to help us debug our application

```go
func buildLogger() *zap.Logger {
    config := zap.NewDevelopmentConfig()
    config.Level.SetLevel(zapcore.InfoLevel)

    var err error
    logger, err := config.Build()
    if err != nil {
        panic("Failed to setup logger")
    }

    return logger
}
```

With both client and logger helper function ready, let's write the function that starts our worker.

```go
func startWorker(logger *zap.Logger, service workflowserviceclient.Interface) {
    // TaskListName identifies set of client workflows, activities, and workers.
    // It could be your group or client or application name.
    workerOptions := worker.Options{
        Logger:       logger,
        MetricsScope: tally.NewTestScope(TaskListName, map[string]string{}),
    }

    worker := worker.New(
        service,
        Domain,
        TaskListName,
        workerOptions)
    err := worker.Start()
    if err != nil {
        panic("Failed to start worker")
    }

    logger.Info("Started Worker.", zap.String("worker", TaskListName))
}
```

Now we have all components ready for the worker, let's put them together.

```Go
import (
    "net/http"
    "go.uber.org/cadence/.gen/go/cadence/workflowserviceclient"
    "go.uber.org/cadence/compatibility"
    "go.uber.org/cadence/worker"

    apiv1 "github.com/cadence-workflow/cadence-idl/go/proto/api/v1"
    "github.com/uber-go/tally"
    "go.uber.org/zap"
    "go.uber.org/zap/zapcore"
    "go.uber.org/yarpc"
    "go.uber.org/yarpc/transport/grpc"
)

var HostPort = "127.0.0.1:7933"
var Domain = "test-domain"
var TaskListName = "test-worker"
var ClientName = "test-worker"
var CadenceService = "cadence-frontend"

func main() {
    startWorker(buildLogger(), buildCadenceClient())
    http.ListenAndServe(":3000", nil)
}

func buildLogger() *zap.Logger {
    config := zap.NewDevelopmentConfig()
    config.Level.SetLevel(zapcore.InfoLevel)

    var err error
    logger, err := config.Build()
    if err != nil {
        panic("Failed to setup logger")
    }

    return logger
}

func buildCadenceClient() workflowserviceclient.Interface {
    dispatcher := yarpc.NewDispatcher(yarpc.Config{
		Name: ClientName,
		Outbounds: yarpc.Outbounds{
		  CadenceService: {Unary: grpc.NewTransport().NewSingleOutbound(HostPort)},
		},
	  })
	  if err := dispatcher.Start(); err != nil {
		panic("Failed to start dispatcher")
	  }

	  clientConfig := dispatcher.ClientConfig(CadenceService)

	  return compatibility.NewThrift2ProtoAdapter(
		apiv1.NewDomainAPIYARPCClient(clientConfig),
		apiv1.NewWorkflowAPIYARPCClient(clientConfig),
		apiv1.NewWorkerAPIYARPCClient(clientConfig),
		apiv1.NewVisibilityAPIYARPCClient(clientConfig),
	  )
}

func startWorker(logger *zap.Logger, service workflowserviceclient.Interface) {
    // TaskListName identifies set of client workflows, activities, and workers.
    // It could be your group or client or application name.
    workerOptions := worker.Options{
        Logger:       logger,
        MetricsScope: tally.NewTestScope(TaskListName, map[string]string{}),
    }

    worker := worker.New(
        service,
        Domain,
        TaskListName,
        workerOptions)
    err := worker.Start()
    if err != nil {
        panic("Failed to start worker")
    }

    logger.Info("Started Worker.", zap.String("worker", TaskListName))
}
```

Open a new terminal and start this server, you should see logs like
```shell
2023-07-03T11:46:46.266-0700    INFO    internal/internal_worker.go:826 Worker has no workflows registered, so workflow worker will not be started.     {"Domain": "test-domain", "TaskList": "test-worker", "WorkerID": "35987@uber-C02F18EQMD6R@test-worker@90c0260e-ba5c-4652-9f10-c6d1f9e29c1d"}
2023-07-03T11:46:46.267-0700    INFO    internal/internal_worker.go:834 Started Workflow Worker {"Domain": "test-domain", "TaskList": "test-worker", "WorkerID": "35987@uber-C02F18EQMD6R@test-worker@90c0260e-ba5c-4652-9f10-c6d1f9e29c1d"}
2023-07-03T11:46:46.267-0700    INFO    internal/internal_worker.go:838 Worker has no activities registered, so activity worker will not be started.    {"Domain": "test-domain", "TaskList": "test-worker", "WorkerID": "35987@uber-C02F18EQMD6R@test-worker@90c0260e-ba5c-4652-9f10-c6d1f9e29c1d"}
2023-07-03T11:46:46.267-0700    INFO    cadence-worker/main.go:75       Started Worker. {"worker": "test-worker"}
```

You may see these logs because your worker is successfully running but we haven't registered any workflows or activities to the worker. In the next tutorial, we will learn how to write a simple hello world workflow for your Cadence application.
