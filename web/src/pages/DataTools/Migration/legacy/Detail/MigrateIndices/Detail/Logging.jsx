import useFetch from "@/lib/hooks/use_fetch";
import {formatUtcTimeToLocal } from "@/utils/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import request from "@/utils/request";
import moment from 'moment';
import LoggingViewer from "./LoggingViewer";
import { Link } from "umi";
import ExecuteLog from "../../../components/ExecuteLog";

export default ({taskId, indexName, refreshFlag, logInfo={}})=>{
  
  const [logs, setLogs] = useState([]);

  useEffect(()=>{
    setLogs([]);
  }, [taskId, indexName]);

  useEffect(()=>{
    fetchLogs();
  },[taskId, indexName, refreshFlag]);


  const fetchLogs = async (queryParams={})=>{
    setLogs(oldLogs=>{
      if(oldLogs.length>0){
        queryParams['min'] = moment(oldLogs[oldLogs.length -1]._source.timestamp).valueOf()+1;
      }
      return oldLogs;
    })
    const res = await request(`/migration/data/${taskId}/logging/${indexName}`,{
      queryParams: queryParams,
    });
    if(res && !res.error){
      if((res.hits?.hits ||[]).length === 0){
        return
      }
      res.hits?.hits.sort((a, b)=> { 
        if(a._source.timestamp > b._source.timestamp){
          return 1
        }
        if(a._source.timestamp < b._source.timestamp){
          return -1
        }
        return 0;
      });
      setLogs((oldLogs) => {
        const merged = [...oldLogs, ...(res.hits?.hits || [])];
        const seen = new Set();
        return merged.filter((item) => {
          const key = item._id || `${item._source?.timestamp}-${item._source?.payload?.task?.logging?.message}`;
          if (seen.has(key)) {
            return false;
          }
          seen.add(key);
          return true;
        });
      });
    }
  }
  
  const logRender = useCallback((row)=>{
    return <div>[{formatUtcTimeToLocal(row._source.timestamp)}] {row._source.payload.task.logging.message}</div>;
  },[])
  
  return <div>
    <div style={{textAlign:"right"}}>
      <ExecuteLog
        text="View more"
        params={{
          clusterID: logInfo?.cluster_id,
          columns: [ 'metadata.labels.task_type', 'payload.task.logging.status', 'payload.task.logging.message', 'payload.task.logging.result.error' ],
          index: logInfo?.index_name,
          query: `metadata.category : "task" and metadata.labels.parent_task_id : "${taskId}" and metadata.labels.unique_index_name : "${indexName}"`,
        }}
      />
    </div>
    <LoggingViewer data={logs} rowRender={logRender} style={{ maxHeight: "210px",overflowY: "scroll"}}/>
  </div>
}
