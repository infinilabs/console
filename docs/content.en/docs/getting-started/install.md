---
weight: 10
title: "Installation"
asciinema: true
---

# Installing the Console

INFINI Console supports mainstream operating systems and platforms, the package is small, without any additional external dependencies, it should be very fast to install :)

## Preparation before Installation

Prepare an Elasticsearch cluster that can store data. The required version is 5.3 or above, which is used for INFINI Console to store related data.

## Installation Demo

{{< asciinema key="/install"  autoplay="1" speed="2" rows="30" preload="1" >}}

## Downloading

**Automatic install**

```bash
curl -sSL http://get.infini.cloud | bash -s -- -p console
```

> The above script can automatically download the latest version of the corresponding platform's console and extract it to /opt/console

> The optional parameters for the script are as follows:

> &nbsp;&nbsp;&nbsp;&nbsp;_-v [version number]（Default to use the latest version number）_

> &nbsp;&nbsp;&nbsp;&nbsp;_-d [installation directory] (default installation to /opt/console)_

**Manual install**

Select a package for downloading in the following URL based on your operating system and platform:

[https://release.infinilabs.com/console/](https://release.infinilabs.com/console/)

## Container Deployment

INFINI Console also supports Docker container deployment.

{{< button relref="./docker" >}}Learn More{{< /button >}}

## Starting the Console

The Console can be started by directly running the program (the mac version is used here, and the program file names of different platforms are slightly different), as follows:

```
➜ ./console-mac-amd64
   ___  __   ___         ___
  / __\/ /  /___\/\ /\  /   \
 / /  / /  //  // / \ \/ /\ /
/ /__/ /__/ \_//\ \_/ / /_//
\____|____|___/  \___/___,'
   ___  ___    __  __    ___  __   __
  / __\/___\/\ \ \/ _\  /___\/ /  /__\
 / /  //  //  \/ /\ \  //  // /  /_\
/ /__/ \_// /\  / _\ \/ \_// /__//__
\____|___/\_\ \/  \__/\___/\____|__/
[CONSOLE] INFINI Cloud Console, The easiest way to operate your own elasticsearch platform.
[CONSOLE] 0.3.0_SNAPSHOT, 2022-03-31 10:26:41, 2023-12-31 10:10:10, fa04f6010144b7c5267c71ccaee30230ddf2432d
[03-31 20:27:40] [INF] [app.go:174] initializing console.
[03-31 20:27:40] [INF] [app.go:175] using config: /console-0.3.0_SNAPSHOT-447-mac-amd64/console.yml.
[03-31 20:27:40] [INF] [instance.go:72] workspace: /console-0.3.0_SNAPSHOT-447-mac-amd64/data/console/nodes/c92psf1pdamk8rdhgqpg
[03-31 20:27:40] [INF] [app.go:283] console is up and running now.
[03-31 20:27:40] [INF] [elastic.go:136] loading [5] remote elasticsearch configs
[03-31 20:27:40] [INF] [ui.go:197] ui listen at: http://0.0.0.0:9000
[03-31 20:27:40] [INF] [module.go:116] all modules are started
```

Seeing the above startup information, it means that the Console has successfully run and listen on port 9000.

## Shutting Down the Console

To shut down INFINI Console, hold down `Ctrl+C`. The following information will be displayed:

```
^C
[CONSOLE] got signal: interrupt, start shutting down
[03-31 20:33:10] [INF] [module.go:145] all modules are stopped
[03-31 20:33:10] [INF] [app.go:267] console now terminated.
[CONSOLE] 0.3.0_SNAPSHOT, uptime: 5m30.307832s

   __ _  __ ____ __ _  __ __
  / // |/ // __// // |/ // /
 / // || // _/ / // || // /
/_//_/|_//_/  /_//_/|_//_/

©INFINI.LTD, All Rights Reserved.
```

## System Service

To run the Console as a background task, run the following commands:

```
➜ ./console -service install
Success
➜ ./console -service start
Success
```

Unloading the service is simple. To unload the service, run the following commands:

```
➜ ./console -service stop
Success
➜ ./console -service uninstall
Success
```
