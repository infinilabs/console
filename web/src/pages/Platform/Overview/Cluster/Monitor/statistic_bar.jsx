import * as React from "react";
import { formatMessage } from "umi/locale";
import useFetch from "@/lib/hooks/use_fetch";
import { ESPrefix } from "@/services/common";
import request from "@/utils/request";
import { formatter } from "@/utils/format";
import { formatUtcTimeToLocal } from "@/utils/utils";
import moment from "moment";
import { HealthStatusCircle } from "@/components/infini/health_status_circle";
import OverviewStatistic from "../../components/overview_statistic";
import { Button } from "antd";
import Link from "umi/link";

const vstyle = {
  fontSize: 12,
  wordBreak: "break-all",
  fontWeight: "bold",
};

const StatisticBar = ({
  clusterID,
  timeRange,
  setSpinning,
  clusterAvailable,
  clusterMonitored,
}) => {
  const { loading, error, value } = useFetch(
    `${ESPrefix}/${clusterID}/metrics`,
    {},
    [clusterID, timeRange]
  );

  React.useEffect(() => {
    setSpinning(loading);
  }, [loading]);

  let overviewStatistic = [];
  if (value?.summary) {
    let rawStats = value.summary;
    overviewStatistic = [
      {
        key: "cluster_name",
        value: rawStats?.cluster_name || "N/A",
        title: formatMessage({ id: "cluster.monitor.summary.name" }),
      },
      {
        key: "uptime",
        value: rawStats?.uptime
          ? moment.duration(rawStats?.uptime).humanize()
          : "N/A",
        title: formatMessage({ id: "cluster.monitor.summary.online_time" }),
      },
      {
        key: "version",
        value: rawStats?.version || "N/A",
        title: formatMessage({ id: "cluster.monitor.summary.version" }),
      },
      {
        key: "status",
        value: rawStats?.status || "N/A",
        title: formatMessage({ id: "cluster.monitor.summary.health" }),
        vstyle: {
          ...vstyle,
          display: "flex",
          alignItems: "center",
        },
        prefix: <HealthStatusCircle status={rawStats?.status} />,
      },
      {
        key: "node_count",
        value: rawStats?.nodes_count,
        title: formatMessage({ id: "cluster.monitor.summary.node_count" }),
      },
      {
        key: "indices_count",
        value: formatter.number(rawStats?.indices_count),
        title: formatMessage({ id: "cluster.monitor.summary.total_index" }),
      },
      {
        key: "shard",
        value:
          formatter.number(rawStats?.primary_shards) +
          "/" +
          formatter.number(rawStats?.total_shards),
        title: formatMessage({ id: "cluster.monitor.summary.shard" }),
      },
      {
        key: "unassign_shard",
        value: formatter.number(rawStats?.unassigned_shards),
        title: formatMessage({ id: "cluster.monitor.summary.unassign_shard" }),
      },
      {
        key: "document_count",
        value: formatter.number(rawStats?.document_count),
        title: formatMessage({ id: "cluster.monitor.summary.total_docs" }),
      },
      {
        key: "storage",
        value:
          formatter.bytes(rawStats?.used_store_bytes) +
          "/" +
          formatter.bytes(rawStats?.max_store_bytes),
        title: formatMessage({ id: "cluster.monitor.summary.storage" }),
      },
      {
        key: "jvm",
        value:
          formatter.bytes(rawStats?.used_jvm_bytes) +
          "/" +
          formatter.bytes(rawStats?.max_jvm_bytes),
        title: formatMessage({ id: "cluster.monitor.summary.jvm" }),
      },
    ];
  }
  return (
    <OverviewStatistic
      data={overviewStatistic}
      isMask={!(clusterAvailable && clusterMonitored)}
    >
      {!clusterAvailable ? (
        <div className={"mask"}>
          <div>
            Cluster is not availabe since:{" "}
            {value?.summary?.timestamp
              ? formatUtcTimeToLocal(value?.summary?.timestamp)
              : "N/A"}
          </div>
        </div>
      ) : !clusterMonitored &&
        moment()
          .add(-1, "m")
          .isAfter(value?.summary?.timestamp) ? (
        <div className={"mask"}>
          <div>
            Cluster is not monitored.{" "}
            <Button type="primary">
              <Link to={`/resource/cluster/${clusterID}/edit`}>Go to open</Link>
            </Button>
          </div>
          <div>
            Last data collection time:{" "}
            {value?.summary?.timestamp
              ? formatUtcTimeToLocal(value?.summary?.timestamp)
              : "N/A"}
          </div>
        </div>
      ) : null}
    </OverviewStatistic>
  );
};

export default StatisticBar;
