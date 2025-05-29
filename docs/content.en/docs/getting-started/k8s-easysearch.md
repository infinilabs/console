---
weight: 38
title: Deploying Console and Easysearch in a Kubernetes Cluster
asciinema: true
---

# Deploying Console and Easysearch in a Kubernetes Cluster

This guide describes how to deploy INFINI Console and INFINI Easysearch as containers and enable Agent metric collection mode within the containers.

## Prerequisites

- Ensure that a Kubernetes cluster is installed and running correctly.
- Ensure that `kubectl` is configured and can access the Kubernetes cluster.
- Ensure that Helm is installed and configured.

## Helm Configuration Adjustments

When deploying Console and Easysearch using Helm, the default configuration needs to be adjusted to enable Agent metric collection mode.

In your `values.yaml` file, add the following configuration:

```yaml
metricsWithAgent: true
metricsConfigServer: "http://console:9000"
```

## Installing the cert-manager Dependency

Use the following commands to install the cert-manager dependency:

```bash
helm repo add jetstack https://charts.jetstack.io --force-update
helm install cert-manager jetstack/cert-manager \
--namespace cert-manager \
--create-namespace \
--version v1.17.2 \
--set crds.enabled=true \
--set prometheus.enabled=false \
--set webhook.timeoutSeconds=10
```

## Configuring the Easysearch Root Certificate

Use the following commands to configure the Easysearch root certificate and access password.
> Note: Please ensure you change the initial password to maintain security.

```bash
cat << EOF | kubectl -n infinilabs apply -f -
apiVersion: cert-manager.io/v1
kind: Issuer
metadata:
name: easysearch-ca-issuer
spec:
selfSigned: {}
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
name: easysearch-ca-certificate
spec:
commonName: easysearch-ca-certificate
duration: 87600h0m0s
isCA: true
issuerRef:
kind: Issuer
name: easysearch-ca-issuer
privateKey:
algorithm: ECDSA
size: 256
renewBefore: 2160h0m0s
secretName: easysearch-ca-secret
EOF

# Create Easysearch access password, please change the initial password yourself
kubectl create secret generic easysearch-secrets \
--namespace infinilabs \
--from-literal=ezs_password='ezs_infini_console'
```

## Deploying Console and Easysearch

Use the following commands to deploy Console and Easysearch. Image downloads may take some time, please be patient.

> During installation, you can use `--set` to adjust parameters, for example, to change the Easysearch image version:  `--set image.repository=infinilabs/easysearch  --set image.tag=1.12.2-2106`

```bash
helm repo add infinilabs https://helm.infinilabs.com --force-update
helm install console infinilabs/console -n infinilabs --create-namespace
helm install easysearch infinilabs/easysearch -n infinilabs --create-namespace \
--set metricsWithAgent=true \
--set metricsConfigServer="http://console:9000"
```

## Verifying the Deployment

After the deployment is complete, access the [Console](http://localhost:30900/) to initialize it and adjust the cluster configuration to enable Agent metric collection mode. Also, associate the Agent with the cluster nodes.
Once these operations are done, you can view the Agent collection status, data latency for various metrics, log information, and shard monitoring on the Monitoring page.

{{% load-img "/img/screenshot/v1.29/monitor/agent-index.png" "" %}}
{{% load-img "/img/screenshot/v1.29/monitor/agent-shard.png" "" %}}

## Deleting Console and Easysearch

Use the following commands to delete Console and Easysearch:

```bash
helm uninstall console -n infinilabs
helm uninstall easysearch -n infinilabs
kubectl delete pvc console-data-console-0 console-config-console-0 -n infinilabs
kubectl delete pvc easysearch-data-easysearch-0 easysearch-config-easysearch-0 -n infinilabs
kubectl delete namespace infinilabs
```