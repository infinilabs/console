import { useMemo, useRef, useState, useEffect } from "react";
import MigrateIndicesTable from "../../components/MigrateIndicesTable";
import IndexEditor from "../../components/MigrateIndicesTable/IndexEditor";
import styles from "./index.scss";
import {
  Button,
  Icon,
  Input,
  InputNumber,
  message,
  Select,
  Table,
  Tooltip,
  Tag,
  Progress,
} from "antd";
import { formatter } from "@/utils/format";
import Detail from "./Detail";
import RefreshGroup from "@/components/infini/RefreshGroup";
import ArrowSplitor from "../Info/ArrowSplitor"
import { formatMessage } from "umi/locale";
import moment from 'moment';

export default ({
  taskId,
  sourceCluster,
  targetCluster,
  migrateIndices,
  onRefresh,
  refreshIntervalFlag,
  setRefreshIntervalFlag,
  logInfo,
  repeat,
}) => {
  const [indices, setIndices] = useState({current: [], last: {}});

  const expandedRowRender = (record) => {
    return (
      <Detail
        taskId={taskId}
        record={record}
        refreshFlag={refreshIntervalFlag}
        logInfo={logInfo}
      />
    );
  };
  const formatTimePart = (text) => {
    return ("00" + text).slice(-2);
  }

  useEffect(() => {
    setIndices(st=>{
      let indicesM = {};
      st.current.forEach((index)=>{
        indicesM[index.sourceIndex+":"+index.sourceDocType] = index;
      });
      const newIndices = migrateIndices.map((item) => {
        const {
          task_id,
          source,
          target,
          status,
          percent,
          error_partitions,
          incremental,
          raw_filter,
          running_children,
          exported_percent,
        } = item;
        let remainTime = 'N/A';
        if(st.last.timestamp){
          const interval = (new Date().valueOf() - st.last.timestamp)/1000;
          const uniqueName = item.source?.name + ":" + source?.doc_type;
          if(st.last.indicesM[uniqueName]){
            const diffDocs = target?.docs - st.last.indicesM[uniqueName].targetDocuments;
            if (diffDocs > 0 ){
              const remainDocs = source.docs - target.docs;
              if(remainDocs <= 0){
                remainTime = "00:00:00"
              }else{
                const remainSecs = (remainDocs/diffDocs) * interval;
                const du = moment.duration(remainSecs, 'seconds');
                const hours = du.asHours();
                remainTime = (hours > 23 ? hours : formatTimePart(du.hours())) + ":" + formatTimePart(du.minutes())+":"+ formatTimePart(du.seconds());
              }
            }
          }
        }
        return {
          task_id,
          sourceIndex: source?.name || "N/A",
          sourceDocType: source?.doc_type || "",
          targetIndex: target?.name || "N/A",
          targetDocType: target?.doc_type || "",
          sourceDocuments: Number.isInteger(source?.docs)
            ? source?.docs
            : "N/A",
          targetDocuments: Number.isInteger(target?.docs)
            ? target?.docs
            : "N/A",
          sourceSize: formatter.bytes(source?.store_size_in_bytes || 0),
          targetSize: formatter.bytes(target?.store_size_in_bytes || 0),
          rawFilter: raw_filter,
          percent: percent || 0,
          error_partitions: error_partitions || 0,
          incremental,
          status,
          running_children,
          exported_percent: exported_percent || 0,
          remain_time: remainTime,
        };
      })
      return {
        current: newIndices,
        last: {
          timestamp: new Date().valueOf(),
          indicesM,
        }
      }
    });
  }, [JSON.stringify(migrateIndices)]);

  const columns = [
    {
      title: formatMessage({id:"migration.table.field.source"}),
      dataIndex: "sourceIndex",
      // width: 520,
      width: "35%",
      render: (v, record)=>{
        return <div style={{display:"flex", gap: 20, alignItems:"center",}}>
          <div style={{width:260}}>
            <div>
              <Tag className="tag" style={{fontSize:12}}>{record.sourceDocType}</Tag>
              <span>{v}</span>
            </div>
            <div style={{display:"flex", gap:3, alignItems:"center", justifyContent:"center",}}>
              <div style={{fontSize:12, color: "#999999"}}>{formatMessage({id:"migration.label.exported"})}</div>
              <div style={{flex: "1 1 auto"}}>
              <Progress strokeLinecap="square" percent={record.exported_percent} strokeWidth={6} showInfo={false} />
              </div>
            </div>
          </div>
        </div>
        
      }
    },
    {
      // width: 370,
      width: "35%",
      title: formatMessage({id:"migration.table.field.target"}),
      dataIndex: "targetIndex",
      render: (v, record)=>{
        return <div style={{width:260}}>
          <div>
            <Tag className="tag" style={{fontSize:12}}>{record.targetDocType}</Tag>
            <span>{v}</span>
          </div>
          <div style={{display:"flex", gap:3, alignItems:"center", justifyContent:"center"}}>
            <div style={{fontSize:12, color: "#999999"}}>{formatMessage({id:"migration.label.written"})}</div>
            <div style={{flex: "1 1 auto"}}>
            <Progress strokeLinecap="square" percent={record.percent} strokeWidth={6} showInfo={false} />
            </div>
          </div>
        </div>
      }
    },
    {
      className:"td-v-center",
      title: formatMessage({id:"migration.table.field.status"}),
      dataIndex: "running_children",
      render: (value, record) => {
        if(typeof value === "undefined"){
          value = 0;
        }
        let runningState = value > 0 ? 1 : 0;
        const diffStyle = runningState === 1 ? {color: "#448EF7", backgroundColor: "rgba(68, 142, 247, 0.2)"}:{backgroundColor: "#E8E8E8"};
        return <div>
           <Tag style={{border: "none", ...diffStyle }}>
            {runningState === 1 ? formatMessage({ id: "migration.label.running" }) : null}
            {runningState === 0 && repeat.is_repeat ? formatMessage({ id: "migration.label.pending" }) : null}
            {value === 0 && !repeat.is_repeat && (record.status == "init" || record.status == "ready") ? formatMessage({ id: "migration.label.pending" }) : null}
            {value === 0 && !repeat.is_repeat && record.status != "init" && record.status != "ready" ? formatMessage({ id: "migration.label.stopped" }) : null}
          </Tag>
          {value > 0 ? <Tag style={{border:"none", color: "#448EF7", backgroundColor: "rgba(68, 142, 247, 0.2)"}}>
            <Icon type="hourglass" style={{marginRight:3}} />{record.remain_time}
          </Tag>: null}
          {runningState === 0 && record.error_partitions == 0 ? <span className="status">
            <Icon style={{color:"#6CCE79"}} type="check-circle"/> 
          </span>: null}
          {record.error_partitions > 0 ?  <Tooltip title={`${formatMessage({ id: "migration.label.error_partitions" })}: ${record.error_partitions}`}>
          <span className="status" style={{background: "rgba(243, 95, 90, 0.2)", marginRight: 3}}>
            <Icon style={{color:"#F35F5A"}} type="exclamation-circle" />
          </span></Tooltip>: null}
          </div>;
      },
    },
  ]

  return (
    <div className={styles.migrationList}>
      <div className={styles.header}>
        Indices
        <div className={styles.actions}>
          {/* <Button type="primary">Start</Button> */}
          {/* <Button type="danger">Stop</Button> */}

          <RefreshGroup
            onRefresh={onRefresh}
            setRefreshIntervalFlag={setRefreshIntervalFlag}
          />
          <Input.Group compact></Input.Group>
        </div>
      </div>
      <Table
          size={"small"}
          dataSource={indices.current}
          rowKey={(record) => {
            return (
              record.sourceIndex +
              (record?.sourceDocType ? record.sourceDocType : "")
            );
          }}
          columns={columns}
          expandedRowRender={expandedRowRender}
          expandIcon={(props)=>{
            return <span style={{cursor:"pointer"}} onClick={(e)=>{
              props.onExpand(props.record, e)
            }}><Icon type={props.expanded === true ? "down": "right"}/></span>
          }}
        />
    </div>
  );
};
