---
layout: default
title: Retries
permalink: /docs/java-client/retries
---

:activity:Activities: and :workflow:workflows: can fail due to various intermediate conditions. In those cases, we want
to retry the failed :activity: or child :workflow: or even the parent :workflow:. This can be achieved
by supplying an optional [retry options](https://www.javadoc.io/static/com.uber.cadence/cadence-client/2.7.9-alpha/com/cadence-workflow/cadence/common/RetryOptions.Builder.html#setInitialInterval-java.time.Duration-).

> Note that sometimes it's also referred as RetryPolicy

## RetryOptions
A RetryOptions includes the following.

### InitialInterval
Backoff interval for the first retry. If coefficient is 1.0 then it is used for all retries.
Required, no default value.

### BackoffCoefficient
Coefficient used to calculate the next retry backoff interval.
The next retry interval is previous interval multiplied by this coefficient.
Must be 1 or larger. Default is 2.0.

### MaximumInterval
Maximum backoff interval between retries. Exponential backoff leads to interval increase.
This value is the cap of the interval. Default is 100x of initial interval.

### ExpirationInterval
Maximum time to retry. Either ExpirationInterval or MaximumAttempts is required.
When exceeded the retries stop even if maximum retries is not reached yet.
First (non-retry) attempt is unaffected by this field and is guaranteed to run
for the entirety of the workflow timeout duration (ExecutionStartToCloseTimeoutSeconds).

### MaximumAttempts
Maximum number of attempts. When exceeded the retries stop even if not expired yet.
If not set or set to 0, it means unlimited, and relies on ExpirationInterval to stop.
Either MaximumAttempts or ExpirationInterval is required.

### NonRetriableErrorReasons(via setDoNotRetry)
Non-Retriable errors. This is optional. Cadence server will stop retry if error reason matches this list.
When matching an exact match is used. So adding RuntimeException.class to this list is going to include only RuntimeException itself, not all of its subclasses. The reason for such behaviour is to be able to support server side retries without knowledge of Java exception hierarchy. When considering an exception type a cause of ActivityFailureException and ChildWorkflowFailureException is looked at.
Error and CancellationException are never retried and are not even passed to this filter.

## Activity Timeout Usage

It's probably too complicated to learn how to set those timeouts by reading the above. There is an easy way to deal with it.

**LocalActivity without retry**: Use ScheduleToClose for overall timeout

**Regular Activity without retry**:
1. Use ScheduleToClose for overall timeout
2. Leave ScheduleToStart and StartToClose empty
3. If ScheduleToClose is too large(like 10 mins), then set Heartbeat timeout to a smaller value like 10s. Call heartbeat API inside activity regularly.

**LocalActivity with retry**:

1. Use ScheduleToClose as timeout of each attempt.
2. Use retryOptions.InitialInterval, retryOptions.BackoffCoefficient, retryOptions.MaximumInterval to control backoff.
3. Use retryOptions.ExpirationInterval as overall timeout of all attempts.
4. Leave retryOptions.MaximumAttempts empty.


**Regular Activity with retry**:
1. Use ScheduleToClose as timeout of each attempt
2. Leave ScheduleToStart and StartToClose empty
3. If ScheduleToClose is too large(like 10 mins), then set Heartbeat timeout to a smaller value like 10s. Call heartbeat API inside activity regularly.
4. Use retryOptions.InitialInterval, retryOptions.BackoffCoefficient, retryOptions.MaximumInterval to control backoff.
5. Use retryOptions.ExpirationInterval as overall timeout of all attempts.
6. Leave retryOptions.MaximumAttempts empty.

## Activity Timeout Internals

### Basics without Retry
Things are easier to understand in the world without retry. Because Cadence started from it.

* ScheduleToClose timeout is the overall end-to-end timeout from a workflow's perspective.

* ScheduleToStart timeout is the time that activity worker needed to start an activity. Exceeding this timeout, activity will return an ScheduleToStart timeout error/exception to workflow

* StartToClose timeout is the time that an activity needed to run. Exceeding this will return
StartToClose to workflow.

* **Requirement and defaults:**

  * Either ScheduleToClose is provided or both of ScheduleToStart and StartToClose are provided.
  * If only ScheduleToClose, then ScheduleToStart and StartToClose are default to it.
  * If only ScheduleToStart and StartToClose are provided, then `ScheduleToClose = ScheduleToStart + StartToClose`.
  * All of them are capped by workflowTimeout. (e.g. if workflowTimeout is 1hour, set 2 hour for ScheduleToClose will still get 1 hour :`ScheduleToClose=Min(ScheduleToClose, workflowTimeout)` )

**So why are they?**

You may notice that ScheduleToClose is only useful when
`ScheduleToClose < ScheduleToStart + StartToClose`. Because if `ScheduleToClose >= ScheduleToStart+StartToClose` the ScheduleToClose timeout is already enforced by the combination of the other two, and it become meaningless.

So the main use case of ScheduleToClose being less than the sum of two is that people want to limit the overall timeout of the activity but give more timeout for scheduleToStart or startToClose. **This is extremely rare use case**.

Also the main use case that people want to distinguish ScheduleToStart and StartToClose is that the workflow may need to do some special handling for ScheduleToStart timeout error. **This is also very rare use case**.

Therefore, you can understand why in TL;DR that I recommend only using **ScheduleToClose** but leave the other two empty. Because only in some rare cases you may need it. If you can't think of the use case, then you do not need it.

LocalActivity doesn't have ScheduleToStart/StartToClose because it's started directly inside workflow worker without server scheduling involved.

### Heartbeat timeout
Heartbeat is very important for long running activity, to prevent it from getting stuck. Not only bugs can cause activity getting stuck, regular deployment/host restart/failure could also cause it. Because without heartbeat, Cadence server couldn't know whether or not the activity is still being worked on. See more details about here https://stackoverflow.com/questions/65118584/solutions-to-stuck-timers-activities-in-cadence-swf-stepfunctions/65118585#65118585

### RetryOptions and Activity with Retry
First of all, here RetryOptions is for `server side` backoff retry -- meaning that the retry is managed automatically by Cadence without interacting with workflows. Because retry is managed by Cadence, the activity has to be specially handled in Cadence history that the started event can not written until the activity is closed. Here is some reference: https://stackoverflow.com/questions/65113363/why-an-activity-task-is-scheduled-but-not-started/65113365#65113365

In fact, workflow can do `client side` retry on their own. This means workflow will be managing the retry logic. You can write your own retry function, or there is some helper function in SDK,  like `Workflow.retry` in Cadence-java-client. Client side retry will show all start events immediately, but there will be many events in the history when retrying for a single activity. It's not recommended because of performance issue.

So what do the options mean:
* ExpirationInterval:
  * It replaces the ScheduleToClose timeout to become the actual overall timeout of the activity for all attempts.
  * It's also capped to workflow timeout like other three timeout options. `ScheduleToClose = Min(ScheduleToClose, workflowTimeout)`
  * The timeout of each attempt is StartToClose, but StartToClose defaults to ScheduleToClose like explanation above.
  * ScheduleToClose will be extended to ExpirationInterval:
`ScheduleToClose = Max(ScheduleToClose, ExpirationInterval)`, and this happens before ScheduleToClose is copied to ScheduleToClose and StartToClose.

* InitialInterval: the interval of first retry
* BackoffCoefficient: self explained
* MaximumInterval: maximum of the interval during retry
* MaximumAttempts: the maximum attempts. If existing with ExpirationInterval, then retry stops when either one of them is exceeded.

* **Requirements and defaults**:
 * Either MaximumAttempts or ExpirationInterval is required. ExpirationInterval is set to workflowTimeout if not provided.

Since ExpirationInterval is always there, and in fact it's more useful. And I think it's quite confusing to use MaximumAttempts, so I would recommend just use ExpirationInterval. Unless you really need it.
