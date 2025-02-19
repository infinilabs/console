import React from "react";
import Overview from "./overview";
import Advanced from "./advanced";
import Shards from "./shards";
import { formatMessage } from "umi/locale";
import Monitor from "@/components/Overview/Monitor";
import StatisticBar from "./statistic_bar";
import { connect } from "dva";
import Logs from "./Logs";

const panes = [
  { title: "Overview", component: Overview, key: "overview" },
  { title: "Advanced", component: Advanced, key: "advanced" },
  { title: "Logs", component: Logs, key: "logs" },
  { title: "Shards", component: Shards, key: "shards" },
];
const Page = (props) => {
  const { clusterStatus, selectedCluster } = props;
  return (
    <Monitor
      selectedCluster={selectedCluster}
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

export default connect(({ global }) => ({
  selectedCluster: global.selectedCluster,
  clusterStatus: global.clusterStatus,
}))(Page);