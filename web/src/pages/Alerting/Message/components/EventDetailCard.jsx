import {Card, Col, Row,Icon } from "antd";
import moment from "moment";
import { formatUtcTimeToLocal } from "@/utils/utils";
import { PriorityColor } from "../../utils/constants";
import { formatMessage } from "umi/locale";
import EventMessageStatus from "./EventMessageStatus";

const calcSafeDuration = (msgItem) => {
  const triggerAt = msgItem?.trigger_at;
  const resolveAt = msgItem?.resolve_at;

  const start = moment(triggerAt);
  const end = resolveAt ? moment(resolveAt) : moment();

  if (!start.isValid() || !end.isValid()) return "-";

  const diffMs = end.diff(start);

  if (diffMs < 0) return "-";

  return moment.duration(diffMs).humanize();
};

const isValidAlertTime = (value) => {
  if (!value) {
    return false;
  }
  const parsed = moment(value);
  return parsed.isValid() && parsed.year() > 1;
};

export default ({msgItem})=>{
  const labelSpan = 6;
  const vSpan = 18;
  const triggerAt = isValidAlertTime(msgItem?.trigger_at) ? msgItem.trigger_at : msgItem?.created;
  const resolveAt = isValidAlertTime(msgItem?.resolve_at) ? msgItem.resolve_at : msgItem?.updated;

  const isBucketDiff = !!(msgItem && msgItem.bucket_conditions)

  return (
    <Card size={"small"} title={formatMessage({ id: "alert.message.detail.title.event_detail" })}>
      <div style={{lineHeight:"2em"}} >
        <Row>
          <Col span={labelSpan}>{formatMessage({ id: "alert.message.table.priority" })}</Col>
          <Col span={vSpan}>
            <div>
              <Icon
                type="alert"
                theme="filled"
                style={{ color: PriorityColor[msgItem?.priority], marginRight: 5 }}
              />
              <span>
              {formatMessage({
                id: "alert.message.priority."+msgItem?.priority,
              })}
              </span>
            </div>
          </Col>
        </Row>
        <Row>
          <Col span={labelSpan}>{formatMessage({ id: "alert.message.detail.status" })}</Col>
          <Col span={vSpan}>
            <EventMessageStatus record={msgItem}/>
          </Col>
        </Row>
        <Row>
          <Col span={labelSpan}>{formatMessage({ id: "alert.message.table.created" })}</Col>
          <Col span={vSpan}>{formatUtcTimeToLocal(triggerAt)}</Col>
        </Row>
        {msgItem.status === "recovered" ? <Row>
          <Col span={labelSpan}>{formatMessage({ id: "alert.message.detail.recover_time" })}</Col>
          <Col span={vSpan}>{formatUtcTimeToLocal(resolveAt)}</Col>
        </Row>:null}
        <Row>
          <Col span={labelSpan}>{formatMessage({ id: "alert.message.table.duration" })}</Col>
          <Col span={vSpan}>{calcSafeDuration(msgItem)}</Col>
        </Row>
        <Row>
          <Col span={labelSpan}>{formatMessage({ id: "alert.message.detail.condition.type" })}</Col>
          <Col span={vSpan}>{isBucketDiff ? formatMessage({id: `alert.rule.form.label.buckets_diff`}) : formatMessage({id: `alert.rule.form.label.metrics_value`})}</Col>
        </Row>
        {
          isBucketDiff && msgItem?.bucket_diff_type ? (
            <Row>
              <Col span={labelSpan}>{formatMessage({ id: "alert.message.detail.bucket_diff_type" })}</Col>
              <Col span={vSpan}>{formatMessage({id: `alert.rule.form.label.${msgItem.bucket_diff_type}`}) }</Col>
            </Row>
          ) : null
        }
        <Row>
          <Col span={labelSpan}>{formatMessage({ id: "alert.message.detail.condition" })}</Col>
          <Col span={vSpan}>{msgItem?.hit_condition}</Col>
        </Row>
        <Row>
          <Col span={labelSpan}>{formatMessage({ id: "alert.message.detail.updated" })}</Col>
          <Col span={vSpan}>{formatUtcTimeToLocal(resolveAt)}</Col>
        </Row>
      </div>
    </Card>
  )
}