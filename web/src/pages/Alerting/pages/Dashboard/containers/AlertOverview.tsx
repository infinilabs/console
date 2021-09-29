import {AlertList} from '../components/AlertList/AlertList';
import _ from 'lodash';
import {useState, useEffect} from 'react';
import './alertoverview.scss';
import { formatMessage } from 'umi/locale';

export const AlertOverview = (props: any)=>{
  const {httpClient, history} = props;
  const [data, setData] = useState({
    alerts: [],
    totalAlerts: 0,
  });

  const [historyData, setHistoryData] = useState({
    alerts: [],
    totalAlerts: 0,
  });

  const getAlerts = _.debounce(
    (from, size, search, sortField, sortDirection, severityLevel, alertState, monitorIds, type) => {
      let params = {
        from,
        size,
        search,
        sortField,
        sortDirection,
        severityLevel,
        alertState,
        type,
      };
      if(monitorIds){
        params["monitorIds"]= monitorIds;
      }
      httpClient.get('/alerting/alerts', { query: params }).then((resp:any) => {
        if (resp.ok) {
          const { alerts, totalAlerts } = resp;
          if(type == 'ALERT_HISTORY'){
            setHistoryData({
              alerts,
              totalAlerts,
            });
            return;
          }
          setData({
            alerts,
            totalAlerts,
          });
        } else {
          console.log('error getting alerts:', resp);
        }
      });
    },
    500,
    { leading: true }
  );
  
  const pageSize = 10;
  useEffect(()=>{
    getAlerts(0, pageSize, "", "start_time", "desc", "ALL", "ALL","", "ALERT");
    getAlerts(0, pageSize, "", "start_time", "desc", "ALL", "ALL","", "ALERT_HISTORY")
  },[])

  const onPageChangeGen = (type:string) => {
    return  (pageIndex: number)=>{
      const from = (pageIndex - 1) * pageSize;
      getAlerts(from, pageSize, "", "start_time", "desc", "ALL", "ALL","", type)
    }
  }
 

  const onItemClick = (item: any)=>{
    history.push(`/monitors/${item.monitor_id}`)
  }

  return (
  <div className="alert-overview">
    <div className="left">
      <AlertList dataSource={data.alerts} 
      title={formatMessage({id:'alert.overview.alertlist.title'})}
      onItemClick={onItemClick}
      pagination={{
        pageSize,
        total: data.totalAlerts,
        onChange: onPageChangeGen('ALERT'),
      }}/>
       <AlertList dataSource={historyData.alerts} 
      title={formatMessage({id:'alert.overview.alertlist-history.title'})}
      onItemClick={onItemClick}
      pagination={{
        pageSize,
        total: historyData.totalAlerts,
        onChange: onPageChangeGen('ALERT_HISTORY'),
      }}/>
    </div>
    {/* <div className="right">
      <div>提示</div>
    </div> */}
  </div>
  )
}