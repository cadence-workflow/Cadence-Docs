---
layout: default
title: Overview
description: A large number of use cases span beyond a single request-reply, require tracking of a complex state, respond to asynchronous events, and communicate to external unreliable dependencies.
permalink: /docs/get-started/
---

A large number of use cases span beyond a single request-reply, require tracking
of a complex state, respond to asynchronous :event:events:, and communicate to external unreliable dependencies.
The usual approach to building such applications is a hodgepodge of stateless services,
databases, cron jobs, and queuing systems. This negatively impacts the developer productivity as most of the code is
dedicated to plumbing, obscuring the actual business logic behind a myriad of low-level details. Such systems frequently have availability problems as it is hard to keep all the components healthy.

The Cadence solution is a [_fault-oblivious stateful_ programming model](/docs/concepts/workflows) that obscures most of the complexities of building scalable distributed applications. In essence, Cadence provides a durable virtual memory that is not
linked to a specific process, and preserves the full application state, including function stacks, with local variables across all sorts of host and software failures.
This allows you to write code using the full power of a programming language while Cadence takes care of durability, availability, and scalability of the application.

Cadence consists of a programming framework (or client library) and a managed service (or backend).
The framework enables developers to author and coordinate :task:tasks: in familiar languages
([Go](https://github.com/cadence-workflow/cadence-go-client/) and [Java](https://github.com/cadence-workflow/cadence-java-client)
are supported officially, and [Python](https://github.com/firdaus/cadence-python) and
[Ruby](https://github.com/coinbase/cadence-ruby) by the community).

You can also use [iWF](https://github.com/indeedeng/iwf) as a DSL framework on top of Cadence.

The Cadence backend service is stateless and relies on a persistent store. Currently, Cassandra and MySQL/Postgres storages
are supported. An adapter to any other database that provides multi-row single shard transactions
can be added. There are different service deployment models. At Uber, our team operates multitenant clusters
that are shared by hundreds of applications. See service [topology](/docs/concepts/topology) to understand the overall architecture. The GitHub repo for the Cadence server is [cadence-workflow/cadence](https://github.com/cadence-workflow/cadence). The docker
image for the Cadence server is available on Docker Hub at
[ubercadence/server](https://hub.docker.com/r/ubercadence/server).

## What's Next
Let's try with some sample workflows.
To start with, go to [server installation](/docs/get-started/server-installation) to install Cadence locally, and run a HelloWorld sample with [Java](/docs/get-started/java-hello-world) or [Golang](/docs/get-started/golang-hello-world).

When you have any trouble with the instructions, you can watch the [video tutorials](/docs/get-started/video-tutorials), and reach out to us on our [Slack Channel](http://t.uber.com/cadence-slack), or raise any question on [Stack Overflow](https://stackoverflow.com/questions/tagged/cadence-workflow) or open a [GitHub issue](https://github.com/cadence-workflow/cadence/issues/new/choose).
