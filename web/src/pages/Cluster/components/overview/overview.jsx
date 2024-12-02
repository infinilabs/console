import StatisticBar from "./statistic_bar";
import ClusterMetric from "../cluster_metric";

const timezone = "local";

const Overview = ({
  clusterID,
  timeRange,
  handleTimeChange,
  setSpinning,
  clusterAvailable,
  clusterMonitored,
}) => {
  if (!clusterID) {
    return null;
  }

  return (
    <div>
      <StatisticBar
        clusterID={clusterID}
        timeRange={timeRange}
        setSpinning={setSpinning}
        clusterAvailable={clusterAvailable}
        clusterMonitored={clusterMonitored}
      />
      <div style={{ marginTop: 15 }}>
        <ClusterMetric
          clusterID={clusterID}
          timezone={timezone}
          timeRange={timeRange}
          handleTimeChange={handleTimeChange}
          overview={1}
        />
      </div>
    </div>
  );
};

export default Overview;
