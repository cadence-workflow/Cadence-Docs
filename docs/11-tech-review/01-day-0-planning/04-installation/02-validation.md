---
layout: default
title: Validation
description: How adopters can test and validate a Cadence installation.
keywords:
  - cadence validation
  - cadence testing installation
  - cadence verification
---

Validating a Cadence installation means confirming that the server is running, the persistence layer is healthy, and workflows can execute end-to-end. The steps below apply to any installation method; specific commands differ by deployment path.

## 1. Verify server health

### Local binary

The server prints startup logs to stdout. Look for frontend, history, matching, and worker services binding to their configured ports.

### Docker Compose

Check that all containers are running:

```bash
docker compose ps
```

The `cadence` container should be `Up` and healthy. If it is not, check logs:

```bash
docker logs -f docker-cadence-1
docker logs -f docker-cassandra-1
```

### Kubernetes / Helm

Wait for all pods to reach `Running` and schema setup jobs to complete:

```bash
kubectl get pods -l app.kubernetes.io/name=cadence-release -n cadence
kubectl get jobs -l app.kubernetes.io/component=schema-server -n cadence
```

Schema jobs should show `Completed` (`1/1`). If pods are not ready, check schema job logs first, as services depend on schema being in place:

```bash
kubectl logs job/cadence-release-schema-server -n cadence
```

## 2. Register a test domain and verify

Domain registration is the first functional check. A successful registration confirms the frontend service is reachable and the persistence layer is operational.

**Local CLI (local binary or Docker Compose):**

```bash
cadence --domain test-domain domain register --retention 1
cadence --domain test-domain domain describe
```

**Kubernetes (no local CLI):**

```bash
kubectl port-forward svc/cadence-release-frontend 7833:7833 -n cadence
cadence --address localhost:7833 --transport grpc --domain test-domain domain register --retention 1
```

The `domain describe` output should show `Status: REGISTERED`.

## 3. Run an end-to-end workflow

The strongest validation is executing a real workflow. The [cadence-samples](https://github.com/cadence-workflow/cadence-samples) repository provides ready-to-run examples.

**Go samples (helloworld):**

```bash
git clone https://github.com/cadence-workflow/cadence-samples.git
cd cadence-samples

# Start the worker
go run cmd/samples/recipes/helloworld/main.go

# In another terminal, trigger the workflow
cadence --domain test-domain workflow start \
  --tasklist helloworld-tasklist \
  --workflow_type helloworld_workflow \
  --execution_timeout 60
```

Java and Python samples follow the same pattern: start a worker process, then trigger a workflow via the CLI or the SDK.

After triggering the workflow, verify it completed successfully:

```bash
cadence --domain test-domain workflow list
```

The workflow should appear with a `Completed` status. The Web UI (default `http://localhost:8088`) provides a visual confirmation: navigate to the test domain and inspect the workflow execution, history events, and activity results.

## 4. Validate advanced visibility (optional)

If Elasticsearch or OpenSearch is deployed, confirm that workflow data is being indexed:

```bash
cadence --domain test-domain workflow list --query "WorkflowType = 'helloworld_workflow'"
```

A successful list query with results confirms that the visibility pipeline (Kafka → Elasticsearch/OpenSearch) is operational. For OpenSearch deployments, you can also check the index directly:

```bash
curl http://localhost:9200/cadence-visibility*/_count
```

## 5. Validate metrics (production)

For production deployments, confirm that the metrics pipeline is operational. The default Docker Compose setup includes Prometheus and Grafana. Verify Prometheus is scraping Cadence targets:

- **Prometheus:** navigate to `http://localhost:9090/targets` and confirm Cadence endpoints are `UP`.
- **Grafana:** navigate to `http://localhost:3000` and check the pre-configured Cadence dashboards for incoming data.

For Kubernetes deployments using Prometheus Operator or GMP (Google Managed Prometheus), verify that `PodMonitor` or `ServiceMonitor` resources are picking up Cadence pods. The Helm chart includes an [example `PodMonitoring` values file](https://github.com/cadence-workflow/cadence-charts/blob/main/charts/cadence/examples/values.podmonitoring.yaml) for GKE environments.

Cadence emits metrics for all four services (frontend, history, matching, worker). Seeing request-count and latency metrics after running a test workflow confirms end-to-end metrics collection.

## 6. Operational validation (production)

For production deployments, Cadence provides two additional validation tools:

- **Canary workflows** run periodic health-check workflows that exercise core server functionality. Deploy via `docker compose -f docker-compose-canary.yml up` or as a separate Kubernetes workload. See the [canary README](https://github.com/cadence-workflow/cadence/blob/master/canary/README.md).
- **Bench workflows** run load tests against the cluster to validate capacity and performance baselines. Deploy via `docker compose -f docker-compose-bench.yml up`. See the [bench README](https://github.com/cadence-workflow/cadence/blob/master/bench/README.md).

Both tools run as Cadence workers that start workflows against the cluster, providing ongoing confidence that the system is functioning correctly under load.

## Related documentation

- **[Server Installation](/docs/get-started/server-installation)**: Docker Compose setup with troubleshooting
- **[Helm deployment codelab](/docs/codelabs/helm-deploy-postgres-opensearch)**: includes validation and troubleshooting steps
- **[Monitoring](/docs/operation-guide/monitoring)**: production observability setup
- **[Troubleshooting](/docs/operation-guide/troubleshooting)**: operational troubleshooting guide
- **[cadence-samples](https://github.com/cadence-workflow/cadence-samples)**: sample workflows for validation
