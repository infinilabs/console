import React, {useEffect, useState, useMemo} from "react";
import {Spin, Card} from 'antd';
import {Fetch} from '../../../../components/kibana/core/public/http/fetch';
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
import {pathPrefix} from '@/services/common';

import {useAlertData, useAlertHsitoryData} from './hooks/use_alert_data';
import {AlertList} from '../Dashboard/components/AlertList/AlertList';
import { formatMessage } from 'umi/locale';

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
  const {history} = props;
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState({
    metrics: {
      last_tree_month: {},
      top_ten_cluster:{},
    },
  });
  const httpClient = useMemo(()=>{
    return new Fetch({
      basePath:{
        get: () => '',
        prepend: (url) => url,
        remove: (url) => url,
        serverBasePath: '',
      }
    });
  })
  useEffect(()=>{
    httpClient.get(pathPrefix + '/alerting/overview', {}).then((resp) => {
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
    history.push(`/alerting/monitor/monitors/${item.monitor_id}/elasticsearch/${item.cluster_id}`)
  }
  const pickLegendItems = (items)=>{
    return [{title:'ACKNOWLEDGED',color:'pink'}, {title:'ACTIVE',color:' rgb(208, 2, 27)'},
    {title:'ERROR', color:'lightgrey'}, {color:'rgb(208, 2, 27)', title:'COMPLETED'}, {title:'DELETED', color:'gray'}]
    .filter(legend=> items.includes(legend.title)).map(legend=>{
      return {
        ...legend,
        title: formatMessage({id: `alert.dashboard.state-options.${legend.title.toLowerCase()}`})
      }
    })
  }

  return (
    <div className="overview-wrapper">
      <Spin spinning={isLoading}>
        <div className="layout">
          <div className="left">
            <div className="state-count">
              <Card className="item" bodyStyle={{ paddingBottom: 20 }}>
                <Card.Meta title={formatMessage({id:'alert.overview.metric.active'})} className="title" />
                <div>
                    <span className="total">{data.state_count?.ACTIVE || 0}</span>
                </div>
              </Card>
              <Card className="item" bodyStyle={{ paddingBottom: 20 }}>
                <Card.Meta title={formatMessage({id:'alert.overview.metric.acknowledged'})} className="title" />
                <div>
                    <span className="total">{data.state_count?.ACKNOWLEDGED || 0}</span>
                </div>
              </Card>
              <Card className="item" bodyStyle={{ paddingBottom: 20 }}>
                <Card.Meta title={formatMessage({id:'alert.overview.metric.error'})} className="title" />
                <div>
                    <span className="total">{data.state_count?.ERROR || 0}</span>
                </div>
              </Card>
            </div>
            <div>
              <AlertList dataSource={alerts.data} 
                title={formatMessage({id:'alert.overview.alertlist.title'})}
                legendItems={pickLegendItems(['ACTIVE','ERROR','ACKNOWLEDGED'])}
                onItemClick={onItemClick}
                pagination={{
                  pageSize: 10,
                  total: alerts.total,
                  onChange: onAlertPageChange,
                }}/>
            </div>
            <div style={{marginTop:10}}>
              <AlertList dataSource={historyAlerts.data} 
                title={formatMessage({id:'alert.overview.alertlist-history.title'})}
                onItemClick={onItemClick}
                legendItems={pickLegendItems(["ACKNOWLEDGED", "ACTIVE", "ERROR", "COMPLETED", "DELETED"])}
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