import React, { Component, Fragment } from "react";
import { connect } from "dva";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  message,
  Divider,
  Drawer,
  Descriptions,
  Table,
} from "antd";
const { Option } = Select;
import { formatMessage, FormattedMessage } from "umi/locale";
import StandardTable from "@/components/StandardTable";
import styles from "./BakAndRestore.less";

@connect(({}) => ({}))
@Form.create()
class BakAndRestore extends Component {
  state = {
    snapshotVisible: false,
  };
  componentDidMount() {
    // message.loading('数据加载中..', 'initdata');
    // const { dispatch } = this.props;
    // dispatch({
    //   type: 'logstash/queryInitialLogstashConfig',
    // });
  }

  handleSnapshotClick(record) {
    this.setState({
      snapshotVisible: true,
    });
  }

  repoColumns = [
    {
      title: "仓库名",
      dataIndex: "id",
      render: (text, record) => (
        <Fragment>
          <a onClick={() => this.handleSnapshotClick(record)}>{record.id}</a>
        </Fragment>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "dateCreated",
    },
    {
      title: "操作",
      render: (text, record) => (
        <Fragment>
          {/* <a onClick={() => this.handleDownload(record)}>下载</a>
          <Divider type="vertical" /> */}
          <a
            onClick={() => {
              this.state.selectedRows.push(record);
              this.handleDeleteClick();
            }}
          >
            删除
          </a>
        </Fragment>
      ),
    },
  ];
  snapshotColumns = [
    {
      title: "快照",
      dataIndex: "id",
      render: (text, record) => (
        <Fragment>
          <a onClick={() => this.handleSnapshotClick(record)}>{record.id}</a>
        </Fragment>
      ),
    },
    {
      title: "仓库",
      dataIndex: "repository",
    },
    {
      title: "索引个数",
      dataIndex: "indices",
    },
    {
      title: "分片个数",
      dataIndex: "shards",
    },
    {
      title: "时长",
      dataIndex: "duration",
    },
    {
      title: "创建时间",
      dataIndex: "dateCreated",
    },
    {
      title: "操作",
      render: (text, record) => (
        <Fragment>
          <a onClick={() => this.handleDownload(record)}>下载</a>
          <Divider type="vertical" />
          <a
            onClick={() => {
              this.state.selectedRows.push(record);
              this.handleDeleteClick();
            }}
          >
            删除
          </a>
        </Fragment>
      ),
    },
  ];

  snapshotData = [
    {
      id: "cluster_snapshot_1",
      repository: "my_local_repo",
      indices: 5,
      shards: 5,
      duration: "2s",
      dateCreated: "2020-10-09 20:30:23",
    },
  ];

  snapshotTable = () => {
    return (
      <div>
        <div style={{ marginBottom: 10 }}>
          <Button icon="plus" type="primary" onClick={() => {}}>
            新建
          </Button>
        </div>
        <Table
          size={"small"}
          columns={this.snapshotColumns}
          dataSource={this.snapshotData}
          bordered
        />
      </div>
    );
  };

  onCloseSnapshot = () => {
    this.setState({
      snapshotVisible: false,
    });
  };

  render() {
    return (
      <Fragment>
        <Card bordered={false}>
          <div>{this.snapshotTable()}</div>
        </Card>
        <Drawer
          title="快照"
          placement="right"
          width={720}
          onClose={this.onCloseSnapshot}
          className={styles.snapshotDrawer}
          visible={this.state.snapshotVisible}
        >
          <div>
            <Descriptions bordered>
              <Descriptions.Item label="快照名称" span={2}>
                cluster_snapshot_1
              </Descriptions.Item>
              <Descriptions.Item label="时长">2s</Descriptions.Item>
              <Descriptions.Item label="仓库" span={3}>
                <Select value="my_local_repo" style={{ width: 200 }}>
                  <Select.Option value="my_local_repo">
                    my_local_repo
                  </Select.Option>
                  <Select.Option value="remote_aws_repo">
                    remote_aws_repo
                  </Select.Option>
                </Select>
              </Descriptions.Item>
              <Descriptions.Item span={3} label="创建时间">
                2020-10-09 20:30:23
              </Descriptions.Item>
            </Descriptions>
            <div className={styles.drawerFooter}>
              <Button className={styles.btnRestore} type="primary">
                恢复
              </Button>
              <Button type="primary">保存</Button>
            </div>
          </div>
        </Drawer>
      </Fragment>
    );
  }
}

export default BakAndRestore;
