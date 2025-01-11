import ClusterMetric from "../../components/cluster_metric";
import { ESPrefix } from "@/services/common";

export default (props) => {

  const { isAgent, clusterID } = props

  return (
    <ClusterMetric
      {...props}
      overview={1}
      fetchUrl={`${ESPrefix}/${clusterID}/cluster_metrics`}
      metrics={[
        'index_throughput', 
        'search_throughput', 
        'index_latency', 
        'search_latency', 
        'cluster_health',
        isAgent ? 'shard_state' : 'cluster_documents'
      ]}
    />
  );
}
