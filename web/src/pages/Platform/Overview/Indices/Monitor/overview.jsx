import { ESPrefix } from "@/services/common";
import StatisticBar from "./statistic_bar";
import ClusterMetric from "../../components/cluster_metric";

export default (props) => {

  const {
    isAgent,
    clusterID,
    indexName,
    shardID,
  } = props

  let url = `${ESPrefix}/${clusterID}/index/${indexName}/metrics`;
  if(shardID){
    url += `?shard_id=${shardID}`
  }
  return (
    <ClusterMetric
      {...props}
      overview={1}
      fetchUrl={url}
      metrics={[
        isAgent && shardID ? 'shard_state' : "index_health",
        "index_throughput",
        "search_throughput",
        "index_latency",
        "search_latency",
        isAgent && !shardID ? "shard_state" : undefined,
      ].filter((item) => !!item)}
    />
  );
}
