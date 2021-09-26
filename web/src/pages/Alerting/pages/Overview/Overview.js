import React, {useEffect, useState} from "react";
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


export default (props)=>{
  const {httpClient, history} = props;
  const [data, setData] = useState({
    metrics: {
      alert_day: [],
    }
  });
  useEffect(()=>{
    httpClient.get('/alerting/overview', {}).then((resp) => {
      if (resp.ok) {
        const { metrics } = resp;
        setData({
          metrics
        });
      } else {
        console.log('error getting alerts:', resp);
      }
    });
  }, [])
  return (
    <div style={{height:'150px'}}>
       <Chart>
        <Settings theme={theme} />
        <Axis id="bottom" position={Position.Bottom} showOverlappingTicks tickFormat={timeFormatter(niceTimeFormatByDay(2))} /> 
        <Axis
          id="left"
          title={'最近告警统计'}
          position={Position.Left}
        />
        <LineSeries
          id="lines"
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor={0}
          yAccessors={[1]}
          data={data.metrics.alert_day}
        />
      </Chart>
    </div>
  );
}