# Demo Script: Deploy Cadence on GKE with Helm

**Video walkthrough of the PostgreSQL + Kafka + OpenSearch codelab**

---

## Opening (1 clip, ~30 seconds)

**Talking Points:**

> What if I told you that you could have a production-ready Cadence deployment running in under 15 minutes?
>
> In this video, I'll show you how to deploy Cadence to Google Kubernetes Engine using our Cadence Helm charts. By the end, you'll have a fully working deployment with PostgreSQL for persistence, Kafka for event streaming, and OpenSearch for advanced visibility search.
>
> Let's get started.

---

## Step 0: Setup Your Local Tools

### Clip 0a: Tool Prerequisites (~45 seconds)

**Show:** Terminal with version checks

**Talking Points:**
- Three tools needed: gcloud, kubectl, helm
- Quick install with Homebrew on macOS

**Commands to highlight:**
```bash
brew install --cask google-cloud-sdk
brew install kubectl
brew install helm
```

---

### Clip 0b: Authenticate with Google Cloud (~30 seconds)

**Show:** Terminal

**Talking Points:**
- Login to your Google account
- Set your project ID
- Set your region (Autopilot clusters are regional)

**Commands to highlight:**
```bash
gcloud auth login
gcloud config set project <YOUR_PROJECT_ID>
gcloud config set compute/region us-central1
```

---

### Clip 0c: Clone the Cadence Helm Charts (~20 seconds)

**Show:** Terminal

**Talking Points:**
- Clone the official cadence-charts repository
- This contains all the Helm charts and example configurations

**Commands to highlight:**
```bash
git clone https://github.com/cadence-workflow/cadence-charts.git
cd cadence-charts
```

---

## Step 1: Connect to GKE Cluster

### Clip 1a: Get Cluster Credentials (~30 seconds)

**Show:** Terminal

**Talking Points:**
- Connect kubectl to your existing GKE cluster
- Verify connection by listing nodes

**Commands to highlight:**
```bash
gcloud container clusters get-credentials <CLUSTER_NAME> --region us-central1
kubectl get nodes
```

**Expected output:** List of nodes with `Ready` status

---

### Clip 1b: Create Namespace (~20 seconds)

**Show:** Terminal

**Talking Points:**
- Create a dedicated namespace for Cadence
- Keeps resources organized and isolated

**Commands to highlight:**
```bash
kubectl create namespace cadence-postgres-os2
kubectl get namespace cadence-postgres-os2
```

---

## Step 2: Review the Values File

### Clip 2a: Walk Through Configuration (~60 seconds)

**Show:** Terminal or editor with values file open

**Talking Points:**
- Official example file: `charts/cadence/examples/values.postgres-os2.yaml`
- PostgreSQL: main persistence store
- Kafka: event streaming in KRaft mode (no ZooKeeper)
- OpenSearch: advanced visibility search
- All dependencies deploy together automatically

**Commands to highlight:**
```bash
cat charts/cadence/examples/values.postgres-os2.yaml
```

**Key sections to scroll through:**
- PostgreSQL configuration
- Kafka configuration
- OpenSearch configuration
- Cadence service settings

---

## Step 3: Install Cadence with Helm

### Clip 3a: Add Helm Repos and Build Dependencies (~45 seconds)

**Show:** Terminal

**Talking Points:**
- Add required Helm repos: Bitnami (PostgreSQL, Kafka) and OpenSearch
- Build chart dependencies to download subchart packages
- These are one-time setup steps

**Commands to highlight:**
```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add opensearch https://opensearch-project.github.io/helm-charts/
helm repo update
helm dependency build ./charts/cadence
```

---

### Clip 3b: Install Cadence (~30 seconds)

**Show:** Terminal

**Talking Points:**
- Run helm install with the values file
- The `--wait` flag waits for all pods to be ready
- Takes about 5-10 minutes

**Commands to highlight:**
```bash
helm upgrade --install cadence-release ./charts/cadence \
  --namespace cadence-postgres-os2 \
  -f charts/cadence/examples/values.postgres-os2.yaml \
  --wait
```

**Note:** This is a good time to cut and resume when install completes.

