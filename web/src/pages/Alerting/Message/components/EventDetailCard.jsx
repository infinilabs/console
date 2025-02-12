import {Card, Col, Row,Icon } from "antd";
import moment from "moment";
import { formatUtcTimeToLocal } from "@/utils/utils";
import { PriorityColor } from "../../utils/constants";
import { formatMessage } from "umi/locale";
import EventMessageStatus from "./EventMessageStatus";

export default ({msgItem})=>{
  const labelSpan = 6;
  const vSpan = 18;

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
          <Col span={vSpan}>{formatUtcTimeToLocal(msgItem?.created)}</Col>
        </Row>
        {msgItem.status === "recovered" ? <Row>
          <Col span={labelSpan}>{formatMessage({ id: "alert.message.detail.recover_time" })}</Col>
          <Col span={vSpan}>{formatUtcTimeToLocal(msgItem?.updated)}</Col>
        </Row>:null}
        <Row>
          <Col span={labelSpan}>{formatMessage({ id: "alert.message.table.duration" })}</Col>
          <Col span={vSpan}>{moment.duration(msgItem?.duration).humanize()}</Col>
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
          <Col span={vSpan}>{formatUtcTimeToLocal(msgItem?.updated)}</Col>
        </Row>
      </div>
    </Card>
  )
}