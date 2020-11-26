import React, { Component,Fragment } from 'react';
import { connect } from 'dva';
import { Card,Form,Input, Select,Button,message,Divider,Drawer,Descriptions } from 'antd';
const { Option } = Select;
import { formatMessage, FormattedMessage } from 'umi/locale';
import StandardTable from '@/components/StandardTable';
import styles from './BakAndRestore.less';
const FormItem = Form.Item;
const { TextArea } = Input;
const operationTabList = [
    {
      key: 'tab1',
      tab: '快照',
    },
    {
      key: 'tab2',
      tab: '仓库',
    }
  ];

@connect(({logstash,loading }) => ({
    data: logstash.logstash,
    loading: loading.models.logstash,
    submitting: loading.effects['logstash/submitLogstashConfig'],
}))

@Form.create()
class BakAndRestore extends Component {
    state = {
        operationkey: 'tab1',
        snapshotVisible: false,
        repVisible: false,
    };
  componentDidMount() {
    // message.loading('数据加载中..', 'initdata');
    // const { dispatch } = this.props;
    // dispatch({
    //   type: 'logstash/queryInitialLogstashConfig',
    // });
  }
  onOperationTabChange = key => {
    this.setState({ operationkey: key });
  };

  handleSnapshotClick(record){
    this.setState({
      snapshotVisible: true,
    });
  }

  repoColumns = [
    {
      title: '仓库名',
      dataIndex: 'id',
      render: (text, record) => (<Fragment>
        <a onClick={() => this.handleSnapshotClick(record)}>{record.id}</a>
        </Fragment>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'dateCreated'
    },
    {
      title: '操作',
      render: (text, record) => (
        <Fragment>
          {/* <a onClick={() => this.handleDownload(record)}>下载</a>
          <Divider type="vertical" /> */}
          <a onClick={() => {
            this.state.selectedRows.push(record);
            this.handleDeleteClick();
          }}>删除</a>
        </Fragment>
      ),
    },
  ];

  repoData = [{
    id: "my_local_repo",
    dateCreated: "2020-10-09 20:30:23",
  }];
  
  repoTable = () =>{
    var data = {
      list: this.repoData,
      pagination: {
        pageSize: 5,
      }
    };
    return (
      <div>
         <div style={{marginBottom: 10}}>
            <Button icon="plus" type="primary" onClick={() => {}}>
              新建
            </Button>
        </div>
        <StandardTable
          selectedRows={[]}
          data={data}
          columns={this.repoColumns}
        /> 
      </div>
    );
  };

  onCloseRep = () => {
    this.setState({
      repVisible: false,
    });
  };

  snapshotColumns = [
    {
      title: '快照',
      dataIndex: 'id',
      render: (text, record) => (<Fragment>
        <a onClick={() => this.handleSnapshotClick(record)}>{record.id}</a>
        </Fragment>
      )
    },
    {
      title: '仓库',
      dataIndex: 'repository',
    },
    {
      title: '索引个数',
      dataIndex: 'indices'
    },
    {
      title: '分片个数',
      dataIndex: 'shards'
    },
    {
      title: '时长',
      dataIndex: 'duration'
    },
    {
      title: '创建时间',
      dataIndex: 'dateCreated'
    },
    {
      title: '操作',
      render: (text, record) => (
        <Fragment>
          <a onClick={() => this.handleDownload(record)}>下载</a>
          <Divider type="vertical" />
          <a onClick={() => {
            this.state.selectedRows.push(record);
            this.handleDeleteClick();
          }}>删除</a>
        </Fragment>
      ),
    },
  ];

  snapshotData = [{
    id: "cluster_snapshot_1",
    repository: "my_local_repo",
    indices: 5,
    shards: 5,
    duration: "2s",
    dateCreated: "2020-10-09 20:30:23",
  }];
  
  snapshotTable = () =>{
    var data = {
      list: this.snapshotData,
      pagination: {
        pageSize: 5,
      }
    };
    return (
      <div>
         <div style={{marginBottom: 10}}>
            <Button icon="plus" type="primary" onClick={() => {}}>
              新建
            </Button>
        </div>
        <StandardTable
          selectedRows={[]}
          data={data}
          columns={this.snapshotColumns}
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
    const { operationkey } = this.state;
    const contentList = {
        tab1: (
          <div>
            {this.snapshotTable()}
          </div>
        ),
        tab2: (
          <div>
            {this.repoTable()}
            <Drawer
              title="仓库"
              placement="right"
              width={720}
              onClose={this.onCloseRepo}
              visible={this.state.repoVisible}
            >
              <p>Some contents...</p>
              <p>Some contents...</p>
              <p>Some contents...</p>
            </Drawer>
          </div>
        )
      };
    return (
        <Fragment>
            <Card
            className={styles.tabsCard}
            bordered={false}
            tabList={operationTabList}
            onTabChange={this.onOperationTabChange}
            >
            {contentList[operationkey]}
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
                  <Descriptions.Item label="快照名称" span={2}>cluster_snapshot_1</Descriptions.Item>
                  <Descriptions.Item label="时长">2s</Descriptions.Item>
                  <Descriptions.Item label="仓库" span={3}>
                    <Select value="my_local_repo" style={{width:200}}>
                      <Select.Option value="my_local_repo">my_local_repo</Select.Option>
                      <Select.Option value="remote_aws_repo">remote_aws_repo</Select.Option>
                    </Select>
                  </Descriptions.Item>
                  <Descriptions.Item  span={3} label="创建时间">2020-10-09 20:30:23</Descriptions.Item>
                </Descriptions>
                <div className={styles.drawerFooter}>
                  <Button className={styles.btnRestore} type="primary" >恢复</Button>
                  <Button type="primary">保存</Button>
                </div>
                
              </div>
            </Drawer>
        </Fragment>
    );
  }
}

export default BakAndRestore;
