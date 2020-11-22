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
import _ from 'lodash';
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
} from 'bizcharts';
import DataSet from '@antv/data-set';
import Slider from 'bizcharts-plugin-slider';
import UserStat from './Search/UserStat';
import TagCloud from './Search/TagCloud';

import styles from "./Monitor.less";


class SearchMonitor extends PureComponent {

  render() {

    return (
        <GridContent>
          <Row gutter={24}>
            <Col xl={8} lg={12} md={24} sm={24} xs={24}>
              <Card
                  title="用户统计"
                  loading={false}
                  bordered={false}
                  bodyStyle={{ overflow: 'hidden' }}
              >
                <UserStat></UserStat>
              </Card>
            </Col>
            <Col xl={8} lg={12} md={24} sm={24} xs={24}>
              <Card
                  title="热门搜索"
                  loading={false}
                  bordered={false}
                  bodyStyle={{ overflow: 'hidden' }}
              >
                <TagCloud>

                </TagCloud>
              </Card>
            </Col>
            <Col xl={8} lg={12} md={24} sm={24} xs={24}>
              <Card
                  title="新词"
                  loading={false}
                  bordered={false}
                  bodyStyle={{ overflow: 'hidden' }}
              >
                <TagCloud>

                </TagCloud>
              </Card>
            </Col>
          </Row>
        </GridContent>
    );
  }
}

export default SearchMonitor;
