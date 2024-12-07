import ClusterMetric from "../../components/cluster_metric";
import { ESPrefix } from "@/services/common";

export default ({
  clusterID,
  timeRange,
  handleTimeChange,
  bucketSize,
  timeout,
  timezone,
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
      fetchUrl={`${ESPrefix}/${clusterID}/cluster_metrics`}
      bucketSize={bucketSize}
      metrics={['index_throughput', 'search_throughput', 'index_latency', 'search_latency']}
    />
  );
}
