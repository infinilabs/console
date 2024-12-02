import { ESPrefix } from "@/services/common";
import StatisticBar from "./statistic_bar";
import ClusterMetric from "../../components/cluster_metric";

const timezone = "local";

export default ({
  clusterID,
  indexName,
  timeRange,
  handleTimeChange,
  shardID,
  bucketSize,
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
    />
  );
}
