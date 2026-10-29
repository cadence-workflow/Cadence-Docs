---
title: "Workflow Diagnostics, Now in Workflow History"
description: Cadence Web now shows Workflow Diagnostics issues directly on the history events that caused them, runs diagnostics on running workflows, and adds new checks for timeout risks and antipatterns.
keywords:
  - cadence workflow diagnostics
  - cadence workflow history
  - cadence web debugging
  - cadence stuck workflow
  - cadence timeout risks
  - cadence antipatterns
  - cadence hot shard
  - cadence root cause analysis
date: 2026-10-29
authors: adhityamamallan
tags:
  - announcement
  - cadence-web
---

[Workflow Diagnostics](/blog/2025/08/06/workflow-diagnostics) scans a workflow's history, finds what went wrong, and tells you how to fix it. Until now, the results lived on their own page. You read an issue there, then went back to the history to find the event it was about.

Now Diagnostics is part of Workflow History. Issues show up on the events that caused them, so you can debug a workflow in one place.

<!-- truncate -->

## What's New

### Issues on the events that caused them

When Diagnostics finds an issue, the event that caused it is highlighted in its summary row. Expand the event to see the issue, the likely root cause, and a link to a runbook with steps to fix it.

Some issues are about the workflow as a whole rather than one event. These show up on the **Workflow Started** event.

<!-- TODO: screenshot of an expanded event with an issue panel -->

### Find issues fast

A long history can have thousands of events. To help you find the ones that matter:

- A **"N issues detected"** pill in the History tab takes you to each issue in turn. The same list is also in the navigation menu.
- A new **Issues** option in the Filters menu shows only the events that have issues.

<!-- TODO: screenshot of the issues pill and the Issues filter -->

### Diagnostics for running workflows

Diagnostics used to run only on closed workflows. Now it also runs on running workflows, so you can catch problems before they turn into failures.

Keep in mind that a running workflow is not finished yet. If no issues show up, that does not mean the workflow is healthy. Some problems only appear after more events happen.

### New checks

Along with the UI changes, the Cadence server has new checks. They look for problems that have not caused a failure yet, but are likely to.

**Timeout risks** ([docs](/docs/workflow-troubleshooting/timeout-risks)):

- An activity StartToClose timeout that the server lowered to match the workflow timeout, which leaves no time for retries.
- A long-running activity with no heartbeat timeout, so a dead worker goes unnoticed until the full timeout passes.

**Antipatterns** ([docs](/docs/workflow-troubleshooting/antipatterns)):

- Many activities scheduled in quick succession, which can overload a single history shard.
- Continue-As-New called from a cron workflow, which can make the schedule drift or skip runs.

**Failures** ([docs](/docs/workflow-troubleshooting/activity-failures#history-size-or-count-limits)): workflows that fail because their history grew past the size or event count limit.

## Try It Today

In-history diagnostics is behind a feature flag in Cadence Web. To turn it on, set both of these environment variables:

```bash
CADENCE_WORKFLOW_DIAGNOSTICS_ENABLED=true
CADENCE_WORKFLOW_DIAGNOSTICS_IN_HISTORY_ENABLED=true
```

See the [Feature Flags section](https://github.com/cadence-workflow/cadence-web#feature-flags) in the Cadence Web README for details. Then open any workflow and go to the History tab.

We'd love to hear what you find, and which checks you want next.

- **Ask a question** - [#cadence-users on CNCF Slack](https://inviter.co/cncf)
- **Open an issue** - [cadence-web on GitHub](https://github.com/cadence-workflow/cadence-web/issues)
- **Join the discussion** - [GitHub Discussions](https://github.com/cadence-workflow/cadence/discussions)
