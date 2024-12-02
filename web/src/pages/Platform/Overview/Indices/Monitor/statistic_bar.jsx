import * as React from "react";
import useFetch from "@/lib/hooks/use_fetch";
import { ESPrefix } from "@/services/common";
import { formatter } from "@/utils/format";
import { HealthStatusCircle } from "@/components/infini/health_status_circle";
import OverviewStatistic from "../../components/overview_statistic";
import { formatUtcTimeToLocal } from "@/utils/utils";

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
        title: "Health",
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
        title: "Status",
        value: indexValue?.index_info?.status ?? "N/A",
      },
      {
        key: "Total",
        title: "Total",
        value: indexValue?.index_info?.store_size?.toUpperCase() ?? "N/A",
      },
      {
        key: "Primaries",
        title: "Primaries",
        value: indexValue?.index_info?.pri_store_size?.toUpperCase() ?? "N/A",
      },
      {
        key: "Documents",
        title: "Documents",
        value: formatter.number(indexValue?.index_info?.docs_count || 0),
      },
      {
        key: "Total shards",
        title: "Total shards",
        value: indexValue?.index_info?.shards ?? "N/A",
      },
      {
        key: "Unassigned shards",
        title: "Unassigned shards",
        value: indexValue?.unassigned_shards ?? "N/A",
      },
      {
        key: "Updated",
        title: "Updated",
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
            Index is{" "}
            {indexValue?.index_info?.status == "delete" ||
            indexValue?.index_info?.status == "close"
              ? `${indexValue?.index_info?.status}d`
              : "not availabe"}{" "}
            since:{" "}
            {indexValue?.timestamp
              ? formatUtcTimeToLocal(indexValue?.timestamp)
              : "N/A"}
          </div>
        </div>
      ) : null}
    </OverviewStatistic>
  );
};

export default StatisticBar;
