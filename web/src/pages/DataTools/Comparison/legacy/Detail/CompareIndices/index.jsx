import { useMemo, useRef, useState, useEffect } from "react";
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
  Popconfirm,
} from "antd";
import { formatter } from "@/utils/format";
import Detail from "./Detail";
import RefreshGroup from "@/components/infini/RefreshGroup";
import ArrowSplitor from "../../../../Migration/legacy/Detail/Info/ArrowSplitor";
import { formatMessage } from "umi/locale";
import moment from 'moment';
import request from "@/utils/request";
import { hasAuthority } from "@/utils/authority";
import SegmentedProgress from "@/pages/DataTools/components/SegmentedProgress";
const formatNumber = (number) => {
  return Number.isInteger(number) ? formatter.number(number) : "N/A";
};

export default ({
  taskId,
  sourceCluster,
  targetCluster,
  compareIndices,
  onRefresh,
  refreshIntervalFlag,
  setRefreshIntervalFlag,
  logInfo,
  repeat,
}) => {
  const [indices, setIndices] = useState({current: [], last: {}});
  const [retryingFailed, setRetryingFailed] = useState(false);

  const expandedRowRender = (record) => {
    return (
      <Detail
        taskId={taskId}
        record={record}
        refreshFlag={refreshIntervalFlag}
        logInfo={logInfo}
        repeat={repeat}
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
      const newIndices = compareIndices.map((item) => {
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
          total_scroll_docs=0,
        } = item;
        let remainTime = 'N/A';
        if(st.last.timestamp){
          const interval = (new Date().valueOf() - st.last.timestamp)/1000;
          const uniqueName = item.source?.name + ":" + source?.doc_type;
          if(st.last.indicesM[uniqueName]){
            const diffDocs = total_scroll_docs - st.last.indicesM[uniqueName].total_scroll_docs;
            if (diffDocs > 0 ){
              const remainDocs = source.docs + target.docs - total_scroll_docs;
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
          remain_time: remainTime,
          total_scroll_docs,
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
  }, [JSON.stringify(compareIndices)]);

  const retryableIndices = indices.current.filter(
    (item) => item.error_partitions > 0
  );

  const retryFailedSubTasks = async () => {
    if (retryableIndices.length === 0) {
      return message.info(
        formatMessage({
          id: "comparison.retry_failed.empty",
          defaultMessage: "No failed subtasks to retry.",
        })
      );
    }

    setRetryingFailed(true);
    try {
      const taskIDs = [];
      for (const item of retryableIndices) {
        const detail = await request(
          `/comparison/data/${taskId}/info/${item.sourceIndex}:${item.sourceDocType}`
        );
        (detail?.partitions || []).forEach((partition) => {
          if (["error", "stopped"].includes(partition.status) && partition.task_id) {
            taskIDs.push(partition.task_id);
          }
        });
      }

      const uniqueTaskIDs = Array.from(new Set(taskIDs));
      if (uniqueTaskIDs.length === 0) {
        message.info(
          formatMessage({
            id: "comparison.retry_failed.empty",
            defaultMessage: "No failed subtasks to retry.",
          })
        );
        return;
      }

      const results = await Promise.allSettled(
        uniqueTaskIDs.map((id) =>
          request(`/comparison/data/${id}/_start`, {
            method: "POST",
          })
        )
      );
      const failedCount = results.filter((item) => item.status === "rejected").length;
      if (failedCount > 0) {
        message.error(
          formatMessage({
            id: "comparison.retry_failed.partial",
            defaultMessage: "Some failed subtasks could not be restarted.",
          })
        );
      } else {
        message.success(
          formatMessage({
            id: "comparison.retry_failed.success",
            defaultMessage: "Failed subtasks are being retried.",
          })
        );
      }
      onRefresh();
    } finally {
      setRetryingFailed(false);
    }
  };

  const columns = [
    {
      title: formatMessage({id:"migration.table.field.source"}),
      dataIndex: "sourceDocuments",
      // width: 520,
      width: "35%",
      render: (v, record)=>{
        return <div style={{display:"flex", gap: 20, alignItems:"center",}}>
          <div style={{width:260}}>
            <div>
              <Tag className="tag" style={{fontSize:12}}>{record.sourceDocType}</Tag>
              <span>{record.sourceIndex}</span>
            </div>
            <div>
              <div style={{color:"#999999", fontSize: 12, marginTop: 3}} >{formatMessage({id:"migration.label.documents"})}: {formatNumber(v)}</div>
            </div>
          </div>
          {/* {record.running_children > 0 ? <div>
            <div style={{ color: "#999999", fontSize:12, marginTop:4}}>{formatMessage({id:"migration.label.remaining_time"})}: {record.remain_time}</div>
            <div style={{marginTop:"-5px"}}>
              <ArrowSplitor color="#E8E8E8"/>
            </div>
          </div>: null} */}
        </div>
        
      }
    },
    {
      // width: 370,
      width: "35%",
      title: formatMessage({id:"migration.table.field.target"}),
      dataIndex: "targetDocuments",
      render: (v, record)=>{
        return <div style={{width:260}}>
          <div>
            <Tag className="tag" style={{fontSize:12}}>{record.targetDocType}</Tag>
            <span>{record.targetIndex}</span>
          </div>
          <div>
            <div style={{color:"#999999", fontSize: 12, marginTop: 3}} >{formatMessage({id:"migration.label.documents"})}: {formatNumber(v)}</div>
          </div>
          <div style={{display:"flex", gap:8, alignItems:"center", marginTop: 6}}>
            <div style={{fontSize:12, color:"#999999"}}>{formatMessage({id:"migration.title.progress"})}</div>
            <div style={{flex:"1 1 auto"}}>
              <SegmentedProgress
                percent={record.percent}
                color={record.error_partitions > 0 ? "#F35F5A" : record.status === "complete" ? "#6CCE79" : "#448EF7"}
                height={8}
                segments={20}
              />
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
            {value === 0 && !repeat.is_repeat && (record.status == "init" || record.status == "ready" || record.status == "pending_stop") ? formatMessage({ id: "migration.label.pending" }) : null}
            {value === 0 && !repeat.is_repeat && record.status != "init" && record.status != "ready" && record.status != "pending_stop" ? formatMessage({ id: "migration.label.stopped" }) : null}
          </Tag>
          {value > 0 ? <Tag style={{border:"none", color: "#448EF7", backgroundColor: "rgba(68, 142, 247, 0.2)"}}>
            <Icon type="hourglass" style={{marginRight:3}} />{record.remain_time}
          </Tag>: null}
          {runningState === 0 && record.error_partitions == 0 ? <span className="status" style={{background:"rgba(108, 206, 121, 0.2)"}}>
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
    <div className={styles.comparisonList}>
      <div className={styles.header}>
        {formatMessage({ id: "migration.label.indices" })}
        <div className={styles.actions}>
          {hasAuthority("data_tools.comparison:all") && retryableIndices.length > 0 ? (
            <Popconfirm
              title={formatMessage({
                id: "comparison.retry_failed.confirm",
                defaultMessage: "Retry all failed subtasks?",
              })}
              onConfirm={retryFailedSubTasks}
            >
              <Button loading={retryingFailed}>
                {formatMessage({
                  id: "comparison.retry_failed.button",
                  defaultMessage: "Retry Failed Subtasks",
                })}
              </Button>
            </Popconfirm>
          ) : null}
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
          rowKey={(record, index) => {
            return (
              record.task_id ||
              `${record.sourceIndex || ""}:${record.sourceDocType || ""}:${record.targetIndex || ""}:${record.targetDocType || ""}:${index}`
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
