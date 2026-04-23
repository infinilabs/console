import { useEffect, useState } from "react";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import { Button, Card, Spin, Icon } from "antd";
import Info from "./Info";
import MigrateIndices from "./MigrateIndices";
import useFetch from "@/lib/hooks/use_fetch";
import styles from "./index.less";
import { generateName } from "../../common";
import { Link } from "umi";
import { formatMessage } from "umi/locale";
import Metrics from "./Metrics";
import moment from "moment";
import { parseTaskConfig } from "@/pages/DataTools/utils";

export default (props) => {
  const id = props.match.params?.id || "";

  if (!id) return null;

  const { run, loading, value } = useFetch(`/migration/data/${id}/info`, {}, [
    id,
  ]);

  const [refreshIntervalFlag, setRefreshIntervalFlag] = useState();

  const config = parseTaskConfig(value);
  const metadata = value && value.metadata;

  const sourceCluster = config.cluster?.source?.name || "N/A";
  const targetCluster = config.cluster?.target?.name || "N/A";
  const creator = config.creator?.name || "N/A";
  const indices = Array.isArray(config.indices) ? config.indices : [];
  const repeat = metadata?.labels?.repeat || {};
  const { interval } = config.settings?.execution?.repeat || {};
  const start_time_in_millis = value?.start_time_in_millis;
  const totalIndices = indices.length;
  const completedIndices = metadata?.labels?.completed_indices || 0;
  const execution = config.settings?.execution || {};
  const timeWindow = execution.time_window || [];
  const nodes = execution.nodes?.permit || [];
  const logInfo = metadata?.labels?.log_info || {};
  let autoName = '';
  if(!config.name && config.cluster?.source){
    autoName = generateName({ ...config, indicesCount: indices.length })
  }
  const [timeRange, setTimeRange] = useState({});
  const expandTimeRange = (min, max) =>{
    min = moment(min);
    max = moment(max);
    if(max.valueOf() - min.valueOf() < 900000){
      const half = parseInt((900000 + min.valueOf() - max.valueOf())/2);
      min.subtract(half, "ms");
      max.add(half, "ms");
    }
    const from = min.toISOString();
    const to = max.toISOString();
    return {
      from,
      to,
    }
  }
  useEffect(()=>{
    setTimeRange(()=>{
      const now = moment();
      let to = now.toISOString();
      let from = now.subtract(15, 'm').toISOString();
        if(repeat.is_repeat === false && ['complete', 'error'].includes(value?.status)){
          const range = expandTimeRange(value.start_time_in_millis, value.completed_time);
        from = range.from;
        to = range.to;
      }
      if(repeat.is_repeat === true ){
        if(repeat.last_complete_time > 0) {
          const range = expandTimeRange(repeat.last_run_time, repeat.last_complete_time);
          from = range.from;
          to = range.to;
        }
      }
      return {
        from: from,
        to: to,
      }
    })
  },[value?.status, value?.completed_time, value?.start_time_in_millis, repeat.is_repeat, repeat.last_complete_time, repeat.last_run_time])
  const onRefresh = ()=>{
    run(); 
    if(repeat.is_repeat === false && ['complete', 'error'].includes(value?.status)){
      return
    }
    if(repeat.is_repeat === true ){
      return
    }
    const now = moment();
    const to = now.toISOString();
    setTimeRange({
      from: now.subtract(15, 'm').toISOString(),
      to: to,
    })
  }

  return (
    <PageHeaderWrapper>
      <Card
        className={styles.detail}
        title={<span>{config.name || autoName}</span>} //<Link to={`/`}><Icon type="edit" style={{color:"#1890FF", marginLeft:5}}/></Link>
        extra={
            <a
              // style={{ width: 80 }}
              // type="primary"
              onClick={() => {
                props.history.push("/data_tools/migration");
              }}
            >
           <Icon type="left"/> {formatMessage({id:"form.button.goback"})}
          </a>
        }
      >
        <Spin spinning={!refreshIntervalFlag && loading}>
          <div>
            <Info
              {...{
                id,
                cluster: config.cluster,
                repeat,
                interval,
                creator,
                start_time_in_millis,
                totalIndices,
                completedIndices,
                timeWindow,
                nodes,
                logInfo,
                tags: config.tags,
              }}
            />
            {config.cluster ? <Metrics  
              taskId={id}
              sourceCluster={config.cluster.source}
              range={timeRange}
              targetCluster={config.cluster.target} refreshIntervalFlag={refreshIntervalFlag}/>: null}
            <MigrateIndices
              taskId={id}
              sourceCluster={sourceCluster}
              targetCluster={targetCluster}
              migrateIndices={indices}
              onRefresh={onRefresh}
              refreshIntervalFlag={refreshIntervalFlag}
              setRefreshIntervalFlag={setRefreshIntervalFlag}
              logInfo={logInfo}
              repeat={repeat}
            />
          </div>
        </Spin>
      </Card>
    </PageHeaderWrapper>
  );
};
