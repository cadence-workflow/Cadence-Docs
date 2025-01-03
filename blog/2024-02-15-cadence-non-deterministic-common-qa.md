---
title: Cadence non-derministic errors common question Q&A (part 1)

date: 2024-03-10
authors: chopincode
tags:
  - deep-dive
---

### If I change code logic inside an Cadence activity (for example, my activity is calling database A but now I want it to call database B),  will it trigger an non-deterministic error?

<b>NO</b>. This change will not trigger non-deterministic error.

An Activity is the smallest unit of execution for Cadence and what happens inside activities are not recorded as historical events and therefore will not be replayed. In short, this change is deterministic and it is fine to modify logic inside activities.

### Does changing the workflow definition trigger non-determinstic errors?

<b>YES</b>. This is a very typical non-deterministic error.

When a new workflow code change is deployed, Cadence will find if it is compatible with
Cadence history. Changes to workflow definition will fail the replay process of Cadence
as it finds the new workflow definition imcompatible with previous historical events.

Here is a list of common workflow definition changes.
- Changing workflow parameter counts
- Changing workflow parameter types
- Changing workflow return types

The following changes are not categorized as definition changes and therefore will not
trigger non-deterministic errors.
- Changes of workflow return values
- Changing workflow parameter names as they are just positional

<!-- truncate -->

### Does changing activity definitions trigger non-determinstic errors?

<b>YES</b>. Similar to workflow definition change, this is also a very typical non-deterministic error.

Activities are also recorded and replayed by Cadence. Therefore, changes to activity must also be compatible with Cadence history. The following changes are common ones that trigger non-deterministic errors.
- Changing activity parameter counts
- Changing activity parameter types
- Changing activity return types

As activity paremeters are also positional, these two changes will NOT trigger non-deterministic errors.
- Changes of activity return values
- Changing activity parameter names

Activity return values inside workflows are not recorded and replayed.

### What changes inside workflows may potentially trigger non-deterministic errors?

Cadence records each execution of a workflow and activity execution inside each of them.Therefore, new changes must be compatible with execution orders inside the workflow. The following changes will fail the non-deterministic check.

- Append another activity
- Delete an existing activity
- Reordering activities

If you really need to change the activity implementation based on new business requirements, you may consider using versioning your workflow.

### Are Cadence signals replayed? If definition of signal is changed, will it trigger non-deterministic errors?

Yes. If a signal is used in a workflow, it becomes a critical component of your workflow. Because signals also involve I/O to your workflow, it is also recorded and replayed. Modifications on signal definitions or usage may yield to non-deterministic errors, for instance, changing return type of a signal.

### If I have new business requirement and really need to change the definition of a workflow, what should I do?

You may introduce a new workflow registered to your worker and divert traffic to it or use versioning for your workflow. Check out [Cadence website](https://cadenceworkflow.io/docs/go-client/workflow-versioning/) for more information about versioning.

### Does changes to local activities' definition trigger non-deterministic errors?

Yes. Local activities are recorded and therefore replayed by Cadence. Imcompatible changes on local activity definitions will yield to non-deterministic errors.
