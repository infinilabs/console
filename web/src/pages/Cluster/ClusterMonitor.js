import React, { PureComponent,Fragment } from 'react';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi/locale';
import { Row, Col, Card,Statistic,Icon, Divider, DatePicker, Input, Dropdown, Menu, Button, InputNumber, Select } from 'antd';
import moment, { relativeTimeRounding } from 'moment';
import Brush from '@antv/g2-brush';
const { RangePicker } = DatePicker;


import {
  G2,
  Chart,
  Geom,
  Axis,
  Tooltip,
  Legend,
} from 'bizcharts';

  let charts = [];
  class SliderChart extends React.Component {
    constructor() {
      super();
      this.state = {
        data:[],
      };
    }

    componentDidMount() {
      //let {generateFunc }= this.props;
      //generateFunc(this);
    }
    render() {
    //console.log(data.length)
    const grid = {
      align: 'center', 
      type: 'line' ,
      lineStyle: {
        stroke: '#d9d9d9',
        lineWidth: 1, 
      }
    };
    let {xname, yname, scale, unit} = this.props;
    const axisLabel = {
      formatter(text){
        return `${text}${unit}`;
      }
    };
    const axisTitle = {
      textStyle:{
        fill: '#999',
      },
    }
    
    let  pos = `${xname}*${yname}`;
      return (
        <div style={{background:"#fff",padding: 10}}>
        <Chart
          data={this.props.data}
          onGetG2Instance={chart=>{
            //c.interaction('brush');
            let brushend = this.props.onBrushend;
            new Brush({
              canvas: chart.get('canvas'),
              chart,
              type: 'X',
              onBrushstart() {
                chart.hideTooltip();
              },
              onBrushmove() {
                chart.hideTooltip();
              },
              onBrushend(ev){       
                this.container.clear();
                brushend(ev);
              }
            });
            charts.push(chart);
          }}
          onPlotMove={ev=>{
            charts.forEach((chart)=>{
              chart.showTooltip({
                x: ev.x,
                y: ev.y
              });
            });
          }}
          onPlotLeave={ev=>{
            charts.forEach(chart=>{
              if(!chart.get('tooltipController')){
                return;
              }
              chart.hideTooltip();
            });
          }}
          scale={scale}
          height={180}
          forceFit
          padding="auto"
        >
           <h3 className='main-title' style={styles.mainTitle}>
              {this.props.title}
          </h3>
          <Tooltip />
          <Axis grid={grid} name={xname} />
          <Axis grid={grid} label={axisLabel} name={yname} title={axisTitle}/>
          <Legend />
          <Geom
            type="line"
            position={pos}
            color={["type"]} 
            shape="line"
            size={2}
          />
					<Geom
					    type="point"
          position={pos}
          size={2}
          shape={'circle'}
          style={{ stroke: '#fff', lineWidth: 1 }}
          color="type"
        />
        </Chart>
        </div>
      );
    }
  }

const styles ={
  mainTitle:{
    fontSize:14,
    color:"black",
    textAlign:"center"
  },
  subTitle:{
    fontSize:12,
    color:"gray",
    textAlign:"center"
  }
};

let HealthCircle = (props)=>{
  return (
    <div style={{
      background: props.color,
      width: 12,
      height: 12,
      borderRadius: 12,
    }}></div>
  )
}

let formatter = {
  bytes: (value)=>{ 
    if(null == value || value == ''){
        return "0 Bytes";
    }
    var unitArr = new Array("Bytes","KB","MB","GB","TB","PB","EB","ZB","YB");
    var index=0;
    var srcsize = parseFloat(value);
    index = Math.floor(Math.log(srcsize)/Math.log(1024));
    var size = srcsize/Math.pow(1024,index);
    size = size.toFixed(1); 
    return size + unitArr[index];
  }
}

