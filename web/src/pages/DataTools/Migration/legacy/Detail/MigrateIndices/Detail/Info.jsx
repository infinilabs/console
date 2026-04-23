import styles from "./Info.scss";
import { Descriptions, Popover, Icon, Row, Col } from "antd";
import moment from "moment";
import { Link } from "umi";
import { formatMessage } from "umi/locale";
import { formatter } from "@/utils/format";

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
  const formatNumber = (value) =>
    Number.isFinite(value) ? formatter.number(value) : "-";
  const totalScrollDocs = (partitions || []).reduce(
    (sum, item) => sum + (Number(item.scroll_docs) || 0),
    0
  );
  const totalIndexDocs = (partitions || []).reduce(
    (sum, item) => sum + (Number(item.index_docs) || 0),
    0
  );
  const totalSourceScrollDocs = (partitions || []).reduce(
    (sum, item) => sum + (Number(item.source_scroll_docs) || 0),
    0
  );
  const totalTargetScrollDocs = (partitions || []).reduce(
    (sum, item) => sum + (Number(item.target_scroll_docs) || 0),
    0
  );
  const totalOnlyInSource = (partitions || []).reduce(
    (sum, item) => sum + (Number(item.only_in_source) || 0),
    0
  );
  const totalOnlyInTarget = (partitions || []).reduce(
    (sum, item) => sum + (Number(item.only_in_target) || 0),
    0
  );
  const totalDiffBoth = (partitions || []).reduce(
    (sum, item) => sum + (Number(item.diff_both) || 0),
    0
  );
  const hasMigrationProgress = (partitions || []).some(
    (item) => typeof item.scroll_docs !== "undefined" || typeof item.index_docs !== "undefined"
  );
  const hasComparisonProgress = (partitions || []).some(
    (item) =>
      typeof item.source_scroll_docs !== "undefined" ||
      typeof item.target_scroll_docs !== "undefined" ||
      typeof item.only_in_source !== "undefined" ||
      typeof item.only_in_target !== "undefined" ||
      typeof item.diff_both !== "undefined"
  );

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
        {hasMigrationProgress ? (
          <>
            <Col span={lblSpan}>
              <span className="info-lbl">
                {formatMessage({ id: "migration.label.exported_docs" })}
              </span>
            </Col>
            <Col span={valSpan}>
              <span className="info-val">{formatNumber(totalScrollDocs)}</span>
            </Col>
            <Col span={lblSpan}>
              <span className="info-lbl">
                {formatMessage({ id: "migration.label.written_docs" })}
              </span>
            </Col>
            <Col span={valSpan}>
              <span className="info-val">{formatNumber(totalIndexDocs)}</span>
            </Col>
          </>
        ) : null}
        {hasComparisonProgress ? (
          <>
            <Col span={lblSpan}>
              <span className="info-lbl">
                {formatMessage({ id: "migration.label.source_docs" })}
              </span>
            </Col>
            <Col span={valSpan}>
              <span className="info-val">{formatNumber(totalSourceScrollDocs)}</span>
            </Col>
            <Col span={lblSpan}>
              <span className="info-lbl">
                {formatMessage({ id: "migration.label.target_docs" })}
              </span>
            </Col>
            <Col span={valSpan}>
              <span className="info-val">{formatNumber(totalTargetScrollDocs)}</span>
            </Col>
            <Col span={lblSpan}>
              <span className="info-lbl">
                {formatMessage({ id: "migration.label.only_in_source" })}
              </span>
            </Col>
            <Col span={valSpan}>
              <span className="info-val">{formatNumber(totalOnlyInSource)}</span>
            </Col>
            <Col span={lblSpan}>
              <span className="info-lbl">
                {formatMessage({ id: "migration.label.only_in_target" })}
              </span>
            </Col>
            <Col span={valSpan}>
              <span className="info-val">{formatNumber(totalOnlyInTarget)}</span>
            </Col>
            <Col span={lblSpan}>
              <span className="info-lbl">
                {formatMessage({ id: "migration.label.diff_both" })}
              </span>
            </Col>
            <Col span={valSpan}>
              <span className="info-val">{formatNumber(totalDiffBoth)}</span>
            </Col>
          </>
        ) : null}
      </Row>
    </div>
  );
};
