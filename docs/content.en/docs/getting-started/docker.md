---
weight: 35
title: Docker
asciinema: true
---

# Container Deployment

INFINI Console supports container deployment.

## Downloading an Image

The images of INFINI Console are published at the official repository of Docker. The URL is as follows:

[https://hub.docker.com/r/infinilabs/console](https://hub.docker.com/r/infinilabs/console)

Use the following command to obtain the latest container image:

```bash
mkdir -p ~/infinilabs && cd ~/infinilabs
docker pull infinilabs/console:{{< globaldata "console" "version" >}}
```

## Verifying the Image

After downloading the image locally, you will notice that the container image of INFINI Console is very small, with a size less than 30 MB. So, the downloading is very fast.

```bash
✗ docker images |grep "console" |grep "{{< globaldata "console" "version" >}}"
REPOSITORY                                      TAG       IMAGE ID       CREATED          SIZE
infinilabs/console                            {{< globaldata "console" "version" >}}    8c27cd334e4c   47 minutes ago   26.4MB
```

## Initialize Config Directory from Image

```bash
docker run --rm -v $PWD/console:/work infinilabs/console:1.29.4-2108 cp -rf /config /work
```

## Starting the Console

Use the following command to start the INFINI Console container:

```bash
docker run -p 9000:9000 \
    -v $PWD/console/config:/config \
    -v $PWD/console/data:/data \
    -v $PWD/console/logs:/log \
    --name infini-console \
    infinilabs/console:{{< globaldata "console" "version" >}}
```

## Docker Compose

You can also use docker compose to manage container instances. Create one `docker-compose.yml` file as follows:

```bash
cat <<EOF > docker-compose.yml
services:
  infini-console:
    image: infinilabs/console:{{< globaldata "console" "version" >}}
    ports:
      - 9000:9000
    volumes:
      - ./console/config:/config
      - ./console/data:/data
      - ./console/logs:/log
    container_name: "infini-console"
    restart: unless-stopped
 EOF
```

In the directory where the configuration file resides, run the following command to start INFINI Console.

```bash
➜  docker-compose up
```
