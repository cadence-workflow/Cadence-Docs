---
title: "Introducing Batch Future with Concurrency Control"
description: "We're excited to announce Batch Future, a new feature in the Cadence Go client that provides controlled concurrency for bulk operations, preventing overwhelming downstream services while maintaining efficient parallel processing."
date: 2025-09-25
authors: kevinb
tags:
  - announcement
  - release
---

Are you struggling with uncontrolled concurrency when trying to process thousands of activities or child workflows? Do you find yourself hitting rate limits or overwhelming downstream services when running bulk operations? We've got great news for you!

Today, we're thrilled to announce **Batch Future**, a powerful new feature in the Cadence Go client that provides controlled concurrency for bulk operations. You can now process multiple activities in parallel while maintaining precise control over how many run simultaneously.

<!-- truncate -->

## The Problem: Uncontrolled Concurrency

Traditionally, when you need to process multiple items in a Cadence workflow, you'd write something like this:

```go
func ProcessUsers(ctx workflow.Context, userIDs []string) error {
    var futures []workflow.Future
    for _, userID := range userIDs {
        future := workflow.ExecuteActivity(ctx, UpdateUserActivity, userID)
        futures = append(futures, future)
    }
    
    // Wait for all activities to complete
    for _, future := range futures {
        if err := future.Get(ctx, nil); err != nil {
            return err
        }
    }
    return nil
}
```

This approach works, but it has **uncontrolled concurrency**:
- All activities start simultaneously, potentially overwhelming downstream services
- No way to limit concurrent executions
- Difficult to manage resource usage
- Can cause rate limiting or timeouts
- Causing hot shard in Cadence server's task processing

## The Solution: Batch Future

With Batch Future, you can process users with **controlled concurrency**:

```go
func ProcessUsersBatch(ctx workflow.Context, userIDs []string, concurrency int) error {
    // Create activity factories for each user
    factories := make([]func(workflow.Context) workflow.Future, len(userIDs))
    for i, userID := range userIDs {
        userID := userID // Capture loop variable for closure
        factories[i] = func(ctx workflow.Context) workflow.Future {
            return workflow.ExecuteActivity(ctx, UpdateUserActivity, userID)
        }
    }
    
    // Execute with controlled concurrency
    batch, err := workflow.NewBatchFuture(ctx, concurrency, factories)
    if err != nil {
        return fmt.Errorf("failed to create batch future: %w", err)
    }
    
    // Wait for all activities to complete
    return batch.Get(ctx, nil)
}
```

## Key Benefits: Controlled Concurrency

Batch Future provides several important advantages:

- **Controlled Concurrency**: Limit simultaneous executions to prevent overwhelming downstream services
- **Resource Management**: Better control over memory and CPU usage
- **Rate Limiting Protection**: Avoid hitting API rate limits by controlling execution speed
- **Graceful Cancellation**: All activities can be cancelled together if needed
- **Simplified Error Handling**: Single point of failure handling for the entire batch

## Real-World Use Cases

Batch Future is perfect for scenarios like:

### 1. Multi-Service Data Synchronization
```go
func SyncProductData(ctx workflow.Context, products []Product) error {
    // Sync to multiple services with different concurrency limits
    inventoryBatch := createBatch(ctx, products, 5, SyncToInventoryActivity)
    searchBatch := createBatch(ctx, products, 3, SyncToSearchActivity)
    analyticsBatch := createBatch(ctx, products, 2, SyncToAnalyticsActivity)
    
    // Wait for all sync operations to complete
    if err := inventoryBatch.Get(ctx, nil); err != nil {
        return fmt.Errorf("inventory sync failed: %w", err)
    }
    if err := searchBatch.Get(ctx, nil); err != nil {
        return fmt.Errorf("search sync failed: %w", err)
    }
    return analyticsBatch.Get(ctx, nil)
}

func createBatch(ctx workflow.Context, items []Product, concurrency int, activityFunc interface{}) workflow.Future {
    factories := make([]func(workflow.Context) workflow.Future, len(items))
    for i, item := range items {
        item := item
        factories[i] = func(ctx workflow.Context) workflow.Future {
            return workflow.ExecuteActivity(ctx, activityFunc, item)
        }
    }
    batch, _ := workflow.NewBatchFuture(ctx, concurrency, factories)
    return batch
}
```

