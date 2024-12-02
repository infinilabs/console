import { useState } from "react";
import StatisticBar from "./statistic_bar";
import NodeMetric from "../../node_metric";

const timezone = "local";

const Advanced = ({
  clusterID,
  nodeID,
  transportAddress,
  timeRange,
  handleTimeChange,
  setSpinning,
}) => {
  if (!clusterID || !nodeID) {
    return null;
  }
  const [param, setParam] = useState({
    show_top: false,
    node_name: transportAddress,
  });
  return (
    <div>
      <StatisticBar
        clusterID={clusterID}
        nodeID={nodeID}
        timeRange={timeRange}
        setSpinning={setSpinning}
      />
      <div style={{ marginTop: 15 }}>
        <NodeMetric
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
