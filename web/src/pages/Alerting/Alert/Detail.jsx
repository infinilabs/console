import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import {
  Card,
  Form,
  Row,
  Col,
  Button,
  message,
  Divider,
  Tag,
  Icon,
} from "antd";
import { formatMessage } from "umi/locale";
import useFetch from "@/lib/hooks/use_fetch";
import { useGlobal, useGlobalClusters } from "@/layouts/GlobalContext";
import router from "umi/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import request from "@/utils/request";
import moment from "moment";
import { formatESSearchResult } from "@/lib/elasticsearch/util";
import {
  filterSearchValue,
  sorter,
  formatUtcTimeToLocal,
} from "@/utils/utils";
import { HealthStatusView } from "@/components/infini/health_status_view";
import { PriorityColor, RuleStautsColor } from "../utils/constants";
import { Route } from "umi";
import { JsonParam, QueryParamProvider, useQueryParam } from "use-query-params";
import { Editor } from "@/components/monaco-editor";
import ClusterName from "@/pages/System/Cluster/components/ClusterName";
import Markdown from "@/components/Markdown";
import { ExpressionView } from "./ExpressionView";
import { useHistory } from "react-router-dom";
import { stripDuplicatedAlertTitle } from "../utils/message";

const Detail = (props) => {
  const [param, setParam] = useQueryParam("_g", JsonParam);
  const eventID = props.match.params?.event_id;

  const [alertDetail, setAlertDetail] = useState({});
  const [ruleDetail, setRuleDetail] = useState({});
  const displayState =
    alertDetail?.display_state || alertDetail?.state || ruleDetail?.state;
  const alertPriority =
    alertDetail?.priority ||
    alertDetail?.condition_result?.result_items?.[0]?.condition_item?.priority ||
    ruleDetail?.bucket_conditions?.items?.[0]?.priority ||
    ruleDetail?.conditions?.items?.[0]?.priority;
  const expressionItems =
    alertDetail?.condition?.items?.length > 0
      ? alertDetail?.condition?.items
      : ruleDetail?.bucket_conditions?.items?.length > 0
      ? ruleDetail?.bucket_conditions?.items
      : ruleDetail?.conditions?.items;
  const alertMessage = stripDuplicatedAlertTitle(
    alertDetail?.message,
    alertDetail?.title
  );

  const fetchAlertDetail = (id) => {
    const fetchData = async () => {
      const res = await request(`/alerting/alert/${id}`, {
        method: "GET",
      });
      if (res && res._source) {
        setAlertDetail(res._source);
      }
    };
    fetchData();
  };

  const fetchRuleDetail = (id) => {
    const fetchData = async () => {
      const res = await request(`/alerting/rule/${id}/info`, {
        method: "GET",
      });
      if (res && !res.error) {
        setRuleDetail(res);
      } else {
        setRuleDetail({});
      }
    };
    fetchData();
  };

  const onAckClick = useCallback(async () => {
    const res = await request(`alerting/alert/_acknowledge`, {
      method: "POST",
      body: { ids: [eventID], user: "" },
    });
    if (res && res.result == "updated") {
      message.success("Acknowledged succeed");
      fetchAlertDetail(eventID);
    } else {
      console.log("Updated failed,", res);
      message.success("Acknowledged failed");
    }
  }, [eventID]);

  useEffect(() => {
    fetchAlertDetail(eventID);
  }, [eventID]);

  useEffect(() => {
    if (!alertDetail?.rule_id) {
      setRuleDetail({});
      return;
    }
    fetchRuleDetail(alertDetail.rule_id);
  }, [alertDetail?.rule_id]);

  const AlertMessageView = ({ content }) => {
    const [visible, setVisible] = useState(false);
    const onVisibleClick = () => {
      setVisible(!visible);
    };
    return (
      <>
        <a onClick={onVisibleClick}>
          {visible ? (
            <>
              <Icon type={"up"} />{" "}
              {formatMessage({ id: "form.button.collapse" })}
            </>
          ) : (
            <>
              <Icon type={"down"} />{" "}
              {formatMessage({ id: "form.button.expand" })}
            </>
          )}
        </a>
        <div style={{ display: visible ? "block" : "none" }}>{content}</div>
      </>
    );
  };

  const DescriptionItem = ({ title, content, isCollapse }) => (
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
      {content}
    </div>
  );
  const clusters = useGlobalClusters();
  const history = useHistory();

  return (
    <PageHeaderWrapper>
      <Card
        title={formatMessage({ id: "alert.task.detail.title" })}
        extra={
          <Button
            type="primary"
            onClick={() => {
              history.goBack();
            }}
          >
            {formatMessage({ id: "form.button.goback" })}
          </Button>
        }
      >
        <Row>
          <Col span={12}>
            <DescriptionItem
              title={formatMessage({
                id: "alert.rule.table.columnns.rule_name",
              })}
              content={alertDetail?.rule_name}
            />
          </Col>
          <Col span={12}>
            <DescriptionItem
              title={formatMessage({
                id: "alert.message.table.execution_status",
              })}
              content={
                <HealthStatusView
                  status={RuleStautsColor[displayState] || "gray"}
                  label={
                    displayState
                      ? formatMessage({
                          id: `alert.message.status.${displayState}`,
                          defaultMessage: displayState,
                        })
                      : "-"
                  }
                />
              }
            />
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <DescriptionItem
              title={formatMessage({ id: "alert.rule.table.columnns.cluster" })}
              content={
                <ClusterName
                  name={alertDetail?.resource_name}
                  id={alertDetail?.resource_id}
                  distribution={
                    clusters[alertDetail?.resource_id]?.distribution
                  }
                />
              }
            />
          </Col>
          <Col span={12}>
            <DescriptionItem
              title={formatMessage({ id: "alert.message.table.priority" })}
              content={
                alertPriority &&
                displayState != "ok" &&
                displayState != "recovered" ? (
                  <Tag color={PriorityColor[alertPriority]}>
                    {formatMessage({
                      id: `alert.message.priority.${alertPriority}`,
                    })}
                  </Tag>
                ) : (
                  "-"
                )
              }
            />
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <DescriptionItem
              title={formatMessage({
                id: "alert.message.detail.resource_objects",
              })}
              content={
                Array.isArray(alertDetail?.objects)
                  ? alertDetail.objects.join(",")
                  : alertDetail.objects
              }
            />
          </Col>
          <Col span={12}>
            <DescriptionItem
              title={formatMessage({
                id: "alert.message.table.execution_time",
              })}
              content={
                <span title={alertDetail?.created}>
                  {formatUtcTimeToLocal(alertDetail?.created)}
                </span>
              }
            />
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <DescriptionItem
              title={formatMessage({
                id: "alert.rule.table.columnns.expression",
              })}
              content={<ExpressionView items={expressionItems} />}
            />
          </Col>
        </Row>
        {alertDetail?.title ? (
          <Row>
            <Col span={24}>
              <DescriptionItem
                title={formatMessage({
                  id: "alert.rule.form.label.event_title",
                })}
                content={alertDetail?.title}
              />
            </Col>
          </Row>
        ) : null}
        {alertDetail?.title ? (
          <Row>
            <Col span={24}>
              <DescriptionItem
                title={formatMessage({
                  id: "alert.rule.form.label.event_message",
                })}
                content={
                  <Card size={"small"} style={{ width: "100%" }}>
                    <Markdown source={alertMessage} />
                  </Card>
                }
              />
            </Col>
          </Row>
        ) : null}

        <Row>
          <Col span={12}>
            <DescriptionItem
              title="Query DSL"
              content={
                <Editor
                  height="300px"
                  width="100%"
                  language="json"
                  theme="light"
                  value={JSON.stringify(
                    JSON.parse(
                      alertDetail?.condition_result?.query_result?.query || "{}"
                    ),
                    null,
                    2
                  )}
                  options={{
                    minimap: {
                      enabled: false,
                    },
                    wordBasedSuggestions: true,
                  }}
                />
              }
            />
          </Col>
          <Col span={12}>
            <DescriptionItem
              title="Response"
              content={
                <Editor
                  height="300px"
                  width="100%"
                  language="json"
                  theme="light"
                  value={JSON.stringify(
                    JSON.parse(
                      alertDetail?.condition_result?.query_result?.raw || "{}"
                    ),
                    null,
                    2
                  )}
                  options={{
                    minimap: {
                      enabled: false,
                    },
                    wordBasedSuggestions: true,
                  }}
                />
              }
            />
          </Col>
        </Row>
        {alertDetail?.action_execution_results?.map((item, i) => {
          return (
            <div key={i}>
              <Divider />
              <Row>
                <Col span={12}>
                  <DescriptionItem
                    title={formatMessage({
                      id: "alert.channel.table.columns.name",
                    })}
                    content={item?.channel_name}
                  />
                </Col>
                <Col span={12}>
                  <DescriptionItem
                    title={formatMessage({
                      id: "alert.channel.table.columns.channel_type",
                    })}
                    content={item?.channel_type}
                  />
                </Col>
              </Row>
              <Row>
                <Col span={24}>
                  <DescriptionItem
                    title={formatMessage({
                      id: "alert.message.detail.action_message",
                    })}
                    content={<AlertMessageView content={item.message} />}
                  />
                </Col>
              </Row>
              <Row>
                <Col span={24}>
                  <DescriptionItem
                    title={formatMessage({
                      id: "alert.message.detail.action_result",
                    })}
                    content={item.result}
                  />
                </Col>
              </Row>
              {item.error ? (
                <Row>
                  <Col span={24}>
                    <DescriptionItem
                      title={formatMessage({
                        id: "alert.message.detail.action_result_error",
                      })}
                      content={item.error}
                    />
                  </Col>
                </Row>
              ) : null}
            </div>
          );
        })}

        {alertDetail?.error && !alertDetail?.action_execution_results ? (
          <Row>
            <Col span={24}>
              <DescriptionItem title="Error" content={alertDetail?.error} />
            </Col>
          </Row>
        ) : null}
      </Card>
    </PageHeaderWrapper>
  );
};

export default (props) => {
  return (
    <QueryParamProvider ReactRouterRoute={Route}>
      <Detail {...props} />
    </QueryParamProvider>
  );
};
