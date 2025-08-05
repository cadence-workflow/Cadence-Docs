---
layout: default
title: Grafana Metrics Dashboards
permalink: /docs/concepts/grafana-metrics-dashboards
---

# Grafana Metrics Dashboards

## Introduction

Cadence provides pre-configured Grafana dashboards to monitor and visualize metrics for workflows, tasks, and system performance. These dashboards are available in the [Cadence GitHub repository](https://github.com/cadence-workflow/cadence/tree/master/docker/grafana/provisioning/dashboards).

The dashboards are designed to help users understand the operational state of Cadence services and workflows. They include metrics for:

- Workflow execution (e.g., latency, success rates)
- Task queue performance (e.g., throughput, errors)
- System health (e.g., CPU, memory usage)
- Service-specific metrics (e.g., history, matching, frontend)

## Setup

### Clone the Repository

Clone the Cadence repository to access the dashboard JSON files:
```bash
git clone https://github.com/cadence-workflow/cadence.git
```

### Locate Dashboard Files

Navigate to the directory containing the dashboard JSON files:
```bash
cd cadence/docker/grafana/provisioning/dashboards
```

### Import Dashboards into Grafana

1. Open Grafana and go to **Dashboards** > **Import**.
2. Upload the JSON files from the directory.

## Available Dashboards
### List of Pre-configured Dashboards

The following dashboards are available in the Cadence GitHub repository:

1. **Cadence Frontend Dashboard**  
  Monitors the performance and health of the Cadence Frontend service, including request rates, latencies, and errors.

2. **Cadence History Dashboard**  
  Provides insights into the Cadence History service, including workflow execution metrics, shard performance, and persistence latencies.

3. **Cadence Matching Dashboard**  
  Tracks metrics related to the Matching service, such as task queue throughput, poller activity, and task latencies.

4. **Cadence Persistence Dashboard**  
  Provides metrics related to persistence operations, including database query latencies, error rates, and throughput. 

5. **Cadence Workflow Dashboard**  
  Focuses on workflow execution metrics, including success rates, failure rates, and execution durations.

  6. **Cadence Client Dashboard**  
    Provides metrics related to client-side operations, including API call latencies, request rates, and error rates.

  7. **Cadence Server Dashboard**  
    Monitors server-side metrics such as resource utilization, request handling performance, and service-specific latencies.

  8. **Cadence Archival Dashboard**  
    Tracks metrics for archival operations, including storage usage, archival throughput, and error rates.

Each dashboard is available as a JSON file in the [Cadence GitHub repository](https://github.com/cadence-workflow/cadence/tree/master/docker/grafana/provisioning/dashboards) and can be imported into Grafana for monitoring.

## Customization

The dashboards can be customized by editing the JSON files or modifying panels directly in Grafana.

## Additional Information

- [Cadence Documentation](https://cadenceworkflow.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Cadence GitHub Repository](https://github.com/cadence-workflow/cadence)
