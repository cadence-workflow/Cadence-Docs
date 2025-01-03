---
layout: default
title: Implementing workflows
permalink: /docs/java-client/implementing-workflows
---

# Implementing workflows

A :workflow: implementation implements a :workflow: interface. Each time a new :workflow_execution: is started,
a new instance of the :workflow: implementation object is created. Then, one of the methods
(depending on which :workflow: type has been started) annotated with `@WorkflowMethod` is invoked. As soon as this method
returns, the :workflow_execution: is closed. While :workflow_execution: is open, it can receive calls to :signal: and :query: methods.
No additional calls to :workflow: methods are allowed. The :workflow: object is stateful, so :query: and :signal: methods
can communicate with the other parts of the :workflow: through :workflow: object fields.

## Calling Activities

`Workflow.newActivityStub` returns a client-side stub that implements an :activity: interface.
It takes :activity: type and :activity: options as arguments. :activity:Activity: options are needed only if some of the required
timeouts are not specified through the `@ActivityMethod` annotation.

Calling a method on this interface invokes an :activity: that implements this method.
An :activity: invocation synchronously blocks until the :activity: completes, fails, or times out. Even if :activity:
execution takes a few months, the :workflow: code still sees it as a single synchronous invocation.
It doesn't matter what happens to the processes that host the :workflow:. The business logic code
just sees a single method call.
```java
public class FileProcessingWorkflowImpl implements FileProcessingWorkflow {

    private final FileProcessingActivities activities;

    public FileProcessingWorkflowImpl() {
        this.activities = Workflow.newActivityStub(FileProcessingActivities.class);
    }

    @Override
    public void processFile(Arguments args) {
        String localName = null;
        String processedName = null;
        try {
            localName = activities.download(args.getSourceBucketName(), args.getSourceFilename());
            processedName = activities.processFile(localName);
            activities.upload(args.getTargetBucketName(), args.getTargetFilename(), processedName);
        } finally {
            if (localName != null) { // File was downloaded.
                activities.deleteLocalFile(localName);
            }
            if (processedName != null) { // File was processed.
                activities.deleteLocalFile(processedName);
            }
        }
    }
    ...
}
```
If different :activity:activities: need different options, like timeouts or a :task_list:, multiple client-side stubs can be created
with different options.

```java
public FileProcessingWorkflowImpl() {
    ActivityOptions options1 = new ActivityOptions.Builder()
             .setTaskList("taskList1")
             .build();
    this.store1 = Workflow.newActivityStub(FileProcessingActivities.class, options1);

    ActivityOptions options2 = new ActivityOptions.Builder()
             .setTaskList("taskList2")
             .build();
    this.store2 = Workflow.newActivityStub(FileProcessingActivities.class, options2);
}
```

## Calling Activities Asynchronously

Sometimes :workflow:workflows: need to perform certain operations in parallel.
The `Async` class static methods allow you to invoke any :activity: asynchronously. The calls return a `Promise` result immediately.
`Promise` is similar to both Java `Future` and `CompletionStage`. The `Promise` `get` blocks until a result is available.
It also exposes the `thenApply` and `handle` methods. See the `Promise` JavaDoc for technical details about differences with `Future`.

