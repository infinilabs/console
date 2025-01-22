---
weight: 60
title: 为 Console 集成 Github 单点登录
asciinema: true
---

# 为 Console 集成 Github 单点登录

## 简介

使用用户名和密码来登录 Console 后台有时候确实很麻烦，密码修改几次自己都忘求了。如果能够通过单点登录那多方便，今天给大家介绍一下具体怎么操作。

## 准备

首先在 Github 里面的个人设置里面或者组织设置里面，找到开发者设置，如下图：

{{% load-img "/img/screenshot/2023/github-dev-settings.jpg" "github developer settings" %}}

选择 `OAuth Apps`，点击 `New OAuth App` 按钮，申请一个 OAuth 应用的账号，如下图：

{{% load-img "/img/screenshot/2023/github-new-oauth-app.jpg" "github new oauth app" %}}

注意，上面标红的地址换成你部署的 Console 正常访问的地址，Github
登录之后会通过这个地址进行信息的回调，`/sso/callback` 是 Console 固定的用于单点登录的路径，不要修改。

如果不出任何意外的话，应该可以跳转到创建成功的页面，在这里可以看到这个 OAuth
应用的 `Client ID`，另外，我们点击 `Generate a new client secret`
来创建一个 `Client secrets`，并复制保存，待会配置的时候会用到。

{{% load-img "/img/screenshot/2023/github-oauth-token.jpg" "github new oauth app" %}}

## 创建角色

不同的用户登录之后可能需要分配不同的角色，比如我们为登录成功的用户默认分配只读角色，包括平台功能角色和集群权限，如下图：

{{% load-img "/img/screenshot/2023/console-setup-default-roles.jpg" "setup default roles in console" %}}

设置角色 `ReadonlyUI` 如下：

{{% load-img "/img/screenshot/2023/console-setup-platform-roles.jpg" "setup platform roles in console" %}}

设置角色 `AllClusters` 如下：

{{% load-img "/img/screenshot/2023/console-setup-data-roles.jpg" "setup data roles in console" %}}

## 修改配置

进入 Console 配置所在的目录，新增一个配置文件 `oauth.yml`，添加如下配置信息：

```yaml
security:
  oauth:
    enabled: true
    client_id: "替换为你的 client_id"
    client_secret: "替换为你的 client_secret"
    default_roles: ["ReadonlyUI", "AllClusters"] #default for all sso users if no specify roles was defined
    role_mapping:
      Github用户名: ["Administrator"]
    authorize_url: "https://github.com/login/oauth/authorize"
    token_url: "https://github.com/login/oauth/access_token"
    redirect_url: ""
    scopes: []
```

替换上面的配置为实际的秘钥信息，在 `role_mapping` 下面可以为指定的用户设置不同的角色。

### 重启生效

保存配置，重启 Console 即可生效，打开登录界面，点击下方的 Github 登录按钮即可。

{{% load-img "/img/screenshot/2023/github-sso-login-success.jpg" "github-sso-login-success" %}}

## 小结

通过集成单点登录，使用 Console 更加简单了。目前 Console 只支持 Github 的集成，更多服务提供方会晚点放出。
