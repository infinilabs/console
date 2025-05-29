---
weight: 38
title: 在 Kubernetes 集群中部署 Console 和 Easysearch
asciinema: true
---

# 在 Kubernetes 集群中部署 Console 和 Easysearch

下面介绍 INFINI Console 和 INFINI Easysearch 进行容器部署及容器内开启 Agent 指标采集模式。

## 前提

- 确保 Kubernetes 集群已安装并运行正常。
- 确保 kubectl 已配置并可以访问 Kubernetes 集群。
- 确保 Helm 已安装并配置。

## helm 配置调整

在使用 helm 部署 Console 和 Easysearch 时，需要调整默认的配置以启用 Agent 指标采集模式。

在 `values.yaml` 中，添加以下配置：

```yaml
metricsWithAgent: true
metricsConfigServer: "http://console:9000"
```

## 安装 cert-manager 依赖

使用以下命令安装 cert-manager 依赖

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

## 配置 Easysearch 根证书

使用以下命令配置 Easysearch 根证书及访问密码。
> 注意：请确保对初始密码进行修改，以确保安全性。

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

# 创建 Easysearch 访问密码,请自行修改初始密码
kubectl create secret generic easysearch-secrets \
  --namespace infinilabs \
  --from-literal=ezs_password='ezs_infini_console'
```

## 部署 Console 和 Easysearch

使用以下命令部署 Console 和 Easysearch, 镜像下载需要一些时间，请耐心等待。

> 安装时可以使用 --set 来调整参数，如调整 Easysearch 镜像版本：  --set image.repository=infinilabs/easysearch  --set image.tag=1.12.2-2106

```bash
helm repo add infinilabs https://helm.infinilabs.com --force-update
helm install console infinilabs/console -n infinilabs --create-namespace
helm install easysearch infinilabs/easysearch -n infinilabs --create-namespace \
    --set metricsWithAgent=true \
    --set metricsConfigServer="http://console:9000"
```

## 验证部署

在部署完成后，访问 [Console](http://localhost:30900/) 初始化，并调整集群配置以启用 Agent 指标采集模式。同时将 Agent 关联到集群节点。
操作完成后，可以在监控页面查看 Agent 采集状态及各指标数据延迟、日志信息及分片监控等。

{{% load-img "/img/screenshot/v1.29/monitor/agent-index.png" "" %}}
{{% load-img "/img/screenshot/v1.29/monitor/agent-shard.png" "" %}}

## 删除 Console 和 Easysearch

使用以下命令删除 Console 和 Easysearch

```bash
helm uninstall console -n infinilabs
helm uninstall easysearch -n infinilabs
kubectl delete pvc console-data-console-0 console-config-console-0 -n infinilabs
kubectl delete pvc easysearch-data-easysearch-0 easysearch-config-easysearch-0 -n infinilabs
kubectl delete namespace infinilabs
```