# logging-center

INFINI Logging Center

确保已经安装好`nodejs`（版本大于等于 8.5.0）环境：
```sh
node -v
npm -v
```

在国内，你可以安装 `cnpm` 获得更快速、更安全的包管理体验。使用如下命令安装：
```sh
npm install -g cnpm --registry=https://registry.npm.taobao.org
```

## 新增依赖包到本地
```
cnpm install --save md5
```

## 下载依赖包
```
cnpm install
```

## 启动开发模式

```sh
cnpm run dev
```

在浏览器中访问：[http://localhost:8000](http://localhost:8000) 


## 构建和部署

```sh
cnpm run build
```

执行该命令后会生成最终的 HTML、CSS 和 JS 到 `dist` 目录下。它们是浏览器可以直接识别并运行的代码，这样你就可以将它们部署到你想要的服务器上了。
