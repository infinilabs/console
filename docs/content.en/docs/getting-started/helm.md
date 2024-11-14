---
weight: 40
title: Kubernetes
asciinema: true
---

# Kubernetes Deployment

INFINI Console supports deployment on Kubernetes using Helm charts.

## The Chart Repository

Chart repository: [https://helm.infinilabs.com](https://helm.infinilabs.com/).

Use the follow command add the repository:

```bash
helm repo add infinilabs https://helm.infinilabs.com
```

## Prerequisites

- K8S StorageClass

The default StorageClass of the Chart package is local-path, you can install it through [here](https://github.com/rancher/local-path-provisioner).

If you want use other StorageClass(installed), you can create a YAML file (eg. vaules.yaml) file that it contains the follow contents:
```yaml
storageClassName: \<storageClassName\>
```
and use it through `-f`.

## Install

```bash
helm install console infinilabs/console -n <namespace>
```

## Uninstall

```bash
helm uninstall console -n <namespace>
kubectl delete pvc console-data-console-0 console-config-console-0 -n <namespace>
```