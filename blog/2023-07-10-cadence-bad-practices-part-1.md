---
title: Bad practices and Anti-patterns with Cadence (Part 1)

date: 2023-07-10
authors: chopincode
tags:
  - introduction-to-cadence
  - deep-dive
---

In the upcoming blog series, we will delve into a discussion about common bad practices and anti-patterns related to Cadence. As diverse teams often encounter distinct business use cases, it becomes imperative to address the most frequently reported issues in Cadence workflows. To provide valuable insights and guidance, the Cadence team has meticulously compiled these common challenges based on customer feedback.

* Reusing the same workflow ID for very active/continuous running workflows

Cadence organizes workflows based on their unique IDs, using a process called <b>partitioning</b>. If a workflow receives a large number of updates in a short period of time or frequently starts new runs using the `continueAsNew` function, all these updates will be directed to the same shard. Unfortunately, the Cadence backend is not equipped to handle this concentrated workload efficiently. As a result, a situation known as a "hot shard" arises, overloading the Cadence backend and worsening the problem.

Solution:
Well, the best way to avoid this is simply just design your workflow in the way such that each workflow owns a uniformly distributed workflow ID across your Cadence domain. This will make sure that Cadence backend is able to evenly distribute the traffic with proper partition on your workflowIDs.

<!-- truncate -->

* Excessive batch jobs or an enormous number of timers triggered at the same time

Cadence has the capability to handle a large number of concurrent tasks initiated simultaneously, but tampering with this feature can lead to issues within the Cadence system. Consider a scenario where millions of jobs are scheduled to start at the same time and are expected to finish within a specific time interval. Cadence faces the challenge of understanding the desired behavior of customers in such cases. It is uncertain whether the intention is to complete all jobs simultaneously, provide progressive updates in parallel, or finish all jobs before a given deadline. This ambiguity arises due to the independent nature of each job and the difficulty in predicting their outcomes.

Moreover, Cadence workers utilize a sticky cache by default to optimize the runtime of workflows. However, when an overwhelming number of parallel workflows cannot fit into the cache, it can result in <b>cache thrashing</b>. This, in turn, leads to a quadratic increase in runtime complexity, specifically O(n^2), exacerbating the overall performance of the system.

Solution:
There are multiple ways to address this issue. Customers can either run jobs in a smaller batch or use start workflow jitter to randomly distribute timers within certain timeframe.
