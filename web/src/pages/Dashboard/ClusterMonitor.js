import React, { PureComponent,Fragment } from 'react';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi/locale';
import { Row, Col, Card,Statistic,Icon, Divider, Skeleton } from 'antd';
import moment from 'moment';


import {
  G2,
  Chart,
  Geom,
  Axis,
  Tooltip,
  Legend,
} from 'bizcharts';
import { func } from 'prop-types';

let generateHeapData = (target)=>{
  let data = [];
  let generator = (initTime) => {
    var now = new Date();
    var time = initTime||now.getTime();
    var heap1 = ~~(Math.random() * 500) + 200;
    var heap2 = ~~(Math.random() * 300) + 512;
    if (data.length >= 120) {
      data.shift();
      data.shift();
    }

    data.push({
      time: time,
      heap_ratio: (heap1 *100) /1024,
      type: "node1"
    });
    data.push({
      time: time,
      heap_ratio: (heap2 *100)/1024,
      type: "node2"
    });
    !initTime && target.setState({
      data
    });
  };
    let stime = new Date();
    for(let i=120;i>0;i--){
      generator(new Date(stime.valueOf()- i * 1000 * 30));
    }
    target.setState({
      data
    });
  setInterval(()=>{generator(null)}, 30000);
}

let generateCpuData = (target)=>{
  let data = [];
  let generator = (initTime) => {
    var now = new Date();
    var time = initTime || now.getTime();
    var cpu1 = ~~(Math.random()*5) + 0.1;
    var cpu2 = ~~(Math.random()*3) +0.2;
    if (data.length >= 120) {
      data.shift();
      data.shift();
    }

    data.push({
      time: time,
      cpu_ratio: cpu1,
      type: "node1"
    });
    data.push({
      time: time,
      cpu_ratio: cpu2,
      type: "node2"
    });
    !initTime && target.setState({
      data
    });
  };
    let stime = new Date();
    for(let i=120;i>0;i--){
      generator(new Date(stime.valueOf()- i * 1000 * 30));
    }
    target.setState({
      data
    });
  setInterval(()=>{generator(null)}, 30000);
}

let generateSearchLatencyData = (target)=>{
  let data = [];
  let generator = (initTime) => {
    var now = new Date();
    var time = initTime || now.getTime();
    var latency1 = ~~(Math.random()*100) + 10;
    var latency2 = ~~(Math.random()*150) +30;
    if (data.length >= 120) {
      data.shift();
      data.shift();
    }

    data.push({
      time: time,
      latency: latency1,
      type: "node1"
    });
    data.push({
      time: time,
      latency: latency2,
      type: "node2"
    });
    !initTime && target.setState({
      data
    });
  };
  let stime = new Date();
  for(let i=120;i>0;i--){
    generator(new Date(stime.valueOf()- i * 1000 * 30));
  }
  target.setState({
    data
  });
  setInterval(()=>{generator(null)}, 30000);
}

let generateIndexLatencyData = (target)=>{
  let data = [];
  let generator = (initTime) => {
    var now = new Date();
    var time = initTime || now.getTime();
    var latency1 = ~~(Math.random()*400) + 50;
    var latency2 = ~~(Math.random()*500) +20;
    if (data.length >= 120) {
      data.shift();
      data.shift();
    }

    data.push({
      time: time,
      latency: latency1,
      type: "node1"
    });
    data.push({
      time: time,
      latency: latency2,
      type: "node2"
    });
    !initTime && target.setState({
      data
    });
  };

  let stime = new Date();
  for(let i=120;i>0;i--){
    generator(new Date(stime.valueOf()- i * 1000 * 30));
  }
  target.setState({
    data
  });
  setInterval(()=>{generator(null)}, 30000);
}



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
        <Chart
          data={this.props.data}
          scale={scale}
          height={300}
          forceFit
          // onGetG2Instance={g2Chart => {
          //   chart = g2Chart;
          // }}
        >
           <h3 className='main-title' style={styles.mainTitle}>
              {this.props.title}
          </h3>
          <Tooltip />
          <Axis grid={grid} name={xname} title={axisTitle}/>
          <Axis grid={grid} label={axisLabel} name={yname} title={axisTitle}/>
          <Legend />
          <Geom
            type="line"
            position={pos}
            color={["type"]} //["#ff7f0e", "#2ca02c"]
            shape="line"
            size={2}
          />
					<Geom
					    type="point"
          position={pos}
          size={3}
          shape={'circle'}
          style={{ stroke: '#fff', lineWidth: 1 }}
          color="type"
        />
        </Chart>
      );
    }
  }

