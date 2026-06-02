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
    "关联后会自动切换为 Agent 采集模式，后续新增节点也会自动补充关联",
  "agent.instance.associate.tips.unregister":
    "没有在 Console 中找到该集群的注册信息，",
  "agent.instance.associate.tips.to_register": "前往注册",
  "agent.instance.associate.drawer.title": "关联集群",
  "agent.instance.regist": "探针注册",
  "agent.instance.field.endpoint.placeholder":
    "探针地址，例如：127.0.0.1:2900",
  "agent.instance.field.endpoint.form.required": "请输入探针 API 地址！",
  "agent.instance.registration.copy": "复制",
  "agent.instance.registration.console.title": "INFINI Console 访问信息",
  "agent.instance.registration.access.endpoint": "访问地址",
  "agent.instance.registration.access.credential": "访问凭据",
  "agent.instance.registration.console.endpoint.tip":
    "复制到探针托管配置。",
  "agent.instance.registration.console.token.tip":
    "复制到探针 keystore，用于注册和同步配置。",
  "agent.instance.registration.console.token.expire.tip":
    "探针未在 {time} 前完成注册时，此凭据会过期。",
  "agent.instance.registration.console.load_failed": "获取 INFINI Console 访问信息失败。",
  "agent.instance.registration.menu.info": "INFINI Console 信息",
  "agent.instance.registration.agent.title": "探针访问信息",
  "agent.instance.registration.agent.token.required": "请输入访问凭据！",
  "agent.instance.registration.agent.endpoint.tip":
    "请输入可访问的探针地址。",
  "agent.instance.registration.agent.token.placeholder":
    "请粘贴目标主机生成的探针访问凭据",
  "agent.instance.registration.agent.token.tip":
    "请粘贴探针访问凭据。",
  "agent.instance.registration.agent.token.expire.tip":
    "凭据长期有效，轮换或替换后失效。",
  "agent.instance.registration.auth.type": "认证方式",
  "agent.instance.registration.auth.type.access_token": "访问凭据",
  "agent.instance.registration.auth.type.basic_auth": "用户名 / 密码",
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
    "默认安装目录为 /infini/agent，通常无需额外配置；如需使用内网镜像，再配置自定义下载地址即可。",
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
  "agent.logs.label.latest_lines": "行",
  "agent.logs.button.view_latest": "跟随最新",
  "agent.logs.button.goto": "确定",
  "agent.install.setup.copy.success": "已成功复制到剪贴板！",
  "agent.install.advanced.title": "高级配置",
  "agent.install.reverse_channel.label": "启用反向通道",
  "agent.install.reverse_channel.help": "默认关闭。仅在 Agent 端口不可达时开启（如容器环境）；开启后 Agent 会回连 Console。",
  "agent.install.no_sudo.label": "无 sudo 权限",
  "agent.install.no_sudo.help": "适用于容器或非 root 环境。开启后生成的命令会去掉 sudo，并自动追加 --no-service，安装完成后请将 Agent 作为容器 ENTRYPOINT/CMD 前台运行。",
  "agent.install.no_sudo.help_line": "如当前环境没有 sudo 或不支持系统服务，可追加",
  "agent.install.no_sudo.tip.title": "容器/无 sudo 模式说明",
  "agent.install.no_sudo.tip.desc": "此模式不会安装或启动系统服务。安装完成后，请把 Agent 二进制作为容器主进程运行，由 Docker 或 Kubernetes 负责拉起与重启。",
  "agent.install.no_sudo.entrypoint.title": "Dockerfile ENTRYPOINT 示例",
  "agent.install.no_sudo.cmd.title": "Dockerfile CMD 示例",
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
