import { ESPrefix } from "@/services/common";
import StatisticBar from "./statistic_bar";
import ClusterMetric from "../../cluster_metric";

const timezone = "local";

const Overview = ({
  clusterID,
  indexName,
  timeRange,
  handleTimeChange,
  setSpinning,
}) => {
  if (!clusterID || !indexName) {
    return null;
  }

  return (
    <div>
      <StatisticBar
        clusterID={clusterID}
        indexName={indexName}
        timeRange={timeRange}
        setSpinning={setSpinning}
      />
      <div style={{ marginTop: 15 }}>
        <ClusterMetric
          clusterID={clusterID}
          timezone={timezone}
          timeRange={timeRange}
          handleTimeChange={handleTimeChange}
          overview={1}
          fetchUrl={`${ESPrefix}/${clusterID}/index/${indexName}/metrics`}
        />
      </div>
    </div>
  );
};

export default Overview;
