---
weight: 10
title: 下载安装
asciinema: true
---

# 安装 INFINI Console

INFINI Console 支持主流的操作系统和平台，程序包很小，没有任何额外的外部依赖，安装起来应该是很快的 :)

## 安装前准备

准备一个可以存储数据的 Elasticsearch 集群，要求为 5.3 及以上版本，用于 INFINI Console 存储相关数据。

> 推荐使用 INFINI Easysearch 来作存储，可通过配置开启 ZSTD 来节约存储空间。安装操作如如下

{{< asciinema key="./console_with_easysearch"  autoplay="1" speed="2" rows="30" preload="1" >}}

<details>
  <summary>查看完整操作代码</summary>
  <div class="highlight">
  <pre style=color:#f8f8f2;background-color:#272822;-moz-tab-size:4;-o-tab-size:4;tab-size:4><code class=language-bash data-lang=bash><span style=color:#75715e># 使用 root 用户操作</span>
whoami <span style=color:#f92672>&amp;&amp;</span> cat /etc/redhat-release <span style=color:#f92672>&amp;&amp;</span> uptime
<span style=color:#75715e># 安装 jdk</span>
yum -y install java-11
<span style=color:#75715e># 创建 infini 用户</span>
groupadd -g <span style=color:#ae81ff>602</span> infini
useradd -u <span style=color:#ae81ff>602</span> -g infini -m -d /home/infini -c <span style=color:#e6db74>&#39;infini&#39;</span> -s /bin/bash infini
<span style=color:#75715e># 安装 Easysearch &amp; Console</span>
curl -sSL http://get.infini.cloud | bash -s -- -p easysearch
curl -sSL http://get.infini.cloud | bash -s -- -p console
<span style=color:#75715e># 配置 Easysearch jdk</span>
ln -s /usr/lib/jvm/java-11-openjdk-11.0.19.0.7-1.el7_9.x86_64 /opt/easysearch/jdk
sed -i <span style=color:#e6db74>&#39;s/1g/512m/g&#39;</span> /opt/easysearch/config/jvm.options
<span style=color:#75715e># 初始化 </span>
cd /opt/easysearch <span style=color:#f92672>&amp;&amp;</span> bin/initialize.sh 
<span style=color:#75715e># 调整目录权限</span>
chown -R infini.infini /opt/easysearch
<span style=color:#75715e># 运行 Easysearch</span>
su infini -c <span style=color:#e6db74>&#34;/opt/easysearch/bin/easysearch -d&#34;</span>
<span style=color:#75715e># 运行 Console</span>
cd /opt/console <span style=color:#f92672>&amp;&amp;</span> ./console-linux-amd64 -service install <span style=color:#f92672>&amp;&amp;</span> ./console-linux-amd64 -service start
<span style=color:#75715e># 检查 Easysearch</span>
curl -ku admin:44e4e00cded8d82c16cf https://localhost:9200
#在 INFINI Console 中可以使用以上凭证来进行连接
</code></pre></div>
</details>

## 在线安装

**自动安装**

```bash
curl -sSL http://get.infini.cloud | bash -s -- -p console
```

> 通过以上脚本可自动下载相应平台的 console 最新版本并解压到 /opt/console
>
> 脚本的可选参数如下：
>
> - _-v [版本号]（默认采用最新版本号）_
> - _-d [安装目录]（默认安装到 /opt/console）_

**手动安装**

根据您所在的操作系统和平台选择相应的下载包，下载地址如下：

<https://release.infinilabs.com/console/>

## 容器部署

INFINI Console 也支持 Docker 容器方式部署。

{{< button relref="./docker" >}}了解更多{{< /button >}}

## 启动 INFINI Console

下载完成，直接运行程序即可启动 INFINI Console 了（这里使用的是 mac 版本的，不同平台的程序文件名称略有不同），如下：

```text
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

[CONSOLE] INFINI Cloud Console, The easiest way to operate your own search platform.
[CONSOLE] 0.3.0_SNAPSHOT, 2022-03-31 10:26:41, 2023-12-31 10:10:10, fa04f6010144b7c5267c71ccaee30230ddf2432d
[03-31 20:27:40] [INF] [app.go:174] initializing console.
[03-31 20:27:40] [INF] [app.go:175] using config: /console-0.3.0_SNAPSHOT-447-mac-amd64/console.yml.
[03-31 20:27:40] [INF] [instance.go:72] workspace: /console-0.3.0_SNAPSHOT-447-mac-amd64/data/console/nodes/c92psf1pdamk8rdhgqpg
[03-31 20:27:40] [INF] [app.go:283] console is up and running now.
[03-31 20:27:40] [INF] [ui.go:197] ui listen at: http://0.0.0.0:9000
[03-31 20:27:40] [INF] [module.go:116] all modules are started
```

看到上面的启动信息，说明 INFINI Console 已经成功运行了，并且监听了 9000 端口。

## 停止 INFINI Console

如果需要停止 INFINI Console，按 `Ctrl+C` 即可停止 INFINI Console 平台，如下：

```text
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

## 配置服务后台运行

如果希望将 INFINI Console 以后台服务任务的方式运行，如下：

```text
➜ ./console -service install
Success
➜ ./console -service start
Success
```

卸载服务也很简单，如下：

```text
➜ ./console -service stop
Success
➜ ./console -service uninstall
Success
```

## 初始化

使用浏览器打开 http://localhost:9000 访问，可以看到如下界面，可以进行初始化配置。

{{% load-img "/img/screenshot/initialization/configuration.png" %}}

{{< button relref="../reference/setup" >}}继续查看{{< /button >}}
