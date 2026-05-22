export default {
  "agent.instance.table.operation.detail": "详情",
  "agent.instance.table.operation.associate": "关联",
  "agent.instance.associate.labels.cluster_name": "集群",
  "agent.instance.associate.labels.cluster_version": "版本",
  "agent.instance.associate.labels.select_cluster": "关联到集群",
  "agent.instance.associate.tips.associate": "请选择要关联的集群！",
  "agent.instance.associate.set_credential": "为探针设置凭据",
  "agent.instance.associate.set_credential.tips": "此凭据将用于指标和日志收集，建议使用权限范围合理的用户。",
  "agent.instance.associate.set_logs_paths": "为探针设置日志采集路径",
  "agent.instance.associate.set_logs_paths.tips":
    "这些日志目录会用于本次批量关联，并保存为后续自动补关联节点的默认日志采集路径。",
  "agent.instance.associate.tips.connected": "连接成功！",
  "agent.instance.associate.tips.connected.check": "请设置凭据",
  "agent.instance.associate.tips.no_match":
    "未能匹配并关联到节点，请检查探针凭据、节点 HTTP 端口和集群连通性后重试。",
  "agent.instance.associate.auth.error": "以下集群需要先设置平台凭据或 Agent 凭据：",
  "agent.instance.associate.tips.metric":
    "关联后会自动切换为 Agent 采集模式并初始化 infini-agent 凭据，后续新增节点也会自动补充关联",
  "agent.instance.associate.tips.unregister":
    "没有在 Console 中找到该集群的注册信息，",
  "agent.instance.associate.tips.to_register": "前往注册",
  "agent.instance.associate.drawer.title": "关联集群",
  "agent.instance.regist": "探针注册",
  "agent.instance.field.endpoint.placeholder":
    "Agent API 地址，例如：127.0.0.1:2900",
  "agent.instance.field.endpoint.form.required": "请输入 Agent API 地址！",
  "agent.instance.registration.copy": "复制",
  "agent.instance.registration.console.title": "Console 访问信息",
  "agent.instance.registration.access.endpoint": "访问地址",
  "agent.instance.registration.access.credential": "访问凭据",
  "agent.instance.registration.console.endpoint.tip":
    "请复制这个访问地址到 Agent 的托管配置中。",
  "agent.instance.registration.console.token.tip":
    "请复制这个访问凭据到 Agent keystore，用于 Agent 向 Console 注册和同步配置。",
  "agent.instance.registration.console.token.expire.tip":
    "如果 Agent 在 {time} 前未完成注册，这个访问凭据会过期。",
  "agent.instance.registration.agent.title": "Agent 访问信息",
  "agent.instance.registration.agent.token.required": "请输入访问凭据！",
  "agent.instance.registration.agent.endpoint.tip":
    "请输入 Console 可以访问到的 Agent 访问地址。",
  "agent.instance.registration.agent.token.placeholder":
    "请粘贴目标主机上生成的访问凭据",
  "agent.instance.registration.agent.token.tip":
    "把 Agent 访问凭据粘贴到这里，Console 后续会用它来发起反向通道请求。",
  "agent.instance.registration.agent.token.expire.tip":
    "这个访问凭据没有固定有效期，只有在轮换或替换后才会失效。",
  "agent.instance.step.result.button.register_new": "继续注册新探针",
  "agent.instance.step.result.button.view_list": "查看探针列表",
  "agent.instance.column.agent_ip": "探针 IP",
  "agent.instance.row_detail.tab.detected_processes": "已识别进程（{count}）",
  "agent.instance.row_detail.tab.unknown_processes": "未知进程（{count}）",
  "agent.instance.process.detail.title": "进程详情",
  "agent.instance.associate.labels.node_adress": "节点地址",
  "agent.instance.associate.labels.logs_paths": "日志目录",
  "agent.instance.associate.labels.logs_paths.placeholder":
    "请输入一个或多个日志目录",
  "agent.instance.associate.labels.logs_paths.tips":
    "默认已带出节点的 path.logs，可继续追加其他目录；这些目录会通过同一个 logs_path 下发给 Agent 采集。",
  "agent.instance.associate.tips.access_failed":
    "探针未能成功访问该节点，请修改设置后再试！",
  "agent.instance.associate.credential_status.set": "已设置",
  "agent.instance.associate.credential_status.unset": "未设置",
  "agent.install.label.get_cmd": "获取安装命令",
  "agent.install.setup.title": "快速安装",
  "agent.install.setup.desc":
    "请复制下方命令并在目标主机上执行，其包含 INFINI Agent 的下载、部署及启动",
  "agent.install.tips.intranet.title": "内网部署说明",
  "agent.install.tips.intranet.desc":
    "默认安装目录为 /infini/agent。若 web.ui.path/agent/stable 下已有安装包，Console 会自动使用自己的 Web 地址下发下载链接；否则回退到官方 release 站点。只有在需要自定义内网镜像时，才需要配置 agent.setup.download_url。",
  "agent.install.tips.title": "提示",
  "agent.install.tips.target": "默认安装目录为",
  "agent.install.tips.version": "如需指定 Agent 版本，可追加",
  "agent.install.tips.download":
    "如需使用内网或自定义下载源，可追加",
  "agent.install.tips.server":
    "如目标主机无法直接访问当前 Console 地址，可追加",
  "agent.install.tips.desc":
    "当前版本自动安装仅支持 Linux ，非 Linux 系统请选择",
  "agent.install.link.manual_install": "手动安装",
  "agent.install.title": "安装探针",
  "agent.install.logs.tips": "日志查看功能需先安装探针(INFINI Agent)",
  "agent.logs.label.log_file": "日志文件",
  "agent.logs.label.goto": "跳转至行",
  "agent.logs.button.view_latest": "查看最新",
  "agent.logs.button.goto": "确定",
  "agent.install.setup.copy.success": "已成功复制到剪贴板！",
  "agent.instance.auto_associate.title": "自动关联集群",
  "agent.instance.install.title": "安装 Agent",

  "agent.label.agent_credential": "探针凭据",
  "agent.credential.tip": "不需要凭据",
  "agent.instance.button.revoke": "撤销",
  "agent.instance.delete.confirm.title": "确定要删除这个探针吗？",
  "agent.instance.revoke.confirm.title": "确定要撤销吗？",
  "agent.instance.clear.title": "清理离线实例",
  "agent.instance.clear.modal.title": "您确定要清理离线实例？",
  "agent.instance.clear.modal.desc": "该操作将会删除离线并且 7 天没有上报指标的实例"
};
