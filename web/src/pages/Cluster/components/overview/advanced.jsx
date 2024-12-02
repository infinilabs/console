import { Tabs } from "antd";
import { formatMessage } from "umi/locale";
import { useState } from "react";
import StatisticBar from "./statistic_bar";
import NodeMetric from "../node_metric";
import IndexMetric from "../index_metric";
import ClusterMetric from "../cluster_metric";
import QueueMetric from "../queue_metric";
// import StorageMetric from "../storage_metric";

const timezone = "local";

const Advanced = ({
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

  const [param, setParam] = useState({
    tab: "cluster",
  });
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
        <Tabs
          type="card"
          tabBarGutter={10}
          tabPosition="right"
          destroyInactiveTabPane
          animated={false}
          activeKey={
            ["cluster", "node", "index", "queue"].includes(param?.tab)
              ? param?.tab
              : "cluster"
          }
          onChange={(key) => {
            setParam({
              tab: key,
            });
          }}
        >
          <Tabs.TabPane
            key="cluster"
            tab={formatMessage({
              id: "cluster.monitor.cluster.title",
            })}
          >
            <ClusterMetric
              clusterID={clusterID}
              timezone={timezone}
              timeRange={timeRange}
              handleTimeChange={handleTimeChange}
            />
          </Tabs.TabPane>
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
            />
          </Tabs.TabPane>
          <Tabs.TabPane
            key="index"
            tab={formatMessage({
              id: "cluster.monitor.index.title",
            })}
          >
            <IndexMetric
              clusterID={clusterID}
              timezone={timezone}
              timeRange={timeRange}
              handleTimeChange={handleTimeChange}
              param={param}
              setParam={setParam}
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
            />
          </Tabs.TabPane>
          {/* <Tabs.TabPane
              key="storage"
              tab={formatMessage({
                id: "cluster.monitor.queue.storage",
              })}
            >
              <StorageMetric
                clusterID={clusterID}
                timezone={timezone}
                timeRange={timeRange}
              />
            </Tabs.TabPane> */}
        </Tabs>
      </div>
    </div>
  );
};

export default Advanced;
