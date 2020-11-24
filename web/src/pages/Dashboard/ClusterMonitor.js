import React, { PureComponent,Fragment } from 'react';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi/locale';
import { Row, Col, Card } from 'antd';

import {
  G2,
  Chart,
  Geom,
  Axis,
  Tooltip,
  Legend,
} from 'bizcharts';

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
      let {generateFunc }= this.props;
      generateFunc(this);
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
          data={this.state.data}
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
// @connect(({ monitor, loading }) => (
//   monitor,
//   loading: loading.models.monitor,
// }))
class ClusterMonitor extends PureComponent {
  componentDidMount() {
    const { dispatch } = this.props;
  }

  render() {
    return (
      <div>
          <Row gutter={24} style={{marginBottom:10}}>
            <Col xl={12} lg={24} md={24} sm={24} xs={24}>
              <Card>
                <SliderChart title="节点内存使用占比(%)" xname="time" yname="heap_ratio"
                  generateFunc={generateHeapData}
                  unit="%"
                  scale={{
                    time: {
                      alias: "时间",
                      type: "time",
                      mask: "HH:mm",
                      tickCount: 10,
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
                  generateFunc={generateCpuData}
                  unit="%"
                  scale={{
                    time: {
                      alias: "时间",
                      type: "time",
                      mask: "HH:mm",
                      tickCount: 10,
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
                  generateFunc={generateSearchLatencyData}
                  unit="ms"
                  scale={{
                    time: {
                      alias: "时间",
                      type: "time",
                      mask: "HH:mm",
                      tickCount: 10,
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
                  generateFunc={generateIndexLatencyData}
                  unit="ms"
                  scale={{
                    time: {
                      alias: "时间",
                      type: "time",
                      mask: "HH:mm",
                      tickCount: 10,
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
            </Row>
      </div>
    );
  }
}

export default ClusterMonitor;
