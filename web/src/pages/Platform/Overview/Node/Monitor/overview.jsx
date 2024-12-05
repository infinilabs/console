import { ESPrefix } from "@/services/common";
import StatisticBar from "./statistic_bar";
import ClusterMetric from "../../components/cluster_metric";

const timezone = "local";

export default ({
  clusterID,
  nodeID,
  timeRange,
  handleTimeChange,
  bucketSize,
}) => {
  return (
    <ClusterMetric
      timezone={timezone}
      timeRange={timeRange}
      handleTimeChange={handleTimeChange}
      overview={1}
      fetchUrl={`${ESPrefix}/${clusterID}/node/${nodeID}/metrics`}
      bucketSize={bucketSize}
      metrics={[
        "node_health",
        "shard_state",
        "cpu",
        "jvm",
        "index_throughput",
        "search_throughput",
        "index_latency",
        "search_latency",
        "parent_breaker"
      ]}
    />
  );
}