@connect(({ clusterMonitor }) => ({
  clusterMonitor
}))
class StatsCharts extends PureComponent {
  state = {
    heapStats: [],
    cpuStats:[],
    searchLatency:[],
    indexLatency:[],
  //  timeScale: {min: moment().subtract(1, 'h').valueOf(), max: new Date()},
  }
  formatData(nodes_stats) {
      let nodesStats = nodes_stats || [];
      let nodeCpu = [],nodeHeap=[],nodeSearchLatency=[],nodeIndexLatency=[], readThreadQueue=[],writeThreadQueue=[],
      searchQps=[], indexQps=[];
      // let startTime = new Date();
      // let startMinutes = (Math.floor(startTime.getMinutes()/10)*10 + 70) % 60;
      // startTime.setMinutes(startMinutes == 0 ? 60: startMinutes, 0,0);
      // let vtime = startTime.valueOf();
      // let ticks = [];
      // for(let i=0; i<6;i++){
      //   ticks.push(
      //     new Date(vtime + (i - 6) * 10 * 60 *1000 ).toUTCString()
      //   );
      // }
        for(let ns of nodesStats){
          //let i = 0;
            for(let bk of ns.metrics.buckets){
                let fields = {
                    time: bk.key_as_string, //now.subtract(300-30*i , 's').valueOf(), 
                    type: ns.key,
                };
                nodeCpu.push({
                    ...fields,
                    cpu_ratio: bk.cpu_used.value,      
                });
                nodeHeap.push({
                    ...fields,
                    heap_ratio: bk.heap_percent.value,
                });
                bk.ds1 && nodeSearchLatency.push({
                    ...fields,
                    latency: bk.ds1.value ? (bk.ds1.value/bk.ds.value).toFixed(2) : null,
                });
                bk.ds4 && nodeIndexLatency.push({
                    ...fields,
                    latency: bk.ds4.value? (bk.ds4.value/bk.ds3.value).toFixed(2): null,
                });
                readThreadQueue.push({
                  ...fields,
                  queue: bk.read_threads_queue.value,
                });
                writeThreadQueue.push({
                  ...fields,
                  queue: bk.write_threads_queue.value,
                });
                // if(bk.search_qps && bk.search_qps.normalized_value && bk.search_qps.normalized_value < 0){
                //   console.log(bk.key_as_string, bk.search_qps.normalized_value, bk.search_qps.value);
                // }
                bk.search_qps && searchQps.push({
                  ...fields,
                  qps: bk.search_qps.normalized_value ? bk.search_qps.normalized_value.toFixed(2) : null,
                });
                bk.index_qps && indexQps.push({
                  ...fields, 
                  qps: bk.index_qps.normalized_value ? bk.index_qps.normalized_value.toFixed(2): null,
                });
            }
        }
        return {
            heapStats: nodeHeap,
            cpuStats: nodeCpu,
            searchLatency: nodeSearchLatency,
            indexLatency: nodeIndexLatency,
            readThreadQueue: readThreadQueue,
            writeThreadQueue: writeThreadQueue,
            searchQps: searchQps,
            indexQps: indexQps,
        };
      
   //       timeScale:{ticks: ticks, min: moment().subtract(1, 'h').valueOf(), max: moment().add(1, 'm').valueOf()}
  }
  componentDidMount(){
    // this.fetchData();
    // tv = setInterval(() =>{
    //   this.fetchData();
    // }, 10000);
  }
  render(){
    let data = this.formatData(this.props.data);
    return (
      <div>
      <Row gutter={24} style={{marginBottom:10}}>
      <Col xl={12} lg={24} md={24} sm={24} xs={24}>
          <SliderChart title="内存使用占比(%)" xname="time" yname="heap_ratio"
            onBrushend={this.props.onBrushend}
            data={data.heapStats}
            unit="%"
            scale={{
              time: {
                alias: "时间",
                type: "time",
                mask: "HH:mm",
                tickCount: 4,
                ...this.props.timeScale,
                nice: true,
              },
              heap_ratio: {
                alias: "内存使用百分比",
                min: 0,
            //    max: 100
                type: "linear"
              }
            }
          }
          />       
      </Col>
      <Col xl={12} lg={24} md={24} sm={24} xs={24}>
        <SliderChart title="CPU使用占比(%)" xname="time" yname="cpu_ratio"
            type="cpu_ratio"
            onBrushend={this.props.onBrushend}
            data={data.cpuStats}
            unit="%"
            scale={{
              time: {
                alias: "时间",
                type: "time",
                mask: "HH:mm",
                tickCount: 4,
                ...this.props.timeScale,
                nice: true,
              },
              cpu_ratio: {
                alias: "CPU使用百分比",
                min: 0,
                // max: 1
                type: "linear"
              }
            }
          }
          />       
      </Col>
      </Row>

      <Row gutter={24} style={{marginBottom:10}}>
      <Col xl={12} lg={24} md={24} sm={24} xs={24}>
          <SliderChart title="搜索延迟(ms)" xname="time" yname="latency"
            data={data.searchLatency}
            onBrushend={this.props.onBrushend}
            unit="ms"
            scale={{
              time: {
                alias: "时间",
                type: "time",
                mask: "HH:mm",
                tickCount: 4,
                ...this.props.timeScale,
                nice: true,
              },
              latency: {
                alias: "延迟时长",
                min: 0,
            //    max: 100
                type: "linear"
              }
            }
          }
          />     
      </Col>
      <Col xl={12} lg={24} md={24} sm={24} xs={24}>
        <SliderChart title="索引延迟(ms)" xname="time" yname="latency"
            type="index_latency"
            onBrushend={this.props.onBrushend}
            data={data.indexLatency}
            unit="ms"
            scale={{
              time: {
            //    alias: "时间",
                type: "time",
                mask: "HH:mm",
                tickCount: 4,
                ...this.props.timeScale,
                nice: true,
              },
              latency: {
                alias: "延迟时长",
                min: 0,
                type: "linear"
                // max: 1
              }
            }
          }
          />       
      </Col>
      </Row>
      <Row gutter={24} style={{marginBottom:10}}>
        <Col xl={12} lg={24} md={24} sm={24} xs={24}>
            <SliderChart title="搜索QPS" xname="time" yname="qps"
              type="test"
              onBrushend={this.props.onBrushend}
              data={data.searchQps}
              unit=""
              scale={{
                time: {
                  alias: "时间",
                  type: "time",
                  mask: "HH:mm",
                  tickCount: 4,
                  ...this.props.timeScale,
                  nice: true,
                },
                qps: {
                  min: 0,
                  type: "linear"
                },
              }
            }
            />     
        </Col>
        <Col xl={12} lg={24} md={24} sm={24} xs={24}>
          <SliderChart title="索引QPS" xname="time" yname="qps"
              onBrushend={this.props.onBrushend}
              data={data.indexQps}
              unit=""
              scale={{
                time: {
              //    alias: "时间",
                  type: "time",
                  mask: "HH:mm",
                  tickCount: 4,
                  ...this.props.timeScale,
                  nice: true,
                },
                qps: {
                  min: 0,
                  // max: 1
                  type: "linear"
                }
              }
            }
            />       
        </Col>
      </Row>
      <Row gutter={24} style={{marginBottom:10}}>
        <Col xl={12} lg={24} md={24} sm={24} xs={24}>
            <SliderChart title="索引线程" xname="time" yname="queue"
              data={data.readThreadQueue}
              onBrushend={this.props.onBrushend}
              unit=""
              scale={{
                time: {
                  alias: "时间",
                  type: "time",
                  mask: "HH:mm",
                  tickCount: 4,
                  ...this.props.timeScale,
                  nice: true,
                },
                queue: {
                  min: 0,
                  type: "linear"
                },
              }
            }
            />     
        </Col>
        <Col xl={12} lg={24} md={24} sm={24} xs={24}>
          <SliderChart title="读线程" xname="time" yname="queue"
              onBrushend={this.props.onBrushend}
              data={data.writeThreadQueue}
              unit=""
              scale={{
                time: {
              //    alias: "时间",
                  type: "time",
                  mask: "HH:mm",
                  tickCount: 4,
                  ...this.props.timeScale,
                  nice: true,
                },
                queue: {
                  min: 0,
                  // max: 1
                  type: "linear"
                }
              }
            }
            />       
        </Col>
        </Row>
      </div>
    )
  }
}

