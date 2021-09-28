import React, {useEffect, useState} from "react";
import {Spin, Card} from 'antd';
import './overview.scss';
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
  BarSeries,
} from "@elastic/charts";

import {useAlertData, useAlertHsitoryData} from './hooks/use_alert_data';
import {AlertList} from '../Dashboard/components/AlertList/AlertList';

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
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState({
    metrics: {
      last_tree_month: {},
      top_ten_cluster:{},
    },
  });
  useEffect(()=>{
    httpClient.get('/alerting/overview', {}).then((resp) => {
      if (resp.ok) {
        const { metrics, state_count } = resp;
        setData({
          metrics,
          state_count
        });
      } else {
        console.log('error getting alerts:', resp);
      }
      setIsLoading(false)
    });
  }, [])
  const pageSize = 10
  const [alerts, onAlertPageChange] = useAlertData(pageSize);
  const [historyAlerts, onAlertHistoryPageChange] = useAlertHsitoryData(pageSize);

  const onItemClick = (item)=>{
    history.push(`/monitors/${item.monitor_id}/elasticsearch/${item.cluster_id}`)
  }


  return (
    <div className="overview-wrapper">
      <Spin spinning={isLoading}>
        <div className="layout">
          <div className="left">
            <div className="state-count">
              <Card className="item" title="激活告警">
                {data.state_count?.ACTIVE || 0}
              </Card>
              <Card className="item" title="已响应告警" >
              {data.state_count?.ACKNOWLEDGED || 0}
              </Card>
              <Card className="item" title="错误告警">
              {data.state_count?.ERROR || 0}
              </Card>
            </div>
            <div>
              <AlertList dataSource={alerts.data} 
                title="Open Alerts"
                onItemClick={onItemClick}
                pagination={{
                  pageSize: 10,
                  total: alerts.total,
                  onChange: onAlertPageChange,
                }}/>
            </div>
            <div>
              <AlertList dataSource={historyAlerts.data} 
                title="History Alerts"
                onItemClick={onItemClick}
                pagination={{
                  pageSize: 10,
                  total: historyAlerts.total,
                  onChange: onAlertHistoryPageChange,
                }}/>
            </div>
          </div>
         
          <div className="right">
            <div style={{height:'150px'}}>
              <Chart>
                <Settings theme={theme} />
                <Axis id="bottom" position={Position.Bottom} title="Last 3 months" showOverlappingTicks tickFormat={timeFormatter(niceTimeFormatByDay(data.metrics.last_tree_month.day))} /> 
                <Axis
                  id="left"
                  title="Alert number"
                  position={Position.Left}
                />
                <LineSeries
                  id="lines"
                  xScaleType={ScaleType.Time}
                  yScaleType={ScaleType.Linear}
                  xAccessor={0}
                  yAccessors={[1]}
                  data={data.metrics.last_tree_month?.data || []}
                />
              </Chart>
            </div>
            <div style={{height:'150px', marginTop: 10}}>
            <Chart>
              <Settings showLegend showLegendExtra legendPosition={Position.Right} theme={theme}  />
              <Axis id="bottom" position={Position.Bottom} title="Top 10 cluster" showOverlappingTicks />
              <Axis id="left2" title="Alert number" position={Position.Left} tickFormat={(d) => Number(d).toFixed(0)} />

              <BarSeries
                id="bars"
                xScaleType={ScaleType.Linear}
                yScaleType={ScaleType.Linear}
                xAccessor="x"
                yAccessors={['y']}
                stackAccessors={['x']}
                splitSeriesAccessors={['g']}
                data={data.metrics.top_ten_cluster?.data || []}
              />
            </Chart>
            </div>
          </div>
          </div>
      </Spin>
    </div>
  );
}