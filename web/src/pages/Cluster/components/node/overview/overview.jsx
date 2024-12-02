import { ESPrefix } from "@/services/common";
import StatisticBar from "./statistic_bar";
import ClusterMetric from "../../cluster_metric";

const timezone = "local";

const Overview = ({
  clusterID,
  nodeID,
  timeRange,
  handleTimeChange,
  setSpinning,
}) => {
  if (!clusterID || !nodeID) {
    return null;
  }

  return (
    <div>
      <StatisticBar
        clusterID={clusterID}
        nodeID={nodeID}
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
          fetchUrl={`${ESPrefix}/${clusterID}/node/${nodeID}/metrics`}
        />
      </div>
    </div>
  );
};

export default Overview;
