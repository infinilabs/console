import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi/locale';
import { Row, Col, Card } from 'antd';
import numeral from 'numeral';
import { Pie, WaterWave, Gauge, TagCloud } from '@/components/Charts';
import NumberInfo from '@/components/NumberInfo';
import CountDown from '@/components/CountDown';
import ActiveChart from '@/components/ActiveChart';
import GridContent from '@/components/PageHeaderWrapper/GridContent';
import {
  G2,
  Chart,
  Geom,
  Axis,
  Tooltip,
  Coord,
  Label,
  Legend,
  View,
  Guide,
  Shape,
  Facet,
  Util
} from "bizcharts";

import Authorized from '@/utils/Authorized';
import styles from './Monitor.less';

const { Secured } = Authorized;

const targetTime = new Date().getTime() + 3900000;

// use permission as a parameter
const havePermissionAsync = new Promise(resolve => {
  // Call resolve on behalf of passed
  setTimeout(() => resolve(), 300);
});

@Secured(havePermissionAsync)
@connect(({ monitor, loading }) => ({
  monitor,
  loading: loading.models.monitor,
}))
class TaskMonitor extends PureComponent {
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'monitor/fetchTags',
    });
  }

  render() {
    const { monitor, loading } = this.props;
    const { tags } = monitor;

    const taskTimedDta = [
      {
        name: "node1-23",
        value: 3
      },
      {
        name: "node1-24",
        value: 4
      },
      {
        name: "node1-25",
        value: 5
      },
      {
        name: "node2-101",
        value: 5.3
      },
      {
        name: "node2-102",
        value: 5.9
      },
      {
        name: "node2-103",
        value: 6
      },
      {
        name: "node3-121",
        value: 7
      },
      {
        name: "node3-122",
        value: 9
      },
      {
        name: "node3-123",
        value: 15
      }
    ];
    const cols = {
      value: {
        min: 0,
        alias:'Time(min)'
      },
      name: {
        range: [0.05, 0.95],
        alias:'Task'
      }
    };
    const taskCategorydDta = [
      {
        name: "索引重建任务",
        value: 16
      },
      {
        name: "数据导入任务",
        value: 4
      },
      {
        name: "数据导出任务",
        value: 2
      },
      {
        name: "备份任务",
        value: 10
      },
      {
        name: "恢复任务",
        value: 6
      },
      {
        name: "其他",
        value: 1
      }
    ];

    return (
        <GridContent>
          <Row gutter={24}>
            <Col xl={12} lg={24} sm={24} xs={24}>
              <Card
                  title="集群健康检查任务"
                  bordered={false}
                  className={styles.pieCard}
              >
                <Row style={{ padding: '16px 0' }}>
                  <Col span={8}>
                    <Pie
                        animate={false}
                        color="#FFFF00"
                        percent={50}
                        subTitle="存活状态"
                        total="50%"
                        height={128}
                        lineWidth={2}
                    />
                  </Col>
                  <Col span={8}>
                    <Pie
                        animate={false}
                        color="#2FC25B"
                        percent={100}
                        subTitle="可读状态"
                        total="100%"
                        height={128}
                        lineWidth={2}
                    />
                  </Col>
                  <Col span={8}>
                    <Pie
                        animate={false}
                        color="#FF0000"
                        percent={50}
                        subTitle="可写状态"
                        total="50%"
                        height={128}
                        lineWidth={2}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col xl={12} lg={24} sm={24} xs={24}>
              <Card
                  title="数据重建任务"
                  bodyStyle={{ textAlign: 'center', fontSize: 0 }}
                  bordered={false}
              >
                <Row style={{ padding: '16px 0' }}>
                  <Col span={8}>
                    <WaterWave
                        height={128}
                        title="数据重建任务"
                        percent={90}
                    />
                  </Col>
                  <Col span={8}>
                    <WaterWave
                        height={128}
                        title="备份任务"
                        percent={50}
                        color="#FFA500"
                    />
                  </Col>
                  <Col span={8}>
                    <WaterWave
                        height={128}
                        title="恢复任务"
                        percent={28}
                        color="#FFE4B5"
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col xl={12} lg={24} sm={24} xs={24}>
              <Card
                  title="任务执行时间统计"
                  bordered={false}
                  style={{ marginTop: 24 }}
              >
                <Chart height={300} data={taskTimedDta} scale={cols} forceFit>
                  <Axis name="name"  title/>
                  <Axis name="value" title/>
                  <Tooltip
                      // crosshairs用于设置 tooltip 的辅助线或者辅助框
                      // crosshairs={{
                      //  type: "y"
                      // }}
                  />
                  <Geom type="interval" position="name*value" />
                </Chart>
              </Card>
            </Col>
            <Col xl={12} lg={24} sm={24} xs={24}>
              <Card
                  title="任务分类统计"
                  bodyStyle={{ textAlign: 'center', fontSize: 0 }}
                  bordered={false}
                  style={{ marginTop: 24 }}
              >
                <Chart
                    height={300}
                    data={taskCategorydDta}
                    forceFit
                >
                  <Coord type="theta"/>
                  <Tooltip showTitle={false} />
                  <Geom
                      type="intervalStack"
                      position="value"
                      color="name"
                  >
                    <Label content="value" />
                  </Geom>
                  <Legend/>
                </Chart>
              </Card>
            </Col>
          </Row>
        </GridContent>
    );
  }
}

export default TaskMonitor;
