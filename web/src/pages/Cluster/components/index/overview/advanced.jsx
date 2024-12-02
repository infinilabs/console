import { useState } from "react";
import StatisticBar from "./statistic_bar";
import IndexMetric from "../../index_metric";

const timezone = "local";

const Advanced = ({
  clusterID,
  indexName,
  timeRange,
  handleTimeChange,
  setSpinning,
}) => {
  if (!clusterID || !indexName) {
    return null;
  }
  const [param, setParam] = useState({
    show_top: false,
    index_name: indexName,
  });
  return (
    <div>
      <StatisticBar
        clusterID={clusterID}
        indexName={indexName}
        timeRange={timeRange}
        setSpinning={setSpinning}
      />
      <div style={{ marginTop: 15 }}>
        <IndexMetric
          clusterID={clusterID}
          timezone={timezone}
          timeRange={timeRange}
          handleTimeChange={handleTimeChange}
          param={param}
          setParam={setParam}
        />
      </div>
    </div>
  );
};

export default Advanced;
