import React, {Fragment} from 'react';
import {Card, Divider, Popconfirm, Table} from "antd";
import Link from "_umi@2.13.16@umi/link";
import moment from "moment";

class Overview extends  React.Component {
  state = {
    data: [{id:"JFpIbacZQamv9hkgQEDZ2Q", name:"single-es", endpoint:"http://localhost:9200", health: "green", version: "7.10.0", uptime:"320883955"}]
  }

  clusterColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      render: (text, record) => (
        <div>
          <Link to='/cluster/monitoring'>{text}</Link>
        </div>
      ),
    },
    {
      title: '集群访问 URL',
      dataIndex: 'endpoint'
    },
    {
      title: '健康状态',
      dataIndex: 'health'
    },
    {
      title: '版本',
      dataIndex: 'version'
    },
    {
      title: '运行时长',
      dataIndex: 'uptime',
      render: (text, record) => (
        moment.duration(text).humanize()
      ),
    }
  ];
  render() {
    return (<Card>
      <Table
        bordered
        dataSource={this.state.data}
        columns={this.clusterColumns}
        rowKey="id"
      />
    </Card>)
  }
}

export  default Overview;