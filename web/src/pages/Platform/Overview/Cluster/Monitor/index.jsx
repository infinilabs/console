import React from "react";
import Overview from "./overview";
import Nodes from "./nodes";
import Indices from "./indices";
import Advanced from "./advanced";
import { connect } from "dva";
import { formatMessage } from "umi/locale";
import Monitor from "@/components/Overview/Monitor";
import StatisticBar from "./statistic_bar";
import { Empty } from "antd";
import TopN from "./TopN";
import Logs from "./Logs";
import Rollup from "./Rollup";
import { isSystemCluster } from "@/utils/setup";

const getPanes = (clusterID) => {
  const basePanes = [
    { title: "Overview", component: Overview, key: "overview" },
    { title: "Advanced", component: Advanced, key: "advanced" },
    { title: "TopN", component: TopN, key: "topn" },
    { title: "Logs", component: Logs, key: "logs" },
    { title: "Nodes", component: Nodes, key: "nodes" },
    { title: "Indices", component: Indices, key: "indices" },
  ];

  if (isSystemCluster(clusterID)) {
    const overviewIndex = basePanes.findIndex(p => p.key === "overview");
    basePanes.splice(overviewIndex + 1, 0, {
      title: "Rollup",
      component: Rollup,
      key: "rollup",
    });
  }

  return basePanes;
};

const Page = (props) => {
  const { clusterStatus, selectedCluster } = props;
  let clusterAvailable = true;
  let clusterMonitored = true;
  let clusterID = props.match.params?.cluster_id;

  if (selectedCluster?.id && selectedCluster?.id !== clusterID) {
    clusterID = selectedCluster.id;
  }

  if (clusterStatus && selectedCluster && clusterStatus[selectedCluster.id]) {
    clusterAvailable = clusterStatus[selectedCluster.id].available;
    clusterMonitored = clusterStatus[selectedCluster.id].config.monitored;
  }
  const panes = getPanes(clusterID);

  return (
    <Monitor
      selectedCluster={selectedCluster}
      formatState={(state) => {
        let clusterID = props.match.params?.cluster_id;
        if (
          props.selectedCluster?.id &&
          props.selectedCluster?.id !== clusterID
        ) {
          clusterID = props.selectedCluster?.id;
        }
        return {
          ...state,
          clusterID: clusterID || "",
        };
      }}
      getBreadcrumbList={() => [
        {
          title: formatMessage({ id: "menu.home" }),
          href: "/",
        },
        {
          title: formatMessage({ id: "menu.cluster" }),
        },
        {
          title: formatMessage({ id: "menu.cluster.monitoring" }),
        },
        {
          title: selectedCluster?.name || "",
        },
      ]}
      StatisticBar={StatisticBar}
      extraParams={{
        clusterAvailable,
        clusterMonitored,
        clusterName: selectedCluster?.name,
        clusterID:
          props.selectedCluster?.id &&
          props.selectedCluster?.id !== props.match.params?.cluster_id
            ? props.selectedCluster?.id
            : props.match.params?.cluster_id,
      }}
      panes={panes}
      checkPaneParams={(params) => !!params.clusterID}
    />
  );
};

export default connect(({ global }) => ({
  selectedCluster: global.selectedCluster,
  clusterStatus: global.clusterStatus,
}))(Page);
