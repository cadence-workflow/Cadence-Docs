---
layout: default
title: Server Installation
permalink: /docs/get-started/installation
---

# Install Cadence Service Locally

To get started with Cadence, you need to set up three components successfully.

* A Cadence server hosting dependencies that Cadence relies on such as Cassandra, Elastic Search, etc
* A Cadence domain for you workflow application
* A Cadence worker service hosting your workflows

## 0. Prerequisite - Install docker

Follow the Docker installation instructions found here: [https://docs.docker.com/engine/installation/](https://docs.docker.com/engine/install/)

## 1. Run Cadence Server Using Docker Compose

Download the Cadence docker-compose file:

```bash
curl -O https://raw.githubusercontent.com/cadence-workflow/cadence/master/docker/docker-compose.yml && curl -O https://raw.githubusercontent.com/cadence-workflow/cadence/master/docker/prometheus/prometheus.yml
```
Then start Cadence Service by running:
```bash
docker-compose up
```
Please keep this process running at background.

## 2. Register a Domain Using the CLI
In a new terminal, create a new domain called `test-domain` (or choose whatever name you like) by running:
```bash
docker run --network=host --rm ubercadence/cli:master --do test-domain domain register -rd 1
```
Check that the domain is indeed registered:
```shell-session
$ docker run --network=host --rm ubercadence/cli:master --do test-domain domain describe
Name: test-domain
Description:
OwnerEmail:
DomainData: map[]
Status: REGISTERED
RetentionInDays: 1
EmitMetrics: false
ActiveClusterName: active
Clusters: active
ArchivalStatus: DISABLED
Bad binaries to reset:
+-----------------+----------+------------+--------+
| BINARY CHECKSUM | OPERATOR | START TIME | REASON |
+-----------------+----------+------------+--------+
+-----------------+----------+------------+--------+
$
```

Please remember the domains you created because they will be used in your worker implementation and Cadence CLI  commands.

## What's Next
So far you've successfully finished two prerequisites to your Cadence application. The next steps are to implement a simple worker service that hosts your workflows and to run your very first hello world Cadence workflow.

Go to [Java HelloWorld](/docs/get-started/java-hello-world) or [Golang HelloWorld](/docs/get-started/golang-hello-world).

## Troubleshooting
There can be various reasons that `docker-compose up` cannot succeed:
* In case of the image being too old, update the docker image by `docker pull ubercadence/server:master-auto-setup` and retry
* In case of the local docker env is messed up: `docker system prune --all` and retry (see [details about it](https://docs.docker.com/engine/manage-resources/pruning/) )
* See logs of different container:
  * If Cassandra is not able to get up: `docker logs -f docker-cassandra-1`
  * If Cadence is not able to get up: `docker logs -f docker-cadence-1`
  * If Cadence Web is not able to get up: `docker logs -f docker-cadence-web-1`

If the above is still not working, [open an issue in Server(main) repo](https://github.com/cadence-workflow/cadence/issues/new/choose)
