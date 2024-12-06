import React from "react";
import { ESPrefix } from "@/services/common";
import Metrics from "@/components/Overview/Detail/Metrics";
import MetricNodes from "@/components/Overview/Detail/Metrics/MetricNodes";
import MetricIndices from "@/components/Overview/Detail/Metrics/MetricIndices";

export default (props) => {
  const clusterID = props.data?._id || null;
  const clusterName = props.data?._source?.name || "";

  if (!clusterID) {
    return null;
  }

  const overviews = [
    { 
      key: 'nodes', 
      title: 'Nodes', 
      action: `${ESPrefix}/${clusterID}/nodes`,
      component: MetricNodes 
    },
    { 
      key: 'indices', 
      title: 'Indices', 
      action: `${ESPrefix}/${clusterID}/indices`,
      component: MetricIndices 
    }
  ]

  return (
    <Metrics
      metricAction={`${ESPrefix}/${clusterID}/cluster_metrics`}
      params={{ clusterID, clusterName }}
      linkMore={`/cluster/monitor/elasticsearch/${clusterID}`}
      overviews={overviews}
      metrics={['index_throughput', 'search_throughput', 'index_latency', 'search_latency']}
    />
  )

};
