import { ESPrefix } from "@/services/common";
import StatisticBar from "./statistic_bar";
import ClusterMetric from "../../components/cluster_metric";
import { useMemo } from "react";

export default ({
  isAgent,
  clusterID,
  nodeID,
  timeRange,
  handleTimeChange,
  bucketSize,
  timezone,
  timeout,
  refresh
}) => {

  return (
    <ClusterMetric
      timezone={timezone}
      timeRange={timeRange}
      timeout={timeout}
      refresh={refresh}
      handleTimeChange={handleTimeChange}
      overview={1}
      fetchUrl={`${ESPrefix}/${clusterID}/node/${nodeID}/metrics`}
      bucketSize={bucketSize}
      metrics={[
        "node_health",
        "cpu",
        "jvm",
        "index_throughput",
        "search_throughput",
        "index_latency",
        "search_latency",
        "parent_breaker",
        isAgent ? "shard_state" : undefined,
      ].filter((item) => !!item)}
    />
  );
}
