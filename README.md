# 极限日志分析中心

INFINI Logging Center


## 开发说明


### Docker 开发环境准备

#### 安装 Docker

#### 设置 Docker 国内镜像

修改 Docker engine 的设置，Windows 在 Docker Desktop 的 setting 里面，Linux 在 /etc/docker/daemon.json

```
{
  "registry-mirrors": [
    "https://registry.docker-cn.com",
    "https://docker.mirrors.ustc.edu.cn/"
  ],
  "insecure-registries": [],
  "debug": true,
  "experimental": false
}
```

#### 本地构建开发镜像

```
npm run docker:build
```

#### 启动开发环境

```
cnpm run docker:dev
```

启动完成，稍等片刻，打开 http://localhost:7001/，手动刷新即可看到最新的更改。

#### 手动更新开发镜像

```
docker pull docker.infini.ltd:64443/nodejs-dev:latest
```

### 本地开发环境准备

确保已经安装好`nodejs`（版本大于等于 8.5.0）环境：
```sh
node -v
npm -v
```

在国内，你可以安装 `cnpm` 获得更快速、更安全的包管理体验。使用如下命令安装：
```sh
npm install -g cnpm --registry=https://registry.npm.taobao.org
```

### 下载项目依赖包
```
cnpm install
```

### 启动开发模式

```sh
cnpm run dev
```

后端开发：在浏览器中访问：[http://localhost:7001](http://localhost:7001) ，使用真实接口实现；

前端开发：在浏览器中访问：[http://localhost:10000](http://localhost:10000)，使用 Mock 接口数据。 


### 构建和部署

```sh
cnpm run build
```

执行该命令后会生成最终的 HTML、CSS 和 JS 到 `app/public` 目录下。它们是浏览器可以直接识别并运行的代码，这样你就可以将它们部署到你想要的服务器上了。

或者使用 Docker 来运行最终的程序。
```
cnpm run docker:prod
```
启动完成，稍等片刻，打开 http://localhost:8001/，即可看到最终的程序界面。

### 新增项目依赖包
```
cnpm install --save md5
```

### 启动 MySQL 服务器
```
npm run docker:start-mysql
```
端口 3306，默认 root 密码 admin