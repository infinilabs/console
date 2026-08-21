import { ESPrefix } from "@/services/common";
import StatisticBar from "./statistic_bar";
import ClusterMetric from "../../components/cluster_metric";
import { useMemo } from "react";

export default (props) => {

  const {
    isAgent,
    clusterID,
    nodeID,
    info,
  } = props

  const nodeRoles = Array.isArray(info?.roles) ? info.roles : [];
  const hasDataRole =
    nodeRoles.length === 0
      ? true
      : nodeRoles.some((role) => role === "data" || role?.startsWith?.("data_"));

  return (
    <ClusterMetric
      {...props}
      overview={1}
      fetchUrl={`${ESPrefix}/${clusterID}/node/${nodeID}/metrics`}
      metrics={[
        "node_health",
        "cpu",
        "jvm",
        "index_throughput",
        "search_throughput",
        "index_latency",
        "search_latency",
        "parent_breaker",
        isAgent && hasDataRole ? "shard_state" : undefined,
      ].filter((item) => !!item)}
    />
  );
}
