import { Tabs } from "antd";
import { Metrics } from "./detail/metrics";
import { Infos } from "./detail/infos";
import { Gateway } from "./detail/gateway";
import { MetricTopN } from "./detail/metric_topn";

const { TabPane } = Tabs;

const panes = [
  { title: "Metrics", component: Metrics, key: "metrics" },
  { title: "TopN", component: MetricTopN, key: "topN" },
  { title: "Infos", component: Infos, key: "infos" },
  // { title: "Gateway", component: Gateway, key: "gateway" },
];

const ClusterDetail = (props) => {
  const data = props.data;
  if (!data || !data._source) {
    return null;
  }
  return (
    <div className="card-detail">
      <Tabs
        onChange={() => {}}
        type="card"
        tabBarGutter={10}
        tabPosition="right"
        destroyInactiveTabPane
      >
        {panes.map((pane) => (
          <TabPane tab={pane.title} key={pane.key}>
            {typeof pane.component == "string" ? (
              pane.component
            ) : (
              <pane.component data={data} />
            )}
          </TabPane>
        ))}
      </Tabs>
    </div>
  );
};

export default ClusterDetail;
