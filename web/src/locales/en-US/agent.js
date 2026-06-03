export default {
  "agent.instance.table.operation.detail": "Detail",
  "agent.instance.table.operation.associate": "Enroll",
  "agent.instance.associate.labels.cluster_name": "Cluster Name",
  "agent.instance.associate.labels.cluster_version": "Cluster Version",
  "agent.instance.associate.labels.select_cluster": "Select Cluster",
  "agent.instance.associate.tips.associate":
    "Please select cluster(s) to enroll !",
  "agent.instance.associate.set_credential": "Set probe credential",
  "agent.instance.associate.set_credential.tips":
    "This credential will be used for metrics and log collection. It is recommended to use a user with a reasonable permission scope.",
  "agent.instance.associate.set_logs_paths": "Set probe log collection paths",
  "agent.instance.associate.set_logs_paths.tips":
    "These log directories are used for the current batch enroll and saved as the default log collection paths for future auto-enrolled nodes.",
  "agent.instance.associate.tips.connected": "Connection succeeded!",
  "agent.instance.associate.tips.connected.check": "please set a credential for agent",
  "agent.instance.associate.tips.no_match":
    "No node was matched and enrolled. Check the probe credential, node HTTP port, and cluster connectivity, then try again.",
  "agent.instance.associate.auth.error": "The following clusters need platform or agent credentials first:",
  "agent.instance.associate.tips.metric":
    "Enroll will switch the cluster to Agent mode and auto-enroll newly added nodes afterward",
  "agent.instance.associate.tips.unregister":
    "No registration information for this cluster was found in the Console,",
  "agent.instance.associate.tips.to_register": "go to register",
  "agent.instance.associate.drawer.title": "Enroll Cluster",
  "agent.instance.regist": "Agent Registration",
  "agent.instance.field.endpoint.placeholder":
    "Agent API endpoint e.g. 127.0.0.1:2900",
  "agent.instance.field.endpoint.form.required":
    "Please input agent API endpoint!",
  "agent.instance.registration.copy": "Copy",
  "agent.instance.registration.console.title": "INFINI Console Access Info",
  "agent.instance.registration.access.endpoint": "Access Endpoint",
  "agent.instance.registration.access.credential": "Access Credential",
  "agent.instance.registration.console.endpoint.tip":
    "Copy this access endpoint to the Agent managed configuration.",
  "agent.instance.registration.console.token.tip":
    "Copy this access credential to the Agent keystore so the Agent can register and sync configs with Console.",
  "agent.instance.registration.console.token.expire.tip":
    "This access credential expires at {time} if the Agent has not completed registration.",
  "agent.instance.registration.console.load_failed":
    "Failed to load INFINI Console access info.",
  "agent.instance.registration.menu.register": "Agent Registration",
  "agent.instance.registration.menu.info": "INFINI Console Access Info",
  "agent.instance.registration.agent.title": "Agent Access Info",
  "agent.instance.registration.agent.token.required":
    "Please input access credential!",
  "agent.instance.registration.agent.endpoint.tip":
    "Enter the Agent access endpoint that Console can reach.",
  "agent.instance.registration.agent.token.placeholder":
    "Paste the access credential generated on the host",
  "agent.instance.registration.agent.token.tip":
    "Paste the Agent access credential here so Console can access the Agent later.",
  "agent.instance.registration.agent.token.expire.tip":
    "This access credential has no fixed expiration and remains valid until it is rotated or replaced.",
  "agent.instance.registration.auth.type": "Authentication Method",
  "agent.instance.registration.auth.type.access_token": "Access Credential",
  "agent.instance.registration.auth.type.basic_auth": "Username / Password",
  "agent.instance.step.result.button.register_new": "Register Another Agent",
  "agent.instance.step.result.button.view_list": "View Agent List",
  "agent.instance.column.agent_ip": "Agent IP",
  "agent.instance.row_detail.tab.detected_processes":
    "Detected Processes ({count})",
  "agent.instance.row_detail.tab.unknown_processes":
    "Unknown Processes ({count})",
  "agent.instance.process.detail.title": "Processes detail",
  "agent.instance.associate.labels.node_adress": "Node Publish Address",
  "agent.instance.associate.labels.logs_paths": "Log Paths",
  "agent.instance.associate.labels.logs_paths.placeholder":
    "Enter one or more log directories",
  "agent.instance.associate.labels.logs_paths.tips":
    "The detected path.logs is prefilled. You can append extra directories and Console will deliver them through the same logs_path setting for Agent collection.",
  "agent.instance.associate.tips.access_failed":
    "The agent failed to access this node, please update the settings and try again!",
  "agent.instance.associate.credential_status.set": "Set",
  "agent.instance.associate.credential_status.unset": "Not Set",
  "agent.install.label.get_cmd": "Get Setup Command",
  "agent.install.setup.title": "Quick Installation",
  "agent.install.setup.desc":
    "Please copy the command below and execute it on the target host, which includes downloading, deploying and starting INFINI Agent",
  "agent.install.tips.intranet.title": "Intranet deployment",
  "agent.install.tips.intranet.desc":
    "The default install directory is /infini/agent. If package files exist under web.ui.path/agent/stable, Console automatically serves them from its own web endpoint; otherwise it falls back to the official release site. Configure agent.setup.download_url only when you need a custom internal mirror.",
  "agent.install.tips.title": "Tips",
  "agent.install.tips.target": "The default install directory is",
  "agent.install.tips.version": "To install a specific Agent version, append",
  "agent.install.tips.download":
    "To use an internal mirror or custom download source, append",
  "agent.install.tips.server":
    "If the target host cannot access the current Console address directly, append",
  "agent.install.tips.desc":
    "The automatic installation of the current version only supports Linux, for non-Linux systems, please select ",
  "agent.install.link.manual_install": "manual installation",
  "agent.install.title": "Install Agent",
  "agent.install.logs.tips":
    "The log viewing feature needs to install the INFINI Agent first",
  "agent.logs.label.log_file": "Log File",
  "agent.logs.label.goto": "Jump To Line",
  "agent.logs.label.latest_lines": "lines",
  "agent.logs.button.view_latest": "Follow Latest",
  "agent.logs.button.goto": "Goto",
  "agent.install.setup.copy.success": "Copied to clipboard successfully!",
  "agent.install.advanced.title": "Advanced configuration",
  "agent.install.reverse_channel.label": "Enable reverse channel",
  "agent.install.reverse_channel.help": "Disabled by default. Enable only when Console cannot reach the Agent port, such as in containers; when enabled, Agent connects back to Console.",
  "agent.install.no_sudo.label": "No sudo access",
  "agent.install.no_sudo.help": "Recommended for containers or non-root environments. When enabled, the generated command removes sudo and appends --no-service. After installation, run Agent in the foreground via the container ENTRYPOINT/CMD.",
  "agent.install.no_sudo.help_line": "If sudo or system services are unavailable in the target environment, append",
  "agent.install.no_sudo.tip.title": "Container / no-sudo mode",
  "agent.install.no_sudo.tip.desc": "This mode skips service installation and startup. After installation, run the Agent binary as the container main process and let Docker or Kubernetes handle restart behavior.",
  "agent.install.no_sudo.entrypoint.title": "Dockerfile ENTRYPOINT example",
  "agent.install.no_sudo.cmd.title": "Dockerfile CMD example",
  "agent.instance.auto_associate.title": "Auto Enroll",
  "agent.instance.install.title": "Install Agent",

  "agent.label.agent_credential": "Probe Credential",
  "agent.credential.tip": "No credential required",
  "agent.instance.button.revoke": "Revoke",
  "agent.instance.delete.confirm.title": "Are you sure you want to delete this agent?",
  "agent.instance.revoke.confirm.title": "Sure to revoke?",
  "agent.instance.clear.title": "Clear Offline Instances",
  "agent.instance.clear.modal.title": "Are you sure you want to clear offline instances?",
  "agent.instance.clear.modal.desc": "This operation will delete offline instances that have not reported metrics for 7 days."
};
