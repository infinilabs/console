import { Tabs } from "antd";

interface IProps {
  data: any;
  details: any[];
  onClose: () => void
}


export default (props: IProps) => {

  const { data, details, onClose } = props;

  if (!data) {
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
        {details.map((pane) => (
          <Tabs.TabPane tab={pane.title} key={pane.key}>
            {typeof pane.component == "string" ? (
              pane.component
            ) : (
              <pane.component data={data} onClose={onClose} />
            )}
          </Tabs.TabPane>
        ))}
      </Tabs>
    </div>
  );
}
