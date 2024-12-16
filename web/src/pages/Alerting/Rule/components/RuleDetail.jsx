import {
  Button,
  message,
  Divider,
  Typography,
  Icon,
  Tooltip,
  Tag,
  Card,
  Empty,
  Tabs,
} from "antd";
import Link from "umi/link";
import { formatMessage } from "umi/locale";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useHistory } from "react-router-dom";
import request from "@/utils/request";
import { formatter, getFormatter } from "@/utils/format";
import { calculateBounds } from "@/components/vendor/data/common/query/timefilter";
import { MonitorDatePicker } from "@/components/infini/MonitorDatePicker";
import RuleCard from "./RuleCard";
import RuleRecords from "../../Message/components/RuleRecords";
import RuleRecordChart from "./RuleRecordChart";
import { Route } from "umi";
import { JsonParam, QueryParamProvider, useQueryParam } from "use-query-params";
import { formatUtcTimeToLocal, generateId } from "@/utils/utils";
import { PriorityIconText } from "../../components/Statistic";
import { MessageStautsColor } from "../../utils/constants";
import ExternalLink from "@/components/Icons/ExternalLink";
import NotificationCard from "./NotificationCard";
import Sum from "@/components/Icons/Sum";
import WidgetLoader, {
  WidgetRender,
} from "@/pages/DataManagement/View/WidgetLoader";
import MessageRecord from "./MessageRecord";
import { hasAuthority } from "@/utils/authority";
import DatePicker from "@/common/src/DatePicker";
import { getLocale } from "umi/locale";
import { getTimezone } from "@/utils/utils";
import moment from "moment";

const { Title } = Typography;

export const buildWidgetByRule = (rule, queries, created, updated) => {
  if (!rule) return;

  const { metrics = {} } = rule;
  const { format_type = "num" } = metrics;
  const formatMapping = {
    num: {
      type: "number",
      pattern: "0.00a",
    },
    bytes: {
      type: "bytes",
      pattern: "0.00b",
    },
    ratio: {
      type: "percent",
      pattern: "0.00%",
    },
  };
  let query;
  try {
    query = JSON.stringify(queries.raw_filter);
  } catch (error) {}

  const number = parseInt(metrics.bucket_size);
  const unit = metrics.bucket_size?.replace(`${number}`, '')
  let bucketSize = metrics.bucket_size
  if (unit) {
    const duration = moment(updated).valueOf() - moment(created).valueOf()
    const ms = moment.duration(number, unit).asMilliseconds()
    if (duration <= 2 * ms) {
      bucketSize = `${ms / 1000 / 2}s`
    }
  }

  const config = {
    bucket_size: bucketSize,
    format: formatMapping[format_type],
    group_labels: metrics.bucket_label ? [metrics.bucket_label] : undefined,
    series: [
      {
        metric: {
          formula: metrics.formula,
          items: metrics.items,
          groups: metrics.groups,
          sort: [
            {
              direction: "desc",
              key: "_count",
            },
          ],
        },
        queries: {
          cluster_id: queries.cluster_id,
          indices: queries.indices,
          time_field: queries.time_field,
          dsl: query,
        },
        type: "line",
      },
    ],
  };
  return {
    id: generateId(20),
    ...config,
  };
};

