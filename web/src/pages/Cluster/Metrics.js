import React, { PureComponent, useState } from "react";
import { connect } from "dva";
import { formatMessage } from "umi/locale";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Dropdown,
  Icon,
  Input,
  InputNumber,
  Row,
  Select,
  Statistic,
} from "antd";
import moment from "moment";
import router from "umi/router";
import Link from "umi/link";
import { Route } from "umi";

import "@elastic/charts/dist/theme_only_light.css";
import {
  Axis,
  Chart,
  CurveType,
  LineSeries,
  niceTimeFormatByDay,
  Position,
  ScaleType,
  Settings,
  timeFormatter,
} from "@elastic/charts";
import styles from "./Metrics.scss";

import { Spin, Alert, Tabs } from "antd";
import { calculateBounds } from "../../components/vendor/data/common/query/timefilter";
import NodeMetric from "./components/node_metric";
import IndexMetric from "./components/index_metric";
import ClusterMetric from "./components/cluster_metric";
import QueueMetric from "./components/queue_metric";
// import StorageMetric from "./components/storage_metric";
import { formatter, getFormatter, getNumFormatter } from "@/utils/format";
import { MonitorDatePicker } from "./components/datepicker";
import {
  useQueryParam,
  StringParam,
  JsonParam,
  QueryParamProvider,
} from "use-query-params";

const { RangePicker } = DatePicker;

let fetchDataCount = 0;
let tv1 = null;

let HealthCircle = (props) => {
  return (
    <div
      style={{
        background: props.color,
        width: 12,
        height: 12,
        borderRadius: 12,
      }}
    />
  );
};

let timezone = "local";

