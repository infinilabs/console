export default {
  "settings.email.server.empty.label1": "您可以在此添加邮件服务器",
  "settings.email.server.empty.label2":
    "告警中心可通过指定的邮件服务器向收件人发送通知。",
  "settings.email.server.empty.button.new": "添加邮件服务器",
  "settings.email.server.form.name": "名称",
  "settings.email.server.form.host": "主机",
  "settings.email.server.form.port": "端口",
  "settings.email.server.form.tls_min_version": "TLS 最低版本",
  "settings.email.server.form.tls": "TLS",
  "settings.email.server.form.enabled": "启用",
  "settings.email.server.form.recipient": "收件人",
  "settings.email.server.form.recipient.placeholder": "请输入收件人",
  "settings.email.server.form.test.button": "发送测试邮件",
  "settings.email.server.form.validation.name": "请输入名称！",
  "settings.email.server.form.validation.host": "请输入 SMTP 服务器主机！",
  "settings.email.server.form.validation.port": "请输入 SMTP 服务器端口！",
  "settings.email.server.form.validation.recipient": "收件人邮箱格式不正确",
  "settings.email.server.form.temp_name": "新建配置名称",
  "settings.email.server.message.test.success": "发送成功",
  "settings.system.tab.general": "通用设置",
  "settings.system.tab.email": "邮件服务器",
  "settings.system.retention.title": "数据保留天数",
  "settings.system.retention.description":
    "设置系统托管数据在被 ILM 删除前保留多少天。",
  "settings.system.retention.help":
    "默认保留 30 天，默认滚动存储大小为 50 GB。保存后会更新系统托管索引对应的 ILM 保留策略。",
  "settings.system.retention.unit": "天",
  "settings.system.retention.size.label": "滚动存储大小",
  "settings.system.retention.size.unit": "GB",
  "settings.system.retention.save": "保存",
  "settings.system.retention.update.success": "数据保留天数已更新",
  "settings.system.retention.validation.days": "请输入有效的保留天数",
  "settings.system.retention.validation.max_size":
    "请输入有效的滚动存储大小，单位为 GB，例如 50",
  "settings.system.rollup.title": "Rollup",
  "settings.system.rollup.description":
    "可在系统设置中启用或停止系统集群的 Rollup 任务。",
  "settings.system.rollup.enabled": "开启",
  "settings.system.rollup.disabled": "关闭",
  "settings.system.rollup.help":
    "关闭 Rollup 会停止 rollup job，并同步关闭集群设置中的 rollup search。",
  "settings.system.rollup.update.success": "Rollup 设置已更新",
};
