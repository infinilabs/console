import {
  Card,
  Form,
  Row,
  Col,
  Button,
  message,
  Divider,
  Tag,
  Switch,
  Icon,
  Tooltip,
} from "antd";
import { formatMessage } from "umi/locale";
import { useCallback, useEffect, useMemo, useState } from "react";
import moment from "moment";
import request from "@/utils/request";
import Link from "umi/link";
import { formatUtcTimeToLocal } from "@/utils/utils";
import { PriorityColor, RuleStautsColor } from "../../utils/constants";
import { HealthStatusView } from "@/components/infini/health_status_view";
import { useGlobalClusters } from "@/layouts/GlobalContext";
import ClusterName from "@/pages/System/Cluster/components/ClusterName";
import { ExpressionView } from "../../Alert/ExpressionView";
import Sum from "@/components/Icons/Sum";
import { PriorityIconText } from "../../components/Statistic";
import { hasAuthority } from "@/utils/authority";

const RuleCard = ({ ruleID, data = {} }) => {
  const onEnableClick = useCallback(
    async (id, enabled) => {
      const res = await request(`/alerting/rule/${id}/_enable`, {
        method: "POST",
        body: { enabled: enabled },
      });
      if (res && res.result == "updated") {
        message.success(
          formatMessage({
            id: "app.message.operate.success",
          })
        );
      } else {
        console.log("Rule enabled failed,", res);
        message.success(
          formatMessage({
            id: "app.message.operate.failed",
          })
        );
      }
    },
    [ruleID]
  );

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

  const CardExtra = () => {
    return (
      <div>
        <span>
          {formatMessage({ id: "alert.rule.detail.switch.enabled" })}{" "}
        </span>
        <Switch
          defaultChecked={data.enabled || false}
          size={"small"}
          onChange={(checked) => {
            onEnableClick(ruleID, checked);
          }}
        />
      </div>
    );
  };
  const clusters = useGlobalClusters();
  
  return (
    <div>
      <Card
        size="small"
        title={formatMessage({ id: "alert.rule.detail.title.rule_detail" })}
        extra={hasAuthority("alerting.rule:all")?<CardExtra />:null}
      >
        <Row style={{ marginBottom: 10 }}>
          <Col span={6}>
            {formatMessage({
              id: "alert.rule.table.columnns.rule_name",
            })}
          </Col>
          <Col span={18}>{data?.rule_name}</Col>
        </Row>
        <Row style={{ marginBottom: 10 }}>
          <Col span={6}>
            {formatMessage({
              id: "alert.rule.table.columnns.cluster",
            })}
          </Col>
          <Col span={18}>
            <ClusterName
              name={data?.resource_name}
              distribution={clusters[data?.resource_id]?.distribution}
              id={data?.resource_id}
            />
          </Col>
        </Row>
        <Row style={{ marginBottom: 10 }}>
          <Col span={6}>
            {formatMessage({
              id: "alert.rule.table.columnns.objects",
            })}
          </Col>
          <Col span={18}>{data?.resource_objects?.join(",")}</Col>
        </Row>
        <Row style={{ marginBottom: 10 }}>
          <Col span={6}>
            {formatMessage({
              id: "alert.rule.form.label.bucket_size",
            })}
          </Col>
          <Col span={18}>{data?.bucket_size}</Col>
        </Row>
        <Row style={{ marginBottom: 10 }}>
          <Col span={6}>
            {formatMessage({
              id: "alert.rule.table.columnns.expression",
            })}
          </Col>
          <Col span={18}>
            <Icon
              component={Sum}
              style={{
                color: "rgb(0, 127, 255)",
                backgroundColor: "#efefef",
                marginRight: 5,
              }}
            />
            <span style={{ wordBreak: "break-all" }}>{data?.expression}</span>
          </Col>
        </Row>
        <Row style={{ marginBottom: 30 }}>
          <Col span={6}>Condition</Col>
          <Col span={18}>
            <Conditions items={data.conditions?.items} />
          </Col>
        </Row>
      </Card>
    </div>
  );
};

const Conditions = ({ items }) => {
  return (items || []).map((item) => {
    let operator = "";
    switch (item.operator) {
      case "gte":
        operator = ">=";
        break;
      case "gt":
        operator = ">";
        break;
      case "lt":
        operator = "<";
        break;
      case "lte":
        operator = "<=";
        break;
    }
    return (
      <div key={item.priority} style={{ marginBottom: 10 }}>
        <span>{operator} </span>
        <span style={{ marginRight: 15 }}>{item.values[0]}</span>
        <PriorityIconText priority={item.priority} />
      </div>
    );
  });
};

export default RuleCard;
