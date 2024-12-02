import ClusterMetric from "../../components/cluster_metric";
import { ESPrefix } from "@/services/common";

const timezone = "local";

export default ({
  clusterID,
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
      fetchUrl={`${ESPrefix}/${clusterID}/cluster_metrics`}
      bucketSize={bucketSize}
    />
  );
}
