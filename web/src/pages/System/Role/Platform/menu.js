import { getEnterpriseTaskManagerEnabled } from "@/utils/authority";

const baseMenuData = [
  { key: "workbench", menuKey: "overview" },
  {
    key: "cluster",
    children: [
      {
        key: "cluster.overview",
      },
      {
        key: "cluster.monitoring",
      },
      {
        key: "cluster.activities",
      },
    ],
  },
  {
    key: "data",
    children: [
      {
        key: "data.index",
      },
      {
        key: "data.alias",
      },
      {
        key: "data.view",
      },
      // {
      //   key: "data.discover",
      // },
    ],
  },
  {
    key: "insight",
    children: [
      {
        key: "data.discover",
      },
    ],
  },
  {
    key: "alerting",
    children: [
      {
        key: "alerting.rule",
      },
      {
        key: "alerting.message",
      },
      {
        key: "alerting.channel",
      },
    ],
  },
  {
    key: "devtool",
    children: [
      {
        key: "devtool.console",
      },
      {
        key: "system.command",
      },
    ],
  },
  {
    key: "resource",
    children: [
      {
        key: "gateway.instance",
        menuKey: "resource.runtime",
      },
      /* 以下网关功能未完善，暂不开放 */
      // {
      //   key: "gateway.entry",
      // },
      // {
      //   key: "gateway.router",
      // },
      // {
      //   key: "gateway.flow",
      // },
      {
        key: "system.cluster",
        menuKey: "resource.cluster",
      },
      {
        key: "agent.instance",
        menuKey: "resource.agent",
      },
    ],
  },
  {
    key: "system",
    children: [
      {
        key: "system.smtp_server",
        menuKey: "system.settings",
      },
      {
        key: "system.security",
      },
      {
        key: "system.credential",
      },
      {
        key: "system.audit_logs",
      },
    ],
  },
];

const enterpriseTaskMenu = {
  key: "data_tools",
  children: [
    {
      key: "data_tools.migration",
    },
    {
      key: "data_tools.comparison",
    },
  ],
};

export const getMenuData = () => {
  const menuData = [...baseMenuData];
  if (getEnterpriseTaskManagerEnabled() === "true") {
    menuData.splice(menuData.length - 1, 0, enterpriseTaskMenu);
  }
  return menuData;
};