let startTime = moment();
let fetchDataCount = 0;
let tv1 = null;
@connect(({ clusterMonitor }) => ({
  clusterMonitor
}))
class ClusterMonitor extends PureComponent {
  constructor(props) {
    super(props);
    //this.timePicker = React.createRef();
    this.handleChartBrush = this.handleChartBrush.bind(this);
  }
  state={
    timeRange: {
      min: moment().subtract(1, 'h').toISOString(),
      max: moment().toISOString()
    },
    lastSeconds: 3600,
    qsVisible: false,
  }
  fetchData = () => {
    fetchDataCount++;
    //console.log(fetchDataCount, moment().diff(startTime)/1000);
    const { dispatch } = this.props;
    let {timeRange, lastSeconds } = this.state;
    if(lastSeconds && lastSeconds > 0){
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
    if(msDiff > 1000 * 3600 + 5 * 1000 && msDiff <= 1000 * 3600 * 24 * 5 ){
      timeMask = 'MM-DD HH'
    }else if (msDiff > 1000 * 3600 * 24 * 5  && msDiff <= 1000 * 3600 * 24 * 182){
      timeMask = 'MM-DD'
    }else if(msDiff > 1000 * 3600 * 24 * 182){
      timeMask = 'YY-MM-DD'
    }
    this.setState({timeScale: {min: timeRange.min, max: timeRange.max, mask: timeMask}});
    dispatch({
      type: 'clusterMonitor/fetchClusterOverview',
      payload: {
        timeRange: timeRange,
      },
    });
  }
  componentWillUnmount(){
    clearInterval(tv1);
  }
  componentDidMount() {
    const { match, location } = this.props;
    console.log(location.query.name, match.params);
    let min = location.query.start || '2020-12-10 15:00';
    let max = location.query.end || '2020-12-10 16:00';
    min = moment(min, 'YYYY-MM-DD HH:mm');
    max = moment(max, 'YYYY-MM-DD HH:mm');
    this.setState({
      timeRange:{
        min: min,
        max: max,
      },
      lastSeconds: 0,
      pickerValue: [min, max],
    },()=>{
      this.fetchData();
    })
    
    // tv1 = setInterval(()=>{
    //   this.fetchData();
    // }, 10000);
    this.autoRefresh();
  }

  autoRefresh(durationInSeconds){
    !durationInSeconds && (durationInSeconds = 10);
    clearInterval(tv1);
    tv1 = setInterval(()=>{
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
    }, ()=>{
      this.fetchData();
    });
  }
  onTimeChange = (values) => {
    this.setState({
      pickerValue: values,
    });
  }

  handleQuickSelect = (ev) =>{
    let lastSeconds = 0;
    let key = ev.key || ev.target.type;
    switch(key){
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
    },()=>{
      this.fetchData();
    });
  }
  
