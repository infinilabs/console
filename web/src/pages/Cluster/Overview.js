import React from 'react';
import {List,Card,Row,Icon,Col} from "antd";
import styles from "./Overview.less";
import {connect} from "dva";
import {formatGigNumber} from "@/utils/utils";


const tabList = [
    {
        key: 'tabCluster',
        tab: '集群',
    },
    {
        key: 'tabHost',
        tab: '主机',
    },
    {
        key: 'tabNode',
        tab: '节点',
    },
];


@connect(({global}) => ({
  
}))


class Overview extends  React.Component {
    state = {
        tabkey: 'tabCluster',
    };

    onOperationTabChange = key => {
        this.setState({ tabkey: key });
    };

    render() {

        const {  tabkey } = this.state;

        const contentList = {
          tabCluster: (
              <Card title="集群列表" style={{ marginBottom: 24 }} bordered={false}>
                  <div>
                      <Icon type="frown-o" />
                      暂无数据
                  </div>
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
                              <span className={styles.total}>1</span>
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
                              <span className={styles.total}>1</span>
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
                              <span className={styles.total}>1</span>
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
                              <span className={styles.total}>100</span><span className={styles.unit}>GB</span>
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
