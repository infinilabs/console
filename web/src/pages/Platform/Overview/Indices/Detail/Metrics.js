import React from "react";
import { ESPrefix } from "@/services/common";
import Metrics from "@/components/Overview/Detail/Metrics";
import MetricNodes from "@/components/Overview/Detail/Metrics/MetricNodes";

export default (props) => {
  const indexName = props.data?._source?.metadata?.index_name;
  const clusterID = props.data?._source?.metadata?.cluster_id;
  const clusterName = props.data?._source?.metadata?.cluster_name;
  if (!indexName || !clusterID) {
    return null;
  }

  const overviews = [
    { 
      key: 'nodes', 
      title: 'Nodes', 
      action: `${ESPrefix}/${clusterID}/index/${indexName}/nodes`,
      component: MetricNodes 
    }
  ]

  return (
    <Metrics
      metricAction={`${ESPrefix}/${clusterID}/index/${indexName}/metrics`}
      params={{ clusterID, clusterName }}
      linkMore={`/cluster/monitor/${clusterID}/indices/${indexName}?_g={"cluster_name":"${clusterName}"}`}
      overviews={overviews}
    />
  )
};
