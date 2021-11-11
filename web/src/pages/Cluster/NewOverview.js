import * as React from 'react';
import {Tabs, Row, Col, Card} from 'antd';
import Clusters from './components/clusters';
import styles from "./Overview.less";
import {connect} from "dva";
import {formatter} from '@/lib/format';
const {TabPane} = Tabs;



const panes = [
  { title: 'Clusters', component: Clusters, key: 'clusters' },
  { title: 'Hosts', component: 'Content of Tab 2', key: 'hosts' },
  {title: 'Nodes', component: 'Content of Tab 3',key: 'nodes'},
  {title: 'Indices', component: 'Content of Tab 3',key: 'indices'},
];

const NewOverview = (props)=>{
  React.useEffect(()=>{
    const {dispatch} = props;
    dispatch({
      type: 'clusterOverview/fetchOverview',
    })
  },[])
  const {clusterTotal, overview} = props;

  const totalStoreSize = formatter.bytes(overview?.total_store_size_in_bytes || 0);
  
  return (<div style={{background:'#fff'}} className="overview">
    <div>
    <Row gutter={24} className={styles.rowSpace}>
                  <Col md={6} sm={12}>
                      <Card
                          bodyStyle={{ paddingBottom: 20 }}
                          className={styles.clusterMeta}
                      >
                          <Card.Meta title='集群总数' className={styles.title} />
                          <div>
                              <span className={styles.total}>{clusterTotal?.value}</span>
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
    </div>
    <div>
    <Tabs
      onChange={()=>{}}
      type="card"
      tabBarGutter={10}
      tabindex="-1"
      >
        {panes.map(pane => (
          <TabPane tab={pane.title} key={pane.key}>
            {typeof pane.component == 'string'? pane.component: <pane.component/>}
          </TabPane>
        ))}
      </Tabs>
    </div>
  </div>);
}

export default connect(({
  clusterOverview,
  global
})=>({
  overview: clusterOverview.overview,
  clusterTotal: global.clusterTotal,
}))(NewOverview)