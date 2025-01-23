import { Icon, Tabs } from "antd";
import { formatMessage } from "umi/locale";
import { useMemo, useState } from "react";
import NodeMetric from "../../components/node_metric";
import IndexMetric from "../../components/index_metric";
import ClusterMetric from "../../components/cluster_metric";
import QueueMetric from "../../components/queue_metric";
import { ESPrefix } from "@/services/common";
import { SearchEngines } from "@/lib/search_engines";
import TopN from "../../components/TopN";

export default (props) => {

  const { isAgent } = props

  const [param, setParam] = useState({
    tab: "node",
  });
  return (
    <Tabs
      type="card"
      tabBarGutter={10}
      tabPosition="right"
      destroyInactiveTabPane
      animated={false}
      activeKey={param?.tab}
      onChange={(key) => {
        setParam({
          tab: key,
        });
      }}
    >
      <Tabs.TabPane
        key="node"
        tab={formatMessage({
          id: "cluster.monitor.node.title",
        })}
      >
        <TopN type={param?.tab} {...props}/>
      </Tabs.TabPane>
      <Tabs.TabPane
        key="index"
        tab={formatMessage({
          id: "cluster.monitor.index.title",
        })}
      >
        <TopN type={param?.tab} {...props}/>
      </Tabs.TabPane>
      {
        isAgent && (
            <Tabs.TabPane
                key="shard"
                tab={formatMessage({
                id: "cluster.monitor.shard.title",
                })}
            >
              <TopN type={param?.tab} {...props}/>
            </Tabs.TabPane>
        )
      }
    </Tabs>
  );
}
