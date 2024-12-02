import { Card, Form, Row, Col, Button, message, Divider, Tag } from "antd";
import { formatMessage } from "umi/locale";
import moment from "moment";
import { formatUtcTimeToLocal } from "@/utils/utils";
import { PriorityColor, MessageStautsColor } from "../../utils/constants";
import { HealthStatusView } from "@/components/infini/health_status_view";
import { format } from "numeral";
import ClusterName from "@/pages/System/Cluster/components/ClusterName";
import { useGlobalClusters } from "@/layouts/GlobalContext";
import Markdown from "@/components/Markdown";
import { Link } from "umi";

const DescriptionItem = ({ title, content }) => (
  <div
    style={{
      fontSize: 14,
      lineHeight: "22px",
      marginBottom: 7,
      color: "rgba(0,0,0,0.65)",
      wordBreak: "break-all",
      whiteSpace: "pre-wrap",
      display: "flex",
      flexWrap: "wrap",
    }}
  >
    <span
      style={{
        marginRight: 8,
        display: "inline-block",
        color: "rgba(0,0,0,0.85)",
      }}
    >
      {title}:
    </span>
    <span>{content}</span>
  </div>
);

const MessageCard = (props) => {
  if (!props?.data) {
    return null;
  }
  const data = props?.data || {};

  const clusterM = useGlobalClusters();

  return (
    <div className="alert-msg-detail-cnt">
      <Row>
        <Col span={24}>
          <DescriptionItem
            title={formatMessage({ id: "alert.rule.table.columnns.rule_name" })}
            content={<Link to={`/alerting/rule/${data.rule_id}`}>{data?.rule_name}</Link>}
          />
        </Col>
      </Row>
      <Row>
        <Col span={12}>
          <DescriptionItem
            title={formatMessage({ id: "alert.message.table.priority" })}
            content={
              <Tag color={PriorityColor[data?.priority]}>
                {formatMessage({
                  id: `alert.message.priority.${data?.priority}`,
                })}
              </Tag>
            }
          />
        </Col>

        <Col span={12}>
          <DescriptionItem
            title={formatMessage({ id: "alert.message.detail.status" })}
            content={
              <HealthStatusView
                status={MessageStautsColor[data?.status]}
                label={data?.status}
              />
            }
          />
        </Col>
      </Row>
      <Row>
        <Col span={12}>
          <DescriptionItem
            title={formatMessage({ id: "alert.message.detail.resource_name" })}
            content={
              <ClusterName
                name={data?.resource_name}
                distribution={clusterM[data?.resource_id]?.distribution}
                linkTo={`/cluster/monitor/elasticsearch/${data?.resource_id}`}
              />
            }
          />
        </Col>
        <Col span={12}>
          <DescriptionItem
            title={formatMessage({
              id: "alert.message.detail.resource_objects",
            })}
            content={data?.resource_objects?.join(",")}
          />
        </Col>
      </Row>
      <Row>
        <Col span={12}>
          <DescriptionItem
            title={formatMessage({ id: "alert.message.table.created" })}
            content={
              <span title={data?.created}>
                {formatUtcTimeToLocal(data?.created)}
              </span>
            }
          />
        </Col>
        <Col span={12}>
          <DescriptionItem
            title={formatMessage({ id: "alert.message.detail.updated" })}
            content={
              <span title={data?.updated}>
                {formatUtcTimeToLocal(data?.updated)}
              </span>
            }
          />
        </Col>
      </Row>
      <Row>
        <Col span={12}>
          <DescriptionItem
            title={formatMessage({ id: "alert.message.table.duration" })}
            content={moment.duration(data?.duration).humanize()}
          />
        </Col>
        {data?.ignored_reason ? (
          <Col span={12}>
            <DescriptionItem
              title={formatMessage({ id: "alert.message.detail.ignored_user" })}
              content={data?.ignored_user}
            />
          </Col>
        ) : null}
      </Row>
      {data?.ignored_reason ? (
        <Row>
          <Col span={12}>
            <DescriptionItem
              title={formatMessage({
                id: "alert.message.detail.ignored_reason",
              })}
              content={data?.ignored_reason}
            />
          </Col>
          <Col span={12}>
            <DescriptionItem
              title={formatMessage({ id: "alert.message.detail.ignored_time" })}
              content={
                <span title={data?.ignored_time}>
                  {formatUtcTimeToLocal(data?.ignored_time)}
                </span>
              }
            />
          </Col>
        </Row>
      ) : null}
      {/* <Row>
        <Col span={24}>
          <DescriptionItem
            title={formatMessage({
              id: "alert.rule.table.columnns.expression",
            })}
            content={data?.conditions?.items?.map((item, i) => {
              return (
                <div key={i}>
                  {item.expression}({item.priority})
                </div>
              );
            })}
          />
        </Col>
      </Row> */}
      <Row>
        <Col span={24} className="message-content">
          <DescriptionItem
            title={formatMessage({ id: "alert.rule.form.label.event_message" })}
            content={
              <Card size={"small"} style={{ width: "100%" }}>
                <Markdown source={data?.message} />
              </Card>
            }
          />
        </Col>
      </Row>
    </div>
  );
};

export default MessageCard;