const styles ={
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
    timeScale: {min: moment().subtract(1, 'h').valueOf(), max: new Date()},
  }
  componentDidMount(){
    let {dispatch} = this.props;
    let me = this;
    setInterval(function(){
      dispatch({
        type: 'clusterMonitor/fetchClusterNodeStats',
        callback: ({nodes_stats})=> {
          // var heapStats = [], cpuStats=[],searchLatency=[], indexLatency=[];
          // for(let st of nodes_stats){
          //   var fields = {
          //     time: st.timestamp,
          //     type: st.node_name,
          //   }
          //   heapStats.push({
          //     ...fields,
          //     heap_ratio: st.node_stats.jvm.mem.heap_used_percent,
          //   });
          //   cpuStats.push({
          //     ...fields,
          //     cpu_ratio: st.node_stats.process.cpu.percent,
          //   });
          // }
          let nodesStats = nodes_stats;
          let nodeCpu = [],nodeHeap=[],nodeSearchLatency=[],nodeIndexLatency=[];
          let now = moment(1607085646112);
            for(let ns of nodesStats){
              let i = 0;
                for(let bk of ns.metrics.buckets){
                    let fields = {
                        time: now.subtract(300-30*i , 's').valueOf(), //bk.key_as_string,
                        type: ns.key,
                    };
                    i++;
                    nodeCpu.push({
                        ...fields,
                        cpu_ratio: bk.cpu_used.value,      
                    });
                    nodeHeap.push({
                        ...fields,
                        heap_ratio: bk.heap_percent.value,
                    });
                    nodeSearchLatency.push({
                        ...fields,
                        latency: bk.ds1 ? (bk.ds1.value/bk.ds.value).toFixed(2): 0,
                    });
                    nodeIndexLatency.push({
                        ...fields,
                        latency: bk.ds1 ? (bk.ds4.value/bk.ds3.value).toFixed(2): 0,
                    });
                }
            }
          me.setState({
              heapStats: nodeHeap,
              cpuStats: nodeCpu,
              searchLatency: nodeSearchLatency,
              indexLatency: nodeIndexLatency,
              timeScale: {min: moment().subtract(1, 'h').valueOf(), max: new Date()},
          });
        }
      });
    }, 10000);
  }
  render(){
    return (
      <div>
      <Row gutter={24} style={{marginBottom:10}}>
      <Col xl={12} lg={24} md={24} sm={24} xs={24}>
        <Card>
          <SliderChart title="内存使用占比(%)" xname="time" yname="heap_ratio"
            data={this.state.heapStats}
            unit="%"
            scale={{
              time: {
                alias: "时间",
                type: "time",
                mask: "HH:mm",
                tickCount: 6,
                ...this.state.timeScale,
                nice: false,
              },
              heap_ratio: {
                alias: "内存使用百分比",
                min: 0,
            //    max: 100
              },
              type: {
                type: "cat"
              }
            }
          }
          />
        </Card>        
      </Col>
      <Col xl={12} lg={24} md={24} sm={24} xs={24}>
        <Card>
        <SliderChart title="CPU使用占比(%)" xname="time" yname="cpu_ratio"
            type="cpu_ratio"
            data={this.state.cpuStats}
            generateFunc={generateCpuData}
            unit="%"
            scale={{
              time: {
                alias: "时间",
                type: "time",
                mask: "HH:mm",
                tickCount: 6,
                ...this.state.timeScale,
                nice: false,
              },
              cpu_ratio: {
                alias: "CPU使用百分比",
                min: 0,
                // max: 1
              },
              type: {
                type: "cat"
              }
            }
          }
          />       
        </Card>
      </Col>
      </Row>

      <Row gutter={24}>
      <Col xl={12} lg={24} md={24} sm={24} xs={24}>
        <Card>
          <SliderChart title="搜索延迟(ms)" xname="time" yname="latency"
            type="search_latency"
            data={this.state.searchLatency}
            generateFunc={generateSearchLatencyData}
            unit="ms"
            scale={{
              time: {
                alias: "时间",
                type: "time",
                mask: "HH:mm",
                tickCount: 6,
                ...this.state.timeScale,
                nice: false,
              },
              heap_ratio: {
                alias: "延迟时长",
                min: 0,
            //    max: 100
              },
              type: {
                type: "cat"
              }
            }
          }
          />
        </Card>        
      </Col>
      <Col xl={12} lg={24} md={24} sm={24} xs={24}>
        <Card>
        <SliderChart title="索引延迟(ms)" xname="time" yname="latency"
            type="index_latency"
            data={this.state.indexLatency}
            generateFunc={generateIndexLatencyData}
            unit="ms"
            scale={{
              time: {
                alias: "时间",
                type: "time",
                mask: "HH:mm",
                tickCount: 6,
                ...this.state.timeScale,
                nice: false,
              },
              cpu_ratio: {
                alias: "延迟时长",
                min: 0,
                // max: 1
              },
              type: {
                type: "cat"
              }
            }
          }
          />       
        </Card>
      </Col>
      </Row></div>
    )
  }
}

@connect(({ clusterMonitor }) => ({
  clusterMonitor
}))
class ClusterMonitor extends PureComponent {
  state={
  }
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'clusterMonitor/fetchClusterOverview',
    });
  }

  render() {
    let vstyle = {
      fontSize: 16,
    };
    let descStryle= {color:'#6a717d', fontSize: 12};
    const {clusterMonitor} = this.props;
    console.log(clusterMonitor);
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
    return (
      <div>
          <Card style={{marginBottom:5}}>
            <Row>
              <Col md={3} xs={8}>
                <Statistic valueStyle={vstyle} title="在线时长" value={clusterStats.online_duration} />
              </Col>
              <Col md={2} xs={4}>
                <Statistic valueStyle={vstyle} title="健康情况" value={clusterStats.status} prefix={<HealthCircle color="yellow"/>} />
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
         <StatsCharts/>
      </div>
    );
  }
}

export default ClusterMonitor;
