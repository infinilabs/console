---
weight: 36
title: Token 管理
---

# Token 管理

## 简介

这里创建的 Token 是 **管理型 API Token**，用于访问受保护的 INFINI Console HTTP API，适合脚本、自动化任务或外部系统集成场景。

创建成功后，系统只会展示一次完整 Token，请立即复制并妥善保存。

> 这类 Token 与用户登录后产生的会话 Token 不同。会话 Token 主要用于 Console Web 登录态；这里创建的 Token 主要用于第三方系统或自动化程序长期调用 API。

## 使用方式

调用 Console API 时，在请求头中带上 `X-API-TOKEN`：

```bash
X-API-TOKEN: <YOUR_TOKEN>
```

示例：

```bash
curl -X GET "http://localhost:9000/account/profile" \
  -H "X-API-TOKEN: <YOUR_TOKEN>"
```

如果请求成功，将返回当前 Token 对应用户的账户信息。

## 使用场景

- 通过脚本调用 Console 的受保护接口
- 在 CI/CD 或运维任务中访问 Console API
- 供外部系统以 HTTP 方式集成 Console 能力

## 权限说明

Token 绑定到创建它的用户身份，使用时继承该用户的访问权限。也就是说，Token 能访问哪些接口，取决于该用户本身拥有哪些平台权限和数据权限。

## 有效期和失效规则

- 创建时可以自定义有效期
- 可以设置为指定到期时间，或设置为 **永不过期**
- 如果创建请求里未显式指定有效期，默认有效期为 **1 年**
- 删除对应 Token 后，将无法继续使用

## 注意事项

- Token 只在创建成功时完整展示一次，关闭弹窗后无法再次查看原文
- 不要将 Token 提交到代码仓库、日志、截图或聊天记录中
- 建议仅在必要的自动化场景中使用，并按需定期轮换