---

### Clip 3c: Verify Installation (~30 seconds)

**Show:** Terminal

**Talking Points:**
- Check all pods are running
- Should see: Cadence services, PostgreSQL, Kafka (controller + broker), OpenSearch
- Schema jobs show as Completed

**Commands to highlight:**
```bash
kubectl get pods -n cadence-postgres-os2
```

**Expected pods:**
- `cadence-release-frontend`, `history`, `matching`, `worker`, `web`
- `cadence-release-postgresql`
- `cadence-release-kafka-controller`, `kafka-broker`
- `cadence-release-opensearch-master-0`

---

## Step 4: Access Cadence Services

### Clip 4a: Port-Forward Services (~30 seconds)

**Show:** Terminal (split or two terminals)

**Talking Points:**
- Port-forward the frontend for CLI access
- Port-forward the web UI
- Keep both running in separate terminals

**Commands to highlight:**
```bash
# Terminal 1
kubectl port-forward -n cadence-postgres-os2 svc/cadence-release-frontend 7833:7833

# Terminal 2
kubectl port-forward -n cadence-postgres-os2 svc/cadence-release-web 8088:8088
```

---

### Clip 4b: Show Web UI (~20 seconds)

**Show:** Browser

**Talking Points:**
- Open http://localhost:8088
- This is the Cadence Web UI for monitoring workflows
- Currently empty—no domains yet

**Action:** Navigate to http://localhost:8088, show the interface briefly

---

## Step 5: Create a Sample Domain

### Clip 5a: Register Domain (~45 seconds)

**Show:** Terminal, then browser

**Talking Points:**
- A domain is a namespace for workflows
- Exec into a frontend pod to use the Cadence CLI
- Register a domain called "sample-domain"
- Verify in the Web UI

**Commands to highlight:**
```bash
POD=$(kubectl get pods -n cadence-postgres-os2 \
  -l app.kubernetes.io/component=frontend \
  -o jsonpath='{.items[0].metadata.name}')

kubectl exec -n cadence-postgres-os2 -it "$POD" -- \
  cadence --address cadence-release-frontend:7833 \
  --do sample-domain domain register -rd 1

kubectl exec -n cadence-postgres-os2 -it "$POD" -- \
  cadence --address cadence-release-frontend:7833 domain list
```

**Action:** Refresh Web UI to show the new domain

---

## Step 6: Cleanup (Optional)

### Clip 6a: Delete Resources (~20 seconds)

**Show:** Terminal

**Talking Points:**
- Delete the namespace to remove everything
- This includes all data—use with caution
- Alternative: `helm uninstall` keeps the namespace

**Commands to highlight:**
```bash
kubectl delete namespace cadence-postgres-os2
```

---

## Closing (1 clip, ~30 seconds)

**Talking Points:**

> That's it! You've successfully deployed Cadence on GKE with PostgreSQL, Kafka, and OpenSearch.
>
> From here, you can start building workflows using the Go or Java client SDKs. Check out the Cadence documentation for sample workflows and tutorials.
>
> If you ran into any issues, the codelab has a troubleshooting section, and you can find help in the Cadence community Slack channel.
>
> Thanks for watching!

---

## Production Notes

**Total estimated runtime:** 8-12 minutes

**Clips summary:**
| Section | Clips | Est. Time |
|---------|-------|-----------|
| Opening | 1 | 30s |
| Step 0 | 3 | 1m 35s |
| Step 1 | 2 | 50s |
| Step 2 | 1 | 1m |
| Step 3 | 3 | 1m 45s |
| Step 4 | 2 | 50s |
| Step 5 | 1 | 45s |
| Step 6 | 1 | 20s |
| Closing | 1 | 30s |

**Pre-recording checklist:**
- [ ] GKE cluster is running and accessible
- [ ] Local tools installed (gcloud, kubectl, helm)
- [ ] Terminal font size increased for readability
- [ ] Browser zoom set appropriately
- [ ] Previous namespace cleaned up (fresh start)

**Post-recording:**
- Consider adding chapter markers for each step
- Add captions/subtitles for accessibility