To convert a synchronous call:
```java
String localName = activities.download(sourceBucket, sourceFile);
```
To asynchronous style, the method reference is passed to `Async.function` or `Async.procedure`
followed by :activity: arguments:
```java
Promise<String> localNamePromise = Async.function(activities::download, sourceBucket, sourceFile);
```
Then to wait synchronously for the result:
```java
String localName = localNamePromise.get();
```
Here is the above example rewritten to call download and upload in parallel on multiple files:
```java
public void processFile(Arguments args) {
    List<Promise<String>> localNamePromises = new ArrayList<>();
    List<String> processedNames = null;
    try {
        // Download all files in parallel.
        for (String sourceFilename : args.getSourceFilenames()) {
            Promise<String> localName = Async.function(activities::download,
                args.getSourceBucketName(), sourceFilename);
            localNamePromises.add(localName);
        }
        // allOf converts a list of promises to a single promise that contains a list
        // of each promise value.
        Promise<List<String>> localNamesPromise = Promise.allOf(localNamePromises);

        // All code until the next line wasn't blocking.
        // The promise get is a blocking call.
        List<String> localNames = localNamesPromise.get();
        processedNames = activities.processFiles(localNames);

        // Upload all results in parallel.
        List<Promise<Void>> uploadedList = new ArrayList<>();
        for (String processedName : processedNames) {
            Promise<Void> uploaded = Async.procedure(activities::upload,
                args.getTargetBucketName(), args.getTargetFilename(), processedName);
            uploadedList.add(uploaded);
        }
        // Wait for all uploads to complete.
        Promise<?> allUploaded = Promise.allOf(uploadedList);
        allUploaded.get(); // blocks until all promises are ready.
    } finally {
        for (Promise<String> localNamePromise : localNamePromises) {
            // Skip files that haven't completed downloading.
            if (localNamePromise.isCompleted()) {
                activities.deleteLocalFile(localNamePromise.get());
            }
        }
        if (processedNames != null) {
            for (String processedName : processedNames) {
                activities.deleteLocalFile(processedName);
            }
        }
    }
}
```

## Workflow Implementation Constraints

Cadence uses the [Microsoft Azure Event Sourcing pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/event-sourcing) to recover
the state of a :workflow: object including its threads and local variable values.
In essence, every time a :workflow: state has to be restored, its code is re-executed from the beginning. When replaying, side
effects (such as :activity: invocations) are ignored because they are already recorded in the :workflow: :event_history:.
When writing :workflow: logic, the replay is not visible, so the code should be written since it executes only once.
This design puts the following constraints on the :workflow: implementation:

- Do not use any mutable global variables because multiple instances of :workflow:workflows: are executed in parallel.
- Do not call any non-deterministic functions like non seeded random or UUID.randomUUID() directly from the :workflow: code.

Always do the following in :workflow:workflows::
- Don’t perform any IO or service calls as they are not usually deterministic. Use :activity:activities: for this.
- Only use `Workflow.currentTimeMillis()` to get the current time inside a :workflow:.
- Do not use native Java `Thread` or any other multi-threaded classes like `ThreadPoolExecutor`. Use `Async.function` or `Async.procedure`
to execute code asynchronously.
- Don't use any synchronization, locks, and other standard Java blocking concurrency-related classes besides those provided
by the Workflow class. There is no need in explicit synchronization because multi-threaded code inside a :workflow: is
executed one thread at a time and under a global lock.
  - Call `WorkflowThread.sleep` instead of `Thread.sleep`.
  - Use `Promise` and `CompletablePromise` instead of `Future` and `CompletableFuture`.
  - Use `WorkflowQueue` instead of `BlockingQueue`.
- Use `Workflow.getVersion` when making any changes to the :workflow: code. Without this, any deployment of updated :workflow: code
might break already open :workflow:workflows:.
- Don’t access configuration APIs directly from a :workflow: because changes in the configuration might affect a :workflow_execution: path.
Pass it as an argument to a :workflow: function or use an :activity: to load it.

:workflow:Workflow: method arguments and return values are serializable to a byte array using the provided
[DataConverter](https://static.javadoc.io/com.uber.cadence/cadence-client/2.4.1/index.html?com/cadence-workflow/cadence/converter/DataConverter.html)
interface. The default implementation uses JSON serializer, but you can use any alternative serialization mechanism.

The values passed to :workflow:workflows: through invocation parameters or returned through a result value are recorded in the execution history.
The entire execution history is transferred from the Cadence service to :workflow_worker:workflow_workers: with every :event: that the :workflow: logic needs to process.
A large execution history can thus adversely impact the performance of your :workflow:.
Therefore, be mindful of the amount of data that you transfer via :activity: invocation parameters or return values.
Otherwise, no additional limitations exist on :activity: implementations.
