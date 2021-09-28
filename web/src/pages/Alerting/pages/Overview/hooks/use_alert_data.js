import {useState, useEffect} from 'react';
import _ from 'lodash';

const getAlerts = 
  async (from, size,type) => {
    let params = {
      from,
      size,
      type
    };
    let qstr = '';
    for(let key in params){
        qstr += `&${key}=${params[key]}`;
    }
    if(qstr){
      qstr = `?${qstr.slice(1)}`
    }
    const resp = await fetch('/elasticsearch/_all/alerting/alerts'+qstr);
    return resp.json();
    // if (resp.ok) {
    //   const { alerts, totalAlerts } = resp;
    
  }

export const useAlertData = (pageSize, page)=>{
  const [size, setSize] = useState(pageSize || 10);
  const [pageIndex, setPageIndex] = useState(page || 1);
  const [alertData, setAlertData] = useState({
    data: [],
    total: 0,
  });
  useEffect(()=>{
    const from = (pageIndex - 1) * size;
    const fetchAlerts = async (from, size)=>{
      const resp = await getAlerts(from, size, 'ALERT');
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
  }, [pageIndex, size]);
  const changePage = (pageIndex) => {
    setPageIndex(pageIndex);
  }
  
  return [alertData, changePage];
}

export const useAlertHsitoryData = (pageSize, page)=>{
  const [size, setSize] = useState(pageSize || 10);
  const [pageIndex, setPageIndex] = useState(page || 1);
  const [alertHisotryData, setAlertHisotryData] = useState({
    data: [],
    total: 0,
  });
  useEffect(()=>{
    const from = (pageIndex - 1) * size;
    const fetchHistoryAlerts = async (from, size)=>{
      const resp = await getAlerts(from, size, 'ALERT_HISTORY');
      if(resp.ok){
        const { alerts, totalAlerts } = resp;
        setAlertHisotryData({
          ...alertHisotryData,
          data: alerts,
          total: totalAlerts,
        })
      }
    }
    fetchHistoryAlerts(from, size);
  }, [pageIndex, size])

  const changePage = (pageIndex) => {
    setPageIndex(pageIndex);
  }
  
  return [alertHisotryData, changePage];
}