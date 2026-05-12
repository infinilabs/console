import {
  Card,
  Table,
  Popconfirm,
  Divider,
  Form,
  Row,
  Col,
  Button,
  Input,
  message,
  Switch,
} from "antd";
import { connect } from "dva";
import { ConsoleUI } from "@/pages/DevTool/Console";

const Index = (props) => {
  return (
    <div style={{ height: props.height }}>
      <Card
        bordered={false}
        style={{ height: "100%" }}
        bodyStyle={{ padding: 0, height: "100%" }}
      >
        <ConsoleUI
          selectedCluster={props.selectedCluster}
          clusterList={props.clusterList}
          visible={true}
          minimize={false}
          onMinimizeClick={() => {}}
          clusterStatus={props.clusterStatus}
          resizeable={false}
          height={props.height}
          mode="page"
        />
      </Card>
    </div>
  );
};

export default connect(({ global }) => ({
  selectedCluster: global.selectedCluster,
  clusterList: global.clusterList,
  clusterStatus: global.clusterStatus,
  height: window.innerHeight - 64 + "px",
}))(Index);
