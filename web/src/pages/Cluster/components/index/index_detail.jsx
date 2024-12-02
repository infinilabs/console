import { Tabs } from "antd";
import { Metrics } from "./detail/metrics";
import { Infos } from "./detail/infos";
import { formatter } from "@/utils/format";
import moment from "moment";

const { TabPane } = Tabs;

const panes = [
  { title: "Metrics", component: Metrics, key: "metrics" },
  { title: "Infos", component: Infos, key: "infos" },
];

const IndexDetail = (props) => {
  const data = props.data;
  if (!data?._source) {
    return null;
  }

  return (
    <div className="card-detail">
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

export default IndexDetail;
