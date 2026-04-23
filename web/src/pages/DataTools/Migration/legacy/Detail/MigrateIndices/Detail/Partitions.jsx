import styles from "./Partitions.scss";
import { Button, Descriptions, Popconfirm, Popover, Spin, message, Tooltip, Icon } from "antd";
import ExecuteLog from "../../../components/ExecuteLog";
import moment from "moment";
import request from "@/utils/request";
import { formatter } from "@/utils/format";
import { hasAuthority } from "@/utils/authority";
import { formatMessage } from "umi/locale";
import {formatUtcTimeToLocal} from "@/utils/utils";

const colors = {
  error: "#F35F5A",
  scroll_complete: "#9BDB97",
  complete: "#6CCE79",
  running: "#007fff",
  default: "#bbb",
};

export default ({ loading, repeating, record, data, onRefresh, logInfo, nextRunTime }) => {
  const renderStatus = (item) => {
    return (
      <>
        <span
          style={{
            marginRight: 12,
            color: colors[item.status] || colors["default"],
          }}
        >
          {item.status}
        </span>
        {item.status !== "init" && (
          <ExecuteLog
            text={`[${formatMessage({id:"migration.label.view_log"})}]`}
            params={{
              clusterID: logInfo?.cluster_id,
              index: logInfo?.index_name,
              columns: [
                "metadata.labels.task_type",
                "payload.task.logging.status",
                "payload.task.logging.message",
                "payload.task.logging.result.error",
              ],
              query: `metadata.category : "task" and (metadata.labels.task_id : "${item.task_id}" or metadata.labels.parent_task_id : "${item.task_id}")`,
            }}
          />
        )}
      </>
    );
  };
  let _data = data;
  if (repeating) {
    _data = data.concat([{
      'type': 'indicator',
    }]);
  }

  const onStart = async (id) => {
    const res = await request(`/migration/data/${id}/_start`, {
      method: "POST",
    });
    if (res && res.success) {
      message.success(
        formatMessage({
          id: "app.message.start.success",
        })
      );
      onRefresh();
    } else {
      message.error(
        formatMessage({
          id: "app.message.start.failed",
        })
      );
      console.log("Start failed,", res);
    }
  };

  const onStop = async (id) => {
    const res = await request(`/migration/data/${id}/_stop`, {
      method: "POST",
    });
    if (res && res.success) {
      message.success(
        formatMessage({
          id: "app.message.stop.success",
        })
      );
      onRefresh();
    } else {
      message.error(
        formatMessage({
          id: "app.message.stop.failed",
        })
      );
      console.log("Stop failed,", res);
    }
  };

  const formatNumber = (number) => {
    return Number.isInteger(number) ? formatter.number(number) : "N/A";
  };

  return (
    <div className={styles.migrateIndicesProgress}>
      <div className={styles.partition}>
        {_data.map((item, index) => {
          if (item.type === 'indicator') {
            return <Tooltip title={<div>{formatMessage({ id: "migration.label.next_run_time" })}: <br/>{formatUtcTimeToLocal(nextRunTime)}</div>}>
            <span style={{background: "rgba(68, 142, 247, 0.2)", padding: "1px 4px", fontSize:12, borderRadius:3}}>
               <Icon style={{color:"#448EF7"}} type="clock-circle" />
             </span></Tooltip>
          }
          if(item.total_docs === 0 && repeating){
            return <Tooltip title={<div style={{lineHeight: "1.8em"}}>
                <span>{formatMessage({id:"migration.tip.label.nodata"})}</span><br/>
                <span>{formatMessage({id:"migration.label.start_time"})}: {item.start > 0 ? formatUtcTimeToLocal(item.start): "-"}</span><br/>
                <span>{formatMessage({id:"migration.label.end_time"})}: {item.end > 0 ? formatUtcTimeToLocal(item.end): "-"}</span>
              </div>}>
               <div
                key={index}
                className={styles.box}
                style={{
                 border: "1px dashed #6CCE79",
                }}
              />
            </Tooltip>
          }
          const content = (
            <Spin spinning={loading}>
              <div className="pop-info" style={{ width: 400}}>
                <Descriptions size="large" column={1}>
                  <Descriptions.Item label={formatMessage({id:"migration.label.data_step"})}>
                    {item.start > 1e12 ? formatUtcTimeToLocal(item.start):item.start} ~ {item.end > 1e12 ? formatUtcTimeToLocal(item.end):item.end}
                  </Descriptions.Item>
                  <Descriptions.Item label={formatMessage({id:"migration.label.total_docs"})}>
                    {formatNumber(item.total_docs)}
                  </Descriptions.Item>
                  <Descriptions.Item label={formatMessage({id:"migration.label.exported_docs"})}>
                    {formatNumber(item.scroll_docs)} { 
                    <span
                    style={{
                      margin: "12px",
                      color: colors[item.scroll_task?.status] || colors["default"],
                    }}>
                    {item.scroll_task?.status}
                  </span>
                  }
                  {hasAuthority("data_tools.migration:all") && ["running"].includes(item.scroll_task?.status) && (
                      <Popconfirm
                        title={formatMessage({ id: "migration.confirm.stop" })}
                        onConfirm={() => onStop(item.scroll_task?.id)}
                     >
                       <Button size="small" type="danger">
                       {formatMessage({id:"form.button.stop"})}
                       </Button>
                     </Popconfirm>
                   )}
                  </Descriptions.Item>
                  <Descriptions.Item label={formatMessage({id:"migration.label.written_docs"})}>
                    {formatNumber(item.index_docs)}
                    { <span
                    style={{
                      margin: "0 12px",
                      color: colors[item.bulk_task?.status] || colors["default"],
                    }}>
                    {item.bulk_task?.status}
                  </span>
                  }
                   {hasAuthority("data_tools.migration:all") &&
                    "init" === item.bulk_task?.status && (
                      <Popconfirm
                        title={formatMessage({ id: "migration.confirm.start" })}
                        onConfirm={() => onStart(item.bulk_task?.id)}
                      >
                        <Button size="small" type="primary">
                        {formatMessage({id:"form.button.start"})}
                        </Button>
                      </Popconfirm>
                    )}
                    {hasAuthority("data_tools.migration:all") &&
                    ["stopped", "error"].includes(item.bulk_task?.status) && (
                      <Popconfirm
                        title={formatMessage({ id: "migration.confirm.restart" })}
                        onConfirm={() => onStart(item.bulk_task?.id)}
                      >
                        <Button size="small" type="primary">
                        {formatMessage({id:"form.button.restart"})}
                        </Button>
                      </Popconfirm>
                    )}
                  {hasAuthority("data_tools.migration:all") && ["running"].includes(item.bulk_task?.status) && (
                      <Popconfirm
                        title={formatMessage({ id: "migration.confirm.stop" })}
                        onConfirm={() => onStop(item.bulk_task?.id)}
                     >
                       <Button size="small" type="danger">
                       {formatMessage({id:"form.button.stop"})}
                       </Button>
                     </Popconfirm>
                   )}
                  </Descriptions.Item>
                  <Descriptions.Item label={formatMessage({id:"migration.label.duration"})}>
                    {moment.utc(item.duration).format("HH:mm:ss")}
                  </Descriptions.Item>
                  <Descriptions.Item label={formatMessage({id:"migration.table.field.status"})}>
                    {renderStatus(item)}
                  </Descriptions.Item>
                </Descriptions>
                <div style={{ display: "flex", gap: 8 }}>
                  {hasAuthority("data_tools.migration:all") &&
                    ["stopped", "error"].includes(item.status) && (
                      <Popconfirm
                        title={formatMessage({ id: "migration.confirm.restart" })}
                        onConfirm={() => onStart(item.task_id)}
                      >
                        <Button size="small" type="primary">
                        {formatMessage({id:"form.button.restart"})}
                        </Button>
                      </Popconfirm>
                    )}
                  {hasAuthority("data_tools.migration:all") &&
                    ["running"].includes(item.status) && (
                      <Popconfirm
                        title={formatMessage({ id: "migration.confirm.stop" })}
                        onConfirm={() => onStop(item.task_id)}
                      >
                        <Button size="small" type="danger">
                        {formatMessage({id:"form.button.stop"})}
                        </Button>
                      </Popconfirm>
                    )}
                </div>
              </div>
            </Spin>
          );
          return (
            <Tooltip title={content} trigger="click" overlayClassName="info-tip">
               <div
                key={index}
                className={styles.box}
                style={{
                  backgroundColor: colors[item.status] || colors["default"],
                }}
              />
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};
