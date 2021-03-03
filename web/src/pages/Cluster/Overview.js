import React, {Fragment} from 'react';
import {Card, List, Divider, Popconfirm, Row, Col, Table, Descriptions, Button} from "antd";
import {Link} from "umi"
import moment from "moment";
import styles from "./Overview.less";
import {connect} from "dva";
import {ClusterItem} from "./ClusterList";

let HealthCircle = (props)=>{
  return (
    <div style={{
      background: props.color,
      width: 12,
      height: 12,
      borderRadius: 12,
      display: "inline-block",
      marginRight: 3,
    }}></div>
  )
}

@connect(({global}) => ({
  selectedCluster: global.selectedCluster
}))

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

  clusterItem = {
    name: 'cluster-test-name4',
    nodes: [{
      name: 'node-32',
      status: 'green'
    },{
      name: 'node-33',
      status: 'green'
    },{
      name: 'node-34',
      status: 'green'
    },{
      name: 'node-35',
      status: 'green'
    },{
      name: 'node-36',
      status: 'green'
    },{
      name: 'node-37',
      status: 'yellow'
    },{
      name: 'node-33',
      status: 'green'
    },{
      name: 'node-34',
      status: 'green'
    },{
      name: 'node-35',
      status: 'green'
    },{
      name: 'node-36',
      status: 'green'
    },{
      name: 'node-37',
      status: 'yellow'
    },{
      name: 'node-33',
      status: 'green'
    },{
      name: 'node-34',
      status: 'green'
    },{
      name: 'node-35',
      status: 'green'
    },{
      name: 'node-36',
      status: 'green'
    },{
      name: 'node-37',
      status: 'yellow'
    },{
      name: 'node-33',
      status: 'green'
    },{
      name: 'node-34',
      status: 'green'
    },{
      name: 'node-35',
      status: 'green'
    },{
      name: 'node-36',
      status: 'green'
    },{
      name: 'node-37',
      status: 'yellow'
    },{
      name: 'node-38',
      status: 'green'
    }],
  };

  handleChangeClusterById = () =>{
    const {dispatch} = this.props;
    dispatch({
      type: 'global/changeClusterById',
      payload: {
        id: "c0oc4kkgq9s8qss2uk51"
      }
    })
  }

  render() {

    return (
        <div>
          <Button type="primary" onClick={this.handleChangeClusterById}>change cluster</Button>
          <Card title={this.props.selectedCluster?this.props.selectedCluster.name:''}>
            <Row gutter={[16,16]}>
              <Col xs={24} sm={12} md={12} lg={8} >
                <Card title="Summary" size={"small"}>
                  <Descriptions column={1} bordered colon={false} className={styles.overview}>
                    <Descriptions.Item label="Health"><HealthCircle color="green"/>Healthy</Descriptions.Item>
                    <Descriptions.Item label="Version">7.10.0</Descriptions.Item>
                    <Descriptions.Item label="Uptime">3 天</Descriptions.Item>
                    <Descriptions.Item label="License">Basic</Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={12} lg={8}>
                <Card title="Nodes:2" size={"small"}>
                  <Descriptions column={1} bordered colon={false} size="small" className={styles.overview}>
                    <Descriptions.Item label="Disk Available">
                      83.21%
                      <p className={styles.light}>775.1 GB / 931.5 GB</p>
                    </Descriptions.Item>
                    <Descriptions.Item label="JVM Heap">
                      27.60%
                      <p className={styles.light}>565.3 GB / 2.0 GB</p>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={12} lg={8}>
                <Card title="Indices:27" size={"small"}>
                  <Descriptions column={1} bordered colon={false} className={styles.overview}>
                    <Descriptions.Item label="Documents">20,812,087</Descriptions.Item>
                    <Descriptions.Item label="Disk Usage">1.1 GB</Descriptions.Item>
                    <Descriptions.Item label="Primary Shards">28</Descriptions.Item>
                    <Descriptions.Item label="Replica Shards">26</Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>
          </Card>

          <Card title={this.clusterItem.name + ": "+ this.clusterItem.nodes.length}
                extra={<Link to={"/cluster/monitoring/" + this.clusterItem.name}>查看更多</Link>}
          >
            <div className={styles.clusterItemCard}>
              {/* {item.nodes.map(node => {
                    return (<a><Tag style={{marginBottom:5}} color={node.status}>{node.name}</Tag></a>);
                  })} */}
              <ClusterItem data={this.clusterItem} />
            </div>
          </Card>
        </div>
    )
  }
}

export  default Overview;
