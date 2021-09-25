import React, {PureComponent, useState} from 'react';
import {connect} from 'dva';
import {formatMessage} from 'umi/locale';
import {Button, Card, Col, DatePicker, Dropdown, Icon, Input, InputNumber, Row, Select, Statistic} from 'antd';
import moment from 'moment';
import {DateTime} from 'luxon';
import router from "umi/router";

import numeral from 'numeral';

import '@elastic/charts/dist/theme_only_light.css';
import {
    Axis,
    Chart,
    CurveType,
    LineSeries,
    niceTimeFormatByDay,
    Position,
    ScaleType,
    Settings,
    timeFormatter
} from "@elastic/charts";
import styles from './Metrics.less';

import { Spin, Alert } from 'antd';
import {EuiSuperDatePicker} from '@elastic/eui';
import {calculateBounds} from '../../components/kibana/data/common/query/timefilter';

const {RangePicker} = DatePicker;


let fetchDataCount = 0;
let tv1 = null;

let HealthCircle = (props) => {
    return (
        <div style={{
            background: props.color,
            width: 12,
            height: 12,
            borderRadius: 12,
        }}/>
    )
}

const unitArr = Array("B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB");

let formatter = {
    bytes: (value) => {
        if (isNaN(value) || null == value || value === ''||value==0) {
            return "0B";
        }
        var index = 0;
        var srcsize = parseFloat(value);
        index = Math.floor(Math.log(srcsize) / Math.log(1024));
        var size = srcsize / Math.pow(1024, index);
        size = size.toFixed(1);
        return size + unitArr[index];
    },
    dates: timeFormatter(niceTimeFormatByDay(1)),
    full_dates: (d) => DateTime.fromMillis(d).toFormat('yyyy-MM-dd HH:mm:ss'),
    utc_full_dates: (d) => DateTime.fromMillis(d).toUTC().toFormat('yyyy-MM-dd HH:mm:ss'),
    ratio: (d) => `${Number(d).toFixed(0)}%`,
    highPrecisionNumber: (d) => numeral(d).format('0.0000'),
    lowPrecisionNumber: (d) => numeral(d).format('0.0'),
    number: (d) => numeral(d).format('0,0'),

}

function getFormatter(type, format, units) {
    switch (type) {
        case "bytes":
            return formatter.bytes
        case "ratio":
            return formatter.ratio
        case "num":
            return getNumFormatter(format, units)
        default:
            return formatter.lowPrecisionNumber
    }
}

function getNumFormatter(format, units) {
    return (d) => numeral(d).format(format) + (units ? ` ${units}` : '')
}

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
            fill: '#333',
            fontSize: 12,
            fontStyle: 'bold',
            fontFamily: "'Open Sans', Helvetica, Arial, sans-serif",
            padding: 2,
        },
        axisLine: {
            stroke: '#333',
        },
        tickLabel: {
            fill: '#333',
            fontSize: 10,
            fontFamily: "'Open Sans', Helvetica, Arial, sans-serif",
            fontStyle: 'normal',
            padding: 2,
        },
        tickLine: {
            visible: true,
            stroke: '#333',
            strokeWidth: 1,
            padding: 0,
        },
    },
}

const vstyle = {
    fontSize: 12,
    wordBreak: "break-all",
    marginRight: "5px"
};

const MonitorDatePicker = ({timeRange, commonlyUsedRanges, onChange, isLoading}) => {
    // const [recentlyUsedRanges, setRecentlyUsedRanges] = useState([]);
    const [isPaused, setIsPaused] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState(10000);
  
    const onTimeChange = ({ start, end }) => {
        onChange({
            start,
            end,
        });
    };
  
    const onRefresh = ({ start, end, refreshInterval }) => {
        onChange({start, end})
    };
  
    const onRefreshChange = ({ isPaused, refreshInterval }) => {
      setIsPaused(isPaused);
      setRefreshInterval(refreshInterval);
    };
  
    return (
        <EuiSuperDatePicker
            dateFormat= ''
          isLoading={isLoading}
          start={timeRange?.min}
          end={timeRange?.max}
          onTimeChange={onTimeChange}
          onRefresh={onRefresh}
          isPaused={isPaused}
          refreshInterval={refreshInterval}
          onRefreshChange={onRefreshChange}
          commonlyUsedRanges={commonlyUsedRanges}
        //   recentlyUsedRanges={recentlyUsedRanges}
        />
    );
  };

@connect(({clusterMonitor,global}) => ({
    clusterMonitor,
    selectedCluster: global.selectedCluster,
    clusterList: global.clusterList
}))