### 2. Progressive Data Processing with Different Priorities
```go
func ProcessDataWithPriorities(ctx workflow.Context, data []DataItem) error {
    // High priority items get more concurrency
    highPriority := filterByPriority(data, "high")
    lowPriority := filterByPriority(data, "low")
    
    // Process high priority items first with high concurrency
    highBatch, _ := workflow.NewBatchFuture(ctx, 10, createFactories(highPriority, ProcessHighPriorityActivity))
    
    // Wait for high priority to complete, then process low priority with lower concurrency
    if err := highBatch.Get(ctx, nil); err != nil {
        return err
    }
    
    lowBatch, _ := workflow.NewBatchFuture(ctx, 3, createFactories(lowPriority, ProcessLowPriorityActivity))
    return lowBatch.Get(ctx, nil)
}
```

### 3. Conditional Batch Processing with Retry Logic
```go
func ProcessOrdersWithRetry(ctx workflow.Context, orders []Order) error {
    // First attempt with normal concurrency
    factories := make([]func(workflow.Context) workflow.Future, len(orders))
    for i, order := range orders {
        order := order
        factories[i] = func(ctx workflow.Context) workflow.Future {
            return workflow.ExecuteActivity(ctx, ProcessOrderActivity, order)
        }
    }
    
    batch, _ := workflow.NewBatchFuture(ctx, 5, factories)
    if err := batch.Get(ctx, nil); err != nil {
        // If batch fails, retry failed orders individually with higher concurrency
        return retryFailedOrders(ctx, orders, 10)
    }
    return nil
}
```

## How It Works Under the Hood

Batch Future leverages Cadence's existing activity infrastructure with controlled concurrency:

1. **Future Factories**: Creates lazy-evaluated future creation functions that aren't scheduled until needed
2. **Concurrency Control**: Limits the number of pending futures
3. **Queue Management**: Maintains a queue of to-be-scheduled futures and starts new ones as others complete
4. **Future Management**: Returns a single future that completes when all futures finish
5. **Error Propagation**: If any future fails, the error is stored in a multi-error wrapper entity, users can either cancel or fail open

## Getting Started

Ready to supercharge your workflows? Here's how to get started:

### 1. Update Your Go Client
Make sure you're using the latest version of the Cadence Go client:

```bash
go get github.com/uber/cadence-go-client@latest
```

### 2. Try the Sample
Check out our [Batch Future sample](https://github.com/cadence-workflow/cadence-samples/tree/master/cmd/samples/batch) to see it in action.

### 3. Migrate Your Workflows (With Caution)

**This is not a simple code change**. Migrating to Batch Future requires workflow versioning and careful production planning.

#### The Challenge
Batch Future changes your workflow's execution pattern from individual activities to controlled batching. This creates non-deterministic changes that will break existing running workflows without proper versioning.

#### Migration Approaches

**Option A: Versioned Migration (Recommended for Production)**
- Use [workflow.GetVersion()](https://cadenceworkflow.io/docs/go-client/workflow-versioning) to support both old and new patterns
- Deploy code that handles both execution patterns
- Gradually transition new workflows to use Batch Future
- Clean up old code after all workflows complete

**Option B: New Workflow Type (Simpler but Requires Coordination)**
- Create a new workflow type specifically for Batch Future
- Update callers to use the new workflow type
- Deprecate the old workflow type after migration

**Option C: Workflow Replacement (Not Gradual)**
- Terminate existing workflows (if acceptable)
- Deploy new code with Batch Future
- Start new workflows with the new pattern

#### Testing Strategy
Before deploying, use [Workflow Shadowing](https://cadenceworkflow.io/docs/go-client/workflow-replay-shadowing) to replay production workflow histories against your new code. This catches compatibility issues before they reach production.

#### Key Considerations
- **Timeline**: Plan for weeks, not days
- **Coordination**: Requires careful coordination between teams
- **Monitoring**: Essential during transition period
- **Rollback**: Always have a rollback plan ready
- **Testing**: Extensive testing in staging environment required

#### When NOT to Migrate
- If you have long-running workflows (weeks/months)
- If you can't coordinate a proper versioning strategy
- If the performance benefits don't justify the migration complexity

## Best Practices

- **Choose Appropriate Concurrency**: Start with 3-5 concurrent activities and adjust based on downstream service capacity
- **Activity Factories**: Always capture loop variables in closures to avoid race conditions
- **Error Handling**: Implement proper error handling for individual activity failures
- **Resource Management**: Consider memory usage for large batches
- **Monitoring**: Use heartbeats for long-running activities within the batch

## Try It Today!

Batch Future is available now in the latest Cadence Go client. We can't wait to see how you use it to optimize your workflows!

Have questions or feedback? Join our [Slack community](http://t.uber.com/cadence-slack) or open an issue on [GitHub](https://github.com/cadence-workflow/cadence-go-client).

Happy coding, and here's to faster, more efficient workflows! 
