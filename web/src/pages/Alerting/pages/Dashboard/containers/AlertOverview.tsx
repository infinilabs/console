import {AlertList} from '../components/AlertList/AlertList';
import _ from 'lodash';
import {useState, useEffect} from 'react';
import './alertoverview.scss';

export const AlertOverview = (props: any)=>{
  const {httpClient, history} = props;
  const [data, setData] = useState({
    alerts: [],
    totalAlerts: 0,
  });

  const getAlerts = _.debounce(
    (from, size, search, sortField, sortDirection, severityLevel, alertState, monitorIds) => {
      let params = {
        from,
        size,
        search,
        sortField,
        sortDirection,
        severityLevel,
        alertState,
      };
      if(monitorIds){
        params["monitorIds"]= monitorIds;
      }
      // const queryParamsString = queryString.stringify(params);
      // history.replace({ ...this.props.location, search: queryParamsString });
      httpClient.get('/alerting/alerts', { query: params }).then((resp:any) => {
        if (resp.ok) {
          const { alerts, totalAlerts } = resp;
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
    getAlerts(0, pageSize, "", "start_time", "desc", "ALL", "ALL","")
  },[])

  const onPageChange = (pageIndex: number)=>{
    const from = (pageIndex - 1) * pageSize;
    getAlerts(from, pageSize, "", "start_time", "desc", "ALL", "ALL","")
  }

  const onItemClick = (item: any)=>{
    history.push(`/monitors/${item.monitor_id}`)
  }

  return (
  <div className="alert-overview">
    <div className="left">
      <AlertList dataSource={data.alerts} 
      title="Open Alerts"
      onItemClick={onItemClick}
      pagination={{
        pageSize,
        total: data.totalAlerts,
        onChange: onPageChange,
      }}/>
    </div>
    <div className="right">
      <div>提示</div>
    </div>
  </div>
  )
}