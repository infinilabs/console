import * as React from "react";
import useFetch from "@/lib/hooks/use_fetch";
import { ESPrefix } from "@/services/common";
import { HealthStatusCircle } from "@/components/infini/health_status_circle";
import OverviewStatistic from "../../components/overview_statistic";
import { formatMessage } from "umi/locale";
import { formatUtcTimeToLocal, formatt } from "@/utils/utils";
import {formatter} from "@/utils/format";

const vstyle = {
  fontSize: 12,
  wordBreak: "break-all",
  fontWeight: "bold",
};

const StatisticBar = ({ clusterID, indexName, timeRange, setSpinning, shardID, }) => {
  if (!clusterID || !shardID) {
    return null;
  }
  const {
    loading,
    error,
    value: shardValue,
  } = useFetch(
    `${ESPrefix}/${clusterID}/shard/${shardID}/info`,
    {},
    [clusterID, shardID, timeRange]
  );

  React.useEffect(() => {
    setSpinning(loading);
  }, [loading]);

  let overviewStatistic = [];
  if (shardValue?.metadata) {
    let nodeV = shardValue?.payload?.elasticsearch?.shard_stats.routing.node;
    if(shardValue?.payload?.elasticsearch?.shard_stats.routing.relocating_node){
      nodeV += " -> " + shardValue?.payload?.elasticsearch?.shard_stats.routing.relocating_node
    }
    overviewStatistic = [
      {
        key: "shard",
        title: formatMessage({ id: "overview.column.shard" }),
        value: shardValue.metadata.labels.shard,
      },
      {
        key: "state",
        title: formatMessage({ id: "overview.column.state" }),
        value: shardValue?.payload?.elasticsearch?.shard_stats.routing.state || "N/A",
      },
      {
        key: "node",
        title: formatMessage({ id: "overview.column.node" }),
        value: nodeV,
      },
      {
        key: "primary",
        title: formatMessage({ id: "overview.statistic.primary" }),
        value: shardValue?.payload?.elasticsearch?.shard_stats.routing.primary,
      },
      {
        key: "Documents",
        title: formatMessage({ id: "indices.field.docs_count" }),
        value: shardValue?.payload?.elasticsearch?.shard_stats?.docs.count || "N/A",
      },
      {
        key: "store",
        title: formatMessage({ id: "overview.column.store" }),
        value: formatter.bytes(shardValue?.payload?.elasticsearch?.shard_stats.store?.size_in_bytes || 0) || "N/A",
      },
      {
        key: "Updated",
        title: formatMessage({ id: "overview.statistic.updated" }),
        value: shardValue?.timestamp
          ? formatUtcTimeToLocal(shardValue?.timestamp)
          : "N/A",
      },
    ];
  }

  return (
    <OverviewStatistic data={overviewStatistic}/>
  );
};

export default StatisticBar;
