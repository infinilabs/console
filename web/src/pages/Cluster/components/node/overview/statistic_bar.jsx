import * as React from "react";
import useFetch from "@/lib/hooks/use_fetch";
import { ESPrefix } from "@/services/common";
import { formatter } from "@/utils/format";
import { formatUtcTimeToLocal } from "@/utils/utils";
import moment from "moment";
import { HealthStatusCircle } from "@/components/infini/health_status_circle";
import OverviewStatistic from "../../overview_statistic";

const vstyle = {
  fontSize: 12,
  wordBreak: "break-all",
  fontWeight: "bold",
};

const StatisticBar = ({ clusterID, nodeID, timeRange, setSpinning }) => {
  if (!clusterID || !nodeID) {
    return null;
  }
  const {
    loading,
    error,
    value: nodeValue,
  } = useFetch(`${ESPrefix}/${clusterID}/node/${nodeID}/info`, {}, [
    clusterID,
    nodeID,
    timeRange,
  ]);

  React.useEffect(() => {
    setSpinning(loading);
  }, [loading]);

  const isAvailable =
    loading ||
    (nodeValue?.status &&
      ["N/A", "unavailable"].indexOf(nodeValue?.status) == -1)
      ? true
      : false;

  let overviewStatistic = [];
  if (nodeValue?.status) {
    overviewStatistic = [
      {
        key: "Status",
        value: nodeValue?.status || "N/A",
        title: "Status",
        vstyle: {
          ...vstyle,
          display: "flex",
          alignItems: "center",
        },
        prefix: <HealthStatusCircle status={nodeValue?.status} />,
      },
      {
        key: "uptime",
        value: nodeValue?.jvm?.uptime
          ? moment.duration(nodeValue?.jvm?.uptime).humanize()
          : "N/A",
        title: "Uptime",
      },
      {
        key: "Type",
        value: nodeValue?.is_master_node ? "Master Node" : "Not Master Node",
        title: "Type",
      },
      {
        key: "Transport Address",
        value: nodeValue?.transport_address || "N/A",
        title: "Transport Address",
      },
      {
        key: "Indices",
        value: nodeValue?.shard_info?.indices_count,
        title: "Indices",
      },
      {
        key: "Shards",
        value:
          (nodeValue?.shard_info?.shard_count || 0) +
          (nodeValue?.shard_info?.replicas_count || 0),
        title: "Shards",
      },
      {
        key: "Documents",
        value: formatter.number(nodeValue?.indices?.docs?.count || 0),
        title: "Documents",
      },
      {
        key: "Data",
        value: formatter.bytes(nodeValue?.indices?.store?.size_in_bytes || 0),
        title: "Data",
      },
      {
        key: "JVM Heap",
        value:
          formatter.bytes(nodeValue?.jvm?.mem?.heap_used_in_bytes || 0) +
          "/" +
          formatter.bytes(nodeValue?.jvm?.mem?.heap_max_in_bytes || 0) +
          "(" +
          (nodeValue?.fs?.total?.total_in_bytes
            ? ((nodeValue?.jvm?.mem?.heap_used_in_bytes || 0) * 100) /
              nodeValue?.jvm?.mem?.heap_max_in_bytes
            : 0
          ).toFixed(2) +
          "%)",
        title: "JVM Heap",
      },
      {
        key: "Free Disk Space",
        value:
          formatter.bytes(nodeValue?.fs?.total?.available_in_bytes || 0) +
          "(" +
          (nodeValue?.fs?.total?.total_in_bytes
            ? ((nodeValue?.fs?.total?.available_in_bytes || 0) * 100) /
              nodeValue?.fs?.total?.total_in_bytes
            : 0
          ).toFixed(2) +
          "%)",
        title: "Free Disk Space",
      },
    ];
  }
  return (
    <OverviewStatistic data={overviewStatistic} isMask={!isAvailable}>
      {!isAvailable ? (
        <div className={"mask"}>
          <div>
            Node is not availabe since:{" "}
            {nodeValue?.timestamp
              ? formatUtcTimeToLocal(nodeValue?.timestamp)
              : "N/A"}
          </div>
        </div>
      ) : null}
    </OverviewStatistic>
  );
};

export default StatisticBar;
