---
layout: default 
title: Deploy Cadence with Helm on GKE (PostgreSQL + OpenSearch)
permalink: /docs/codelabs/helm-deploy-postgres-opensearch

---
## Codelab: Deploy Cadence with Helm on GKE

This codelab walks you through deploying Cadence on GKE using official Helm charts with PostgreSQL, Kafka, and OpenSearch for advanced visibility.

**Prerequisites:**
- Google Cloud project with billing enabled
- An existing GKE cluster with kubectl access
  - If you need to create a cluster, see [Creating a GKE cluster](https://cloud.google.com/kubernetes-engine/docs/how-to/creating-a-zonal-cluster)
- Basic familiarity with terminal commands

### What you'll build
- A complete Cadence deployment (frontend, history, matching, worker)
- PostgreSQL as the main persistence store
- Kafka for visibility event streaming
- OpenSearch v2 for advanced visibility
- Cadence Web UI for workflow monitoring

---

### Step 0: Setup your local tools

This step ensures you have the necessary tools installed and configured. The examples below use macOS commands, but the official documentation links provide instructions for all platforms.

#### Prerequisites

You'll need these tools installed locally:

**Google Cloud SDK (gcloud)** - Manages GCP resources and authentication
- Install instructions: https://cloud.google.com/sdk/docs/install

**kubectl** - Kubernetes command-line tool for cluster management
- Install instructions: https://kubernetes.io/docs/tasks/tools/

**Helm** - Kubernetes package manager
- Install instructions: https://helm.sh/docs/intro/install/

**Quick install (macOS with Homebrew):**

```bash
brew install --cask google-cloud-sdk
```

```bash
brew install kubectl
```

```bash
brew install helm
```

#### Authenticate and configure GCloud

Initialize gcloud (interactive setup):

```bash
gcloud init
```

Or configure manually:

Login to your Google account:

```bash
gcloud auth login
```

Set your GCP project (replace `<YOUR_GCP_PROJECT_ID>` with your actual project ID):

```bash
gcloud config set project <YOUR_GCP_PROJECT_ID>
```

Set your preferred region:

```bash
gcloud config set compute/region us-central1
```

Set your preferred zone:

```bash
gcloud config set compute/zone us-central1-a
```

#### Get Cadence Helm Charts

This codelab uses the local charts approach. Clone the repository:

```bash
git clone https://github.com/cadence-workflow/cadence-charts.git
```

```bash
cd cadence-charts
```

**Alternative approach:** Use the remote Helm repository (not used in this codelab):

```bash
helm repo add cadence https://cadence-workflow.github.io/cadence-charts
```

```bash
helm repo update
```

Note: If using the remote repo, replace `./charts/cadence` with `cadence/cadence` in install commands.

---

### Step 1: Connect to your GKE cluster and create a namespace

**Prerequisites:** You need an existing GKE cluster. In many organizations, platform or infra teams manage cluster creation. If you need to create a cluster yourself, see the official documentation: [Creating a GKE cluster](https://cloud.google.com/kubernetes-engine/docs/how-to/creating-a-zonal-cluster)

For this guide, we'll assume your cluster is named `cadence-test-gke-1`. Replace this with your actual cluster name in the commands below.

#### Connect kubectl to your cluster

Get credentials for your existing GKE cluster (replace `cadence-test-gke-1` with your cluster name):

```bash
gcloud container clusters get-credentials cadence-test-gke-1
```

**Note:** If this command fails (404, not found), you may need to specify the region or zone where your cluster is located:

```bash
gcloud container clusters get-credentials cadence-test-gke-1 --region us-central1
```

Verify the connection by listing nodes:

```bash
kubectl get nodes
```

You should see a list of nodes in your cluster with a `Ready` status.

#### Create a namespace for Cadence

Namespaces provide logical isolation within the cluster:

```bash
kubectl create namespace cadence-postgres-os2
```

Verify the namespace was created:

```bash
kubectl get namespace cadence-postgres-os2
```

---

### Step 2: Review the Helm values file

This codelab uses the official example values file that configures Cadence with:

- **PostgreSQL** - Main persistence store for workflow data
- **Kafka** - Event streaming for visibility events (KRaft mode, no ZooKeeper)
- **OpenSearch v2** - Advanced visibility search and filtering (ES v7 API compatible)
- **Cadence services** - Frontend, history, matching, worker

The Cadence Helm chart includes subcharts for all dependencies, so everything deploys together automatically.

#### View the values file

```bash
cat charts/cadence/examples/values.postgres-os2.yaml
```

The values file is well-commented and describes each configuration option. Key points:

- **OpenSearch** uses the official OpenSearch Helm chart (not Bitnami)
- **Security is disabled** for demo purposes—enable for production
- **Kafka topic provisioning** is enabled to avoid race conditions
- **GKE Autopilot compatible** with appropriate security contexts

**For production environments,** consider using managed services (Cloud SQL, Amazon OpenSearch Service, Confluent Cloud) or enabling security features.

---

### Step 3: Install Cadence with Helm

#### Build chart dependencies

First, ensure you're in the `cadence-charts` directory:

```bash
cd cadence-charts
```

Download the dependency charts:

```bash
helm dependency build ./charts/cadence
```

#### Install Cadence

```bash
helm upgrade --install cadence-release ./charts/cadence \
  --namespace cadence-postgres-os2 \
  -f charts/cadence/examples/values.postgres-os2.yaml \
  --wait
```

The `--wait` flag keeps the command running until all pods are ready (typically 5-10 minutes).

**Note:** GKE Autopilot warnings about "autopilot-default-resources-mutator" are normal and not errors.

#### Verify installation

Check that all pods are running:

```bash
kubectl get pods -n cadence-postgres-os2
```

You should see pods for:
- `cadence-release-frontend`, `cadence-release-history`, `cadence-release-matching`, `cadence-release-worker`
- `cadence-release-web`
- `cadence-release-postgresql`
- `cadence-release-kafka-controller`, `cadence-release-kafka-broker`
- `cadence-release-opensearch-master-0`
- Schema jobs (may show as `Completed`)

All pods should show `Running` status (or `Completed` for jobs).

---

### Step 4: Access Cadence services

#### Check schema jobs

Verify schema jobs completed successfully:

```bash
kubectl get jobs -n cadence-postgres-os2
```

Jobs should show `COMPLETIONS` as `1/1`. If needed, check logs:

```bash
kubectl logs job/cadence-release-schema-postgresql -n cadence-postgres-os2 --tail=100
```

```bash
kubectl logs job/cadence-release-schema-elasticsearch -n cadence-postgres-os2 --tail=100
```

#### Port-forward to Cadence services

**Port-forward the frontend** (for CLI access):

```bash
kubectl port-forward -n cadence-postgres-os2 svc/cadence-release-frontend 7833:7833
```

Keep this running and open a new terminal.

**Port-forward the Web UI:**

```bash
kubectl port-forward -n cadence-postgres-os2 svc/cadence-release-web 8088:8088
```

**Access the Web UI** at http://localhost:8088

---

### Step 5: Create a sample domain

A Cadence **domain** is a namespace for workflows. We'll exec into a frontend pod to use the CLI.

Find a frontend pod:

```bash
POD=$(kubectl get pods -n cadence-postgres-os2 \
  -l app.kubernetes.io/component=frontend \
  -o jsonpath='{.items[0].metadata.name}')
```

Register a domain:

```bash
kubectl exec -n cadence-postgres-os2 -it "$POD" -- \
  cadence --address cadence-release-frontend:7833 \
  --do sample-domain domain register -rd 1
```

Verify domain creation:

```bash
kubectl exec -n cadence-postgres-os2 -it "$POD" -- \
  cadence --address cadence-release-frontend:7833 domain list
```

---

### Step 6: Cleanup (optional)

**Warning:** These operations will delete all data.

**Recommended: Delete the namespace** (complete cleanup):

```bash
kubectl delete namespace cadence-postgres-os2
```

This removes all resources including PersistentVolumeClaims. Deletion may take a minute.

**Alternative: Helm uninstall** (keeps namespace and PVCs):

```bash
helm uninstall cadence-release -n cadence-postgres-os2
```

**Note:** `helm uninstall` intentionally preserves PersistentVolumeClaims to prevent accidental data loss. To fully clean up after helm uninstall:

```bash
kubectl delete pvc --all -n cadence-postgres-os2
```

---

### Troubleshooting

#### Installation Issues

**Pods stuck in Pending:**

```bash
kubectl describe pod <pod-name> -n cadence-postgres-os2
```

Look for resource or quota issues. Scale up your cluster or reduce resource requests.

**Helm install times out:**

Remove `--wait` and monitor manually:

```bash
kubectl get pods -n cadence-postgres-os2 -w
```

#### OpenSearch Issues

**OpenSearch not starting:**

```bash
kubectl get pods -n cadence-postgres-os2 -l app.kubernetes.io/name=opensearch
kubectl logs -n cadence-postgres-os2 cadence-release-opensearch-master-0 --tail=100
```

**Test OpenSearch connectivity:**

```bash
kubectl port-forward -n cadence-postgres-os2 svc/cadence-release-opensearch 9200:9200
curl -s http://localhost:9200/cadence-visibility-os2
```

#### Kafka Issues

**Kafka pods not starting:**

```bash
kubectl get pods -n cadence-postgres-os2 -l app.kubernetes.io/name=kafka
kubectl logs -n cadence-postgres-os2 -l app.kubernetes.io/component=controller --tail=100
```

#### General Debugging

```bash
kubectl get all -n cadence-postgres-os2
kubectl logs -n cadence-postgres-os2 <pod-name> --tail=100
kubectl describe pod -n cadence-postgres-os2 <pod-name>
helm status cadence-release -n cadence-postgres-os2
```

---

### References

#### Cadence Resources

- **[Cadence Helm Charts Repository](https://github.com/cadence-workflow/cadence-charts)** - Source repository for the Helm charts
- **[Cadence Helm Chart README](https://github.com/cadence-workflow/cadence-charts/tree/main/charts/cadence)** - Detailed configuration options
- **[Cadence CLI Documentation](https://cadenceworkflow.io/docs/cli/)** - CLI reference for managing domains and workflows

#### Kubernetes and Helm

- **[Helm Installation](https://helm.sh/docs/intro/install/)** - Installing Helm
- **[kubectl Overview](https://kubernetes.io/docs/reference/kubectl/)** - Kubernetes CLI reference

#### Google Cloud Platform

- **[Google Cloud SDK Installation](https://cloud.google.com/sdk/docs/install)** - Install gcloud CLI
- **[Creating a GKE Cluster](https://cloud.google.com/kubernetes-engine/docs/how-to/creating-a-zonal-cluster)** - GKE cluster creation guide

#### Database and Search

- **[PostgreSQL on Kubernetes (Bitnami)](https://artifacthub.io/packages/helm/bitnami/postgresql)** - Bitnami PostgreSQL Helm chart
- **[OpenSearch Documentation](https://opensearch.org/docs/latest/)** - OpenSearch official documentation
- **[OpenSearch Helm Charts](https://github.com/opensearch-project/helm-charts)** - Official OpenSearch Helm charts