const theme = {
  legend: {
    margin: 0,
    padding: 0,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  chartMargins: {
    left: 5,
    right: 0,
    top: 1,
    bottom: 5,
  },
  chartPaddings: {
    left: 5,
    right: 5,
    top: 0,
    bottom: 0,
  },
  scales: {
    barsPadding: 0.24,
  },
  axes: {
    axisTitle: {
      fill: "#333",
      fontSize: 12,
      fontStyle: "bold",
      fontFamily: "'Open Sans', Helvetica, Arial, sans-serif",
      padding: 2,
    },
    axisLine: {
      stroke: "#333",
    },
    tickLabel: {
      fill: "#333",
      fontSize: 10,
      fontFamily: "'Open Sans', Helvetica, Arial, sans-serif",
      fontStyle: "normal",
      padding: 2,
    },
    tickLine: {
      visible: true,
      stroke: "#333",
      strokeWidth: 1,
      padding: 0,
    },
  },
};

const vstyle = {
  fontSize: 12,
  wordBreak: "break-all",
  marginRight: "5px",
};

@connect(({ clusterMonitor, global }) => ({
  clusterMonitor,
  selectedCluster: global.selectedCluster,
  clusterList: global.clusterList,
  clusterStatus: global.clusterStatus,
}))
class ClusterMonitor extends PureComponent {
  constructor(props) {
    super(props);
    //this.timePicker = React.createRef();
    this.handleChartBrush = this.handleChartBrush.bind(this);
    this.handleTimeChange = this.handleTimeChange.bind(this);
    this.state = {
      spinning: false,
      clusterID: null,
      activeTab: props.param?.tab || "cluster",
      timeRange: {
        min: "now-1h", //moment().subtract(1, 'h').toISOString(),
        max: "now", //moment().toISOString()
        timeFormatter: formatter.dates(1),
      },
    };
  }

  componentWillReceiveProps(newProps) {}

  fetchData = () => {
    if (
      this.state.clusterID === undefined ||
      this.state.clusterID === "" ||
      this.state.clusterID === null
    ) {
      return;
    }

    this.setState({
      spinning: true,
    });

    fetchDataCount++;
    const { dispatch } = this.props;
    const { timeRange } = this.state;
    const bounds = calculateBounds({
      from: timeRange.min,
      to: timeRange.max,
    });
    dispatch({
      type: "clusterMonitor/fetchClusterMetrics",
      payload: {
        timeRange: {
          min: bounds.min.valueOf(),
          max: bounds.max.valueOf(),
        },
        cluster_id: this.state.clusterID,
      },
    }).then((res) => {
      this.setState({
        spinning: false,
      });
    });
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    // console.log(this.props.selectedCluster)
    // console.log(this.state.clusterID)

    if (this.props.selectedCluster.id !== this.state.clusterID) {
      console.log("cluster changed");

      this.setState({ clusterID: this.props.selectedCluster.id }, () => {
        //TODO 处理 cancel 事件，先把当前还在执行中的请求结束，避免更新完成之后，被晚到的之前的请求给覆盖了。
        this.fetchData();
      });
    }
  }

  pointerUpdate = (event) => {
    this.chartRefs.forEach((ref) => {
      if (ref.current) {
        ref.current.dispatchExternalPointerEvent(event);
      }
    });
  };

  componentDidMount() {
    const { match, location } = this.props;

    const queryESID = this.props.match.params.cluster_id;

    if (queryESID !== null && queryESID !== undefined) {
      this.state.clusterID = queryESID;
      const { dispatch } = this.props;
      dispatch({
        type: "global/changeClusterById",
        payload: {
          id: queryESID,
        },
      });
    } else if (
      this.props.selectedCluster.id !== undefined &&
      this.props.selectedCluster.id !== null
    ) {
      this.setState({ clusterID: this.props.selectedCluster.id }, () => {});
    } else {
      //alert("cluster ID is not set");
      return;
    }

    let min = location.query.start || this.state.timeRange.min; //'2020-12-10 15:00';
    let max = location.query.end || this.state.timeRange.max; //'2020-12-10 16:00';
    this.setState(
      {
        timeRange: {
          ...this.state.timeRange,
          min: min,
          max: max,
        },
      },
      () => {
        this.fetchData();
      }
    );

    // tv1 = setInterval(()=>{
    //   this.fetchData();
    // }, 10000);

    //this.autoRefresh();
  }

  autoRefresh(durationInSeconds) {
    !durationInSeconds && (durationInSeconds = 10);
    clearInterval(tv1);
    tv1 = setInterval(() => {
      this.fetchData();
    }, durationInSeconds * 1000);
  }

  handleChartBrush({ x }) {
    if (!x) {
      return;
    }
    const [from, to] = x;
    let timeRange = {
      min: moment(from).toISOString(),
      max: moment(to).toISOString(),
    };
    timeRange.day = moment
      .duration(moment(to).valueOf() - moment(from).valueOf())
      .asDays();
    this.setState(
      {
        timeRange: timeRange,
      },
      () => {
        this.fetchData();
      }
    );
  }

  handleTimeChange = ({ start, end }) => {
    const bounds = calculateBounds({
      from: start,
      to: end,
    });
    const day = moment
      .duration(bounds.max.valueOf() - bounds.min.valueOf())
      .asDays();
    const intDay = parseInt(day) + 1;
    this.setState(
      {
        timeRange: {
          min: start,
          max: end,
          timeFormatter: formatter.dates(intDay),
        },
      },
      () => {
        this.fetchData();
      }
    );
  };
  onTabChange = (key) => {
    this.props.setParam((param) => {
      return {
        tab: key,
      };
    });
  };

  render() {
    const { clusterMonitor } = this.props;
    let clusterStats = {};
    let clusterMetrics = {};

    if (clusterMonitor.summary) {
      let rawStats = clusterMonitor.summary;
      clusterStats = {
        cluster_name: rawStats.cluster_name,
        status: rawStats.status,
        version: rawStats.version,
        nodes_count: rawStats.nodes_count,
        indices_count: formatter.number(rawStats.indices_count),
        primary_shards: formatter.number(rawStats.primary_shards),
        unassigned_shards: formatter.number(rawStats.unassigned_shards),
        total_shards: formatter.number(rawStats.total_shards),
        used_store_bytes: formatter.bytes(rawStats.used_store_bytes),
        max_store_bytes: formatter.bytes(rawStats.max_store_bytes),
        used_jvm_bytes: formatter.bytes(rawStats.used_jvm_bytes),
        max_jvm_bytes: formatter.bytes(rawStats.max_jvm_bytes),
        document_count: formatter.number(rawStats.document_count),
        uptime: moment.duration(rawStats.uptime).humanize(),
        timestamp: moment(rawStats.timestamp).toLocaleString(),
      };
    }

    if (clusterMonitor.metrics) {
      clusterMetrics = clusterMonitor.metrics;
    }

    let clusterAvailable = true;
    const { clusterStatus: cstatus, selectedCluster } = this.props;
    let clusterMonitored = true;
    if (cstatus && selectedCluster && cstatus[selectedCluster.id]) {
      clusterAvailable = cstatus[selectedCluster.id].available;
      clusterMonitored = cstatus[selectedCluster.id].config.monitored;
    }

    return (
      //   <Spin spinning={this.state.spinning} tip="Loading...">
      <div style={{ background: "#fff" }}>
        <div
          style={{ background: "#fff", padding: "5px", marginBottom: 5 }}
          className={styles.datepicker}
        >
          <MonitorDatePicker
            timeRange={this.state.timeRange}
            isLoading={this.state.spinning}
            onChange={this.handleTimeChange}
          />
        </div>

        <div className={styles.summary}>
          {!clusterAvailable ? (
            <div className={styles.mask}>
              <div>
                Cluster is not availabe since: {clusterStats?.timestamp}
              </div>
            </div>
          ) : !clusterMonitored &&
            moment()
              .add(-1, "m")
              .isAfter(clusterStats?.timestamp) ? (
            <div className={styles.mask}>
              <div>
                Cluster is not monitored.{" "}
                <Button type="primary">
                  <Link to={`/resource/cluster/${selectedCluster.id}/edit`}>
                    Go to open
                  </Link>
                </Button>
              </div>
              <div className={styles.time}>
                Last data collection time: {clusterStats?.timestamp}
              </div>
            </div>
          ) : null}
          <Row
            gutter={[16, { xs: 8, sm: 16, md: 24, lg: 32 }]}
            className={
              !clusterAvailable || !clusterMonitored ? styles.metricMask : ""
            }
          >
            <Col md={2} xs={4}>
              <Statistic
                valueStyle={vstyle}
                title={formatMessage({
                  id: "cluster.monitor.summary.name",
                })}
                value={clusterStats.cluster_name}
              />
            </Col>
            <Col md={2} xs={4}>
              <Statistic
                valueStyle={vstyle}
                title={formatMessage({
                  id: "cluster.monitor.summary.online_time",
                })}
                value={clusterStats.uptime}
              />
            </Col>
            <Col md={2} xs={4}>
              <Statistic
                valueStyle={vstyle}
                title={formatMessage({
                  id: "cluster.monitor.summary.version",
                })}
                value={clusterStats.version}
              />
            </Col>
            <Col md={2} xs={4}>
              <Statistic
                valueStyle={{
                  ...vstyle,
                  display: "flex",
                  alignItems: "center",
                }}
                title={formatMessage({
                  id: "cluster.monitor.summary.health",
                })}
                value={clusterStats.status}
                prefix={<HealthCircle color={clusterStats.status} />}
              />
            </Col>
            <Col md={2} xs={4}>
              <Statistic
                valueStyle={vstyle}
                title={formatMessage({
                  id: "cluster.monitor.summary.node_count",
                })}
                value={clusterStats.nodes_count}
              />
            </Col>
            <Col md={2} xs={4}>
              <Statistic
                valueStyle={vstyle}
                title={formatMessage({
                  id: "cluster.monitor.summary.total_index",
                })}
                value={clusterStats.indices_count}
              />
            </Col>

            <Col md={2} xs={4}>
              <Statistic
                valueStyle={vstyle}
                title={formatMessage({
                  id: "cluster.monitor.summary.shard",
                })}
                value={
                  clusterStats.primary_shards + "/" + clusterStats.total_shards
                }
              />
            </Col>

            <Col md={2} xs={4}>
              <Statistic
                valueStyle={vstyle}
                title={formatMessage({
                  id: "cluster.monitor.summary.unassign_shard",
                })}
                value={clusterStats.unassigned_shards}
              />
            </Col>

            <Col md={2} xs={4}>
              <Statistic
                valueStyle={vstyle}
                title={formatMessage({
                  id: "cluster.monitor.summary.total_docs",
                })}
                value={clusterStats.document_count}
              />
            </Col>

            <Col md={2} xs={4}>
              <Statistic
                valueStyle={vstyle}
                title={formatMessage({
                  id: "cluster.monitor.summary.storage",
                })}
                value={
                  clusterStats.used_store_bytes +
                  "/" +
                  clusterStats.max_store_bytes
                }
              />
            </Col>
            <Col md={2} xs={4}>
              <Statistic
                valueStyle={vstyle}
                title={formatMessage({
                  id: "cluster.monitor.summary.jvm",
                })}
                value={
                  clusterStats.used_jvm_bytes + "/" + clusterStats.max_jvm_bytes
                }
              />
            </Col>
          </Row>
        </div>
        <div>
          <Tabs
            destroyInactiveTabPane
            animated={false}
            activeKey={
              ["cluster", "node", "index", "queue"].includes(
                this.props.param?.tab
              )
                ? this.props.param?.tab
                : "cluster"
            }
            onChange={this.onTabChange}
          >
            <Tabs.TabPane
              key="cluster"
              tab={formatMessage({
                id: "cluster.monitor.cluster.title",
              })}
            >
              <ClusterMetric
                clusterID={this.props.selectedCluster.id}
                timezone={timezone}
                timeRange={this.state.timeRange}
                handleTimeChange={this.handleTimeChange}
              />
            </Tabs.TabPane>
            <Tabs.TabPane
              key="node"
              tab={formatMessage({
                id: "cluster.monitor.node.title",
              })}
            >
              <NodeMetric
                clusterID={this.props.selectedCluster.id}
                timezone={timezone}
                timeRange={this.state.timeRange}
                handleTimeChange={this.handleTimeChange}
                param={this.props.param}
                setParam={this.props.setParam}
              />
            </Tabs.TabPane>
            <Tabs.TabPane
              key="index"
              tab={formatMessage({
                id: "cluster.monitor.index.title",
              })}
            >
              <IndexMetric
                clusterID={this.props.selectedCluster.id}
                timezone={timezone}
                timeRange={this.state.timeRange}
                handleTimeChange={this.handleTimeChange}
                param={this.props.param}
                setParam={this.props.setParam}
              />
            </Tabs.TabPane>
            <Tabs.TabPane
              key="queue"
              tab={formatMessage({
                id: "cluster.monitor.queue.title",
              })}
            >
              <QueueMetric
                clusterID={this.props.selectedCluster.id}
                timezone={timezone}
                timeRange={this.state.timeRange}
                handleTimeChange={this.handleTimeChange}
                param={this.props.param}
                setParam={this.props.setParam}
              />
            </Tabs.TabPane>
            {/* <Tabs.TabPane
              key="storage"
              tab={formatMessage({
                id: "cluster.monitor.queue.storage",
              })}
            >
              <StorageMetric
                clusterID={this.props.selectedCluster.id}
                timezone={timezone}
                timeRange={this.state.timeRange}
              />
            </Tabs.TabPane> */}
          </Tabs>
        </div>
      </div>
      //   </Spin>
    );
  }
}

const ClusterMonitorWithParams = (props) => {
  const [param, setParam] = useQueryParam("_g", JsonParam);

  return <ClusterMonitor {...props} param={param} setParam={setParam} />;
};

const ClusterMonitorUI = (props) => {
  return (
    <QueryParamProvider ReactRouterRoute={Route}>
      <ClusterMonitorWithParams {...props} />
    </QueryParamProvider>
  );
};

export default ClusterMonitorUI;
