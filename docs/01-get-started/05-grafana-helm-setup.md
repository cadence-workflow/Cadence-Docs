---
layout: default
title: Grafana Helm Setup
permalink: /docs/get-started/grafana-helm-setup
---

# Grafana Helm Setup

This guide explains how to set up Grafana for monitoring Cadence workflows and services using Helm charts. Helm simplifies the deployment and management of Grafana in Kubernetes environments. Pre-configured dashboards for Cadence are available to visualize metrics effectively.

## Prerequisites

Before proceeding, ensure the following:

- Kubernetes cluster is up and running.
- Helm is installed on your system. Refer to the [Helm installation guide](https://helm.sh/docs/intro/install/).
- Access to the Cadence Helm charts repository.

## Setup Steps

### Step 1: Add Cadence Helm Repository

```bash
helm repo add cadence-workflow https://cadenceworkflow.github.io/cadence-charts
helm repo update
```

### Step 2: Deploy Prometheus Operator

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus-operator prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace
```

### Step 3: Deploy Cadence with ServiceMonitor

Create a `values.yaml` file to enable ServiceMonitor for automatic metrics scraping:

```yaml
# Enable metrics collection
metrics:
  enabled: true
  port: 9090
  portName: metrics

  serviceMonitor:
    enabled: true
    # Replace with the namespace where Prometheus is deployed
    namespace: "monitoring"
    namespaceSelector:
      # Ensure this matches Prometheus's namespace
      matchNames:
        - monitoring
    scrapeInterval: 10s
    additionalLabels:
      # Ensure this matches Prometheus's Helm release name
      release: prometheus-operator
    annotations: {}
    jobLabel: "app.kubernetes.io/name"
    targetLabels:
      - app.kubernetes.io/name
    relabelings: []
    metricRelabelings: []
```

Deploy Cadence:
```bash
helm install cadence cadence-workflow/cadence \
  --namespace cadence --create-namespace \
  --values values.yaml
```

**Note:** Update the `namespace`, `matchNames`, and `release` values to match your Prometheus deployment.

### Step 4: Access Grafana

Get Grafana admin password:
```bash
kubectl get secret --namespace monitoring prometheus-operator-grafana \
  -o jsonpath="{.data.admin-password}" | base64 --decode
```

Access Grafana:
```bash
kubectl port-forward --namespace monitoring svc/prometheus-operator-grafana 3000:80
```

Open http://localhost:3000 (admin/password from above)

### Step 5: Import Cadence Dashboards

1. **Download the Cadence Grafana Dashboard JSON:**
```bash
curl https://raw.githubusercontent.com/cadence-workflow/cadence/refs/heads/master/docker/grafana/provisioning/dashboards/cadence-server.json -o cadence-server.json
```

2. **Import in Grafana:** **Dashboards** → **Import** → Upload JSON files
3. **Select Prometheus** as data source when prompted
4. Try the same steps for other dashboards

## Customization

The Grafana dashboards can be customized by editing the JSON files or modifying panels directly in Grafana. Additionally, Helm values can be overridden during installation to customize Grafana settings.

### Example: Override Helm Values
Create a `values.yaml` file to customize Grafana settings:
```yaml
grafana:
  adminPassword: "your-password"
  dashboards:
    enabled: true
```

Install Grafana with the custom values:
```bash
helm install grafana cadence/grafana -n cadence-monitoring -f values.yaml
```

## Additional Information

- [Cadence Helm Charts Repository](https://github.com/cadence-workflow/cadence-charts)
- [Grafana Documentation](https://grafana.com/docs/)
- [Helm Documentation](https://helm.sh/docs/)
