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
    <Card bordered={false} bodyStyle={{ padding: 0 }}>
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
  );
};

export default connect(({ global }) => ({
  selectedCluster: global.selectedCluster,
  clusterList: global.clusterList,
  clusterStatus: global.clusterStatus,
  height: window.innerHeight - 80 + "px",
}))(Index);
