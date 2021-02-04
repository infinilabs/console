import React, { Component,Fragment } from 'react';
import { connect } from 'dva';
import { Card,Form,Input, Select,Button,message,Divider,Drawer,Table } from 'antd';
const { Option } = Select;
import { formatMessage, FormattedMessage } from 'umi/locale';

@connect(({logstash,loading }) => ({
}))

@Form.create()
class Repository extends Component {
  state = {
    drawerVisible: false,
  };
  componentDidMount() {
  }

  handleRepoClick = ()=>{
    this.setState({
      drawerVisible: true,
    });
  }
  repoColumns = [
    {
      title: '仓库名',
      dataIndex: 'id',
      render: (text, record) => (<Fragment>
          <a onClick={() => this.handleRepoClick(record)}>{record.id}</a>
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
    return (
      <div>
        <div style={{marginBottom: 10}}>
          <Button icon="plus" type="primary" onClick={() => {}}>
            新建
          </Button>
        </div>
        <Table
          bordered
          dataSource={this.repoData}
          columns={this.repoColumns}
          rowKey="id"
        />
      </div>
    );
  }

  onCloseRep = () => {
    this.setState({
      drawerVisible: false,
    });
  };



  render() {
    return (
      <Fragment>
        <Card
          bordered={false}
          onTabChange={this.onOperationTabChange}
        >
          <div>
            {this.repoTable()}
            <Drawer
              title="仓库"
              placement="right"
              width={720}
              visible={this.state.drawerVisible}
              onClose={this.onCloseRep}
            >
              <p>Some contents...</p>
              <p>Some contents...</p>
              <p>Some contents...</p>
            </Drawer>
          </div>
        </Card>
      </Fragment>
    );
  }
}

export default Repository;