class ClusterMonitor extends PureComponent {
    constructor(props) {
        super(props);
        //this.timePicker = React.createRef();
        this.handleChartBrush = this.handleChartBrush.bind(this);
    }

    state = {
        spinning: false,
        clusterID:null,
        timeRange: {
            min: 'now-1h', //moment().subtract(1, 'h').toISOString(),
            max: 'now'//moment().toISOString()
        },
    }

    componentWillReceiveProps(newProps) {

    }

    fetchData = () => {

        console.log("fetching data ing."+this.state.clusterID)

        if (this.state.clusterID===undefined||this.state.clusterID===""||this.state.clusterID===null){
            return
        }

        this.setState({
            spinning:true,
        })

        fetchDataCount++;
        const {dispatch} = this.props;
        const {timeRange} = this.state;
        const bounds = calculateBounds({
            from: timeRange.min,
            to: timeRange.max,
        });
        dispatch({
            type: 'clusterMonitor/fetchClusterMetrics',
            payload: {
                timeRange: {
                    min: bounds.min.valueOf(),
                    max: bounds.max.valueOf(),
                },
                cluster_id:this.state.clusterID
            },
        }).then(()=>{
            this.setState({
                spinning:false,
            })
        })
    }

    componentWillUnmount() {
        clearInterval(tv1);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {

        // console.log(this.props.selectedCluster)
        // console.log(this.state.clusterID)

        if (this.props.selectedCluster.id!==this.state.clusterID){
            console.log("cluster changed")

            this.setState({ clusterID:this.props.selectedCluster.id }, () => {
                //TODO 处理 cancel 事件，先把当前还在执行中的请求结束，避免更新完成之后，被晚到的之前的请求给覆盖了。
                this.fetchData();
            });
        }
    }

    componentDidMount() {
        const {match, location} = this.props;

        const queryESID=this.props.match.params.cluster_id;

        if (queryESID !== null&&queryESID !== undefined){
            this.state.clusterID=queryESID
            const {dispatch} = this.props;
            dispatch({
                type: 'global/changeClusterById',
                payload: {
                    id: queryESID
                }
            })
        }else if (this.props.selectedCluster.id!==undefined&&this.props.selectedCluster.id!==null){
            this.setState({ clusterID:this.props.selectedCluster.id }, () => {
            });
        }else{
            //alert("cluster ID is not set");
            return
        }

        console.log("selectedCluster:"+this.state.clusterID)

        let min = location.query.start || this.state.timeRange.min;//'2020-12-10 15:00';
        let max = location.query.end || this.state.timeRange.max;//'2020-12-10 16:00';
        this.setState({
            timeRange: {
                min: min,
                max: max,
            },
        }, () => {
            this.fetchData();
        })


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


    handleChartBrush({x}) {
        if (!x) {
            return;
        }
        const [from, to] = x;
        let timeRange = {
            min: moment(from).toISOString(),
            max: moment(to).toISOString(),
        }
        this.setState({
            timeRange: timeRange,
        }, () => {
            this.fetchData();
        });
    }

    handleTimeChange = ({start, end})=>{
        this.setState({
            timeRange: {
                min: start,
                max: end,
            }
        },()=>{
            this.fetchData();
        })
    }


    render() {

        const {clusterMonitor} = this.props;
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
            };
        }

        if (clusterMonitor.metrics) {
            clusterMetrics = clusterMonitor.metrics;
        }

        const commonlyUsedRanges =
        [
            {
                from: 'now-15m',
                to: 'now',
                display: '最近15分钟'
            },
            {
            from: 'now-30m',
            to: 'now',
            display:  '最近30分钟'
            },
            {
            from: 'now-1h',
            to: 'now',
            display: '最近一小时'
            },
            {
            from: 'now-24h',
            to: 'now',
            display: '最近一天',
            },
          {
            from: 'now/d',
            to: 'now/d',
            display:'今天',
          },
          {
            from: 'now/w',
            to: 'now/w',
            display: '这个星期'
          },
          {
            from: 'now-7d',
            to: 'now',
            display:  '最近一周',
          },
          {
            from: 'now-30d',
            to: 'now',
            display: '最近一个月',
          },
          {
            from: 'now-90d',
            to: 'now',
            display:  '最近三个月',
          },
          {
            from: 'now-1y',
            to: 'now',
            display: '最近一年',
          },
        ].map(({ from, to, display }) => {
          return {
            start: from,
            end: to,
            label: display,
          };
        });

        return (
            <Spin spinning={this.state.spinning} tip="Loading...">
                <div>
                    <div style={{background: "#fff", padding: "5px", marginBottom: 5}}>
                        <MonitorDatePicker timeRange={this.state.timeRange} commonlyUsedRanges={commonlyUsedRanges} 
                        isLoading={this.state.spinning}
                        onChange={this.handleTimeChange} />
                    </div>

                    <Card
                         //title={this.state.clusterID?this.state.clusterID:''}
                        style={{marginBottom: 5}}>
                        <Row>
                            <Col md={2} xs={4}>
                                <Statistic valueStyle={vstyle} title="集群名称" value={clusterStats.cluster_name}/>
                            </Col>
                            <Col md={2} xs={4}>
                                <Statistic valueStyle={vstyle} title="在线时长" value={clusterStats.uptime}/>
                            </Col>
                            <Col md={2} xs={4}>
                                <Statistic valueStyle={vstyle} title="集群版本" value={clusterStats.version}/>
                            </Col>
                            <Col md={2} xs={4}>
                                <Statistic valueStyle={vstyle} title="健康情况" value={clusterStats.status}
                                           prefix={<HealthCircle color={clusterStats.status}/>}/>
                            </Col>
                            <Col md={2} xs={4}>
                                <Statistic valueStyle={vstyle} title="节点数" value={clusterStats.nodes_count}/>
                            </Col>
                            <Col md={2} xs={4}>
                                <Statistic valueStyle={vstyle} title="索引数" value={clusterStats.indices_count}/>
                            </Col>

                            <Col md={2} xs={4}>
                                <Statistic valueStyle={vstyle} title="主/总分片"
                                           value={clusterStats.primary_shards + '/' + clusterStats.total_shards}/>
                            </Col>

                            <Col md={2} xs={4}>
                                <Statistic valueStyle={vstyle} title="未分配分片"
                                           value={clusterStats.unassigned_shards}/>
                            </Col>

                            <Col md={2} xs={4}>
                                <Statistic valueStyle={vstyle} title="文档数" value={clusterStats.document_count}/>
                            </Col>

                            <Col md={2} xs={4}>
                                <Statistic valueStyle={vstyle} title="存储空间"
                                           value={clusterStats.used_store_bytes + '/' + clusterStats.max_store_bytes}/>
                            </Col>
                            <Col md={2} xs={4}>
                                <Statistic valueStyle={vstyle} title="JVM 内存"
                                           value={clusterStats.used_jvm_bytes + '/' + clusterStats.max_jvm_bytes}/>
                            </Col>


                        </Row>
                    </Card>


                    {
                        Object.keys(clusterMetrics).map((e, i) => {
                            let axis = clusterMetrics[e].axis
                            let lines = clusterMetrics[e].lines
                            let disableHeaderFormat = false
                            let headerUnit = ""
                            return (
                                <div key={e} className={styles.vizChartContainer}>
                                    <Chart size={[, 200]} className={styles.vizChartItem}>
                                        <Settings theme={theme} showLegend legendPosition={Position.Top}
                                                    onBrushEnd={this.handleChartBrush}
                                                  tooltip={{
                                                      headerFormatter: disableHeaderFormat
                                                          ? undefined
                                                          : ({value}) => `${formatter.full_dates(value)}${headerUnit ? ` ${headerUnit}` : ''}`,
                                                  }}
                                                  debug={false}/>
                                        <Axis id="{e}-bottom" position={Position.Bottom} showOverlappingTicks
                                              labelFormat={formatter.dates}
                                              tickFormat={formatter.dates}
                                        />
                                        {
                                            axis.map((item) => {
                                                return <Axis key={e + '-' + item.id}
                                                    id={e + '-' + item.id}
                                                    showGridLines={item.showGridLines}
                                                    groupId={item.group}
                                                    title={formatMessage({id: 'dashboard.charts.title.' + e + '.axis.' + item.title})}
                                                    position={item.position}
                                                    ticks={item.ticks}
                                                    labelFormat={getFormatter(item.formatType, item.labelFormat)}
                                                    tickFormat={getFormatter(item.formatType, item.tickFormat)}
                                                />
                                            })
                                        }

                                        {
                                            lines.map((item) => {
                                                return <LineSeries key={item.metric.label}
                                                    id={item.metric.label}
                                                    groupId={item.metric.group}
                                                    timeZone={timezone}
                                                    xScaleType={ScaleType.Time}
                                                    yScaleType={ScaleType.Linear}
                                                    xAccessor={0}
                                                    tickFormat={getFormatter(item.metric.formatType, item.metric.tickFormat, item.metric.units)}
                                                    yAccessors={[1]}
                                                    data={item.data}
                                                    curve={CurveType.CURVE_MONOTONE_X}
                                                />
                                            })
                                        }

                                    </Chart>
                                </div>
                            )
                        })
                    }
                </div>
            </Spin>
        );
    }
}

export default ClusterMonitor;
