# 极限搜索中心

INFINI Search Center


## 前端开发说明

前端采用 React 开发，最终输出为 `.public` 目录的纯静态资源，可以独立部署无需依赖 Node 环境。

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

#### 启动开发环境

```
cnpm run docker:dev
```

启动完成，稍等片刻，打开 http://localhost:8000/，手动刷新即可看到最新的更改。

#### 手动更新开发镜像

```
docker login -u infini -p ltd docker.infini.ltd:64443
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


### 编译静态资源

```sh
cnpm run build
```

执行该命令后会生成最终的 HTML、CSS 和 JS 到 `/.public` 目录下。它们是浏览器可以直接识别并运行的代码，这样你就可以将它们部署到你想要的服务器上了。

或者使用 Docker 来打包生成。
```
cnpm run docker:build
```

### 新增项目依赖包
```
cnpm install --save md5
```

### 前端开发常用链接

- 当前所用组件：https://3x.ant.design/components/button-cn/
- ProComponents: https://procomponents.ant.design/
- 图表组件：https://charts.ant.design/guide
- Ant Design Pro 预览: https://preview.pro.ant.design


## 后端开发说明

后端采用 Golang 开发，最终输出为 `bin` 目录的可执行文件 `search-center` 和配置文件 `search-center.yml`。

### Docker 开发环境

```
cd docker
docker-compose -f docker-compose.dev.yml  up
```

Docker 实例每次启动都会重新编译打包，并启动监听端口 `9000`，使用浏览器打开 `localhost:9000` 即可看到最终效果。

## 启动 MySQL 服务器

```
npm run docker:start-mysql
```
端口 3306，默认 root 密码 admin