import { ESPrefix } from "@/services/common";
import StatisticBar from "./statistic_bar";
import ClusterMetric from "../../components/cluster_metric";

export default ({
  isAgent,
  clusterID,
  indexName,
  timeRange,
  handleTimeChange,
  shardID,
  bucketSize,
  timezone,
  timeout,
  refresh
}) => {
  let url = `${ESPrefix}/${clusterID}/index/${indexName}/metrics`;
  if(shardID){
    url += `?shard_id=${shardID}`
  }
  return (
    <ClusterMetric
      timezone={timezone}
      timeRange={timeRange}
      handleTimeChange={handleTimeChange}
      overview={1}
      fetchUrl={url}
      bucketSize={bucketSize}
      timeout={timeout}
      refresh={refresh}
      metrics={[
        "index_health",
        "index_throughput",
        "search_throughput",
        "index_latency",
        "search_latency",
        isAgent ? "shard_state" : undefined,
      ].filter((item) => !!item)}
    />
  );
}
