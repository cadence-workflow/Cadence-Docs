---
layout: default
title: Code Block Usage Guide
permalink: /docs/concepts/code-block-usage
---

# Code Block Usage Guide

This guide explains when and how to use different types of code blocks in Cadence workflows, including workflows, child workflows, activities, local activities, batching, and utility functions. Examples are referenced from the official [Cadence Samples](https://github.com/cadence-workflow/cadence-samples) and [Cadence Server](https://github.com/cadence-workflow/cadence) repositories.

## Workflows

**When to use:** Workflows are the main orchestration logic that coordinates the execution of activities and manages the business process flow.

### Use workflows when you need to:
- Coordinate multiple activities or services
- Maintain state across long-running processes
- Handle complex business logic with decision points
- Implement retry and error handling policies
- Manage timeouts and deadlines

### Example scenarios:
- **Order Processing:** Orchestrate payment, inventory check, shipping
- **User Onboarding:** Coordinate account creation, email verification, welcome notifications
- **Data Pipeline:** Orchestrate data extraction, transformation, and loading

### Code structure:

#### Go Example
```go
// Workflow definition
func OrderProcessingWorkflow(ctx workflow.Context, orderID string) error {
    // Set execution timeout
    ctx = workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
        StartToCloseTimeout: time.Minute * 30,
        RetryPolicy: &cadence.RetryPolicy{
            InitialInterval:    time.Second,
            BackoffCoefficient: 2.0,
            MaximumInterval:    time.Minute,
            ExpirationInterval: time.Hour,
        },
    })
    
    // Execute activities in sequence
    var paymentResult PaymentResult
    err := workflow.ExecuteActivity(ctx, ProcessPayment, orderID).Get(ctx, &paymentResult)
    if err != nil {
        return err
    }
    
    var inventoryResult InventoryResult
    err = workflow.ExecuteActivity(ctx, CheckInventory, orderID).Get(ctx, &inventoryResult)
    if err != nil {
        return err
    }
    
    // Execute shipping activity
    return workflow.ExecuteActivity(ctx, ArrangeShipping, orderID).Get(ctx, nil)
}
```

#### Java Example
```java
// Workflow interface
@WorkflowInterface
public interface OrderProcessingWorkflow {
    @WorkflowMethod
    void processOrder(String orderID);
}

// Workflow implementation
public class OrderProcessingWorkflowImpl implements OrderProcessingWorkflow {
    private final PaymentActivity paymentActivity = 
        Workflow.newActivityStub(PaymentActivity.class, 
            ActivityOptions.newBuilder()
                .setStartToCloseTimeout(Duration.ofMinutes(30))
                .setRetryOptions(RetryOptions.newBuilder()
                    .setInitialInterval(Duration.ofSeconds(1))
                    .setBackoffCoefficient(2.0)
                    .setMaximumInterval(Duration.ofMinutes(1))
                    .setExpiration(Duration.ofHours(1))
                    .build())
                .build());
    
    @Override
    public void processOrder(String orderID) {
        // Execute activities in sequence
        PaymentResult paymentResult = paymentActivity.processPayment(orderID);
        InventoryResult inventoryResult = inventoryActivity.checkInventory(orderID);
        shippingActivity.arrangeShipping(orderID);
    }
}
```

### Best practices:
- Keep workflows deterministic (no random numbers, system time, or external calls)
- Use activities for non-deterministic operations
- Implement proper error handling and retry policies
- Use signals for external communication
- Use queries for state inspection

---

## Child Workflows

**When to use:** Child workflows help break down complex business processes into smaller, manageable, and reusable components.

### Use child workflows when you need to:
- Decompose complex workflows into smaller units
- Reuse workflow logic across different parent workflows
- Implement fan-out/fan-in patterns
- Manage independent sub-processes with their own lifecycle
- Scale workflow execution across multiple workers

### Example scenarios:
- **E-commerce:** Main order workflow spawning child workflows for each item
- **Data Processing:** Parent workflow spawning child workflows for each data partition
- **Multi-tenant Processing:** Separate child workflows per tenant

### Code structure:

#### Go Example
```go
// Parent workflow
func ParentWorkflow(ctx workflow.Context, orders []Order) error {
    // Execute child workflows in parallel
    var futures []workflow.Future
    
    for _, order := range orders {
        childCtx := workflow.WithChildOptions(ctx, workflow.ChildWorkflowOptions{
            WorkflowID: "order-" + order.ID,
            ExecutionStartToCloseTimeout: time.Hour,
        })
        
        future := workflow.ExecuteChildWorkflow(childCtx, OrderProcessingWorkflow, order.ID)
        futures = append(futures, future)
    }
    
    // Wait for all child workflows to complete
    for _, future := range futures {
        err := future.Get(ctx, nil)
        if err != nil {
            return err
        }
    }
    
    return nil
}

// Child workflow
func OrderProcessingWorkflow(ctx workflow.Context, orderID string) error {
    // Implementation of order processing logic
    return workflow.ExecuteActivity(ctx, ProcessSingleOrder, orderID).Get(ctx, nil)
}
```

#### Java Example
```java
// Parent workflow
public class ParentWorkflowImpl implements ParentWorkflow {
    @Override
    public void processMultipleOrders(List<Order> orders) {
        List<Promise<Void>> promises = new ArrayList<>();
        
        for (Order order : orders) {
            ChildWorkflowOptions options = ChildWorkflowOptions.newBuilder()
                .setWorkflowId("order-" + order.getId())
                .setExecutionStartToCloseTimeout(Duration.ofHours(1))
                .build();
                
            OrderProcessingWorkflow child = Workflow.newChildWorkflowStub(
                OrderProcessingWorkflow.class, options);
            
            Promise<Void> promise = Async.procedure(child::processOrder, order.getId());
            promises.add(promise);
        }
        
        // Wait for all child workflows
        Promise.allOf(promises).get();
    }
}
```

### Best practices:
- Use child workflows for logical business boundaries
- Consider using ContinueAsNew for long-running child workflows
- Handle child workflow failures appropriately
- Use proper workflow IDs to avoid conflicts

---

## Activities

**When to use:** Activities are for executing business logic that interacts with external services or performs non-deterministic operations.

### Use activities when you need to:
- Call external APIs or services
- Perform database operations
- Execute file I/O operations
- Make network calls
- Perform CPU-intensive computations
- Access system resources

### Example scenarios:
- **Payment Processing:** Call payment gateway APIs
- **Email Sending:** Send emails via SMTP or email service
- **Data Validation:** Validate data against external systems
- **File Processing:** Read/write files or process uploads

### Code structure:

#### Go Example
```go
// Activity definition
func SendEmailActivity(ctx context.Context, to, subject, body string) error {
    // Activity can make external calls, access databases, etc.
    logger := activity.GetLogger(ctx)
    logger.Info("Sending email", "to", to, "subject", subject)
    
    // Simulate email sending
    emailService := &EmailService{
        SMTPHost: "smtp.example.com",
        Port:     587,
    }
    
    return emailService.SendEmail(to, subject, body)
}

// Usage in workflow
func NotificationWorkflow(ctx workflow.Context, userID string) error {
    // Configure activity options
    activityCtx := workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
        StartToCloseTimeout: time.Minute * 5,
        RetryPolicy: &cadence.RetryPolicy{
            InitialInterval:    time.Second * 10,
            BackoffCoefficient: 2.0,
            MaximumInterval:    time.Minute * 5,
            MaximumAttempts:    3,
        },
    })
    
    // Execute activity
    return workflow.ExecuteActivity(activityCtx, SendEmailActivity, 
        "user@example.com", "Welcome!", "Welcome to our service!").Get(ctx, nil)
}
```

#### Java Example
```java
// Activity interface
@ActivityInterface
public interface EmailActivity {
    @ActivityMethod
    void sendEmail(String to, String subject, String body);
}

// Activity implementation
public class EmailActivityImpl implements EmailActivity {
    @Override
    public void sendEmail(String to, String subject, String body) {
        // Can make external calls, access databases, etc.
        EmailService emailService = new EmailService();
        emailService.send(to, subject, body);
    }
}

// Usage in workflow
public class NotificationWorkflowImpl implements NotificationWorkflow {
    private final EmailActivity emailActivity = Workflow.newActivityStub(
        EmailActivity.class,
        ActivityOptions.newBuilder()
            .setStartToCloseTimeout(Duration.ofMinutes(5))
            .setRetryOptions(RetryOptions.newBuilder()
                .setInitialInterval(Duration.ofSeconds(10))
                .setBackoffCoefficient(2.0)
                .setMaximumInterval(Duration.ofMinutes(5))
                .setMaximumAttempts(3)
                .build())
            .build());
    
    @Override
    public void sendNotification(String userID) {
        emailActivity.sendEmail("user@example.com", "Welcome!", "Welcome to our service!");
    }
}
```

### Best practices:
- Keep activities idempotent when possible
- Use appropriate timeout settings
- Implement proper retry policies
- Handle activity failures gracefully
- Use heartbeats for long-running activities

---

## Local Activities

**When to use:** Local activities are optimized for short-duration, lightweight operations that don't require the full durability guarantees of regular activities.

### Use local activities when you need to:
- Perform quick validations or data transformations
- Execute lightweight computations
- Make fast local operations
- Avoid the overhead of regular activity scheduling
- Process small amounts of data quickly

### Example scenarios:
- **Data Validation:** Quick input validation
- **Format Conversion:** Convert data formats
- **Simple Calculations:** Mathematical operations
- **Local File Operations:** Quick file reads/writes

### Code structure:

#### Go Example
```go
// Local activity definition
func ValidateInputLocalActivity(ctx context.Context, input string) (bool, error) {
    // Quick validation logic
    if len(input) == 0 {
        return false, errors.New("input cannot be empty")
    }
    
    // Perform quick validation
    matched, err := regexp.MatchString(`^[a-zA-Z0-9]+$`, input)
    if err != nil {
        return false, err
    }
    
    return matched, nil
}

// Usage in workflow
func DataProcessingWorkflow(ctx workflow.Context, data string) error {
    // Configure local activity options
    localActCtx := workflow.WithLocalActivityOptions(ctx, workflow.LocalActivityOptions{
        StartToCloseTimeout: time.Second * 10,
        RetryPolicy: &cadence.RetryPolicy{
            MaximumAttempts: 3,
        },
    })
    
    // Execute local activity for validation
    var isValid bool
    err := workflow.ExecuteLocalActivity(localActCtx, ValidateInputLocalActivity, data).Get(ctx, &isValid)
    if err != nil {
        return err
    }
    
    if !isValid {
        return errors.New("invalid input data")
    }
    
    // Continue with regular activities for heavy operations
    return workflow.ExecuteActivity(ctx, ProcessDataActivity, data).Get(ctx, nil)
}
```

#### Java Example
```java
// Local activity method
@ActivityMethod
public boolean validateInput(String input) {
    if (input == null || input.isEmpty()) {
        throw new IllegalArgumentException("Input cannot be empty");
    }
    
    return input.matches("^[a-zA-Z0-9]+$");
}

// Usage in workflow
public class DataProcessingWorkflowImpl implements DataProcessingWorkflow {
    @Override
    public void processData(String data) {
        // Execute as local activity
        LocalActivityOptions localOptions = LocalActivityOptions.newBuilder()
            .setStartToCloseTimeout(Duration.ofSeconds(10))
            .setRetryOptions(RetryOptions.newBuilder()
                .setMaximumAttempts(3)
                .build())
            .build();
            
        ValidationActivity validationActivity = Workflow.newLocalActivityStub(
            ValidationActivity.class, localOptions);
        
        boolean isValid = validationActivity.validateInput(data);
        
        if (!isValid) {
            throw new IllegalArgumentException("Invalid input data");
        }
        
        // Continue with regular activities
        dataActivity.processData(data);
    }
}
```

### Best practices:
- Use for operations that complete in seconds, not minutes
- Avoid external service calls in local activities
- Keep local activities deterministic
- Use for preprocessing and validation logic
- Limit local activity execution time

---

## Batching Inside Activities

**When to use:** Batching helps optimize performance when dealing with multiple similar operations or large datasets.

### Use batching when you need to:
- Process large amounts of data efficiently
- Reduce the number of external API calls
- Optimize database operations
- Handle bulk operations
- Minimize network overhead

### Example scenarios:
- **Bulk Data Processing:** Process multiple records in a single activity
- **Batch API Calls:** Send multiple requests in one batch
- **Database Bulk Operations:** Insert/update multiple records
- **File Batch Processing:** Process multiple files together

### Code structure:

#### Go Example
```go
// Batch processing activity
func ProcessBatchActivity(ctx context.Context, items []DataItem) ([]ProcessResult, error) {
    logger := activity.GetLogger(ctx)
    logger.Info("Processing batch", "count", len(items))
    
    results := make([]ProcessResult, 0, len(items))
    batchSize := 100 // Process in chunks of 100
    
    for i := 0; i < len(items); i += batchSize {
        end := i + batchSize
        if end > len(items) {
            end = len(items)
        }
        
        batch := items[i:end]
        
        // Process batch with external service
        batchResults, err := processBatchWithExternalService(batch)
        if err != nil {
            return nil, fmt.Errorf("failed to process batch %d-%d: %w", i, end, err)
        }
        
        results = append(results, batchResults...)
        
        // Send heartbeat for long-running batches
        activity.RecordHeartbeat(ctx, fmt.Sprintf("Processed %d/%d items", end, len(items)))
    }
    
    return results, nil
}

// Usage in workflow
func BulkProcessingWorkflow(ctx workflow.Context, items []DataItem) ([]ProcessResult, error) {
    activityCtx := workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
        StartToCloseTimeout: time.Hour,        // Long timeout for bulk processing
        HeartbeatTimeout:    time.Minute * 5,  // Regular heartbeats
        RetryPolicy: &cadence.RetryPolicy{
            MaximumAttempts: 3,
        },
    })
    
    var results []ProcessResult
    err := workflow.ExecuteActivity(activityCtx, ProcessBatchActivity, items).Get(ctx, &results)
    return results, err
}
```

#### Java Example
```java
// Batch processing activity
@ActivityInterface
public interface BatchProcessingActivity {
    @ActivityMethod
    List<ProcessResult> processBatch(List<DataItem> items);
}

public class BatchProcessingActivityImpl implements BatchProcessingActivity {
    @Override
    public List<ProcessResult> processBatch(List<DataItem> items) {
        List<ProcessResult> results = new ArrayList<>();
        int batchSize = 100;
        
        for (int i = 0; i < items.size(); i += batchSize) {
            int end = Math.min(i + batchSize, items.size());
            List<DataItem> batch = items.subList(i, end);
            
            // Process batch with external service
            List<ProcessResult> batchResults = processBatchWithExternalService(batch);
            results.addAll(batchResults);
            
            // Record heartbeat for progress tracking
            Activity.getExecutionContext().recordHeartbeat(
                String.format("Processed %d/%d items", end, items.size()));
        }
        
        return results;
    }
}

// Usage in workflow
public class BulkProcessingWorkflowImpl implements BulkProcessingWorkflow {
    private final BatchProcessingActivity batchActivity = 
        Workflow.newActivityStub(BatchProcessingActivity.class,
            ActivityOptions.newBuilder()
                .setStartToCloseTimeout(Duration.ofHours(1))
                .setHeartbeatTimeout(Duration.ofMinutes(5))
                .setRetryOptions(RetryOptions.newBuilder()
                    .setMaximumAttempts(3)
                    .build())
                .build());
    
    @Override
    public List<ProcessResult> processBulkData(List<DataItem> items) {
        return batchActivity.processBatch(items);
    }
}
```

### Best practices:
- Choose appropriate batch sizes based on data size and processing time
- Implement heartbeats for long-running batch operations
- Handle partial failures gracefully
- Consider memory usage when batching large datasets
- Use parallel processing when possible

---

## Local Functions (Utility Methods)

**When to use:** Local functions are utility methods within workflows that help organize code and perform deterministic operations without the overhead of activities.

### Use local functions when you need to:
- Organize workflow code into smaller, reusable functions
- Perform deterministic calculations or data transformations
- Implement complex business logic within workflows
- Avoid code duplication across workflows
- Create helper methods for common operations

### Example scenarios:
- **Data Transformation:** Format or transform data within workflows
- **Business Logic:** Implement complex business rules
- **Validation Logic:** Validate workflow inputs or intermediate results
- **Utility Operations:** Common calculations or string manipulations

### Code structure:

#### Go Example
```go
// Utility functions
func calculateDiscount(orderAmount float64, customerTier string) float64 {
    switch customerTier {
    case "premium":
        return orderAmount * 0.15
    case "gold":
        return orderAmount * 0.10
    case "silver":
        return orderAmount * 0.05
    default:
        return 0
    }
}

func validateOrderData(order Order) error {
    if order.CustomerID == "" {
        return errors.New("customer ID is required")
    }
    if order.Amount <= 0 {
        return errors.New("order amount must be positive")
    }
    if len(order.Items) == 0 {
        return errors.New("order must have at least one item")
    }
    return nil
}

func formatOrderSummary(order Order, discount float64) string {
    total := order.Amount - discount
    return fmt.Sprintf("Order %s: %d items, Amount: $%.2f, Discount: $%.2f, Total: $%.2f",
        order.ID, len(order.Items), order.Amount, discount, total)
}

// Main workflow using utility functions
func OrderProcessingWorkflow(ctx workflow.Context, order Order) error {
    // Validate order using utility function
    if err := validateOrderData(order); err != nil {
        return fmt.Errorf("order validation failed: %w", err)
    }
    
    // Get customer information via activity
    var customer Customer
    err := workflow.ExecuteActivity(ctx, GetCustomerActivity, order.CustomerID).Get(ctx, &customer)
    if err != nil {
        return err
    }
    
    // Calculate discount using utility function
    discount := calculateDiscount(order.Amount, customer.Tier)
    
    // Create order summary using utility function
    summary := formatOrderSummary(order, discount)
    
    // Log the summary
    workflow.GetLogger(ctx).Info("Processing order", "summary", summary)
    
    // Continue with activities for external operations
    return workflow.ExecuteActivity(ctx, ProcessPaymentActivity, order, discount).Get(ctx, nil)
}
```

#### Java Example
```java
// Utility methods in workflow implementation
public class OrderProcessingWorkflowImpl implements OrderProcessingWorkflow {
    
    // Utility method for discount calculation
    private double calculateDiscount(double orderAmount, String customerTier) {
        switch (customerTier) {
            case "premium":
                return orderAmount * 0.15;
            case "gold":
                return orderAmount * 0.10;
            case "silver":
                return orderAmount * 0.05;
            default:
                return 0;
        }
    }
    
    // Utility method for order validation
    private void validateOrderData(Order order) {
        if (order.getCustomerId() == null || order.getCustomerId().isEmpty()) {
            throw new IllegalArgumentException("Customer ID is required");
        }
        if (order.getAmount() <= 0) {
            throw new IllegalArgumentException("Order amount must be positive");
        }
        if (order.getItems().isEmpty()) {
            throw new IllegalArgumentException("Order must have at least one item");
        }
    }
    
    // Utility method for formatting
    private String formatOrderSummary(Order order, double discount) {
        double total = order.getAmount() - discount;
        return String.format("Order %s: %d items, Amount: $%.2f, Discount: $%.2f, Total: $%.2f",
            order.getId(), order.getItems().size(), order.getAmount(), discount, total);
    }
    
    @Override
    public void processOrder(Order order) {
        // Validate order using utility method
        validateOrderData(order);
        
        // Get customer information via activity
        Customer customer = customerActivity.getCustomer(order.getCustomerId());
        
        // Calculate discount using utility method
        double discount = calculateDiscount(order.getAmount(), customer.getTier());
        
        // Create order summary using utility method
        String summary = formatOrderSummary(order, discount);
        
        // Log the summary
        Workflow.getLogger(OrderProcessingWorkflowImpl.class)
            .info("Processing order: {}", summary);
        
        // Continue with activities for external operations
        paymentActivity.processPayment(order, discount);
    }
}
```

### Best practices:
- Keep utility functions deterministic (no side effects)
- Use for pure functions and calculations
- Avoid external calls in utility functions
- Keep functions focused and single-purpose
- Use for code organization and reusability

---

## Language-Specific Considerations

### Go vs Java Comparison

| Aspect | Go | Java |
|--------|-----|------|
| **Workflow Definition** | Functions with `workflow.Context` | Interfaces with `@WorkflowMethod` |
| **Activity Definition** | Functions with `context.Context` | Interfaces with `@ActivityMethod` |
| **Error Handling** | Return error values | Throw exceptions |
| **Concurrency** | Goroutines with `workflow.Go()` | Async with `Promise` and `Async` |
| **Type Safety** | Compile-time with generics | Runtime with reflection |
| **Timeouts** | `time.Duration` | `java.time.Duration` |
| **Configuration** | Struct-based options | Builder pattern |

### Go-Specific Features
- Use `workflow.Go()` for concurrent execution within workflows
- Leverage channels for communication between goroutines
- Use `workflow.Selector` for complex conditional logic
- Take advantage of Go's simple error handling

### Java-Specific Features
- Use `Promise` and `Async` for asynchronous operations
- Leverage annotations for configuration
- Use the builder pattern for complex configurations
- Take advantage of strong typing and IDE support

---

## Additional Resources

- **Cadence Samples Repository:** [github.com/cadence-workflow/cadence-samples](https://github.com/cadence-workflow/cadence-samples)
- **Cadence Server Repository:** [github.com/cadence-workflow/cadence](https://github.com/cadence-workflow/cadence)
- **Go Client Documentation:** [Go Client Guide](/docs/go-client/)
- **Java Client Documentation:** [Java Client Guide](/docs/java-client/)

---

## Summary

Choose the right code block type based on your specific needs:

1. **Workflows** - For orchestration and business process coordination
2. **Child Workflows** - For decomposing complex processes and reusability
3. **Activities** - For external interactions and non-deterministic operations
4. **Local Activities** - For quick, lightweight operations
5. **Batching** - For optimizing bulk operations and performance
6. **Utility Functions** - For deterministic calculations and code organization

Understanding when to use each approach will help you build more efficient, maintainable, and scalable Cadence applications.
