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

### Workflow Metrics Dashboard

- **Purpose**: Monitor workflow execution times, success rates, and failures.
- **Usage**: Identify bottlenecks and optimize workflows.

### Task Queue Metrics Dashboard

- **Purpose**: Track task queue latency, throughput, and errors.
- **Usage**: Ensure efficient task processing.

### System Health Dashboard

- **Purpose**: Monitor resource usage (CPU, memory) for Cadence services.
- **Usage**: Diagnose system-level issues.

### Service Metrics Dashboards

- **Purpose**: Provide detailed metrics for individual Cadence services (history, matching, frontend).
- **Usage**: Analyze service-specific performance.

## Customization

The dashboards can be customized by editing the JSON files or modifying panels directly in Grafana.

## Additional Information

- [Cadence Documentation](https://cadenceworkflow.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Cadence GitHub Repository](https://github.com/cadence-workflow/cadence)
