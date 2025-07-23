---
layout: default 
title: How To Write Tests With Workflow Replayer and Shadower 
permalink: /docs/codelabs/workflow-tests-go-replayer-shadower
---

# **Codelab: How to Write Tests With Workflow Replayer and Shadower**

**A video companion to this Codelab is available on our YouTube channel:**

<iframe width="560" height="315" src="https://www.youtube.com/embed/LHOr0NOp0Gc?si=iJB0TMfS5QbxWrn7" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

This Codelab is a step-by-step guide to help you create tests for your Cadence Workflows. By the end of this guide, you will be able to build a safety net for your workflow code, ensuring that changes you make don't break existing, long-running workflows.

We will cover two powerful testing tools and three keys concepts in the Go client:

* **[Workflow Replayer](https://cadenceworkflow.io/docs/go-client/workflow-replay-shadowing)**: A component for replaying a single, specific workflow history against your current code to check for non-deterministic changes.  
* **[Workflow Shadower](https://cadenceworkflow.io/docs/go-client/workflow-replay-shadowing#workflow-shadower)**: A tool built on top of the replayer that can scan and test many live workflows, making it ideal for CI/CD integration.
* **[Non-deterministic errors](https://cadenceworkflow.io/docs/go-client/workflow-non-deterministic-error)**: This occurs when a code change causes a workflow to make different decisions during a replay than it did originally.
---

## **Setup: Preparing Your Environment**

Let's get your local environment ready. Before we can write tests, you need a running Cadence server and the Cadence CLI to manage it.

### **1. Start the Cadence Server with Advanced Visibility**

For local development, the easiest way to run Cadence is with Docker.

* First, clone the Cadence server repository and start the server using the provided `docker-compose-es.yml` file. Advanced Visibility included in the `docker-compose-es.yml` configuration powered by Elasticsearch, is required. The [scan filters](https://cadenceworkflow.io/docs/go-client/workflow-replay-shadowing#scan-filters) for Workflow Shadower will only work if Advanced Visibility is enabled. 
```bash
  # Clone the repository  
  git clone https://github.com/cadence-workflow/cadence.git
```
```bash
  # Start the server and its dependencies  
  cd cadence/docker && docker-compose -f docker-compose-es.yml up
```
This will start the Cadence server, along with its dependencies. Keep this terminal window open to keep the server running.

For more help getting started with the Cadence platform: 
* [Cadence Server Installation](https://cadenceworkflow.io/docs/get-started/server-installation)
* [Searching Workflows (Advanced Visibility)](https://cadenceworkflow.io/docs/concepts/search-workflows)

### **2. Install Cadence CLI**

The Cadence Command Line Interface (CLI) is your primary tool for interacting with the server.

The simplest way to install the CLI is with Homebrew if you're on macOS or Linux. For other installation methods, including Docker and building from source, see the [official CLI documentation](https://cadenceworkflow.io/docs/cli/).  
```bash
brew install cadence-workflow
```

### **3. Create a Domain for this Codelab**

A **Domain** is a namespace that groups related workflows. Let's create a dedicated domain for this tutorial to keep our work isolated.

* Open a **new terminal window** and run the following command to register the domain:  
```bash
cadence --do workflow-tests-codelab-domain domain register --rd 0 --desc "Domain for the workflow tests codelab"
```

You should see a confirmation that the domain was registered successfully. We will use ```workflow-tests-codelab-domain``` throughout this Codelab.

---

## **Building and Running Our Base Workflow**

Now, let's create our initial workflow and worker code. This will be the "version 1" of our code that we'll use to generate workflow history.

Create a new directory for your project and add the following files.

### **1. The Workflow and Activity Code (```workflow.go```)**

This file defines the business logic of our workflow. It executes two activities with a one-minute pause in between.

```go
// workflow.go
package main

import (
	"context"
	"fmt"
	"time"

	"go.uber.org/cadence/activity"
	"go.uber.org/cadence/workflow"
	"go.uber.org/zap"
)

// SimpleWorkflow defines a basic workflow that calls two activities.
func SimpleWorkflow(ctx workflow.Context, name string) (string, error) {
	ao := workflow.ActivityOptions{
		TaskList:               "my-task-list",
		ScheduleToCloseTimeout: time.Minute,
		ScheduleToStartTimeout: time.Minute,
		StartToCloseTimeout:    time.Minute,
	}
	ctx = workflow.WithActivityOptions(ctx, ao)

	logger := workflow.GetLogger(ctx)
	logger.Info("SimpleWorkflow started.")

	var activityAResult string
	err := workflow.ExecuteActivity(ctx, ActivityA, name).Get(ctx, &activityAResult)
	if err != nil {
		logger.Error("Activity A failed.", zap.Error(err))
		return "", err
	}

	workflow.Sleep(ctx, time.Minute) // Wait for 1 minute

	var activityBResult string
	err = workflow.ExecuteActivity(ctx, ActivityB, activityAResult).Get(ctx, &activityBResult)
	if err != nil {
		logger.Error("Activity B failed.", zap.Error(err))
		return "", err
	}

	result := fmt.Sprintf("Workflow completed. Final result: %s", activityBResult)
	logger.Info(result)
	return result, nil
}

// ActivityA is a simple activity that returns a greeting.
func ActivityA(ctx context.Context, name string) (string, error) {
	logger := activity.GetLogger(ctx)
	logger.Info("Activity A started.")
	return fmt.Sprintf("Hello, %s!", name), nil
}

// ActivityB is another simple activity.
func ActivityB(ctx context.Context, input string) (string, error) {
	logger := activity.GetLogger(ctx)
	logger.Info("Activity B started.")
	return fmt.Sprintf("Processed message: '%s'", input), nil
}

```

### **2. The Worker and Client Code (```main.go```)**

This file contains the main function to set up and run a Cadence worker. The worker polls for tasks, executing the workflow and activity code defined in workflow.go.

```go
// main.go
package main

import (
	apiv1 "github.com/uber/cadence-idl/go/proto/api/v1"
	"go.uber.org/cadence/.gen/go/cadence/workflowserviceclient"
	"go.uber.org/cadence/compatibility"
	"go.uber.org/cadence/worker"
	"go.uber.org/cadence/workflow"
	"go.uber.org/cadence/activity"
	"go.uber.org/yarpc"
	"go.uber.org/yarpc/transport/grpc"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

const (
	Domain   = "workflow-tests-codelab-domain"
	HostPort = "127.0.0.1:7833"
	TaskList 	   = "my-task-list"
	ClientName     = "cadence-samples-worker"
	CadenceService = "cadence-frontend"
)

func main() {
	// Create logger
	logger, err:= zap.NewDevelopment(zap.AddStacktrace(zapcore.ErrorLevel))
	if err != nil {
		panic("Failed to setup logger: " + err.Error())
	}
	// Create workflow service client
	cadenceClient :=  BuildCadenceClient()

	// Create worker and register workflows and activities
	workerOptions := worker.Options{
		Logger:       logger,
	}
	w := worker.New(cadenceClient, Domain, TaskList, workerOptions)
	w.RegisterWorkflowWithOptions(SimpleWorkflow, workflow.RegisterOptions{Name: "workflow-shadowing.SimpleWorkflow"})
	w.RegisterActivityWithOptions(ActivityA, activity.RegisterOptions{Name: "workflow-shadowing.ActivityA"})
	w.RegisterActivityWithOptions(ActivityB, activity.RegisterOptions{Name: "workflow-shadowing.ActivityB"})
	
	logger.Info("Starting worker.", zap.String("Domain", Domain), zap.String("TaskList", TaskList))

	// Start worker
	err = w.Start()
	if err != nil {
		logger.Fatal("Failed to start worker.", zap.Error(err))
	}

	// Prevent main from exiting
	select {}
}

func BuildCadenceClient() workflowserviceclient.Interface { 
	dispatcher := yarpc.NewDispatcher(yarpc.Config{
		Name: ClientName,
		Outbounds: yarpc.Outbounds{
			CadenceService: {Unary: grpc.NewTransport().NewSingleOutbound(HostPort)},
		},
	})
	if err := dispatcher.Start(); err != nil {
		panic("Failed to start dispatcher: " + err.Error())
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

### **3. Initialize Go Module**

Before running the worker, you need to initialize the Go module and install dependencies.

* Open a terminal in your project directory and run:

Initialize the Go module
```bash
go mod init workflow-shadowing
```
Download the dependencies
```bash
go mod tidy
```
**If you see any errors like this:**
```
ambiguous import: found package google.golang.org/genproto/googleapis...
```
Add the following to your `go.mod` file and run `go mod tidy` again. 
```go
// Explicitly require the newer split modules
require (
    google.golang.org/genproto/googleapis/rpc v0.0.0-20240814211410-ddb44dafa142
)

// Exclude the old monolithic module that causes conflicts
exclude (
    google.golang.org/genproto v0.0.0-20200212174721-66ed5ce911ce
)
```

You should now have a `go.mod` and a `go.sum` file. You are ready to run the worker.

### **4. Run the Worker**

With both files created, start your worker. It will connect to the Cadence server and begin polling for tasks on my-task-list.

* In the same terminal, run the following to start your `Worker`:  
```bash
go run .
```
**Leave this worker running.*

### **5. Generate Workflow History (```run-workflows.sh```)**

Now we need to create some workflow histories to test against later.

* Create a new shell script named ```run-workflows.sh``` in your project directory. This version allows you to specify the number of workflows to run as a command-line argument, defaulting to 20 if not provided.  
```bash
#!/bin/bash

# run-workflows.sh  
# Usage: ./run-workflows.sh [number_of_workflows]

# Use the first command-line argument for the count, or default to 20.  
COUNT=${1:-20}

echo "Starting $COUNT instances of SimpleWorkflow..."

for i in $(seq 1 $COUNT)  
do  
  WORKFLOW_ID="codelab-workflow-$i"  
  cadence --do workflow-tests-codelab-domain workflow start  \
    --tl my-task-list   \
    --wt workflow-shadowing.SimpleWorkflow   \
    --et 600   \
    --wid "$WORKFLOW_ID"   \
    -i '"World"'  
  echo "Started workflow with ID: $WORKFLOW_ID"  
  sleep 1 # Sleep for a second to not overwhelm the server  
done

echo "Finished starting workflows."
```

* Make the script executable and run it to start 20 workflow executions.  
```bash
chmod +x run-workflows.sh
```
```bash
./run-workflows.sh
```
**Or, run with a specific number, like 5**

```bash
./run-workflows.sh 5
```

You have now successfully created running instances of SimpleWorkflow. This history is stored in Cadence and is what we will test against.

---

## **Testing Part 1: Unit Testing with WorkflowReplayer**

The WorkflowReplayer is your first line of defense. It allows you to test your code changes against the history of a single, specific workflow execution. This is perfect for unit tests.

Let's start by testing our current workflow code to ensure it's compatible with existing workflow histories. This will establish a baseline of success before we make any changes.

### **Step 1: Get a Workflow History**

First, you need the history of a completed workflow to test against. Use the CLI to find a workflow that has already completed and save its history to a file.

```bash
# First, list recent workflows to find a completed one  
cadence --do workflow-tests-codelab-domain workflow list

# Pick a Workflow ID and Run ID from the list and save its history  
cadence --do workflow-tests-codelab-domain workflow show --wid <workflow-id> --rid <run-id> --of history.json
```

### **Step 2: Write the Replay Test**

Now, create a new file named ```workflow_replayer_test.go```. This test will use the history file you just downloaded to verify that our current code is compatible with existing workflow histories.

```go
//workflow_replayer_test.go
package main

import (
	"testing"

	"github.com/stretchr/testify/require"
	"go.uber.org/cadence/worker"
	"go.uber.org/cadence/workflow"
	"go.uber.org/zap"
)

func TestReplayWorkflowHistory(t *testing.T) {  
	replayer := worker.NewWorkflowReplayer()

	// Register our current workflow definition 
	replayer.RegisterWorkflowWithOptions(SimpleWorkflow, workflow.RegisterOptions{Name: "workflow-shadowing.SimpleWorkflow"})  

	err := replayer.ReplayWorkflowHistoryFromJSONFile(zap.NewNop(), "history.json")  
	  
	// This test should PASS because our current code matches the history  
	require.NoError(t, err, "The workflow replay should succeed with our current code.")  
}
```

### **Step 3: Run the Test and See Success**

Run the test from your terminal.

```bash
go test -run TestReplayWorkflowHistory -v
```

The test should pass! This confirms that our current workflow code is compatible with existing workflow histories. You should see output similar to:

```
=== RUN   TestReplayWorkflowHistory
--- PASS: TestReplayWorkflowHistory (0.01s)
PASS
```

This successful test establishes that our testing framework is working correctly and our current code is safe.

---

## **Testing Part 2: Integration Testing with WorkflowShadower**

The WorkflowReplayer is great, but manually downloading histories isn't scalable for a CI pipeline. WorkflowShadower automates this process by scanning live workflows from a domain and replaying them on the fly.

Let's test our current workflow code using the shadower to ensure it's compatible with all the workflow histories in our domain.

### **Step 1: Write the Shadower Test**

Create a new file named ```workflow_shadower_test.go```. This test will connect to your Cadence server and attempt to replay a sample of recent workflows from the domain we created.

```go
// workflow_shadower_test.go
package main

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"go.uber.org/cadence/worker"
	"go.uber.org/cadence/workflow"
	"go.uber.org/zap"
)

func TestShadowRecentWorkflows(t *testing.T) {       
    //Create workflow service client
	cadenceClient :=  BuildCadenceClient()

	// Shadow workflows that started in the last 24 hours  
	// and stop after successfully replaying 20 of them.  
	shadowOptions := worker.ShadowOptions{  
		WorkflowStartTimeFilter: worker.TimeFilter{  
			// Subtract 24 hours from the current time
			MinTimestamp: time.Now().Add(-24 * time.Hour),  
		},  
		ExitCondition: worker.ShadowExitCondition{  
			ShadowCount: 20,  
		},
		WorkflowStatus: []string{"Completed"},
	}  

	// Create shadower
	shadower, err := worker.NewWorkflowShadower(  
		cadenceClient,  
		Domain, // Using the constant from main.go  
		shadowOptions,  
		worker.ReplayOptions{}, // Can add custom converters, etc. here  
		zap.NewNop(),  
	)  
	assert.NoError(t, err)  
      
    // Register our current workflow definition
	shadower.RegisterWorkflowWithOptions(SimpleWorkflow, workflow.RegisterOptions{Name: "workflow-shadowing.SimpleWorkflow"})  

	// Run will fetch and replay workflows. It will return an error  
	// if any of them have a non-deterministic failure.  
	err = shadower.Run()  
	assert.NoError(t, err, "Shadower should not find any non-deterministic workflows")  
}
```

### **Step 2: Run the Test and See Success**

Run the shadower test from your terminal.

```bash
go test -run TestShadowRecentWorkflows -v
```

The test should pass! This confirms that our current workflow code is compatible with all the existing workflow histories in our domain. You should see output similar to:

```
=== RUN   TestShadowRecentWorkflows
--- PASS: TestShadowRecentWorkflows (0.08s)
PASS
```

This successful test demonstrates that the shadower can scan multiple workflows from your domain and verify compatibility automatically. This is exactly what you'd want running in your CI/CD pipeline.

---

## **Introduce a Breaking Change**

Now that we've established that our testing tools work correctly with our current code, let's see what happens when we introduce a breaking change.

A [non-deterministic error](https://cadenceworkflow.io/docs/go-client/workflow-non-deterministic-error) occurs when a code change causes a workflow to make different decisions during a replay than it did originally.

Let's introduce a **breaking change** to our ```workflow.go``` file. We will add a new activity call right after ```ActivityA```.

* Modify ```workflow.go```:  
```go
// workflow.go
// ... inside the SimpleWorkflow function  
	var activityAResult string  
	err := workflow.ExecuteActivity(ctx, ActivityA, name).Get(ctx, &activityAResult)  
//...

// NEWLY ADDED CODE  
	var activityCResult string  
	workflow.ExecuteActivity(ctx, ActivityC, activityAResult).Get(ctx, &activityCResult)  
// END NEWLY ADDED CODE

	workflow.Sleep(ctx, time.Minute) // Wait for 1 minute  
// ...
```

* Next, define ```ActivityC``` and register it in ```main.go```:  
```go
// workflow.go  
func ActivityC(ctx context.Context, input string) (string, error) {  
	return fmt.Sprintf("Activity C processed: '%s'", input), nil  
}

// main.go  
// ... in main() function  
w.RegisterActivityWithOptions(ActivityC, activity.RegisterOptions{Name: "workflow-shadowing.ActivityC"})
 
// ...
```

If you were to restart your worker now, any of the 20 workflows that were past ActivityA but paused at the Sleep would fail with a non-deterministic error. Let's prove this with our testing tools.

---

## **Testing the Breaking Change: Replayer Catches the Error**

Now let's see how our replayer test catches this breaking change.



### **Run the Test and See the Failure**

Run the replayer test from your terminal.

```bash
go test -run TestReplayWorkflowHistory  -v
```

The test will fail! The error message clearly indicates that the replay produced an extra command that wasn't in the original history, pinpointing the non-deterministic change.

```
    workflow_replayer_test.go:22:   
        	Error Trace:	workflow_replayer_test.go:22  
        	Error:      	Received unexpected error:  
        	            	nondeterministic workflow: history event is TimerStarted: (TimerId:1, StartToFireTimeoutSeconds:60, DecisionTaskCompletedEventId:10), replay decision is ScheduleActivityTask: (ActivityId:1, ActivityType:(Name:workflow-shadowing.ActivityC)...
        	Test:       	TestReplayWorkflowHistory
--- FAIL: TestReplayWorkflowHistory (0.01s) 
```

This test successfully caught the breaking change before it could affect production workflows.

---

## **Testing the Breaking Change: Shadower Catches the Error**

Let's also see how our shadower test catches this same breaking change.

### **Run the Test and See it Fail**

Run the shadower test from your terminal.

```bash
go test -run TestShadowRecentWorkflows  -v
```

Like the replayer test, this will also fail. The shadower will find one of the workflows we started earlier, attempt to replay its history with our modified code, and immediately detect the non-deterministic error. The error occurs because the replayer expected a ```TimerStarted``` task but instead a ```ScheduleActivityTask``` for ```ActivityC```.  

```
    workflow_shadower_test.go:48   
        	Error Trace:	workflow_shadower_test.go:48  
        	Error:      	Received unexpected error:  
				nondeterministic workflow: history event is TimerStarted: (TimerId:1, StartToFireTimeoutSeconds:60, DecisionTaskCompletedEventId:10), replay decision is ScheduleActivityTask: (ActivityId:1, ActivityType:(Name:workflow-shadowing.ActivityC)...
        	Test:       	TestShadowRecentWorkflows
--- FAIL: TestShadowRecentWorkflows (0.17s) 
```

This provides a powerful, automated way to validate changes against real-world workflow executions.

---

## **Cleanup**

Once you've completed the Codelab, you can deprecate and then delete the domain to keep your local Cadence server clean.

* To deprecate the domain, run the following command:  
```bash
cadence --do workflow-tests-codelab-domain domain deprecate 
```

* To delete the domain, run the following command:  
```bash
cadence --do workflow-tests-codelab-domain domain delete 
```

---

## **Conclusion**

By using WorkflowReplayer for unit tests and WorkflowShadower for broader integration tests, you can build a comprehensive CI/CD gate. This ensures your Cadence Workflows remain backward-compatible, giving you the confidence to develop and deploy changes freely without risking the integrity of your long-running business processes.