---
weight: 37
title: 使用 Docker Compose 部署 Console 和 Easysearch
asciinema: true
---

# 使用 Docker Compose 部署 Console 和 Easysearch

下面介绍 INFINI Console 和 INFINI Easysearch 进行容器部署及容器内开启 Agent 指标采集模式。

## 前提

- 确保 Docker 已安装并运行正常。
- 确保 Docker Compose 已安装。

## 创建 Docker Compose 文件

创建一个名为 `docker-compose.yml` 的文件

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

## 创建 `.env` 文件

> 注意：请确保对初始密码进行修改，以确保安全性。

```bash
cat << EOF > .env
EASYSEARCH_INITIAL_ADMIN_PASSWORD=ezs_infini_console
METRICS_WITH_AGENT=true
METRICS_CONFIG_SERVER=http://console:9000
EOF
```

## 从镜像初始化 config 目录

```bash
cd ~/infinilabs
docker run --rm -v $PWD/console:/work infinilabs/console:{{< globaldata "console" "version" >}} cp -rf /config /work
docker run --rm --entrypoint "" -v $PWD/easysearch:/work infinilabs/easysearch:{{< globaldata "easysearch" "version" >}} cp -rf /app/easysearch/config /work
```

## 启动服务

```bash
docker-compose up -d
```

## 验证部署

在部署完成后，访问 [Console](http://localhost:9000/) 初始化，并调整集群配置以启用 Agent 指标采集模式。同时将 Agent 关联到集群节点。
操作完成后，可以在监控页面查看 Agent 采集状态及各指标数据延迟、日志信息及分片监控等。
{{% load-img "/img/screenshot/v1.29/monitor/agent-index.png" "" %}}
{{% load-img "/img/screenshot/v1.29/monitor/agent-shard.png" "" %}}

## 删除 Console 和 Easysearch

使用以下命令删除 Console 和 Easysearch

```bash
docker-compose down
rm -rf ~/infinilabs/console ~/infinilabs/easysearch
```