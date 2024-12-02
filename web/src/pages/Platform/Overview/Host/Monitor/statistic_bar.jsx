import * as React from "react";
import useFetch from "@/lib/hooks/use_fetch";
import { ESPrefix } from "@/services/common";
import { formatter } from "@/utils/format";
import { formatUtcTimeToLocal } from "@/utils/utils";
import moment from "moment";
import { HealthStatusCircle } from "@/components/infini/health_status_circle";
import OverviewStatistic from "../../components/overview_statistic";
import { formatMessage } from "umi/locale";

const vstyle = {
  fontSize: 12,
  wordBreak: "break-all",
  fontWeight: "bold",
};

export default ({ hostID, timeRange, setSpinning, onInfoChange}) => {
  const {
    loading,
    error,
    value,
  } = useFetch(`/host/${hostID}/info`, {}, [
    hostID,
    timeRange,
  ]);

  React.useEffect(() => {
    setSpinning(loading);
  }, [loading]);

  React.useEffect(() => {
    if (onInfoChange) {
      onInfoChange(value)
    }
  }, [JSON.stringify(value)]);

  const isAvailable = loading

  let overviewStatistic = [];
  if (value) {
    const { metrics, summary } = value;
    overviewStatistic = [
      {
        key: "host_mame",
        value: value.host_mame || "N/A",
        title: formatMessage({ id: "cluster.monitor.summary.host.name" }),
      },
      {
        key: "ip",
        value: value.ip || "N/A",
        title: formatMessage({ id: "cluster.monitor.summary.ip" }),
      },
      {
        key: "os",
        value: value.os_info?.platform || "N/A",
        title: formatMessage({ id: "cluster.monitor.summary.os" }),
      },
      {
        key: "memory",
        value:
          formatter.bytes(summary?.memory?.used_in_bytes) +
          "/" +
          formatter.bytes(summary?.memory?.total_in_bytes),
          title: formatMessage({ id: "cluster.monitor.summary.memory" }),
      },
      {
        key: "disk",
        value:
          formatter.bytes(summary?.disk_usage_summary?.used_in_bytes) +
          "/" +
          formatter.bytes(summary?.disk_usage_summary?.total_in_bytes),
          title: formatMessage({ id: "cluster.monitor.summary.storage" }),
      },
      {
        key: "agent_status",
        value: value.agent_status || "N/A",
        title: formatMessage({ id: "cluster.monitor.summary.agent_status" }),
      },
    ];
  }
  return (
    <OverviewStatistic data={overviewStatistic} isMask={!isAvailable}>
      {/* {!isAvailable ? (
        <div className={"mask"}>
          <div>
            Host is not availabe since:{" "}
            {nodeValue?.timestamp
              ? formatUtcTimeToLocal(nodeValue?.timestamp)
              : "N/A"}
          </div>
        </div>
      ) : null} */}
    </OverviewStatistic>
  );
}
