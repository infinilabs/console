import styles from "./Info.scss";
import { Descriptions, Popover, Icon, Row, Col } from "antd";
import moment from "moment";
import { Link } from "umi";
import { formatMessage } from "umi/locale";

export default ({ taskId, record, data, logInfo }) => {
  const {
    start_time,
    completed_time,
    duration,
    data_partition,
    step,
    partitions,
    incremental,
    workers,
  } = data;

  const completed_partition = (partitions || [])?.filter(
    (item) => item.status === "complete"
  ).length;

  const lblSpan = 4;
  const valSpan = 8;
  return (
    <div className={styles.migrateIndicesInfo}>
      <Row gutter={[16, { xs: 8, sm: 8, md: 16, lg: 16 }]}>
        <Col span={lblSpan}>
          <span className="info-lbl">
            {formatMessage({ id: "migration.label.start_time" })}
          </span>
        </Col>
        <Col span={valSpan}>
          <span className="info-val">
            {moment(start_time).format("YYYY-MM-DD HH:mm:ss")}
          </span>
        </Col>
        <Col span={lblSpan}>
          <span className="info-lbl">
            {formatMessage({ id: "migration.label.partition" })}
          </span>
        </Col>
        <Col span={valSpan}>
          <span className="info-val">{data_partition}</span>
        </Col>
        <Col span={lblSpan}>
          <span className="info-lbl">
            {formatMessage({ id: "migration.label.end_time" })}
          </span>
        </Col>
        <Col span={valSpan}>
          <span className="info-val">
            {completed_time
              ? moment(completed_time).format("YYYY-MM-DD HH:mm:ss")
              : "-"}
          </span>
        </Col>
        <Col span={lblSpan}>
          <span className="info-lbl">
            {formatMessage({ id: "migration.label.completed_partition" })}
          </span>
        </Col>
        <Col span={valSpan}>
          <span className="info-val">{completed_partition}</span>
        </Col>
        <Col span={lblSpan}>
          <span className="info-lbl">
            {formatMessage({ id: "migration.label.duration" })}
          </span>
        </Col>
        <Col span={valSpan}>
          <span className="info-val">
            {moment.utc(duration).format("HH:mm:ss")}
          </span>
        </Col>
        <Col span={lblSpan}>
          <span className="info-lbl">
            {formatMessage({ id: "migration.label.incremental" })}
          </span>
        </Col>
        <Col span={valSpan}>
          <span className="info-val">
            {incremental
              ? `${incremental.field_name}, ${incremental.delay}`
              : "-"}
          </span>
        </Col>
        <Col span={lblSpan}>
          <span className="info-lbl">
            {formatMessage({ id: "migration.label.step" })}
          </span>
        </Col>
        <Col span={valSpan}>
          <span className="info-val">{step || "-"}</span>
        </Col>
        <Col span={lblSpan}>
          <span className="info-lbl">
            {formatMessage({ id: "migration.label.worker" })}
          </span>
        </Col>
        <Col span={valSpan}>
          <span className="info-val">
            {(workers || []).map((worker) => {
              return (
                <Link
                  style={{ marginRight: 5 }}
                  to={`/resource/runtime/instance/${worker.id}/task`}
                >
                  {worker.name}
                </Link>
              );
            })}
          </span>
        </Col>
      </Row>
    </div>
  );
};
