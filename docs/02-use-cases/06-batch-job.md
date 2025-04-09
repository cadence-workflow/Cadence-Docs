---
layout: default
title: Batch job
permalink: /docs/use-cases/batch-job
---

## Batch job
A lot of batch jobs are not pure data manipulation programs. For those, the existing big data frameworks are the best fit. Cadence is a more general orchestration mechanism and doesn't provide native SQL or worker data shuffle functionality out of the box, engineers wishing to rely on these would need to implement this functionality themselves.
But if processing a record requires external API calls that might fail and potentially take a long time, Cadence might be preferable.

#### Use Case:

One of our internal Uber customers use Cadence for end of month statement generation. Each statement requires calls to multiple microservices and some statements can be really large. Cadence was chosen because it provides hard guarantees around durability of the financial data and seamlessly deals with long running operations, retries, and intermittent failures.

## Batch jobs with heartbeating

Cadence is able to coordinate, restart and track progress of large batch jobs by keeping track of their incremental progress and allowing them to resume if they're stopped for any reason. This predominantly relies on the `heartbeat` feature and activity retries. 

This is used in production for customers who wish to work through large batch workloads 

### Considerations before starting

Heartbeating cadence activities are activities who emit their progress at an appropriate interval (usually every few seconds) indicating where they are up to. Optionally, they may use progress information (like an offset number or iterator) to resume their progress. However, this necessarily implies that:

- If activities get restarted, they may redo some work, so this is not suitable for non-idempotent operations.
- The activity will be handling all the progress, so apart from heartbeat information, debugging about the granular operations being performed is not necessarily visible as compared by doing each operation in a distinct activity. 

### What problems this solves

- This is for high-throughput operations where work may able to fit into a single long-running activity, or partitioned across multiple activities which can run for a longer duration.
- This addresses problems customers may have running workflows which are returning large blocks of data where the data is hitting up against Cadence activity limits
- Because heartbeat data is only temporarily recorded, this is a good way avoid hitting Cadence workflow limits on the number of history events: there only is a single activity which is long running vs many small short-lived activities (each of which needs multiple history events).

### High level concept:

The idea is to create an activity which will handle a lot of records and record its progress:

```golang
func (a *ABatchActivity) Execute(ctx context.Context, params Params) error {

    // in this case this is just a struct with a mutex protecting it
	var state State

    // when starting the activity, check at start time for a previous iteration 
		err := activity.GetHeartbeatDetails(ctx, &state)
		if err != nil {
			return err
		}
		log.Info("resuming from a previous state", zap.Any("state", state))
		}
	}

    // in the background, every 5 seconds, emit where we're up to
    // so the cadence server knows the activity is still alive, and 
    // put the progress in the recordheartbeat call so it can be pulled in
    // if we have to restart
    go func() {
        ticker := time.NewTicker(time.Seconds * 5)
        defer ticker.Stop()
        for {
            select {
            case <-ctx.Done():
                return
                reportState := state.Clone()
                activity.RecordHeartbeat(ctx, reportState)
            }
        }
    }()

    // here in this example, we may assume this is several thousand 
    // records which will take a while to get through. Importantly, 
    // if we have to restart, don't start from the beginning, use the 
    // offset so we don't redo work.
	batchDataToProcess := a.DB.GetDataFromOffset(state.GetOffset())

    // go through and process all the records through whatever side-effects are appropriate
    for i := range batchDataToProcess {
        a.rpc.UpdateRecord(i)
        state.Finished(i)
    }
	return nil
}
```

And run this activity in a workflow with settings:
```golang
// an example configuration for setting activity options to 
// retry if the activity gets stopped for any reason
func setActivityOptions(ctx workflow.Context) workflow.Context {

	ctx = workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
		ScheduleToStartTimeout: time.Minute,           // how long we expect this task to sit waiting to be picked up. 
                                                       // Typically subseconds unless heavily contended
		StartToCloseTimeout:    time.Hour,             // however long this activity is expected to take, maximum, from end to end. 
                                                       // This is workload dependent
		HeartbeatTimeout:       time.Second * 30,      // How long we should wait before deciding to restart the activity because the 
                                                       // background thread hasn't checked in. Half a a minute is probably a bit 
                                                       // overgenous. In the example above we're picking 5 seconds to heartbeat
		
        // It is unrealistic to assume that a long running activity will succeed
        // so add a retry-policy to restart it when there's a failure. 
        RetryPolicy: &workflow.RetryPolicy{
            InitialInterval:          time.Second,
            MaximumInterval:          time.Minute * 10,
            MaximumAttempts:          10,               // we expect this to have to restart a maximum of 10 times before giving up. 	
		},
	})
	return ctx
}

func Workflow(ctx workflow.Context, config entity.Config) error {

	log := workflow.GetLogger(ctx)
	ctx = setActivityOptions(ctx, config)
    err := workflow.ExecuteActivity(ctx, ABatchActivityName, config).Get(ctx, nil)
    if err != nil {
        log.Error("failed to execute activity", zap.Error(err), zap.Any("input", config))

    }

	log.Info("Workflow complete")
	return nil
}
```