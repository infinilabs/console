import React, {Fragment} from 'react';
import {Card, List, Divider, Popconfirm, Row, Col, Table, Descriptions, Button} from "antd";
import {Link} from "umi"
import moment from "moment";
import styles from "./Overview.less";
import {connect} from "dva";
import {ClusterItem} from "./ClusterList";
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Avatar } from 'antd';
import { Tabs } from 'antd';
const { TabPane } = Tabs;
import ClusterLoadMore from "../../components/List/LoadMoreList"
const data = [
    {
        title: 'Ant Design Title 1',
    },
    {
        title: 'Ant Design Title 2',
    },
    {
        title: 'Ant Design Title 3',
    },
    {
        title: 'Ant Design Title 4',
    },
];

@connect(({global}) => ({
  selectedCluster: global.selectedCluster
}))


class Overview extends  React.Component {

  render() {
    return (
        <div>
            <Row gutter={24}>
              <Col lg={17} md={24}>
                  <Card className={styles.card}  title={'Overall Platform Status'}>
                    <CalendarHeatmap
                        showMonthLabels={false}
                        showWeekdayLabels={false}
                        showOutOfRangeDays={true}
                        startDate={new Date('2016-01-01')}
                        endDate={new Date('2016-12-31')}
                        monthLabels={['01','02','03','04','05','06',
                          '07','08','09','10','11','12']}
                        weekdayLabels={['周日','周一','周二','周三','周四'
                          ,'周五','周六']}
                        values={[
                          { date: '2016-01-01', count: 12 },
                          { date: '2016-01-22', count: 122 },
                          { date: '2016-01-30', count: 38 },
                        ]}
                        // tooltipDataAttrs={
                        //   (value) => (value.count > 0 ? 'blue' : 'white')
                        // }
                        // onClick={value => alert(`Clicked on value with count: ${value.count}`)}
                    />
                  </Card>

                  <Card className={styles.card}  title={'Open Issues'}>
                      <List
                          itemLayout="horizontal"
                          dataSource={data}
                          renderItem={item => (
                              <List.Item>
                                  <List.Item.Meta
                                      avatar={<Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" />}
                                      title={<a href="https://ant.design">{item.title}</a>}
                                      description="Ant Design, a design language for background applications, is refined by Ant UED Team"
                                  />
                              </List.Item>
                          )}
                      />
                  </Card>
              </Col>
              <Col lg={7} md={24}>
                  <Card>
                      <Tabs defaultActiveKey="1" >
                          <TabPane tab="Elasticsearch" key="1" >
                            <ClusterLoadMore />

                          </TabPane>
                          <TabPane tab="业务部门" key="2">
                              Content of Tab Pane 2
                          </TabPane>
                      </Tabs>
                  </Card>
              </Col>
            </Row>



        </div>
    )
  }
}

export  default Overview;
