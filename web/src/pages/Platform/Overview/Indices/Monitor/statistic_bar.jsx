import * as React from "react";
import useFetch from "@/lib/hooks/use_fetch";
import { ESPrefix } from "@/services/common";
import { formatter } from "@/utils/format";
import { HealthStatusCircle } from "@/components/infini/health_status_circle";
import OverviewStatistic from "../../components/overview_statistic";
import { formatUtcTimeToLocal } from "@/utils/utils";
import { formatMessage } from "umi/locale";

const vstyle = {
  fontSize: 12,
  wordBreak: "break-all",
  fontWeight: "bold",
};

const StatisticBar = ({ clusterID, indexName, timeRange, setSpinning }) => {
  if (!clusterID || !indexName) {
    return null;
  }
  const {
    loading,
    error,
    value: indexValue,
  } = useFetch(
    `${ESPrefix}/${clusterID}/index/${clusterID}:${indexName}/info`,
    {},
    [clusterID, indexName, timeRange]
  );

  React.useEffect(() => {
    setSpinning(loading);
  }, [loading]);

  const isAvailable =
    loading ||
    (indexValue?.index_info?.health &&
      ["N/A", "unavailable"].indexOf(indexValue?.index_info?.health) == -1)
      ? true
      : false;
  let overviewStatistic = [];
  if (indexValue?.index_info) {
    overviewStatistic = [
      {
        key: "Health",
        title: formatMessage({ id: "indices.field.health" }),
        value: indexValue?.index_info?.health,
        vstyle: {
          ...vstyle,
          display: "flex",
          alignItems: "center",
        },
        prefix: <HealthStatusCircle status={indexValue?.index_info?.health} />,
      },
      {
        key: "Status",
        title: formatMessage({ id: "indices.field.status" }),
        value: indexValue?.index_info?.status ?? "N/A",
      },
      {
        key: "Total",
        title: formatMessage({ id: "indices.field.store_size" }),
        value: indexValue?.index_info?.store_size?.toUpperCase() ?? "N/A",
      },
      {
        key: "Primaries",
        title: formatMessage({ id: "indices.field.primary_store_size" }),
        value: indexValue?.index_info?.pri_store_size?.toUpperCase() ?? "N/A",
      },
      {
        key: "Documents",
        title: formatMessage({ id: "indices.field.docs_count" }),
        value: formatter.number(indexValue?.index_info?.docs_count || 0),
      },
      {
        key: "Total shards",
        title: formatMessage({ id: "overview.statistic.total_shards" }),
        value: indexValue?.index_info?.shards ?? "N/A",
      },
      {
        key: "Unassigned shards",
        title: formatMessage({ id: "cluster.monitor.summary.unassign_shard" }),
        value: indexValue?.unassigned_shards ?? "N/A",
      },
      {
        key: "Updated",
        title: formatMessage({ id: "overview.statistic.updated" }),
        value: indexValue?.timestamp
          ? formatUtcTimeToLocal(indexValue?.timestamp)
          : "N/A",
      },
    ];
  }

  return (
    <OverviewStatistic data={overviewStatistic} isMask={!isAvailable}>
      {!isAvailable ? (
        <div className={"mask"}>
          <div>
            {formatMessage(
              { id: "overview.status.index_since" },
              {
                status:
                  indexValue?.index_info?.status == "delete"
                    ? formatMessage({ id: "overview.status.deleted" })
                    : indexValue?.index_info?.status == "close"
                      ? formatMessage({ id: "overview.status.closed" })
                      : formatMessage({ id: "overview.status.unavailable" }),
                timestamp: indexValue?.timestamp
                  ? formatUtcTimeToLocal(indexValue?.timestamp)
                  : "N/A",
              }
            )}
          </div>
        </div>
      ) : null}
    </OverviewStatistic>
  );
};

export default StatisticBar;
