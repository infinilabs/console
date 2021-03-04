import React, {PureComponent} from 'react';
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
            min: moment().subtract(1, 'h').toISOString(),
            max: moment().toISOString()
        },
        lastSeconds: 3600,
        qsVisible: false,
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
        //console.log(fetchDataCount, moment().diff(startTime)/1000);
        const {dispatch} = this.props;
        let {timeRange, lastSeconds} = this.state;
        if (lastSeconds && lastSeconds > 0) {
            timeRange = {
                min: moment().subtract(lastSeconds, 's').toISOString(),
                max: moment().toISOString(),
            };
            this.setState({
                pickerValue: [moment().subtract(lastSeconds, 's'), moment()],
            });
            //this.timePicker.current.value= [moment().subtract(lastSeconds, 's'), moment()];
        }
        let msDiff = moment(timeRange.max).diff(moment(timeRange.min));
        let timeMask = 'HH:mm';
        //console.log(msDiff);
        if (msDiff > 1000 * 3600 + 5 * 1000 && msDiff <= 1000 * 3600 * 24 * 5) {
            timeMask = 'MM-DD HH'
        } else if (msDiff > 1000 * 3600 * 24 * 5 && msDiff <= 1000 * 3600 * 24 * 182) {
            timeMask = 'MM-DD'
        } else if (msDiff > 1000 * 3600 * 24 * 182) {
            timeMask = 'YY-MM-DD'
        }
        this.setState({timeScale: {min: timeRange.min, max: timeRange.max, mask: timeMask}});
        dispatch({
            type: 'clusterMonitor/fetchClusterMetrics',
            payload: {
                timeRange: timeRange,
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

        const queryESID=this.props.match.params.elasticsearch;

        if (queryESID !== null&&queryESID !== undefined){
            this.state.clusterID=queryESID
            const {dispatch} = this.props;
            dispatch({
                type: 'global/changeClusterById',
                payload: {
                    id: queryESID
                }
            })
        }else{
            //alert("cluster ID is not set");
            return
        }

        console.log("selectedCluster:"+this.state.clusterID)

        let min = location.query.start || '2020-12-10 15:00';
        let max = location.query.end || '2020-12-10 16:00';
        min = moment(min, 'YYYY-MM-DD HH:mm');
        max = moment(max, 'YYYY-MM-DD HH:mm');
        this.setState({
            timeRange: {
                min: min,
                max: max,
            },
            lastSeconds: 0,
            pickerValue: [min, max],
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

    onTimeOk = (values) => {
        //console.log('onOk: ', values);
        const min = values[0].toISOString();
        const max = values[1].toISOString();
        this.setState({
            timeRange: {
                min: min,
                max: max
            },
            lastSeconds: 0,
        }, () => {
            this.fetchData();
        });
    }
    onTimeChange = (values) => {
        this.setState({
            pickerValue: values,
        });
    }

    handleQuickSelect = (ev) => {
        let lastSeconds = 0;
        let key = ev.key || ev.target.type;
        switch (key) {
            case "2":
                lastSeconds = 3600 * 24;
                break;
            case "3":
                lastSeconds = 3600 * 24 * 7;
                break;
            case "4":
                lastSeconds = 3600 * 24 * 30;
                break;
            case "5":
                lastSeconds = 3600 * 24 * 30 * 3;
                break;
            case "6":
                lastSeconds = 3600 * 24 * 365;
                break;
            default:
                lastSeconds = 60 * 60;
        }
        this.setState({
            lastSeconds: lastSeconds,
            qsVisible: false,
        }, () => {
            this.fetchData();
        });
    }

    handleQSVisibleChange = flag => {
        this.setState({qsVisible: flag});
    };

    handleChartBrush(ev) {
        let dtimes = ev.time;
        if (dtimes.length < 2)
            return;
        let timeRange = {
            min: dtimes[0],
            max: dtimes[1],
        }
        this.setState({
            timeRange: timeRange,
            lastSeconds: 0,
            pickerValue: [moment(dtimes[0]), moment(dtimes[1])],
        }, () => {
            this.fetchData();
        });
    }

    handleAutoRefresh = () => {
        let unit = this.refreshUnit.rcSelect.state.value[0];
        let base = 1;
        switch (unit) {
            case "minutes":
                base *= 60;
                break;
            case "hours":
                base *= 3600
                break;
        }
        let durationInSeconds = this.refreshNum.inputNumberRef.state.value * base;
        this.autoRefresh(durationInSeconds);
    }

    handleRecentInput = () => {
        let unit = this.recentUnit.rcSelect.state.value[0];
        let base = 1;
        switch (unit) {
            case "minutes":
                base *= 60;
                break;
            case "hours":
                base *= 3600;
                break;
            case "days":
                base *= 3600 * 24;
                break;
            case "weeks":
                base *= 3600 * 24 * 7;
                break;
            case "months":
                base *= 3600 * 24 * 30;
                break;
            case "years":
                base *= 3600 * 24 * 365;
                break;
        }
        let lastSeconds = this.recentNum.inputNumberRef.state.value * base;
        this.setState({
            lastSeconds: lastSeconds,
        }, () => {
            this.fetchData();
        });
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

        const menu = (
            <div style={{background: "#fff", border: "1px solid #ccc", padding: 5}}>
                <Input.Group compact style={{marginBottom: 10}}>
                    <Button style={{cursor: "default"}}>最近</Button>
                    <InputNumber min={1} defaultValue={1} ref={el => this.recentNum = el}/>
                    <Select defaultValue="hours" ref={el => this.recentUnit = el}>
                        <Select.Option value="minutes">分</Select.Option>
                        <Select.Option value="hours">时</Select.Option>
                        <Select.Option value="days">天</Select.Option>
                        <Select.Option value="weeks">周</Select.Option>
                        <Select.Option value="months">月</Select.Option>
                        <Select.Option value="years">年</Select.Option>
                    </Select>
                    <Button type="primary" onClick={this.handleRecentInput}>
                        确定
                    </Button>
                </Input.Group>
                <div style={{marginBottom: 10}}>
                    <Row gutter={[24, 5]}>
                        <Col span={12}><a type="1" onClick={this.handleQuickSelect}>最近一个小时</a></Col>
                        <Col span={12}><a type="2" onClick={this.handleQuickSelect}>最近一天</a></Col>
                    </Row>
                    <Row gutter={[24, 5]}>
                        <Col span={12}><a type="3" onClick={this.handleQuickSelect}>最近一周</a></Col>
                        <Col span={12}><a type="4" onClick={this.handleQuickSelect}>最近一个月</a></Col>
                    </Row>
                    <Row gutter={[24, 5]}>
                        <Col span={12}><a type="5" onClick={this.handleQuickSelect}>最近三个月</a></Col>
                        <Col span={12}><a type="6" onClick={this.handleQuickSelect}>最近一年</a></Col>
                    </Row>
                </div>
                {/* // <Menu onClick={this.handleQuickSelect}>
      //   <Menu.Item key="1">
      //     最近一小时
      //   </Menu.Item>
      //   <Menu.Item key="2">
      //     最近一天
      //   </Menu.Item>
      //   <Menu.Item key="3">
      //     最近一周
      //   </Menu.Item>
      //   <Menu.Item key="4">
      //     最近一个月
      //   </Menu.Item>
      //   <Menu.Divider/>
      //   <Menu.Item key="5"> */}
                <Input.Group compact>
                    <Button style={{cursor: "default"}}>刷新间隔</Button>
                    <InputNumber min={-1} defaultValue={-1} ref={el => this.refreshNum = el}/>
                    <Select defaultValue="seconds" ref={el => this.refreshUnit = el}>
                        <Select.Option value="seconds">秒</Select.Option>
                        <Select.Option value="minutes">分</Select.Option>
                        <Select.Option value="hours">时</Select.Option>
                    </Select>
                    <Button type="primary" onClick={this.handleAutoRefresh}>
                        确定
                    </Button>
                </Input.Group>
                {/* //   </Menu.Item>
      // </Menu> */}
            </div>
        );

        return (
            <Spin spinning={this.state.spinning} tip="Loading...">
                <div>

                    <div style={{background: "#fff", padding: "5px", marginBottom: 5}}>
                        <Input.Group compact>
                            <Dropdown overlay={menu}
                                      onVisibleChange={this.handleQSVisibleChange}
                                      visible={this.state.qsVisible}
                            >
                                <Button>
                                    快速选择 <Icon type="clock-circle"/>
                                </Button>
                            </Dropdown>
                            <RangePicker
                                showTime={{format: 'HH:mm'}}
                                format="YYYY-MM-DD HH:mm"
                                placeholder={['开始时间', '结束时间']}
                                defaultValue={[moment().subtract(1, 'h'), moment()]}
                                value={this.state.pickerValue}
                                onChange={this.onTimeChange}
                                onOk={this.onTimeOk}
                            />
                            <Button type="primary" onClick={this.fetchData}>
                                刷新
                            </Button>
                        </Input.Group>
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

                            <Col md={3} xs={4}>
                                <Statistic valueStyle={vstyle} title="分片数"
                                           value={clusterStats.primary_shards + '/' + clusterStats.unassigned_shards + '/' + clusterStats.total_shards}/>
                            </Col>

                            <Col md={3} xs={4}>
                                <Statistic valueStyle={vstyle} title="文档数" value={clusterStats.document_count}/>
                            </Col>

                            <Col md={3} xs={4}>
                                <Statistic valueStyle={vstyle} title="存储空间"
                                           value={clusterStats.used_store_bytes + '/' + clusterStats.max_store_bytes}/>
                            </Col>
                            <Col md={3} xs={4}>
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
                                <div className={styles.vizChartContainer}>
                                    <Chart size={[, 200]} className={styles.vizChartItem}>
                                        <Settings theme={theme} showLegend legendPosition={Position.Top}
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
                                                return <Axis
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
                                                return <LineSeries
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
