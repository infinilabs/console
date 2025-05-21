import ClusterMetric from "../../components/cluster_metric";
import { ESPrefix } from "@/services/common";

export default (props) => {

  const { clusterID } = props

  return (
    <ClusterMetric
      {...props}
      overview={1}
      fetchUrl={`${ESPrefix}/${clusterID}/cluster_metrics`}
      metrics={[
        'rollup_cluster_health', 
        'rollup_index_health', 
        'rollup_cluster_stats', 
        'rollup_index_stats', 
        'rollup_node_stats',
        'rollup_shard_stats_metrics',
        'rollup_shard_stats_state',
      ]}
    />
  );
}
