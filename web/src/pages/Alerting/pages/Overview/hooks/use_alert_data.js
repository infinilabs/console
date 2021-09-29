import {useState, useEffect} from 'react';
import _ from 'lodash';
import {pathPrefix} from '@/services/common';

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
    const resp = await fetch(pathPrefix + '/alerting/overview/alerts'+qstr);
    return resp.json();
  }

const useData = (pageSize, page, type) => {
  const [size, setSize] = useState(pageSize || 10);
  const [pageIndex, setPageIndex] = useState(page || 1);
  const [alertData, setAlertData] = useState({
    data: [],
    total: 0,
  });
  useEffect(()=>{
    const from = (pageIndex - 1) * size;
    const fetchAlerts = async (from, size)=>{
      const resp = await getAlerts(from, size, type);
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
  const changePage = (pageIndex) => {
    setPageIndex(pageIndex);
  }
  
  return [alertData, changePage];
}

export const useAlertData = (pageSize, page)=>{
  return useData(pageSize, page, 'ALERT');
}

export const useAlertHsitoryData = (pageSize, page)=>{
  return useData(pageSize, page, 'ALERT_HISTORY');
}