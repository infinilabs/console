#INFINI Console

INFINI Console for Elasticsearch/OpenSearch/Easysearch

## 前端开发说明

前端采用 React 开发，最终输出为 `.public` 目录的纯静态资源，可以独立部署无需依赖 Node 环境。

### 本地开发环境准备

确保已经安装好`nodejs`（版本大于等于 8.5.0）环境：
```sh
node -v
npm -v
```

在国内，你可以安装 `cnpm` 获得更快速、更安全的包管理体验。使用如下命令安装：
```sh
npm install -g cnpm@9.2.0 --registry=https://registry.npm.taobao.org
```

### 下载项目依赖包
```
cnpm install
cnpm install -g  cross-env
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


### 新增项目依赖包
```
cnpm install --save md5
```

### 前端开发常用链接

- 当前所用组件：https://3x.ant.design/components/button-cn/
- ProComponents: https://procomponents.ant.design/
- 图表组件：https://charts.ant.design/guide
- Ant Design Pro 预览: https://preview.pro.ant.design
