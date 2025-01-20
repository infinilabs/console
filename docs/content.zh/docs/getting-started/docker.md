---
weight: 35
title: 容器部署
asciinema: true
---

# 容器部署

INFINI Console 支持容器方式部署。

## 下载镜像

INFINI Console 的镜像发布在 Docker 的官方仓库，地址如下：

<https://hub.docker.com/r/infinilabs/console>

使用下面的命令即可获取最新的容器镜像：

```bash
docker pull infinilabs/console:{{< globaldata "console" "version" >}}
```

## 验证镜像

将镜像下载到本地之后，可以看到 INFINI Console 平台的容器镜像非常小，只有不到 30MB，所以下载的速度应该是非常快的。

```text
➜ docker images |grep "console" |grep "{{< globaldata "console" "version" >}}"
REPOSITORY             TAG      IMAGE ID       CREATED          SIZE
infinilabs/console   latest   8c27cd334e4c   47 minutes ago   26.4MB
```

## 启动平台

使用如下命令启动极限网关容器：

```bash
docker run -p 9000:9000 infinilabs/console:{{< globaldata "console" "version" >}}
```

## Docker Compose

还可以使用 docker compose 来管理容器实例，新建一个 `docker-compose.yml` 文件如下：

```yaml
version: "3.5"

services:
  infini-console:
    image: infinilabs/console:{{< globaldata "console" "version" >}}
    ports:
      - 9000:9000
    container_name: "infini-console"
```

在配置文件所在目录，执行如下命令即可启动，如下：

```bash
docker-compose up
```
