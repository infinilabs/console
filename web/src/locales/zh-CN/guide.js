export default {
  "guide.header.title": "配置向导",
  "guide.initialization.step.configuration": "配置",
  "guide.initialization.step.configuration.desc":
    "连接系统集群（Elasticsearch 要求 5.3 或更高版本）。",
  "guide.initialization.step.initialization": "初始化",
  "guide.initialization.step.initialization.desc":
    "初始化系统索引和模板的基本设置。",
  "guide.initialization.start": "开始初始化",
  "guide.initialization.defaults.message":
    "已检测到 {dataNodes} 个可用数据节点（总节点数 {totalNodes}），主分片默认按节点数推荐为 {primaryShards}。",
  "guide.initialization.primary_shards": "主分片数",
  "guide.initialization.primary_shards.help":
    "默认按可用数据节点数计算，通常保持与承载数据的节点数一致即可。",
  "guide.initialization.primary_shards.invalid": "请输入大于 0 的主分片数。",
  "guide.initialization.auto_expand_replicas": "自动副本",
  "guide.initialization.auto_expand_replicas.help":
    "默认使用 0-1，可填写 false、all 或形如 0-1 的范围值。",
  "guide.initialization.auto_expand_replicas.invalid":
    "自动副本格式无效，请输入 false、all 或形如 0-1 的范围值。",
  "guide.initialization.rollup": "初始化 Rollup 模板",
  "guide.initialization.rollup.help":
    "仅 Easysearch 1.12.1 及以上版本支持。关闭后将跳过 Rollup 模板和作业初始化。",
  "guide.initialization.task.template_ilm": "初始化模板和 ILM",
  "guide.initialization.task.rollup": "初始化 Rollup 模板",
  "guide.initialization.task.insight": "初始化仪表盘和可视化模板",
  "guide.initialization.task.alerting": "初始化内置告警规则和通道",
  "guide.initialization.task.agent": "初始化 Agent 安装模板",
  "guide.initialization.task.view": "初始化数据视图模板",
  "guide.initialization.task.start": "开始执行：{task}",
  "guide.initialization.task.success": "执行成功：{task}",
  "guide.initialization.task.failed": "执行失败：{task} {reason}",
  "guide.initialization.step.settings": "设置",
  "guide.initialization.step.settings.desc":
    "设置登录的默认用户以及凭据密钥。",
  "guide.initialization.step.finish": "完成",
  "guide.initialization.step.finish.desc": `配置完成，开启 ${APP_DOMAIN} Console 之旅。`,
  "guide.cluster.host": "集群地址",
  "guide.cluster.host.required": "请输入集群地址！",
  "guide.cluster.host.validate": "请输入IP地址和端口号！",
  "guide.cluster.auth": "身份验证",
  "guide.cluster.test.connection": "连接测试",
  "guide.cluster.test.connection.error.version":
    "Elasticsearch 要求 5.3 或更高版本。",
  "guide.cluster.test.connection.failed": "连接集群失败。",
  "guide.cluster.validate.elasticsearch_version_too_old":
    "Elasticsearch 版本太旧。",
  "guide.cluster.validate.elasticsearch_indices_exists":
    "目标群集中已存在一些相关索引。",
  "guide.cluster.validate.elasticsearch_template_exists":
    "目标群集中已存在一些相关模板。",
  "guide.cluster.validate.default": "目标群集中已存在一些相关数据。",
  "guide.cluster.validate.sub":
    "在其他终端工具中执行以下请求可以删除现有数据，但可能会丢失数据。",
  "guide.cluster.validate.sub.strong": "[风险自负！]",
  "guide.cluster.skip": "跳过",
  "guide.cluster.skip.desc": "您也可以跳过此步骤并重用现有数据。",
  "guide.user.title": "初始化管理员账户",
  "guide.step.next": "下一步",
  "guide.step.prev": "上一步",
  "guide.step.refresh": "刷新",
  "guide.shell.copy": "已成功复制到剪贴板！",
  "guide.username": "用户名",
  "guide.username.required": "请输入用户名！",
  "guide.password": "密码",
  "guide.password.required": "请输入您的密码！",
  "guide.confirm.password": "确认密码",
  "guide.confirm.password.required": "请确认您的密码！",
  "guide.confirm.password.validate": "您输入的两次密码不一致！",
  "guide.password.strength.invalid": "密码未满足所有安全要求。",
  "guide.password.rules.title": "密码必须符合以下规则",
  "guide.password.rule.length": "长度至少为 10 个字符",
  "guide.password.rule.uppercase": "至少一个大写字母 (A-Z)",
  "guide.password.rule.lowercase": "至少一个小写字母 (a-z)",
  "guide.password.rule.digit": "至少一个数字 (0-9)",
  "guide.password.rule.special": "至少一个特殊字符（!@#%^&*_+-=?）",
  "guide.credential_secret": "凭据密钥",
  "guide.credential_secret.required": "请输入凭据密钥！",
  "guide.credential_secret.tips":
    "凭据密钥用来加解密凭据信息，如果密钥丢失，加密凭据信息将无法解密，需妥善保管！",
  "guide.credential_secret.generate": "生成密钥",

  "guide.configuration.title": "配置",
  "guide.configuration.cluster": "集群",
  "guide.configuration.cluster_username": "集群用户名",
  "guide.configuration.cluster_password": "集群密码",
  "guide.configuration.console_username": "Console用户名",
  "guide.configuration.console_password": "Console密码",
  "guide.configuration.credential_secret": "凭据密钥",
  "guide.configuration.tips": "请下载您的配置并妥善保管。",

  "guide.completed": "初始化完成！",
  "guide.enter.console": `进入 ${APP_DOMAIN} Console`,

  "health.modal.title": "服务受限",
  "health.modal.desc":
    "请点击上方的服务受限，以确保系统集群正常运行。",
  "health.modal.services.title": "服务状态",

  "guide.startup.modal.title": `欢迎使用 ${APP_DOMAIN} Console`,
  "guide.startup.modal.subtitle": "一站式的数据搜索分析与管理平台",
  "guide.startup.modal.desc":
    "通过对流行的搜索引擎基础设施进行跨版本、多集群的集中纳管，企业可以快速方便的统一管理企业内部的不同版本的多套搜索集群",
  "guide.startup.modal.goto_register": "前往注册，轻松纳管集群",
  "guide.settings.reset_user.desc": "重置管理员账户",
  "guide.settings.verify_secret.empty_tip": "密钥不能为空!",
  "guide.settings.verify_secret.confirm.title": "您输入的密钥与已有数据不匹配",
  "guide.settings.verify_secret.confirm.desc": "已有凭据将会因为无法解密而失效，您必须在登录系统之后手动更新先前的凭据，以免影响系统的正常使用！",
  "guide.settings.verify_secret.notification.desc": "因为您使用了新的凭据密钥，历史凭据数据不再有效，建议您立即手动更新凭据信息，立即前往",
};
