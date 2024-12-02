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
  firstUpperCase,
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

const Detail = (props) => {
  const [param, setParam] = useQueryParam("_g", JsonParam);
  const eventID = props.match.params?.event_id;

  const [alertDetail, setAlertDetail] = useState({});
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
                  status={RuleStautsColor[alertDetail?.state]}
                  label={firstUpperCase(alertDetail?.state)}
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
                alertDetail?.state != "ok" ? (
                  <Tag color={PriorityColor[alertDetail?.priority]}>
                    {formatMessage({
                      id: `alert.message.priority.${alertDetail?.priority}`,
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
              content={<ExpressionView items={alertDetail?.condition?.items} />}
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
                    <Markdown source={alertDetail?.message} />
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