const RuleDetail = (props) => {
  const ruleID = props?.ruleID;
  if (!ruleID) {
    return null;
  }
  const [param, setParam] = useQueryParam("_g", JsonParam);
  const history = useHistory();
  const [state, setState] = React.useState({
    spinning: false,
    timeRange: {
      min: param?.timeRange?.min || "now-7d",
      max: param?.timeRange?.max || "now",
      timeFormatter: formatter.dates(1),
    },
  });
  const ruleCardWrap = useRef();
  const [ruleCardHeight, setRuleCardHeight] = React.useState(0);

  const [refresh, setRefresh] = useState({ isRefreshPaused: true });
  const [timeZone, setTimeZone] = useState(() => getTimezone());

  useMemo(() => {
    setParam({ ...param, timeRange: state.timeRange });
  }, [state.timeRange]);

  const handleTimeChange = ({ start, end }) => {
    setState({
      ...state,
      spinning: true,
      timeRange: {
        min: start,
        max: end,
        timeFormatter: formatter.dates(1),
      },
    });
  };

  const [ruleDetail, setRuleDetail] = useState({});
  const fetcDetail = (id) => {
    const fetchData = async () => {
      const res = await request(`/alerting/rule/${id}/info`, {
        method: "GET",
      });
      if (res) {
        setRuleDetail(res);
      }
    };
    fetchData();
  };

  const onIgnoreClick = useCallback(async () => {
    const res = await request(`alerting/message/_ignore`, {
      method: "POST",
      body: { ids: [ruleID], user: "" },
    });
    if (res && res.result == "updated") {
      message.success(
        formatMessage({
          id: "app.message.ignored.success",
        })
      );
      fetcDetail(ruleID);
    } else {
      console.log("Ignored failed,", res);
      message.success(
        formatMessage({
          id: "app.message.ignored.failed",
        })
      );
    }
  }, [ruleID]);

  useEffect(() => {
    fetcDetail(ruleID);

    //Delay update RuleCard componment height
    setTimeout(() => {
      setRuleCardHeight(ruleCardWrap.current?.clientHeight);
    }, 2000);
  }, []);

  const widget = useMemo(() => {
    if (!ruleDetail || !ruleDetail.rule_name) return;
    return buildWidgetByRule(ruleDetail, {
      cluster_id: ruleDetail.resource_id,
      indices: ruleDetail.resource_objects,
      time_field: ruleDetail.resource_time_field,
      raw_filter: ruleDetail.resource_raw_filter,
    }, ruleDetail?.created, ruleDetail?.updated);
  }, [ruleDetail]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <Title level={4}>{ruleDetail?.rule_name}</Title>
        <div>
          {hasAuthority("alerting.rule:all") ? (
            <Link to={`/alerting/rule/edit/${ruleID}`}>
              <Button type="primary">
                {formatMessage({ id: "form.button.edit" })}
              </Button>
            </Link>
          ) : null}
          <Button
            style={{ marginLeft: 20 }}
            type="primary"
            onClick={() => {
              history.goBack();
            }}
          >
            {formatMessage({ id: "form.button.goback" })}
          </Button>
        </div>
      </div>
      <div>
        <div style={{ color: "rgb(153, 153, 153)" }}>
          {formatMessage(
            { id: "alert.rule.detail.title.changed_desc" },
            {
              updated: formatUtcTimeToLocal(ruleDetail?.updated),
              created: formatUtcTimeToLocal(ruleDetail?.created),
              user: ruleDetail?.creator?.name,
            }
          )}
        </div>
        <div style={{ margin: "10px 0" }}>
          {(ruleDetail?.tags || []).map((tag) => {
            return (
              <Tag
                key={tag}
                style={{
                  color: "rgb(0, 127, 255)",
                  border: "none",
                  background: "rgba(173, 173, 173, 0.15)",
                }}
              >
                {tag}
              </Tag>
            );
          })}
        </div>
        {ruleDetail?.alerting_message ? (
          <Link
            to={`/alerting/message/${ruleDetail?.alerting_message.id}`}
            style={{
              display: "block",
              background: "rgba(255, 0, 0, 0.1)",
              color: "rgb(102, 102, 102)",
              fontSize: 12,
              padding: 5,
              marginBottom: 15,
            }}
          >
            <Tag
              style={{
                backgroundColor: MessageStautsColor["alerting"],
                color: "#fff",
                border: "none",
              }}
            >
              Alerting
            </Tag>
            <PriorityIconText
              priority={ruleDetail?.alerting_message?.priority}
            />{" "}
            | {ruleDetail?.alerting_message?.title}
            <Icon
              component={ExternalLink}
              style={{
                fontSize: "14px",
                color: "rgb(0, 127, 255)",
                marginLeft: 10,
              }}
            />
          </Link>
        ) : null}
      </div>

      <div style={{ display: "flex", gap: 15, marginBottom: 20 }}>
        <div style={{ flex: "1 1 50%" }} ref={ruleCardWrap}>
          <RuleCard ruleID={ruleID} data={ruleDetail} />
        </div>
        <div style={{ flex: "1 1 50%" }}>
          <Card
            size="small"
            title={formatMessage({
              id: "alert.message.detail.title.notification",
            })}
            bodyStyle={{
              height: ruleCardHeight > 0 ? ruleCardHeight - 38 : 240,
              minHeight: 240,
              overflowY: "scroll",
              overflowX: "hidden",
            }}
          >
            <NotificationCard
              notificationConfig={ruleDetail?.notification_config}
              recoverNotificationConfig={
                ruleDetail.recovery_notification_config
              }
            />
          </Card>
        </div>
      </div>

      {/* <Title level={4} style={{ marginTop: 20 }}>
        {formatMessage({ id: "alert.message.detail.alert_metric_status" })}
      </Title> */}
      <div style={{ marginBottom: 10, display: "flex", gap: 8 }}>
        <div style={{ flexGrow: 0, minWidth: 400 }}>
          <DatePicker
            locale={getLocale()}
            start={state.timeRange.min}
            end={state.timeRange.max}
            onRangeChange={handleTimeChange}
            {...refresh}
            onRefreshChange={setRefresh}
            onRefresh={handleTimeChange}
            timeZone={timeZone}
            onTimeZoneChange={setTimeZone}
            recentlyUsedRangesKey={"rule-detail"}
          />
        </div>
        <Button
          onClick={() => {
            handleTimeChange({
              start: state.timeRange.min,
              end: state.timeRange.max,
            });
          }}
          icon={"reload"}
          type="primary"
        >
          {formatMessage({ id: "form.button.refresh" })}
        </Button>
      </div>
      <div style={{ display: "flex", gap: 15, marginBottom: 20 }}>
        <div style={{ flex: "1 1 50%" }}>
          <Card
            size={"small"}
            title={
              <>
                {formatMessage({ id: "alert.rule.detail.title.rule_preview" })}
                <Tooltip title={ruleDetail?.expression}>
                  <Icon
                    component={Sum}
                    style={{
                      color: "rgb(0, 127, 255)",
                      backgroundColor: "#efefef",
                      marginLeft: 5,
                    }}
                  />
                </Tooltip>
              </>
            }
            bodyStyle={{ height: 250, padding: 1 }}
          >
            {ruleDetail.rule_name ? (
              <WidgetRender
                widget={widget}
                range={{
                  from: state.timeRange.min,
                  to: state.timeRange.max,
                }}
              />
            ) : (
              <Empty />
            )}
          </Card>
        </div>
        <div style={{ flex: "1 1 50%" }}>
          <Card
            size="small"
            title={formatMessage({
              id: "alert.rule.detail.title.alert_heatmap",
            })}
            bodyStyle={{ height: 250, padding: 1 }}
          >
            <WidgetLoader
              id="cji1sc28go5i051pl1i0"
              range={{
                from: state.timeRange.min,
                to: state.timeRange.max,
              }}
              queryParams={{ rule_id: ruleID }}
            />
          </Card>
        </div>
      </div>
      {/* {ruleDetail.resource_id ?
      <RuleRecordChart
        ruleID={ruleID}
        timeRange={state.timeRange}
        conditions={ruleDetail?.conditions}
        clusterID ={ruleDetail?.resource_id}
      />:null} */}
      {/* <Title level={4} style={{ marginTop: 20 }}>
        {formatMessage({ id: "alert.message.detail.execution_record" })}
      </Title> */}
      <Tabs>
        <Tabs.TabPane
          key="alerts"
          tab={formatMessage({ id: "alert.rule.detail.title.alert_event" })}
        >
          <MessageRecord ruleID={ruleID} timeRange={state.timeRange} />
        </Tabs.TabPane>
        <Tabs.TabPane
          key="history"
          tab={formatMessage({ id: "alert.rule.detail.title.alert_history" })}
        >
          <RuleRecords
            ruleID={ruleID}
            timeRange={state.timeRange}
            showAertMetric={true}
          />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default (props) => {
  return (
    <QueryParamProvider ReactRouterRoute={Route}>
      <RuleDetail {...props} />
    </QueryParamProvider>
  );
};
