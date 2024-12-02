import { Tabs } from "antd";
import { Metrics } from "./detail/metrics";
import { Infos } from "./detail/infos";

const { TabPane } = Tabs;

const panes = [
  { title: "Metrics", component: Metrics, key: "metrics" },
  { title: "Infos", component: Infos, key: "infos" },
];

const HostDetail = (props) => {
  const data = props.data;
  if (!data) {
    return null;
  }

  return (
    <div className="card-detail">
      <div className="top-title">
        <span className="label">{data._source?.metadata?.name}</span>/
        <span className="label">
          {data._source?.metadata?.network?.[0]?.internal_ip}
        </span>
        /<span className="label">{data._source?.metadata?.os?.name}</span>/
        <span className="label">{data._source?.summary?.status || 'unavailable'}</span>
      </div>
      <Tabs
        onChange={() => {}}
        type="card"
        tabBarGutter={10}
        tabPosition="right"
      >
        {panes.map((pane) => (
          <TabPane tab={pane.title} key={pane.key}>
            {typeof pane.component == "string" ? (
              pane.component
            ) : (
              <pane.component data={props.data} />
            )}
          </TabPane>
        ))}
      </Tabs>
    </div>
  );
};

export default HostDetail;
