import { useState } from "react";
import StatisticBar from "./statistic_bar";
import IndexMetric from "../../components/index_metric";

const timezone = "local";

export default ({
  clusterID,
  indexName,
  timeRange,
  handleTimeChange,
  shardID,
  bucketSize
}) => {
  const [param, setParam] = useState({
    show_top: false,
    index_name: indexName,
  });
  return (
    <IndexMetric
      clusterID={clusterID}
      timezone={timezone}
      timeRange={timeRange}
      handleTimeChange={handleTimeChange}
      param={param}
      setParam={setParam}
      shardID={shardID}
      bucketSize={bucketSize}
    />
  );
}
