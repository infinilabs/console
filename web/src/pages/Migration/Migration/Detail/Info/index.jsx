import { Col, Descriptions, Row, Tag } from "antd";
import styles from "./index.scss";
import Editer from "./Editer";
import { Link } from "react-router-dom";
import ExecuteLog from "../../components/ExecuteLog";
import ExecuteNodes from "../../components/FormItem/ExecuteNodes";
import ExecuteIntervals from "../../components/FormItem/ExecuteIntervals";
import ClusterName from "@/pages/System/Cluster/components/ClusterName";
import moment from "moment";
import ClusterItem from "./ClusterItem";
import ArrowSplitor from "./ArrowSplitor";
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
  tags = [],
  showLeftArrow,
}) => {
  return (
    <div className="mi-info">
      <div className="first-part">
        <Row>
          <Col span={5}>
            <ClusterItem
              name={cluster.source?.name}
              distribution={cluster.source?.distribution}
              id={cluster.source?.id}
            />
          </Col>
          <Col span={14}>
            <div style={{ margin: "0 30px" }}>
              <div style={{ textAlign: "center" }}>
                <span>
                  Indices: {completedIndices}/{totalIndices}
                </span>
              </div>
              <div style={{ margin: "4px 0" }}>
                <ArrowSplitor showLeftArrow={showLeftArrow} />
              </div>
              <div>
                <div style={{ textAlign: "center" }}>
                  {nodes.map((item, index) => {
                    const title = "Workers";
                    const isFirst = index === 0;
                    return (
                      <Link to={`/resource/runtime/instance/${item.id}/task`}>
                        <Tag className="tag" style={{ cursor: "pointer" }}>
                          {item.name}
                        </Tag>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </Col>
          <Col span={5}>
            <ClusterItem
              name={cluster.target?.name}
              distribution={cluster.target?.distribution}
              id={cluster.target?.id}
              isSource={false}
            />
          </Col>
        </Row>
      </div>
      <div className="second-part">
        <div className="iw">
          <div className="im">
            <dl>
              <dt>{formatMessage({ id: "migration.label.start_time" })}</dt>
              <dd>
                {start_time_in_millis
                  ? moment(start_time_in_millis).format("YYYY-MM-DD HH:mm:ss")
                  : "N/A"}
              </dd>
            </dl>
          </div>
          <div className="im">
            <dl>
              <dt>{formatMessage({ id: "migration.label.time_window" })}</dt>
              <dd>
                {timeWindow.map((item, index) => {
                  return `${item.start}~${item.end}`;
                })}
              </dd>
            </dl>
          </div>
          <div className="im">
            <dl>
              <dt>{formatMessage({ id: "migration.label.creator" })}</dt>
              <dd>{creator}</dd>
            </dl>
          </div>
          <div className="im">
            <dl>
              <dt>{formatMessage({ id: "migration.label.task_logging" })}</dt>
              <dd>
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
              </dd>
            </dl>
          </div>
          <div className="im">
            <dl>
              <dt>{formatMessage({ id: "migration.label.tags" })}</dt>
              <dd>
                {(tags || []).map((tag) => {
                  return <Tag className="tag">{tag}</Tag>;
                })}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};
