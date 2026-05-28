---
layout: default
title: Get Started with Cadence
description: Get started with Cadence, the open-source workflow engine for fault-tolerant distributed applications. Run a local server in 5 minutes and build your first workflow in Go or Java.
keywords:
  - cadence get started
  - cadence tutorial
  - cadence workflow tutorial
  - cadence getting started
  - what is cadence
  - cadence workflow engine
  - cadence workflow platform
  - distributed application cadence
  - open source workflow engine tutorial
permalink: /docs/get-started/
---

## 5-minute quickstart

No Docker required. The fastest way to run Cadence locally uses the embedded SQLite backend:

```bash
# Clone and build
git clone https://github.com/cadence-workflow/cadence.git
cd cadence
make bins

# Install the schema and start the server
make install-schema-sqlite
./cadence-server --zone sqlite start
```

Open [http://localhost:8088](http://localhost:8088) for the Cadence Web UI. Then run your first workflow:

- [Golang Hello World](/docs/get-started/golang-hello-world)
- [Java Hello World](/docs/get-started/java-hello-world)

---

## What is Cadence?

A large number of use cases span beyond a single request-reply, require tracking of complex state, respond to asynchronous :event:events:, and communicate with external unreliable dependencies. The usual approach — stateless services, databases, cron jobs, and queuing systems — means most of the code is dedicated to plumbing rather than business logic, and failures are hard to recover from cleanly.

Cadence solves this with a [_fault-oblivious stateful_ programming model](/docs/concepts/workflows): a durable virtual memory that is not linked to a specific process, and preserves the full application state — including function stacks and local variables — across host and software failures. You write code using the full power of a programming language; Cadence handles durability, availability, and scalability.

Cadence consists of a client SDK and a backend service. SDKs are available for [Go](https://github.com/cadence-workflow/cadence-go-client/) and [Java](https://github.com/cadence-workflow/cadence-java-client) (official), and [Python](https://github.com/firdaus/cadence-python) and [Ruby](https://github.com/coinbase/cadence-ruby) (community). You can also use [iWF](https://github.com/indeedeng/iwf) as a DSL framework on top of Cadence.

The backend is stateless and stores workflow history in Cassandra, MySQL, or Postgres. See [topology](/docs/concepts/topology) for the full architecture. The server is open source at [cadence-workflow/cadence](https://github.com/cadence-workflow/cadence) and available on Docker Hub as [ubercadence/server](https://hub.docker.com/r/ubercadence/server).

---

## What's next?

| I want to... | Go to |
|---|---|
| Run my first workflow | [Golang Hello World](/docs/get-started/golang-hello-world) · [Java Hello World](/docs/get-started/java-hello-world) |
| Install with Docker or Kubernetes | [Server Installation](/docs/get-started/server-installation) |
| Understand what a workflow engine is | [Workflow Engine and Orchestration](/docs/concepts/workflow-engine) |
| Deploy Cadence in production | [Open Source Workflow Engine](/docs/concepts/open-source-workflow-engine) |
| Learn core concepts | [Workflows](/docs/concepts/workflows) · [Activities](/docs/concepts/activities) · [Task Lists](/docs/concepts/task-lists) |
| Watch video tutorials | [Video Tutorials](/docs/get-started/video-tutorials) |
| Get help | [Slack](https://join.slack.com/t/uber-cadence/shared_invite/zt-3sdz5oow2-TXL478KDhHvJOuUm0nItiQ) · [Stack Overflow](https://stackoverflow.com/questions/tagged/cadence-workflow) · [GitHub Issues](https://github.com/cadence-workflow/cadence/issues/new/choose)