  handleQSVisibleChange = flag => {
    this.setState({ qsVisible: flag });
  };

  handleChartBrush(ev){
    let dtimes = ev.time;
    if(dtimes.length < 2)
      return;
    let timeRange = {
      min: dtimes[0],
      max: dtimes[1],
    }
    this.setState({
      timeRange: timeRange,
      lastSeconds: 0,
      pickerValue:[moment(dtimes[0]), moment(dtimes[1])],
    },()=>{
      this.fetchData();
    });
  }

  handleAutoRefresh = ()=>{
    let unit = this.refreshUnit.rcSelect.state.value[0];
    let base = 1;
    switch(unit){
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

  handleRecentInput = ()=>{
    let unit = this.recentUnit.rcSelect.state.value[0];
    let base = 1;
    switch(unit){
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
    },()=>{
      this.fetchData();
    });
  }

  render() {
    let vstyle = {
      fontSize: 16,
    };
    let descStryle= {color:'#6a717d', fontSize: 12};
    const {clusterMonitor} = this.props;
    //console.log(clusterMonitor);
    let clusterStats = {};
    if(clusterMonitor.elasticsearch){
      let rawStats = clusterMonitor.elasticsearch.cluster_stats;
      clusterStats = {
        status: rawStats.status,
        nodes_count: rawStats.nodes.count.total,
        disk_avaiable: (rawStats.nodes.fs.available_in_bytes/rawStats.nodes.fs.total_in_bytes * 100).toFixed(2) + "%",
        disk_desc: formatter.bytes(rawStats.nodes.fs.available_in_bytes) + "/" + formatter.bytes(rawStats.nodes.fs.total_in_bytes),
        jvm_mem: (rawStats.nodes.jvm.mem.heap_used_in_bytes/rawStats.nodes.jvm.mem.heap_max_in_bytes * 100).toFixed(2) + "%",
        jvm_desc: formatter.bytes(rawStats.nodes.jvm.mem.heap_used_in_bytes) + "/" + formatter.bytes(rawStats.nodes.jvm.mem.heap_max_in_bytes),
        shards_count: rawStats.indices.shards.total,
        shards_desc:  "主:" + rawStats.indices.shards.primaries + ",从:" + rawStats.indices.shards.replication,
        docs: rawStats.indices.docs.count,
        indices_count: rawStats.indices.count,
        online_duration: moment.duration(rawStats.nodes.jvm.max_uptime_in_millis).humanize(),
      };
    }
    //console.log(clusterMonitor.nodes_stats);
    const menu = (
      <div style={{background:"#fff", border: "1px solid #ccc", padding: 10}}>
         <Input.Group compact style={{marginBottom: 10}}>
            <Button style={{cursor: "default"}}>最近</Button>
            <InputNumber min={1} defaultValue={1} ref={el => this.recentNum = el} />
            <Select defaultValue="hours"  ref={el => this.recentUnit = el}>
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
          <Row gutter={[24,5]}>
            <Col span={12}><a type="3" onClick={this.handleQuickSelect}>最近一周</a></Col>
            <Col span={12}><a type="4" onClick={this.handleQuickSelect}>最近一个月</a></Col>
          </Row>
          <Row gutter={[24,5]}>
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
            <Button style={{cursor: "default"}}>自动刷新间隔</Button>
            <InputNumber min={1} defaultValue={10} ref={el => this.refreshNum = el} />
            <Select defaultValue="seconds"  ref={el => this.refreshUnit = el}>
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
      <div>
         <div style={{background: "#fff", padding: "10px", marginBottom: 5}}>
         <Input.Group compact>
            <Dropdown overlay={menu}
            onVisibleChange={this.handleQSVisibleChange}
            visible={this.state.qsVisible}
            >
              <Button>
                快速选择 <Icon type="clock-circle" />
              </Button>
            </Dropdown>
            <RangePicker
              showTime={{ format: 'HH:mm' }}
              format="YYYY-MM-DD HH:mm"
              placeholder={['开始时间', '结束时间']}
              defaultValue ={[moment().subtract(1, 'h'), moment()]}
              value={this.state.pickerValue}
              onChange={this.onTimeChange} 
              onOk={this.onTimeOk}
            />
            <Button type="primary" onClick={this.fetchData}>
              刷新
            </Button>
          </Input.Group>
          </div>
          <Card style={{marginBottom:5}}>
            <Row>
              <Col md={3} xs={8}>
                <Statistic valueStyle={vstyle} title="在线时长" value={clusterStats.online_duration} />
              </Col>
              <Col md={2} xs={4}>
                <Statistic valueStyle={vstyle} title="健康情况" value={clusterStats.status} prefix={<HealthCircle color={clusterStats.status}/>} />
              </Col>
              <Col md={2} xs={4}>
                <Statistic valueStyle={vstyle} title="节点数" value={clusterStats.nodes_count} />
              </Col>
              <Col md={5} xs={8}>
                <Statistic valueStyle={vstyle} title="磁盘可用率" value={clusterStats.disk_avaiable} suffix={
                  <div style={descStryle}>({clusterStats.disk_desc})</div>
                } />
              </Col>
              <Col md={5} xs={8}>
                <Statistic valueStyle={vstyle} title="JVM内存使用率" value={clusterStats.jvm_mem} suffix={
                  <div style={descStryle}>({clusterStats.jvm_desc})</div>
                } />
              </Col>
              <Col md={3} xs={8}>
                <Statistic valueStyle={vstyle} title="分片数" value={clusterStats.shards_count} suffix={
                  <div style={descStryle}>({clusterStats.shards_desc})</div>
                } />
              </Col>
              <Col md={2} xs={4}>
                <Statistic valueStyle={vstyle} title="索引个数" value={clusterStats.indices_count} />
              </Col>
              <Col md={2} xs={4}>
                <Statistic valueStyle={vstyle} title="文档数" value={clusterStats.docs} />
              </Col>
            </Row>
          </Card>
         <StatsCharts data={clusterMonitor.nodes_stats} 
         onBrushend={this.handleChartBrush}
         timeScale={this.state.timeScale}/>
      </div>
    );
  }
}

export default ClusterMonitor;
