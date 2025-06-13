---
weight: 37
title: Deploying Console and Easysearch with Docker Compose
asciinema: true
---

# Deploying Console and Easysearch with Docker Compose

This guide describes how to deploy INFINI Console and INFINI Easysearch as containers and enable Agent metric collection mode within the containers.

## Prerequisites

- Ensure that Docker is installed and running correctly.
- Ensure that Docker Compose is installed.

## Create Docker Compose File

Create a file named `docker-compose.yml`:

```bash
mkdir -p ~/infinilabs && cd ~/infinilabs
cat << "EOF" > docker-compose.yml
services:
console:
image: infinilabs/console:{{< globaldata "console" "version" >}}
container_name: console
hostname: console
networks:
- cluster_network
ports:
- "9000:9000"
volumes:
- $PWD/console/config:/config
- $PWD/console/data:/data
- $PWD/console/logs:/log
easysearch:
image: infinilabs/easysearch:{{< globaldata "easysearch" "version" >}}
container_name: easysearch
hostname: easysearch
networks:
- cluster_network
environment:
- "JAVA_OPTS=-Xms1g -Xmx1g"
env_file:
- .env
ulimits:
memlock:
soft: -1
hard: -1
nofile:
soft: 65536
hard: 65536
volumes:
- $PWD/easysearch/config:/app/easysearch/config
- $PWD/easysearch/data:/app/easysearch/data
- $PWD/easysearch/logs:/app/easysearch/logs
networks:
cluster_network:
driver: bridge      
EOF
```

## Create `.env` File

> Note: Please ensure you change the initial password to maintain security.

```bash
cat << EOF > .env
EASYSEARCH_INITIAL_ADMIN_PASSWORD=ezs_infini_console
METRICS_WITH_AGENT=true
METRICS_CONFIG_SERVER=http://console:9000
EOF
```

## Initialize Config Directory from Image

```bash
cd ~/infinilabs
docker run --rm -v $PWD/console:/work infinilabs/console:{{< globaldata "console" "version" >}} cp -rf /config /work
docker run --rm --entrypoint "" -v $PWD/easysearch:/work infinilabs/easysearch:{{< globaldata "easysearch" "version" >}} cp -rf /app/easysearch/config /work
```

## Start Services

```bash
docker-compose up -d
```

## Verifying the Deployment

After the deployment is complete, access the [Console](http://localhost:9000/) to initialize it and adjust the cluster configuration to enable Agent metric collection mode. Also, associate the Agent with the cluster nodes.
Once these operations are done, you can view the Agent collection status, data latency for various metrics, log information, and shard monitoring on the Monitoring page.

{{% load-img "/img/screenshot/v1.29/monitor/agent-index.png" "" %}}
{{% load-img "/img/screenshot/v1.29/monitor/agent-shard.png" "" %}}

## Deleting Console and Easysearch

Use the following commands to delete Console and Easysearch:

```bash
docker-compose down
rm -rf ~/infinilabs/console ~/infinilabs/easysearch
```