import { Tabs } from "antd";
import { formatMessage } from "umi/locale";
import { useState } from "react";
import NodeMetric from "../../components/node_metric";
import IndexMetric from "../../components/index_metric";
import ClusterMetric from "../../components/cluster_metric";
import QueueMetric from "../../components/queue_metric";
import { ESPrefix } from "@/services/common";

const timezone = "local";

export default ({
  clusterID,
  timeRange,
  handleTimeChange,
  bucketSize,
}) => {
  const [param, setParam] = useState({
    tab: "cluster",
  });
  return (
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
          timezone={timezone}
          timeRange={timeRange}
          handleTimeChange={handleTimeChange}
          fetchUrl={`${ESPrefix}/${clusterID}/cluster_metrics`}
          bucketSize={bucketSize}
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
          bucketSize={bucketSize}
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
  );
}
