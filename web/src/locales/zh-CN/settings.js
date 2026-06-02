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
  "settings.email.server.form.sender": "发件人",
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
  "settings.email.server.message.test.error.auth_required": "SMTP 认证信息不能为空，请检查用户名和密码配置。",
  "settings.email.server.message.test.error.smtp_auth_failed":
    "SMTP 认证失败，请检查用户名、密码或邮箱服务商要求的授权码。",
  "settings.email.server.message.test.error.sender_mismatch":
    "SMTP 认证失败，部分邮箱服务商要求发件人地址与认证账号一致，或必须是该账号已授权的别名。",
  "settings.email.server.message.test.error.tls_required":
    "SMTP 服务器要求先启用 TLS/STARTTLS，请检查 TLS 配置和端口是否正确。",
  "settings.email.server.message.test.error.send_failed":
    "测试邮件发送失败，请检查发件人、收件人、SMTP 配置以及邮箱服务商限制。",
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
  "settings.system.rollup.title": "数据汇聚",
  "settings.system.rollup.description":
    "可在系统设置中启用或停止系统集群的数据汇聚任务。",
  "settings.system.rollup.enabled": "开启",
  "settings.system.rollup.disabled": "关闭",
  "settings.system.rollup.help":
    "关闭数据汇聚会逐个停止现有的数据汇聚任务，并同步关闭集群设置中的 rollup search。",
  "settings.system.rollup.update.success": "数据汇聚设置已更新",
  "settings.system.advanced.title": "高级设置",
  "settings.system.local_templates.title": "本地模板更新",
  "settings.system.local_templates.description":
    "刷新系统集群中的内置本地配置模板，用于在二进制升级后同步 Agent 与 Gateway 的托管模板内容。",
  "settings.system.local_templates.refresh": "更新模板",
  "settings.system.local_templates.help":
    "会覆盖系统集群中的 system_ingest_config.yml、task_config.tpl、relay.yml 和 migration.yml，并触发实例重新同步。",
  "settings.system.local_templates.update.success": "本地模板已更新",
};
