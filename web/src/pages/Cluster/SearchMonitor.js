import React, { Component } from 'react';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi/locale';
import numeral from 'numeral';
import {
  Row,
  Col,
  Icon,
  Card,
  Tabs,
  Table,
  Radio,
  DatePicker,
  Tooltip,
  Menu,
  Dropdown,
} from 'antd';
import NumberInfo from '@/components/NumberInfo';
import {
  ChartCard,
  MiniArea,
  MiniBar,
  MiniProgress,
  Field,
  Bar,
  Pie,
  TimelineChart,
} from '@/components/Charts';
import Trend from '@/components/Trend';
import GridContent from '@/components/PageHeaderWrapper/GridContent';
import Yuan from '@/utils/Yuan';
import { getTimeDistance } from '@/utils/utils';

import _ from 'lodash';
import {
  G2,
  Chart,
  Geom,
  Axis,
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

import styles from './Analysis.less';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const rankingListData = [];
for (let i = 0; i < 7; i += 1) {
  rankingListData.push({
    title: `工专路 ${i} 号店`,
    total: 323234,
  });
}

@connect(({ chart, loading }) => ({
  chart,
  loading: loading.effects['chart/fetch'],
}))
class SearchMonitor extends Component {
  constructor(props) {
    super(props);
    this.rankingListData = [];
    for (let i = 0; i < 7; i += 1) {
      this.rankingListData.push({
        title: formatMessage({ id: 'app.analysis.test' }, { no: i }),
        total: 323234,
      });
    }
  }

  state = {
    salesType: 'all',
    currentTabKey: '',
    rangePickerValue: getTimeDistance('year'),
    loading: true,
  };

  componentDidMount() {
    const { dispatch } = this.props;
    this.reqRef = requestAnimationFrame(() => {
      dispatch({
        type: 'chart/fetch',
      });
      this.timeoutId = setTimeout(() => {
        this.setState({
          loading: false,
        });
      }, 600);
    });
  }

  componentWillUnmount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'chart/clear',
    });
    cancelAnimationFrame(this.reqRef);
    clearTimeout(this.timeoutId);
  }

  handleChangeSalesType = e => {
    this.setState({
      salesType: e.target.value,
    });
  };

  handleTabChange = key => {
    this.setState({
      currentTabKey: key,
    });
  };

  handleRangePickerChange = rangePickerValue => {
    const { dispatch } = this.props;
    this.setState({
      rangePickerValue,
    });

    dispatch({
      type: 'chart/fetchSalesData',
    });
  };

  selectDate = type => {
    const { dispatch } = this.props;
    this.setState({
      rangePickerValue: getTimeDistance(type),
    });

    dispatch({
      type: 'chart/fetchSalesData',
    });
  };

  isActive(type) {
    const { rangePickerValue } = this.state;
    const value = getTimeDistance(type);
    if (!rangePickerValue[0] || !rangePickerValue[1]) {
      return '';
    }
    if (
        rangePickerValue[0].isSame(value[0], 'day') &&
        rangePickerValue[1].isSame(value[1], 'day')
    ) {
      return styles.currentDate;
    }
    return '';
  }

  render() {
    const { rangePickerValue, salesType, loading: propsLoding, currentTabKey } = this.state;
    const { chart, loading: stateLoading } = this.props;
    const {
      visitData,
      visitData2,
      salesData,
      searchData,
      searchDataInfini,
      offlineData,
      offlineChartData,
      salesTypeData,
      docTypeDataInfini,
      salesTypeDataOnline,
      salesTypeDataOffline,
    } = chart;
    const loading = propsLoding || stateLoading;
    let salesPieData = docTypeDataInfini;

    const menu = (
        <Menu>
          <Menu.Item>操作一</Menu.Item>
          <Menu.Item>操作二</Menu.Item>
        </Menu>
    );

    const iconGroup = (
        <span className={styles.iconGroup}>
        <Dropdown overlay={menu} placement="bottomRight">
          <Icon type="ellipsis" />
        </Dropdown>
      </span>
    );

    const salesExtra = (
        <div className={styles.salesExtraWrap}>
          <div className={styles.salesExtra}>
            <a className={this.isActive('today')} onClick={() => this.selectDate('today')}>
              <FormattedMessage id="app.analysis.all-day" defaultMessage="All Day" />
            </a>
            <a className={this.isActive('week')} onClick={() => this.selectDate('week')}>
              <FormattedMessage id="app.analysis.all-week" defaultMessage="All Week" />
            </a>
            <a className={this.isActive('month')} onClick={() => this.selectDate('month')}>
              <FormattedMessage id="app.analysis.all-month" defaultMessage="All Month" />
            </a>
            <a className={this.isActive('year')} onClick={() => this.selectDate('year')}>
              <FormattedMessage id="app.analysis.all-year" defaultMessage="All Year" />
            </a>
          </div>
          <RangePicker
              value={rangePickerValue}
              onChange={this.handleRangePickerChange}
              style={{ width: 256 }}
          />
        </div>
    );

    const columns = [
      {
        title: <FormattedMessage id="app.analysis.table.rank" defaultMessage="Rank" />,
        dataIndex: 'index',
        key: 'index',
      },
      {
        title: (
            <FormattedMessage
                id="app.analysis.table.search-keyword"
                defaultMessage="Search keyword"
            />
        ),
        dataIndex: 'keyword',
        key: 'keyword',
        render: text => <a href="/">{text}</a>,
      },
      {
        title: <FormattedMessage id="app.analysis.table.users" defaultMessage="Users" />,
        dataIndex: 'count',
        key: 'count',
        sorter: (a, b) => a.count - b.count,
        className: styles.alignRight,
      },
      {
        title: (
            <FormattedMessage id="app.analysis.table.weekly-range" defaultMessage="Weekly Range" />
        ),
        dataIndex: 'range',
        key: 'range',
        sorter: (a, b) => a.range - b.range,
        render: (text, record) => (
            <Trend flag={record.status === 1 ? 'down' : 'up'}>
              <span style={{ marginRight: 4 }}>{text}%</span>
            </Trend>
        ),
        align: 'right',
      },
    ];

    const activeKey = currentTabKey || (offlineData[0] && offlineData[0].name);

    const CustomTab = ({ data, currentTabKey: currentKey }) => (
        <Row gutter={8} style={{ width: 138, margin: '8px 0' }}>
          <Col span={12}>
            <NumberInfo
                title={data.name}
                subTitle={
                  <FormattedMessage
                      id="app.analysis.conversion-rate"
                      defaultMessage="Conversion Rate"
                  />
                }
                gap={2}
                total={`${data.cvr * 100}%`}
                theme={currentKey !== data.name && 'light'}
            />
          </Col>
          <Col span={12} style={{ paddingTop: 36 }}>
            <Pie
                animate={false}
                color={currentKey !== data.name && '#BDE4FF'}
                inner={0.55}
                tooltip={false}
                margin={[0, 0, 0, 0]}
                percent={data.cvr * 100}
                height={64}
            />
          </Col>
        </Row>
    );

    const topColResponsiveProps = {
      xs: 24,
      sm: 12,
      md: 12,
      lg: 12,
      xl: 6,
      style: { marginBottom: 24 },
    };

    return (
        <GridContent>

          <Row gutter={24}>
            <Col xl={12} lg={24} md={24} sm={24} xs={24}>
              <Card
                  loading={loading}
                  bordered={false}
                  title="热词搜索"
                  style={{ marginTop: 0 }}
              >
                <Row gutter={68}>
                  <Col sm={12} xs={24} style={{ marginBottom: 24 }}>
                    <NumberInfo
                        subTitle={
                          <span>
                        <FormattedMessage
                            id="app.analysis.search-users"
                            defaultMessage="search users"
                        />
                        <Tooltip
                            title={
                              <FormattedMessage
                                  id="app.analysis.introduce"
                                  defaultMessage="introduce"
                              />
                            }
                        >
                          <Icon style={{ marginLeft: 8 }} type="info-circle-o" />
                        </Tooltip>
                      </span>
                        }
                        gap={8}
                        total={numeral(8371).format('0,0')}
                        status="up"
                        subTotal={17.1}
                    />
                    <MiniArea line height={45} data={visitData2} />
                  </Col>
                  <Col sm={12} xs={24} style={{ marginBottom: 24 }}>
                    <NumberInfo
                        subTitle={
                          <span>
                        <FormattedMessage
                            id="app.analysis.per-capita-search"
                            defaultMessage="Per Capita Search"
                        />
                        <Tooltip
                            title={
                              <FormattedMessage
                                  id="app.analysis.introduce"
                                  defaultMessage="introduce"
                              />
                            }
                        >
                          <Icon style={{ marginLeft: 8 }} type="info-circle-o" />
                        </Tooltip>
                      </span>
                        }
                        total={2.7}
                        status="down"
                        subTotal={26.2}
                        gap={8}
                    />
                    <MiniArea line height={45} data={visitData2} />
                  </Col>
                </Row>
                <Table
                    rowKey={record => record.index}
                    size={"small"}
                    columns={columns}
                    dataSource={searchDataInfini}
                    pagination={{
                      size: "small",
                      style: { marginBottom: 0 },
                      pageSize: 5,
                      showSizeChanger: true,
                      showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                    }}
                />
              </Card>
            </Col>
            <Col xl={12} lg={24} md={24} sm={24} xs={24}>
              <Card
                  title="用户统计"
                  loading={false}
                  bordered={false}
                  bodyStyle={{ overflow: 'hidden' }}
              >
                <UserStat></UserStat>
              </Card>
            </Col>
          </Row>
          <Row gutter={24}>
            {/*<Col xl={8} lg={12} md={24} sm={24} xs={24}>*/}
            {/*  <Card*/}
            {/*      title="热门搜索"*/}
            {/*      loading={false}*/}
            {/*      bordered={false}*/}
            {/*      bodyStyle={{ overflow: 'hidden' }}*/}
            {/*  >*/}
            {/*    <TagCloud>*/}

            {/*    </TagCloud>*/}
            {/*  </Card>*/}
            {/*</Col>*/}
            <Col xl={12} lg={24} md={24} sm={24} xs={24}>
              <Card
                  title="新词"
                  loading={false}
                  bordered={false}
                  bodyStyle={{ overflow: 'hidden' }}
                  style={{ marginTop: 24 }}
              >
                <TagCloud>

                </TagCloud>
              </Card>
            </Col>
            <Col xl={12} lg={24} md={24} sm={24} xs={24}>
              <Card
                  loading={loading}
                  bordered={false}
                  title="TOP索引占比"
                  style={{ marginTop: 24 }}
              >
                <Pie
                    hasLegend
                    subTitle="TOP INDEX"
                    total={() => {salesPieData.reduce((pre, now) => now.y + pre, 0)}}
                    data={salesPieData}
                    valueFormat={value => {value}}
                    height={248}
                    lineWidth={4}
                />
              </Card>
            </Col>
          </Row>

        </GridContent>
    );
  }
}

export default SearchMonitor;
