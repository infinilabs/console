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
    />
  );
}
