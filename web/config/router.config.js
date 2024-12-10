export default [
  // user
  {
    path: "/user",
    component: "../layouts/UserLayout",
    routes: [
      { path: "/user", redirect: "/user/login" },
      { path: "/user/login", component: "./User/Login" },
      { path: "/user/sso/success", component: "./User/SSOSuccess" },
      { path: "/user/sso/failed", component: "./User/SSOFailed" },
    ],
  },
  {
    path: "/guide",
    component: "../layouts/GuideLayout",
    routes: [
      { path: "/guide", redirect: "/guide/initialization" },
      { path: "/guide/initialization", component: "./Guide/Initialization" },
    ],
  },
  // app
  {
    path: "/",
    component: "../layouts/BasicLayout",
    routes: [
      // cluster
      {
        path: "/",
        component: "./Redirect",
        exact: true,
      },
      {
        path: "/overview",
        name: "overview",
        component: "./Overview",
        icon: "home",
        exact: true,
        authority: ["workbench:all", "workbench:read"],
      },

      //platform
      {
        path: "/cluster",
        name: "cluster",
        icon: "cluster",
        authority: ["cluster"],
        routes: [
          {
            path: "/cluster/overview",
            name: "overview",
            component: "./Platform/Overview/index",
            authority: ["cluster.overview:all", "cluster.overview:read"],
          },
          {
            path: "/cluster/monitor/elasticsearch/:cluster_id",
            name: "monitoring_overview",
            component: "./Platform/Overview/Cluster/Monitor/index",
            hideInMenu: true,
          },
          // {
          //   path: "/cluster/monitor/hosts/:host_id",
          //   name: "monitoring_overview_hosts",
          //   component: "./Platform/Overview/Host/Monitor/index",
          //   hideInMenu: true,
          // },
          {
            path: "/cluster/monitor/:cluster_id/nodes/:node_id",
            name: "monitoring_overview_nodes",
            component: "./Platform/Overview/Node/Monitor/index",
            hideInMenu: true,
          },
          {
            path: "/cluster/monitor/:cluster_id/indices/:index_name",
            name: "monitoring_overview_indices",
            component: "./Platform/Overview/Indices/Monitor/index",
            hideInMenu: true,
          },
          {
            path: "/cluster/monitor",
            name: "monitoring",
            component: "./Platform/Overview/Cluster/Monitor/index",
            authority: ["cluster.monitoring:all", "cluster.monitoring:read"],
          },
          {
            path: "/cluster/metrics/:cluster_id",
            name: "monitoring",
            component: "./Cluster/Metrics",
            hideInMenu: true,
          },
          {
            path: "/cluster/activities",
            name: "activities",
            component: "./Cluster/Activities",
            authority: ["cluster.activities:all", "cluster.activities:read"],
          },
        ],
      },
      // data
      {
        path: "/data",
        name: "data",
        icon: "database",
        authority: [
          "data.index:all",
          "data.index:read",
          "data.alias:all",
          "data.alias:read",
          "data.view:all",
          "data.view:read",
        ],
        routes: [
          {
            path: "/data/index",
            name: "index",
            component: "./DataManagement/Index",
            // routes: [{ path: "/", redirect: "/" }],
            authority: ["data.index:all", "data.index:read"],
            exact: false,
          },
          {
            path: "/data/alias",
            name: "alias",
            component: "./DataManagement/Alias",
            authority: ["data.alias:all", "data.alias:read"],
            exact: false,
          },
          {
            path: "/data/views",
            name: "view",
            component: "./DataManagement/IndexPatterns",
            authority: ["data.view:all", "data.view:read"],
            exact: false,
          },
        ],
      },

      //insight
      {
        path: "/insight",
        name: "insight",
        icon: "dot-chart",
        authority: [
          "insight.dashboard:all",
          "insight.dashboard:read",
          "data.discover:all",
          "data.discover:read",
        ],
        routes: [
          {
            path: "/insight/discover",
            name: "discover",
            component: "./DataManagement/Discover",
            authority: ["data.discover:all", "data.discover:read"],
            exact: false,
          },
        ],
      },

      // alerting
      {
        path: "/alerting",
        name: "alerting",
        icon: "alert",
        authority: ["alerting"],
        routes: [
          {
            path: "/alerting/message/:message_id",
            component: "./Alerting/Message/Detail",
            hideInMenu: true,
            name: "message_detail",
            authority: ["alerting.message:all", "alerting.message:read"],
          },
          {
            path: "/alerting/message",
            component: "./Alerting/Message/Index",
            name: "message",
            authority: ["alerting.message:all", "alerting.message:read"],
          },
          {
            path: "/alerting/alert/:event_id",
            component: "./Alerting/Alert/Detail",
            hideInMenu: true,
            name: "task_detail",
            authority: [
              "alerting.rule:all",
              "alerting.rule:read",
              "alerting.message:read",
              "alerting.message:all",
            ],
          },
          {
            path: "/alerting/rule/new",
            name: "new_rule",
            component: "./Alerting/Rule/New",
            hideInMenu: true,
            authority: ["alerting.rule:all"],
          },
          {
            path: "/alerting/rule/:rule_id",
            name: "rule_detail",
            component: "./Alerting/Rule/Detail",
            hideInMenu: true,
            authority: ["alerting.rule:all", "alerting.rule:read"],
          },
          {
            path: "/alerting/rule/edit/:rule_id",
            name: "edit_rule",
            component: "./Alerting/Rule/Edit",
            hideInMenu: true,
            authority: ["alerting.rule:all"],
          },
          {
            path: "/alerting/rule",
            component: "./Alerting/Rule/Index",
            name: "rule",
            authority: ["alerting.rule:all", "alerting.rule:read"],
          },
          {
            path: "/alerting/channel/new",
            name: "new_channel",
            component: "./Alerting/Channel/New",
            hideInMenu: true,
            authority: ["alerting.channel:all"],
          },
          {
            path: "/alerting/channel/edit/:channel_id",
            name: "edit_channel",
            component: "./Alerting/Channel/Edit",
            hideInMenu: true,
            authority: ["alerting.channel:all"],
          },
          {
            path: "/alerting/channel",
            component: "./Alerting/Channel/Index",
            name: "channel",
            authority: ["alerting.channel:all", "alerting.channel:read"],
          },
        ],
      },
      {
        path: "/devtool",
        name: "devtool",
        icon: "code",
        authority: [
          "devtool.console:all",
          "devtool.console:read",
          "system.command:all",
          "system.command:read",
        ],
        routes: [
          {
            path: "/devtool/console",
            name: "console",
            component: "./DevTool/Index",
            authority: ["devtool.console:all", "devtool.console:read"],
          },
          {
            path: "/devtool/command",
            name: "command",
            component: "./System/Command/Index",
            authority: ["system.command:all", "system.command:read"],
          },
        ],
      },

      // resource
      {
        path: "/resource",
        name: "resource",
        icon: "share-alt",
        authority: [
          "gateway.instance:all",
          "gateway.instance:read",
          "system.cluster:all",
          "system.cluster:read",
          "agent.instance:all",
          "agent.instance:read",
        ],
        routes: [
          {
            path: "/resource/runtime/instance/new",
            name: "runtime.new_instance",
            component: "./Gateway/Instance/new",
            hideInMenu: true,
            authority: ["gateway.instance:all"],
          },
          {
            path: "/resource/runtime/instance/edit/:instance_id",
            name: "runtime.edit_instance",
            component: "./Gateway/Instance/edit",
            hideInMenu: true,
            authority: ["gateway.instance:all"],
          },
          {
            path: "/resource/runtime/instance/:instance_id/task",
            name: "runtime.task",
            component: "./Gateway/Task/index",
            hideInMenu: true,
            authority: ["gateway.instance:all", "gateway.instance:read"],
          },
          {
            path: "/resource/runtime/instance/:instance_id/queue",
            name: "runtime.queue",
            hideInMenu: true,
            component: "./Gateway/Queue/index",
            authority: ["gateway.instance:all", "gateway.instance:read"],
          },
          {
            path: "/resource/runtime/instance/:instance_id/disk",
            name: "runtime.disk",
            hideInMenu: true,
            component: "./Gateway/Disk/index",
            authority: ["gateway.instance:all", "gateway.instance:read"],
          },
          {
            path: "/resource/runtime/instance/:instance_id/logging",
            name: "runtime.logging",
            hideInMenu: true,
            component: "./Gateway/Instance/Logging/index",
            authority: ["gateway.instance:all", "gateway.instance:read"],
          },
          {
            path: "/resource/runtime/instance/:instance_id/config",
            name: "runtime.config",
            hideInMenu: true,
            component: "./Gateway/Config/index",
            authority: ["gateway.instance:all", "gateway.instance:read"],
          },
          {
            path: "/resource/runtime/instance",
            name: "runtime",
            component: "./Gateway/Instance/index",
            authority: ["gateway.instance:all", "gateway.instance:read"],
          },
          {
            path: "/resource/cluster/regist",
            name: "registCluster",
            component: "./System/Cluster/Step",
            hideInMenu: true,
            authority: ["system.cluster:all"],
          },
          {
            path: "/resource/cluster/:id/edit",
            name: "editCluster",
            component: "./System/Cluster/Form",
            hideInMenu: true,
            authority: ["system.cluster:all"],
          },
          {
            path: "/resource/cluster",
            name: "cluster",
            component: "./System/Cluster/index",
            authority: ["system.cluster:all", "system.cluster:read"],
          },
          {
            path: "/resource/agent",
            name: "agent",
            component: "./Agent/Instance/index",
            authority: ["agent.instance:all", "agent.instance:read"],
          },
          {
            path: "/resource/agent/new",
            name: "agent.new_instance",
            component: "./Agent/Instance/new",
            hideInMenu: true,
            authority: ["agent.instance:all"],
          },
          {
            path: "/resource/agent/instance/edit/:instance_id",
            name: "agent.edit_instance",
            component: "./Agent/Instance/edit",
            hideInMenu: true,
            authority: ["agent.instance:all"],
          },
        ],
      },

      //settings
      {
        path: "/system",
        name: "system",
        icon: "setting",
        authority: [
          "system.credential:all",
          "system.credential:read",
          "system.security:all",
          "system.security:read",
          "system.audit_logs:all",
          "system.audit_logs:read",
          "system.smtp_server:all",
          "system.smtp_server:read"
        ],
        routes: [
          {
            path: "/system/email_server",
            name: "smtp_server",
            component: "./System/Email/Server",
            authority: ["system.smtp_server:all", "system.smtp_server:read"],
          },
          {
            path: "/system/credential",
            name: "credential",
            component: "./System/Credential/Index",
            authority: ["system.credential:all", "system.credential:read"],
          },
          {
            path: "/system/security",
            name: "security",
            component: "./System/Security/index",
            authority: ["system.security:all", "system.security:read"],
          },
          {
            path: "/system/security/user/new",
            name: "new_user",
            component: "./System/User/new",
            hideInMenu: true,
            authority: ["system.security:all"],
          },
          {
            path: "/system/security/user/edit/:user_id",
            name: "edit_user",
            component: "./System/User/edit",
            hideInMenu: true,
            authority: ["system.security:all"],
          },
          {
            path: "/system/security/user/password/:user_id",
            name: "reset_password",
            component: "./System/User/resetPassword",
            hideInMenu: true,
            authority: ["system.security:all"],
          },
          {
            path: "/system/security/role/platform/new",
            name: "new_role",
            component: "./System/Role/Platform/new",
            hideInMenu: true,
            authority: ["system.security:all"],
          },
          {
            path: "/system/security/role/platform/edit/:role_id",
            name: "edit_role",
            component: "./System/Role/Platform/edit",
            hideInMenu: true,
            authority: ["system.security:all"],
          },
          {
            path: "/system/security/role/data/new",
            name: "new_role",
            component: "./System/Role/Data/new",
            hideInMenu: true,
            authority: ["system.security:all"],
          },
          {
            path: "/system/security/role/data/edit/:role_id",
            name: "edit_role",
            component: "./System/Role/Data/edit",
            hideInMenu: true,
            authority: ["system.security:all"],
          },
          {
            path: "/system/audit",
            name: "audit_logs",
            component: "./System/Audit/index",
            authority: ["system.audit_logs:all", "system.audit_logs:read"],
          },
        ],
      },

      {
        name: "exception",
        icon: "warning",
        path: "/exception",
        hideInMenu: true,
        routes: [
          // exception
          {
            path: "/exception/403",
            name: "not-permission",
            component: "./Exception/403",
          },
          {
            path: "/exception/404",
            name: "not-find",
            component: "./Exception/404",
          },
          {
            path: "/exception/500",
            name: "server-error",
            component: "./Exception/500",
          },
          {
            path: "/exception/application",
            name: "client-error",
            component: "./Exception/app",
          },
        ],
      },
      {
        name: "account",
        icon: "user",
        path: "/account",
        hideInMenu: true,
        routes: [
          {
            path: "/account/settings",
            name: "settings",
            component: "./Account/Settings/Info",
            routes: [
              {
                path: "/account/settings",
                redirect: "/account/settings/base",
              },
              {
                path: "/account/settings/base",
                component: "./Account/Settings/BaseView",
              },
              {
                path: "/account/settings/security",
                component: "./Account/Settings/SecurityView",
              },
            ],
          },
          {
            path: "/account/password",
            component: "./Account/Settings/PasswordView",
            hideInMenu: true,
          },
          {
            path: "/account/notification",
            name: "notification",
            component: "./Platform/Notification/index",
            hideInMenu: true,
          },
        ],
      },
      {
        component: "404",
      },
    ],
  },
];
