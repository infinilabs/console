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

  const getAlerts = (from, size, search, sortField, sortDirection, severityLevel, alertState, monitorIds, type) => {
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
      return httpClient.get('/alerting/alerts', { query: params })
    }

  const useData = (pageSize: number, page: number, type: string):[any,any] => {
    const [size, setSize] = useState(pageSize || 10);
    const [pageIndex, setPageIndex] = useState(page || 1);
    const [alertData, setAlertData] = useState({
      data: [],
      total: 0,
    });
    useEffect(()=>{
      const from = (pageIndex - 1) * size;
      const fetchAlerts = async (from: number, size: number)=>{
        const resp = await getAlerts(from, size,"", "start_time", "desc", "ALL", "ALL","", type);
        if(resp.ok){
          const { alerts, totalAlerts } = resp;
          setAlertData({
            ...alertData,
            data: alerts,
            total: totalAlerts,
          })
        }
      }
      fetchAlerts(from,size);
    }, [pageIndex, size, type]);
    const changePage = (pageIndex: number) => {
      setPageIndex(pageIndex);
    }
    
    return [alertData, changePage];
  }
  
  const pageSize = 10;
  const [alerts, onAlertPageChange] = useData(pageSize, 1, "ALERT");
  const [historyAlerts, onAlertHistoryPageChange] = useData(pageSize, 1, "ALERT_HISTORY");

 

  const onItemClick = (item: any)=>{
    history.push(`/monitors/${item.monitor_id}`)
  }

  return (
  <div className="alert-overview">
    <div className="left">
      <AlertList dataSource={alerts.data as any} 
      title={formatMessage({id:'alert.overview.alertlist.title'})}
      onItemClick={onItemClick}
      pagination={{
        pageSize,
        total: alerts.total,
        onChange: onAlertPageChange,
      }}/>
       <AlertList dataSource={historyAlerts.data} 
      title={formatMessage({id:'alert.overview.alertlist-history.title'})}
      onItemClick={onItemClick}
      pagination={{
        pageSize,
        total: historyAlerts.total,
        onChange: onAlertHistoryPageChange,
      }}/>
    </div>
    {/* <div className="right">
      <div>提示</div>
    </div> */}
  </div>
  )
}