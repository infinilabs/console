---
weight: 35
title: Helm 部署
asciinema: true
---

# Helm 部署

INFINI Console 支持 Helm 方式部署。

## 添加仓库

Chart 仓库地址在这里 [https://helm.infinilabs.com](https://helm.infinilabs.com/)。

使用下面的命令添加仓库：

```bash
helm repo add infinilabs https://helm.infinilabs.com
```

## 前提

Chart 包中默认配置的 StorageClass 是 local-path，可参考[这里](https://github.com/rancher/local-path-provisioner)安装。

如果想使用其他已安装的 StorageClass, 可以创建一个 YAML 文件（例如：values.yaml），添加如下配置 
```yaml
storageClassName: \<storageClassName\>
```
创建的时候使用 `-f` 参数指定，替换默认值。

## 安装

```bash
helm install console infinilabs/console -n <namespace>
```

## 卸载

```bash
helm uninstall console -n <namespace>
kubectl delete pvc console-data-console-0 console-config-console-0 -n <namespace>
```