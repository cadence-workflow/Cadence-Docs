---
layout: default
title: Open Source Workflow Engine
description: Cadence is an open-source, self-hostable workflow engine for durable, fault-tolerant distributed applications. Deploy on SQLite, Docker, or Kubernetes. Apache 2.0 licensed and CNCF-hosted.
keywords:
  - open source workflow engine
  - open source workflow orchestration
  - self hosted workflow engine
  - open source workflow automation
  - cadence open source
  - cadence workflow github
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Cadence is an open-source workflow engine for building fault-tolerant, stateful distributed applications. It is released under the [Apache 2.0 license](https://github.com/cadence-workflow/cadence/blob/master/LICENSE), hosted by the [Linux Foundation](https://lfprojects.org/policies/), and actively maintained by contributors from Uber and the broader open-source community.

The full source (server, Go client, Java client, web UI, and Helm charts) is on [GitHub](https://github.com/cadence-workflow). You can run Cadence on your laptop in under five minutes with a single SQLite binary, or deploy it to Kubernetes with a Helm chart. No license key, no usage limits, no vendor dependency.

---

## Why open source matters for a workflow engine

A workflow engine sits at the center of your most critical business processes. Open source changes the risk profile of that dependency significantly.

| Concern | Proprietary / hosted-only engine | Cadence (open source) |
|---|---|---|
| Vendor lock-in | Workflows are tied to a provider's API and pricing | Run anywhere; migrate to your own cluster at any time |
| Auditability | Black box: you cannot inspect how state is stored or replayed | Full source available; persistence schema is documented and versioned |
| Data residency | Payloads stored on provider infrastructure | Your workflows stay in your VPC, your region, your storage tier |
| Customization | Blocked by the provider's feature roadmap | Fork, extend, or contribute upstream |
| Cost at scale | Per-workflow or per-execution pricing adds up | Operational cost only; no per-execution fee |
| Community support | Vendor-controlled SLAs | Stack Overflow, CNCF Slack, GitHub Issues, community contributors |

---

## Deployment options

Cadence supports four deployment modes. Start with the simplest one that fits your stage.

| Mode | Backend | When to use |
|---|---|---|
| **SQLite** | Embedded SQLite | Local development, demos, CI (no Docker required) |
| **Docker Compose** | Cassandra or MySQL in containers | Team dev environment, local integration tests |
| **Kubernetes (Helm)** | Cassandra, MySQL, or Postgres | Staging and production |
| **Managed (Uber)** | Uber-operated multi-tenant cluster | Uber internal teams |

### Local quickstart

SQLite mode requires no Docker and no external database. It is the fastest path from a fresh clone to a running Cadence server.

<Tabs groupId="deployment">
<TabItem value="sqlite" label="SQLite (no Docker)">

```bash
git clone https://github.com/cadence-workflow/cadence.git
cd cadence
make bins
make install-schema-sqlite
./cadence-server --zone sqlite start
```

Open `http://localhost:8088` for the Cadence Web UI.

</TabItem>
<TabItem value="docker" label="Docker Compose">

```bash
git clone https://github.com/cadence-workflow/cadence.git
cd cadence/docker

# Starts Cadence + Cassandra
docker-compose up

# Or use the MySQL variant
docker-compose -f docker-compose-mysql.yml up
```

</TabItem>
</Tabs>

:::note Pre-built Docker images are available on Docker Hub
The server image `ubercadence/server` is updated with every release. See [Docker Hub](https://hub.docker.com/r/ubercadence/server).
:::

---

## Client SDKs

| Language | Status | Repository |
|---|---|---|
| Go | Official | [cadence-workflow/cadence-go-client](https://github.com/cadence-workflow/cadence-go-client) |
| Java | Official | [cadence-workflow/cadence-java-client](https://github.com/cadence-workflow/cadence-java-client) |
| Python | Community | |
| Ruby | Community | [coinbase/cadence-ruby](https://github.com/coinbase/cadence-ruby) |
| .NET | In development | |

You can also use [iWF](https://github.com/indeedeng/iwf) as a DSL framework that runs on top of Cadence if you prefer a state-machine abstraction over raw workflow code.

---

## Hello World

The smallest possible Cadence program registers a workflow, registers an activity, starts a worker, and runs the workflow from a client.

<Tabs groupId="lang">
<TabItem value="go" label="Go">

```go
func HelloWorkflow(ctx workflow.Context, name string) (string, error) {
    ao := workflow.ActivityOptions{ScheduleToCloseTimeout: 10 * time.Second}
    ctx = workflow.WithActivityOptions(ctx, ao)

    var result string
    err := workflow.ExecuteActivity(ctx, HelloActivity, name).Get(ctx, &result)
    return result, err
}

func HelloActivity(ctx context.Context, name string) (string, error) {
    return "Hello, " + name + "!", nil
}
```

</TabItem>
<TabItem value="java" label="Java">

```java
public interface HelloWorkflow {
    @WorkflowMethod
    String sayHello(String name);
}

public class HelloWorkflowImpl implements HelloWorkflow {
    private final HelloActivities activities =
        Workflow.newActivityStub(HelloActivities.class);

    @Override
    public String sayHello(String name) {
        return activities.greet(name);
    }
}
```

</TabItem>
</Tabs>

Full step-by-step guides: [Golang Hello World](/docs/get-started/golang-hello-world) · [Java Hello World](/docs/get-started/java-hello-world)

:::caution Register workflows and activities on every worker
Every worker that polls a task list must register all workflows and activities that may run on that task list. A worker that receives a task for an unregistered type will abandon the task and block the workflow until a correctly registered worker picks it up.
:::

---

## Persistence backends

| Backend | Production use | Notes |
|---|---|---|
| **Cassandra** | Yes | Recommended for high-throughput, multi-region deployments |
| **MySQL 8** | Yes | Simpler ops for teams already running MySQL |
| **Postgres** | Yes | Fully supported; schema in `schema/postgres/` |
| **SQLite** | Local dev only | Embedded, zero-config; not for production |

Schema migrations are managed by the `cadence-sql-tool` CLI bundled with the server binary. See [CONTRIBUTING.md](https://github.com/cadence-workflow/cadence/blob/master/CONTRIBUTING.md) for setup instructions.

---

## Community

| Channel | Link |
|---|---|
| CNCF Slack (`#cadence-workflow`) | [Join](https://slack.cncf.io/) |
| Stack Overflow | [`cadence-workflow` tag](https://stackoverflow.com/questions/tagged/cadence-workflow) |
| GitHub Issues | [cadence-workflow/cadence/issues](https://github.com/cadence-workflow/cadence/issues) |
| GitHub Discussions | [cadence-workflow/cadence/discussions](https://github.com/cadence-workflow/cadence/discussions) |
| Reddit | [r/cadenceworkflow](https://www.reddit.com/r/cadenceworkflow/) |
| OSS Community Survey | [2025 Survey](https://lf.biz/cadence-survey-2025) |

Contributions to the server, SDKs, docs, and samples are welcome. See [CONTRIBUTING.md](https://github.com/cadence-workflow/cadence/blob/master/CONTRIBUTING.md) for the development setup, coding standards, and PR process.

---

## References

- [Workflow Engine and Orchestration](/docs/concepts/workflow-engine): how Cadence works as a workflow engine
- [Get Started](/docs/get-started): server installation, HelloWorld samples, Video Tutorials
- [Deployment Topology](/docs/concepts/topology): Frontend, Matching, History, Worker services
- GitHub org: [github.com/cadence-workflow](https://github.com/cadence-workflow)
- Docker Hub: [ubercadence/server](https://hub.docker.com/r/ubercadence/server)
- Helm charts: [cadence-workflow/cadence-charts](https://github.com/cadence-workflow/cadence-charts)
