import { Col, Descriptions, Row } from "antd";
import styles from "./index.scss";
import { Link } from "react-router-dom";
import ExecuteLog from "../../components/ExecuteLog";
import ExecuteNodes from "../../components/FormItem/ExecuteNodes";
import ExecuteIntervals from "../../components/FormItem/ExecuteIntervals";
import ClusterName from "@/pages/System/Cluster/components/ClusterName";
import moment from "moment";
import { formatMessage } from "umi/locale";

export default ({
  id,
  cluster = {},
  creator,
  start_time_in_millis,
  repeat,
  interval,
  totalIndices,
  completedIndices,
  timeWindow,
  nodes,
  logInfo,
}) => {
  return (
    <div className={styles.comparisonInfo}>
      <Row>
        <Col span={12}>
          <Descriptions size="large" column={1} colon={false}>
            <Descriptions.Item label={formatMessage({ id: "migration.label.source_cluster" })}>
              <div className="icon-wrapper">
                <ClusterName
                  name={cluster.source?.name}
                  distribution={cluster.source?.distribution}
                  id={cluster.source?.id}
                />
              </div>
            </Descriptions.Item>
            <Descriptions.Item label={formatMessage({ id: "migration.label.target_cluster" })}>
              <div className="icon-wrapper">
                <ClusterName
                  name={cluster.target?.name}
                  distribution={cluster.target?.distribution}
                  id={cluster.target?.id}
                />
              </div>
            </Descriptions.Item>
            <Descriptions.Item label={formatMessage({ id: "migration.label.creator" })}>{creator}</Descriptions.Item>
            <Descriptions.Item label={formatMessage({ id: "migration.label.start_time" })}>
              {start_time_in_millis
                ? moment(start_time_in_millis).format("YYYY-MM-DD HH:mm:ss")
                : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label={formatMessage({ id: "task.label.total_indices", defaultMessage: "Total Indices" })}>
              {totalIndices}
            </Descriptions.Item>
            <Descriptions.Item label={formatMessage({ id: "task.label.completed_indices", defaultMessage: "Completed Indices" })}>
              {completedIndices}
            </Descriptions.Item>
          </Descriptions>
        </Col>
        <Col span={12}>
          <Descriptions size="large" column={1} colon={false}>
            {nodes.map((item, index) => {
               const title = formatMessage({ id: "task.label.workers", defaultMessage: "Workers" });
              const isFirst = index === 0;
              return (
                <Descriptions.Item key={index} label={isFirst ? title : " "}>
                  <Link to={`/resource/runtime/instance/${item.id}/task`}>
                    {item.name}
                  </Link>
                </Descriptions.Item>
              );
            })}
            {timeWindow.map((item, index) => {
              const isFirst = index === 0;
               const title = formatMessage({ id: "migration.label.time_window" });
              return (
                <Descriptions.Item key={index} label={isFirst ? title : " "}>
                  {item.start}~{item.end}
                </Descriptions.Item>
              );
            })}
            {repeat?.is_repeat && (
              <Descriptions.Item label={formatMessage({ id: "task.label.detect_interval", defaultMessage: "Detect Interval" })}>
                {interval}
              </Descriptions.Item>
            )}
            <Descriptions.Item label={formatMessage({ id: "migration.label.task_logging" })}>
              <ExecuteLog
                text={formatMessage({ id: "migration.label.view_log" })}
                params={{
                  clusterID: logInfo?.cluster_id,
                  columns: [
                    "metadata.labels.task_type",
                    "payload.task.logging.status",
                    "payload.task.logging.message",
                    "payload.task.logging.result.error",
                  ],
                  index: logInfo?.index_name,
                  query: `metadata.category : "task" and (metadata.labels.task_id : "${id}" or metadata.labels.parent_task_id : "${id}")`,
                }}
              />
            </Descriptions.Item>
          </Descriptions>
        </Col>
      </Row>
    </div>
  );
};
