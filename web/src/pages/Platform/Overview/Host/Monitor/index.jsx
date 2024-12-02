import React from "react";
import Overview from "./overview";
import Advanced from "./advanced";
import Process from "./process";
import { formatMessage } from "umi/locale";
import Monitor from "@/components/Overview/Monitor";
import StatisticBar from "./statistic_bar";

const panes = [
  { title: "Overview", component: Overview, key: "overview" },
  { title: "Advanced", component: Advanced, key: "advanced" },
  { title: "Process", component: Process, key: "process" },
];

export default (props) => {
  return (
    <Monitor
      formatState={(state) => {
        return {
          ...state,
          hostID: props.match.params?.host_id || "",
          hostName: state?.param?.host_name || "",
        };
      }}
      getBreadcrumbList={(state) => [
        {
          title: formatMessage({ id: "menu.home" }),
          href: "/",
        },
        {
          title: formatMessage({ id: "menu.cluster" }),
        },
        {
          title: "Hosts",
        },
        {
          title: state.hostName || state.hostID,
        },
      ]}
      StatisticBar={StatisticBar}
      panes={panes}
      checkPaneParams={(params) => !!params.hostID}
    />
  );
};
