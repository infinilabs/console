import React from "react";
import Overview from "./overview";
import Advanced from "./advanced";
import Shards from "./shards";
import { formatMessage } from "umi/locale";
import Monitor from "@/components/Overview/Monitor";
import StatisticBar from "./statistic_bar";

const panes = [
  { title: "Overview", component: Overview, key: "overview" },
  { title: "Advanced", component: Advanced, key: "advanced" },
  { title: "Shards", component: Shards, key: "shards" },
];

export default (props) => {
  return (
    <Monitor
      formatState={(state) => {
        return {
          ...state,
          clusterID: props.match.params?.cluster_id || "",
          clusterName: state?.param?.cluster_name || "",
          nodeID: props.match.params?.node_id || "",
          nodeName: state?.param?.node_name || "",
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
          title: state.clusterName || state.clusterID,
          href: `/#/cluster/monitor/elasticsearch/${
            state.clusterID
          }?_g={"timeRange":${encodeURIComponent(JSON.stringify(state.timeRange))}}`,
        },
        {
          title: "Nodes",
          href: `/#/cluster/monitor/elasticsearch/${
            state.clusterID
          }?_g={"tab":"nodes","timeRange":${encodeURIComponent(JSON.stringify(state.timeRange))}}`,
        },
        {
          title: state.nodeName || state.nodeID,
        },
      ]}
      StatisticBar={StatisticBar}
      panes={panes}
      checkPaneParams={(params) => !!params.clusterID && !!params.nodeID}
    />
  );
};
