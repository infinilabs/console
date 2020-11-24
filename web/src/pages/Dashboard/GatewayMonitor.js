import React, { PureComponent } from 'react';

import GridContent from '@/components/PageHeaderWrapper/GridContent';
import {
  Row,
  Col,
  Icon,
  Card,
  Tabs,
  Table,
  Radio,
  DatePicker,
  Menu,
  Dropdown,
} from 'antd';
import { Chart, Geom, Axis, Tooltip, Legend, Coord } from 'bizcharts';
import DataSet from '@antv/data-set';
import Slider from 'bizcharts-plugin-slider';

import stylesGateway from "./GatewayMonitor.less";

const styles ={
  ...stylesGateway,
  mainTitle:{
    fontSize:20,
    color:"black",
    textAlign:"center"
  },
  subTitle:{
    fontSize:16,
    color:"gray",
    textAlign:"center"
  }
}

class GatewayMonitor extends PureComponent {

  //时间戳转换方法    date:时间戳数字
  formatDate(timestamp) {
    var date = new Date(timestamp);
    var YY = date.getFullYear();
    var MM = '-' + (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1);
    var DD = '-' + (date.getDate() < 10 ? '0' + (date.getDate()) : date.getDate());
    var hh = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours());
    var mm = ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
    var ss = ':' + (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());
    // return YY + MM + DD +" "+hh + mm + ss;
    return hh + mm;
  }

  render() {

    // 数据源
    const chartDataIndex = [];
    const chartDataQuery = [];
    const chartDataGateway = [];
    const chartDataTop = [{
      user:"liugq",
      count: 202989,
    },{
      user:"liaosy",
      count: 342989,
    },{
      user:"medcl",
      count: 285989,
    },{
      user:"blogsit",
      count: 291989,
    },{
      user:"lucas",
      count: 272489,
    },{
      user:"liming",
      count: 312589,
    }];

    for (let i = 0; i < 24; i += 1) {
      chartDataIndex.push({
        x_time: this.formatDate(new Date().getTime() + (1000 * 60 * 60 * (i-24))),
        y_value: Math.floor(Math.random() * 100) * 100,
      });
      chartDataQuery.push({
        x_time: this.formatDate(new Date().getTime() + (1000 * 60 * 60 * (i-24))),
        y_value: Math.floor(Math.random() * 100) * 500,
      });
      chartDataGateway.push({
        x_time: this.formatDate(new Date().getTime() + (1000 * 60 * 60 * (i-24))),
        y_value: Math.floor(Math.random() * 100) * 3000,
      });
    }

// 定义度量
    const cols = {
      y_value: {
        min: 0,
        alias: '次数'
      },
      x_time: {
        range: [0, 1],
        alias: '时间'
      }
    };

    return (
        <GridContent>
          <Row gutter={24}>
            <Col xl={12} lg={24} md={24} sm={24} xs={24}>
              <Card
                  loading={false}
                  className={styles.offlineCard}
                  bordered={false}
                  bodyStyle={{ padding: '30px 0 10px' }}
                  style={{ marginTop: 32 }}
              >
                <Chart height={300} data={chartDataIndex} scale={cols} forceFit>
                  <h3 className='main-title' style={styles.mainTitle}>
                    索引QPS
                  </h3>
                  <Axis name="year" title/>
                  <Axis name="value" title/>
                  <Tooltip
                      crosshairs={{
                        type: "y"
                      }}
                  />
                  <Geom type="line" position="x_time*y_value" size={2} />
                  <Geom
                      type="point"
                      position="x_time*y_value"
                      size={4}
                      shape={"circle"}
                      style={{
                        stroke: "#fff",
                        lineWidth: 1
                      }}
                  />
                </Chart>
              </Card>
            </Col>
            <Col xl={12} lg={24} md={24} sm={24} xs={24}>
              <Card
                  loading={false}
                  className={styles.offlineCard}
                  bordered={false}
                  bodyStyle={{ padding: '30px 0 10px' }}
                  style={{ marginTop: 32 }}
              >
                <div style={{ padding: '0 24px' }}>
                  <Chart height={300} data={chartDataQuery} scale={cols} forceFit>
                    <h3 className='main-title' style={styles.mainTitle}>
                      查询QPS
                    </h3>

                    <Axis name="year" />
                    <Axis name="value" />
                    <Tooltip
                        crosshairs={{
                          type: "y"
                        }}
                    />
                    <Geom type="line" position="x_time*y_value" size={2} />
                    <Geom
                        type="point"
                        position="x_time*y_value"
                        size={4}
                        shape={"circle"}
                        style={{
                          stroke: "#fff",
                          lineWidth: 1
                        }}
                    />
                  </Chart>
                </div>
              </Card>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col xl={12} lg={24} md={24} sm={24} xs={24}>
              <Card
                  loading={false}
                  className={styles.offlineCard}
                  bordered={false}
                  bodyStyle={{ padding: '30px 0 10px' }}
                  style={{ marginTop: 32 }}
              >
                <Chart height={300} data={chartDataGateway} scale={cols} forceFit>
                  <h3 className='main-title' style={styles.mainTitle}>
                    网关写入QPS
                  </h3>
                  <Axis name="year" title/>
                  <Axis name="value" title/>
                  <Tooltip
                      crosshairs={{
                        type: "y"
                      }}
                  />
                  <Geom type="line" position="x_time*y_value" size={2} />
                  <Geom
                      type="point"
                      position="x_time*y_value"
                      size={4}
                      shape={"circle"}
                      style={{
                        stroke: "#fff",
                        lineWidth: 1
                      }}
                  />
                </Chart>
              </Card>
            </Col>
            <Col xl={12} lg={24} md={24} sm={24} xs={24}>
              <Card
                  loading={false}
                  className={styles.offlineCard}
                  bordered={false}
                  bodyStyle={{ padding: '30px 0 10px' }}
                  style={{ marginTop: 32 }}
              >
                <div style={{ padding: '0 24px' }}>
                <Chart height={300} data={chartDataTop} scale={cols} forceFit>
                <h3 className='main-title' style={styles.mainTitle}>
                    Top用户统计
                  </h3>
                  <Axis name="user" />
                  <Axis name="count" />
                  <Tooltip/>
                  <Geom type="interval" position="user*count" />
                </Chart>
                </div>
              </Card>
            </Col>
          </Row>
        </GridContent>
    )
  }
}
export default GatewayMonitor;