import * as React from "react";
import useFetch from "@/lib/hooks/use_fetch";
import { ESPrefix } from "@/services/common";
import { HealthStatusCircle } from "@/components/infini/health_status_circle";
import OverviewStatistic from "../../components/overview_statistic";
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
        title: "Shard",
        value: shardValue.metadata.labels.shard,
      },
      {
        key: "state",
        title: "State",
        value: shardValue?.payload?.elasticsearch?.shard_stats.routing.state || "N/A",
      },
      {
        key: "node",
        title: "node",
        value: nodeV,
      },
      {
        key: "primary",
        title: "Primary",
        value: shardValue?.payload?.elasticsearch?.shard_stats.routing.primary,
      },
      {
        key: "Documents",
        title: "Documents",
        value: shardValue?.payload?.elasticsearch?.shard_stats?.docs.count || "N/A",
      },
      {
        key: "store",
        title: "Store",
        value: formatter.bytes(shardValue?.payload?.elasticsearch?.shard_stats.store?.size_in_bytes || 0) || "N/A",
      },
      {
        key: "Updated",
        title: "Updated",
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
