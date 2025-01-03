---
layout: default
title: Golang hello world
permalink: /docs/get-started/golang-hello-world
---

# Golang Hello World
This section provides step-by-step instructions on how to write and run a HelloWorld workflow in Cadence with Golang. You will learn two critical building blocks of Cadence: activities and workflows. First, you will write an activity function that prints a "Hello World!" message in the log. Then, you will write a workflow function that executes this activity.

## Prerequisite
To successfully run this hello world sample, follow this checklist of setting up Cadence environment
1. Your worker is running properly and you have registered the hello world activity and workflow to the worker
2. Your Cadence server is running (check your background docker container process)
3. You have successfully registered a domain for this workflow

You must finish part 2 and 3 by following the [first section](/docs/get-started/server-installation) to proceed the next steps.
We are using domain called `test-domain` for this tutorial project.

## Step 1. Implement A Cadence Worker Service
Create a new `main.go` file in your local directory and paste the basic worker service layout.

```go
package main

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

var HostPort = "127.0.0.1:7833"
var Domain = "test-domain"
var TaskListName = "test-worker"
var ClientName = "test-worker"
var CadenceService = "cadence-frontend"

func main() {
    startWorker(buildLogger(), buildCadenceClient())
    err := http.ListenAndServe(":8080", nil)
    if err != nil {
        panic(err)
    }
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

In this worker service, we start a HTTP server and create a new Cadence client running continuously at the background. Then start the server on your local, you may see logs such like

```log
2023-07-03T11:46:46.266-0700    INFO    internal/internal_worker.go:826 Worker has no workflows registered, so workflow worker will not be started.     {"Domain": "test-domain", "TaskList": "test-worker", "WorkerID": "35987@uber-C02F18EQMD6R@test-worker@90c0260e-ba5c-4652-9f10-c6d1f9e29c1d"}
2023-07-03T11:46:46.267-0700    INFO    internal/internal_worker.go:834 Started Workflow Worker {"Domain": "test-domain", "TaskList": "test-worker", "WorkerID": "35987@uber-C02F18EQMD6R@test-worker@90c0260e-ba5c-4652-9f10-c6d1f9e29c1d"}
2023-07-03T11:46:46.267-0700    INFO    internal/internal_worker.go:838 Worker has no activities registered, so activity worker will not be started.    {"Domain": "test-domain", "TaskList": "test-worker", "WorkerID": "35987@uber-C02F18EQMD6R@test-worker@90c0260e-ba5c-4652-9f10-c6d1f9e29c1d"}
2023-07-03T11:46:46.267-0700    INFO    cadence-worker/main.go:75       Started Worker. {"worker": "test-worker"}
```

You may see this because there are no activities and workflows registered to the worker. Let's proceed to next steps to write a hello world activity and workflow.

## Step 2. Write a simple Cadence hello world activity and workflow

Let's write a hello world activity, which take a single input called `name` and greet us after the workflow is finished.

```go
func helloWorldWorkflow(ctx workflow.Context, name string) error {
	ao := workflow.ActivityOptions{
		ScheduleToStartTimeout: time.Minute,
		StartToCloseTimeout:    time.Minute,
		HeartbeatTimeout:       time.Second * 20,
	}
	ctx = workflow.WithActivityOptions(ctx, ao)

	logger := workflow.GetLogger(ctx)
	logger.Info("helloworld workflow started")
	var helloworldResult string
	err := workflow.ExecuteActivity(ctx, helloWorldActivity, name).Get(ctx, &helloworldResult)
	if err != nil {
		logger.Error("Activity failed.", zap.Error(err))
		return err
	}

	logger.Info("Workflow completed.", zap.String("Result", helloworldResult))

	return nil
}

func helloWorldActivity(ctx context.Context, name string) (string, error) {
	logger := activity.GetLogger(ctx)
	logger.Info("helloworld activity started")
	return "Hello " + name + "!", nil
}
```

Don't forget to register the workflow and activity to the worker.

```go
func init() {
    workflow.Register(helloWorldWorkflow)
    activity.Register(helloWorldActivity)
}
```

Import the `context` module if it was not automatically added.
```go
import (
    "context"
)
```

## Step 3. Run the workflow with Cadence CLI

Restart your worker and run the following command to interact with your workflow.

```bash
cadence --domain test-domain workflow start --et 60 --tl test-worker --workflow_type main.helloWorldWorkflow --input '"World"'
```

You should see logs in your worker terminal like
```log
2023-07-16T11:30:02.717-0700    INFO    cadence-worker/code.go:104      Workflow completed. {"Domain": "test-domain", "TaskList": "test-worker", "WorkerID": "11294@uber-C02F18EQMD6R@test-worker@5829c68e-ace0-472f-b5f3-6ccfc7903dd5", "WorkflowType": "main.helloWorldWorkflow", "WorkflowID": "8acbda3c-d240-4f27-8388-97c866b8bfb5", "RunID": "4b91341f-056f-4f0b-ab64-83bcc3a53e5a", "Result": "Hello World!"}
```

Congratulations! You just launched your very first Cadence workflow from scratch

## (Optional) Step 4. Monitor Cadence workflow with Cadence web UI
When you start the Cadence backend server, it also automatically starts a front end portal for your workflow. Open you browser and go to

http://localhost:8088

You may see a dashboard below
![cadence-ui](./img/cadence_ui.png)

Type the domain you used for the tutorial, in this case, we type `test-domain` and hit enter. Then you can see a complete history of the workflows you have triggered associated to this domain.
![cadence-ui-detailed](./img/cadence_ui_detailed.png)

## What is Next
Now you have completed the tutorials. You can continue to explore the key [concepts](/docs/concepts) in Cadence, and also how to use them with [Go Client](/docs/go-client)

For complete, ready to build samples covering all the key Cadence concepts go to [Cadence-Samples](https://github.com/cadence-workflow/cadence-samples) for more examples.

You can also review [Cadence-Client](https://github.com/cadence-workflow/cadence-go-client/) and [go-docs](https://pkg.go.dev/go.uber.org/cadence) for more documentation.
