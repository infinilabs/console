import { Col, Descriptions, Row } from "antd";
import styles from "./index.scss";
import { Link } from "react-router-dom";
import ExecuteLog from "../../components/ExecuteLog";
import ExecuteNodes from "../../components/FormItem/ExecuteNodes";
import ExecuteIntervals from "../../components/FormItem/ExecuteIntervals";
import ClusterName from "@/pages/System/Cluster/components/ClusterName";
import moment from "moment";

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
            <Descriptions.Item label="Source Cluster">
              <div className="icon-wrapper">
                <ClusterName
                  name={cluster.source?.name}
                  distribution={cluster.source?.distribution}
                  id={cluster.source?.id}
                />
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Target Cluster">
              <div className="icon-wrapper">
                <ClusterName
                  name={cluster.target?.name}
                  distribution={cluster.target?.distribution}
                  id={cluster.target?.id}
                />
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Creator">{creator}</Descriptions.Item>
            <Descriptions.Item label="Start Time">
              {start_time_in_millis
                ? moment(start_time_in_millis).format("YYYY-MM-DD HH:mm:ss")
                : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Total Indices">
              {totalIndices}
            </Descriptions.Item>
            <Descriptions.Item label="Completed Indices">
              {completedIndices}
            </Descriptions.Item>
          </Descriptions>
        </Col>
        <Col span={12}>
          <Descriptions size="large" column={1} colon={false}>
            {nodes.map((item, index) => {
              const title = "Workers";
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
              const title = "Time Window";
              return (
                <Descriptions.Item key={index} label={isFirst ? title : " "}>
                  {item.start}~{item.end}
                </Descriptions.Item>
              );
            })}
            {repeat?.is_repeat && (
              <Descriptions.Item label="Detect Interval">
                {interval}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Task Logging">
              <ExecuteLog
                text="View"
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
