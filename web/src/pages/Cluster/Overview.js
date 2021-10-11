import React from 'react';
import {List,Card,Row,Icon,Col, Table} from "antd";
import styles from "./Overview.less";
import {connect} from "dva";
import {formatGigNumber} from "@/utils/utils";
import {HealthStatusCircle} from '@/components/infini/health_status_circle';
import {formatter} from '@/lib/format';
import Link from 'umi/link';


const tabList = [
    {
        key: 'tabCluster',
        tab: '集群',
    },
    // {
    //     key: 'tabHost',
    //     tab: '主机',
    // },
    // {
    //     key: 'tabNode',
    //     tab: '节点',
    // },
];


@connect(({clusterOverview, global}) => ({
  clusterList: clusterOverview.clusterList,
  clusterStatus: global.clusterStatus,
  overview: clusterOverview.overview,
}))


class Overview extends  React.Component {
    state = {
        tabkey: 'tabCluster',
    };
    clusterColumns = [{
        title: '集群名称',
        dataIndex: 'name',
        key: 'name',
        render:(val, item)=>{
            return <Link to={`/cluster/metrics/elasticsearch/${item.id}`}>{val}</Link>;
        }
      },{
        title: '健康状态',
        dataIndex: 'id',
        key: 'health_status',
        render: (val)=>{
          const {clusterStatus} = this.props;
          if(!clusterStatus || !clusterStatus[val]){
            return
          }
          const isAvailable = clusterStatus[val].available;
          if(!isAvailable){
            return <Icon type="close-circle" style={{width:14, height:14, color:'red',borderRadius: 14, boxShadow: '0px 0px 5px #555'}}/>
          }
          const status = clusterStatus[val].health?.status;
          return <HealthStatusCircle  status={status}/>
          
        }
      },{
        title: '所属业务',
        dataIndex: 'business',
        key: 'business',
        render: ()=>{
          return 'eu-de-1'
        }
      },
      {
        title: '所属部门',
        dataIndex: 'business_department',
        key: 'business_department',
        render: ()=>{
          return '部门X'
        }
      }, {
        title: '部署环境',
        dataIndex: 'deploy_env',
        key: 'deploy_env',
        render: ()=>{
          return 'PROD'
        }
      },{
        title: '程序版本',
        dataIndex: 'version',
        key: 'elasticsearch_version',
        // render: (data)=>{
        //   return 
        // }
      },{
        title: '节点数',
        dataIndex: 'id',
        key: 'number_of_nodes',
        render: (val)=>{
          const {clusterStatus} = this.props;
          if(!clusterStatus || !clusterStatus[val]){
            return
          }
          return clusterStatus[val].health?.number_of_nodes;
        }
      },{
        title: '集群地址',
        dataIndex: 'host',
        key: 'host',
      },
      {
          title: '监控启用状态',
          dataIndex: 'monitored',
          key: 'monitored',
          render: (val) => {
            return val? '启用': '关闭';
          }
    }]

    onOperationTabChange = key => {
        this.setState({ tabkey: key });
    };

    getClusterList = (params)=>{
        const {dispatch} = this.props;
        dispatch({
          type: 'clusterOverview/fetchClusterList',
          payload: params,
        })
    }
    getOverviewData = (params)=>{
        const {dispatch} = this.props;
        dispatch({
          type: 'clusterOverview/fetchOverview',
        })
    }
    componentDidMount() {
        this.getClusterList({size:20})
        this.getOverviewData();
    }

    render() {

        const {  tabkey } = this.state;
        const {clusterList, overview} = this.props;

        const contentList = {
          tabCluster: (
              <Card style={{ marginBottom: 24 }} bordered={false}>
                  {/* <div>
                      <Icon type="frown-o" />
                      暂无数据
                  </div> */}
                <Table
                bordered
                columns={this.clusterColumns}
                dataSource={clusterList?.data}
                rowKey='id'
                pagination={{
                    total: clusterList?.total?.value,
                    pageSize: 20,
                    onChange: (page, pageSize)=>{
                        this.getClusterList({
                            size: pageSize,
                            from: (page - 1)*pageSize,
                        })
                    }
                }}
                />
              </Card>
          ),
          tabHost: (
              <Card title="主机列表" style={{ marginBottom: 24 }} bordered={false}>
                  <div>
                      <Icon type="frown-o" />
                      暂无数据
                  </div>
              </Card>
          ),
          tabNode: (
              <Card title="节点列表" style={{ marginBottom: 24 }} bordered={false}>
                  <div>
                      <Icon type="frown-o" />
                      暂无数据
                  </div>
              </Card>
          ),
      };
      const totalStoreSize = formatter.bytes(overview?.total_store_size_in_bytes || 0);

        return (
          <div>
              <Row gutter={24} className={styles.rowSpace}>
                  <Col md={6} sm={12}>
                      <Card
                          bodyStyle={{ paddingBottom: 20 }}
                          className={styles.clusterMeta}
                      >
                          <Card.Meta title='集群总数' className={styles.title} />
                          <div>
                              <span className={styles.total}>{clusterList?.total?.value}</span>
                          </div>
                      </Card>
                  </Col>
                  <Col md={6} sm={12}>
                      <Card
                          bodyStyle={{ paddingBottom: 20 }}
                          className={styles.clusterMeta}
                      >
                          <Card.Meta title='主机总数' className={styles.title} />
                          <div>
                              <span className={styles.total}>{overview?.total_host}</span>
                          </div>
                      </Card>
                  </Col>
                  <Col md={6} sm={12}>
                      <Card
                          bodyStyle={{ paddingBottom: 20 }}
                          className={styles.clusterMeta}
                      >
                          <Card.Meta title='节点总数' className={styles.title} />
                          <div>
                              <span className={styles.total}>{overview?.total_node}</span>
                          </div>
                      </Card>
                  </Col>
                  <Col md={6} sm={12}>
                      <Card
                          bodyStyle={{ paddingBottom: 20 }}
                          className={styles.clusterMeta}
                      >
                          <Card.Meta title='存储空间' className={styles.title} />
                          <div>
                              <span className={styles.total}>{totalStoreSize.size || '-'}</span><span className={styles.unit}>{totalStoreSize.unit}</span>
                          </div>
                      </Card>
                  </Col>
              </Row>

              <Row gutter={24} className={styles.rowSpace}>
                  <Col lg={24} md={24}>
                      <Card
                          className={styles.tabsCard}
                          bordered={false}
                          tabList={tabList}
                          onTabChange={this.onOperationTabChange}
                      >
                          {contentList[tabkey]}
                      </Card>
                  </Col>
              </Row>
          </div>
      )
    }
}

export  default Overview;
