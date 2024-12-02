import { useState,useEffect } from "react";
import { Tabs } from "antd";
import NodeMetric from "../../components/node_metric";
import QueueMetric from "../../components/queue_metric";
import { formatMessage } from "umi/locale";

const timezone = "local";

export default ({
  clusterID,
  nodeID,
  timeRange,
  handleTimeChange,
  bucketSize,
}) => {
  const [param, setParam] = useState({
    show_top: false,
    node_name: nodeID,
    tab: "node",
  });
  return (
    <Tabs
      type="card"
      tabBarGutter={10}
      tabPosition="right"
      destroyInactiveTabPane
      animated={false}
      activeKey={
        ["node", "queue"].includes(param?.tab)
          ? param?.tab
          : "node"
      }
      onChange={(key) => {
        setParam((st)=>{
          return {
            ...st,
            tab: key,
          }
        });
      }}
    >
      <Tabs.TabPane
        key="node"
        tab={formatMessage({
          id: "cluster.monitor.node.title",
        })}
      >
        <NodeMetric
          clusterID={clusterID}
          timezone={timezone}
          timeRange={timeRange}
          handleTimeChange={handleTimeChange}
          param={param}
          setParam={setParam}
          bucketSize={bucketSize}
        />
      </Tabs.TabPane>
      <Tabs.TabPane
        key="queue"
        tab={formatMessage({
          id: "cluster.monitor.queue.title",
        })}
      >
        <QueueMetric
          clusterID={clusterID}
          timezone={timezone}
          timeRange={timeRange}
          handleTimeChange={handleTimeChange}
          param={param}
          setParam={setParam}
          bucketSize={bucketSize}
        />
      </Tabs.TabPane>
    </Tabs>
  );
}