import React from "react";
import { ESPrefix } from "@/services/common";
import Metrics from "@/components/Overview/Detail/Metrics";
import MetricIndices from "@/components/Overview/Detail/Metrics/MetricIndices";

export default (props) => {
  const nodeID = props.data?._source?.metadata?.node_id;
  const clusterID = props.data?._source?.metadata?.cluster_id;
  const clusterName = props.data?._source?.metadata?.cluster_name;
  const nodeName = props.data?._source?.metadata?.node_name;
  if (!nodeID || !clusterID) {
    return null;
  }

  const overviews = [
    {
      key: "indices",
      title: "Indices",
      action: `${ESPrefix}/${clusterID}/node/${nodeID}/indices`,
      component: MetricIndices,
    },
  ];

  return (
    <Metrics
      metricAction={`${ESPrefix}/${clusterID}/node/${nodeID}/metrics`}
      params={{ clusterID, clusterName }}
      linkMore={`/cluster/monitor/${clusterID}/nodes/${nodeID}?_g={"cluster_name":"${clusterName}","node_name":"${nodeName}"}`}
      overviews={overviews}
    />
  );
};
