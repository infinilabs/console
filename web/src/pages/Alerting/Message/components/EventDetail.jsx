import { Button,message, Divider, Typography, Tabs, Card } from "antd";
import { formatMessage } from "umi/locale";
import { useCallback, useEffect, useMemo, useState } from "react";
import request from "@/utils/request";
import { formatter, getFormatter } from "@/utils/format";
import moment from "moment";
import MessageCard from "./MessageCard";
import RuleRecords from "./RuleRecords";
import RuleRecordChart from "./RuleRecordChart";
import ExpressionCard from "./ExpressionCard";
import EventMessageCard from "./EventMessageCard";
import EventDetailCard from "./EventDetailCard";
import NotificationCard from "./NotificationCard";
import AlertChartCard from "./AlertChartCard";
import { useHistory, useLocation } from "react-router-dom";
import WidgetLoader from "@/pages/DataManagement/View/WidgetLoader";
import DatePicker from "@/common/src/DatePicker";
import { getLocale } from "umi/locale";
import { getTimezone } from "@/utils/utils";
import { JsonParam, QueryParamProvider, useQueryParam } from "use-query-params";
import isEqual from "lodash/isEqual";

const { Title } = Typography;

const MessageDetail = (props) => {
  const messageID = props?.messageID;

  const [param, setParam] = useQueryParam("_g", JsonParam);

  const [messageDetail, setMessageDetail] = useState({});
  const fetchMessageDetail = (id) => {
    const fetchData = async () => {
      const res = await request(`/alerting/message/${id}`, {
        method: "GET",
      });
      if (res) {
        setMessageDetail(res);
        updateTimeRange(res);
      }
    };
    fetchData();
  };


  const [timeRange, setTimeRange] = React.useState({
    min: param?.timeRange?.min || "", // here we must use time range which calculated by event message, do not set default time range
    max: param?.timeRange?.max || "",
    timeFormatter: formatter.dates(1),
  });

  const [refresh, setRefresh] = useState({ isRefreshPaused: true });
  const [timeZone, setTimeZone] = useState(() => getTimezone());
  const syncedTimeRange = useMemo(
    () => ({
      min: timeRange.min,
      max: timeRange.max,
    }),
    [timeRange.max, timeRange.min]
  );

  useEffect(() => {
    if (isEqual(param?.timeRange, syncedTimeRange)) {
      return;
    }
    setParam({ ...param, timeRange: syncedTimeRange });
  }, [param, setParam, syncedTimeRange]);

  const updateTimeRange = (messageDetail) => {
    let startTimestamp = moment(messageDetail.created).valueOf();
    let endTimestamp = moment().valueOf();
    const resolvedAt = messageDetail?.resolve_at;

    if (resolvedAt) {
      endTimestamp = moment(resolvedAt).valueOf();
    } else if (messageDetail?.status == "recovered") {
      endTimestamp = moment(messageDetail.updated).valueOf();
    }
    setTimeRange({
      ...timeRange,
      min: moment(startTimestamp).toISOString(),
      max: moment(endTimestamp).toISOString(),
    });
  }

  const handleTimeChange = ({ start, end }) => {
    setTimeRange({
      ...timeRange,
      min: start,
      max: end,
    });
  };

  useEffect(() => {
    if (messageID) {
      fetchMessageDetail(messageID);
    }
  }, []);
  const history = useHistory();
  const location = useLocation();
  const backTo = location?.state?.from || "/alerting/message";

  return (
    <Card title={messageDetail.title} bordered={false} extra={<Button
      type="primary"
      onClick={() => {
        history.push(backTo);
      }}
    >
      {formatMessage({ id: "form.button.goback" })}
    </Button>}>
      <ExpressionCard ruleID={messageDetail?.rule_id} expression={messageDetail?.expression}/>
      <div style={{marginTop: 15}}></div>
      <EventMessageCard message={messageDetail.message} title={messageDetail.title}/>
      <div style={{marginTop: 15}}></div>
      <div style={{display:"flex", gap: 15}}>
        <div style={{flex: "1 1 50%"}}>
          {messageDetail?.status ? <EventDetailCard msgItem={messageDetail}/>: null}
        </div>
          <Card
            size="small"
            title={formatMessage({ id: "alert.message.detail.title.notification" })}
            style={{flex: "1 1 50%"}}
            bodyStyle={{ height:180, overflowY:"scroll", overflowX:"hidden"}}>
            {messageDetail?.status ? <NotificationCard showTitle msgItem={messageDetail}/>: null}
          </Card>
      </div>
      <div style={{ marginTop: 15, display: "flex", gap: 8 }}>
        <div style={{ flexGrow: 0, minWidth: 400 }}>
          <DatePicker
            locale={getLocale()}
            start={timeRange.min}
            end={timeRange.max}
            onRangeChange={handleTimeChange}
            {...refresh}
            onRefreshChange={setRefresh}
            onRefresh={handleTimeChange}
            timeZone={timeZone}
            onTimeZoneChange={setTimeZone}
            recentlyUsedRangesKey={"rule-detail"}
          />
        </div>
      </div>
      <div style={{marginTop: 15,display:"flex", gap: 15, marginBottom:10}}>
        <div style={{flex: "1 1 50%"}}>
          <AlertChartCard
            msgItem={messageDetail}
            range={{ 
              from: timeRange.min || "now-7d", 
              to: timeRange.max || "now"
            }}
            onRangeChange={({ from, to }) => {
              handleTimeChange({
                start: from,
                end: to,
              });
            }}
          />
        </div>
          <Card
            style={{flex: "1 1 50%"}}
            title={formatMessage({ id: "alert.message.detail.title.alert_history" })}
            size="small"
            bodyStyle={{height: 250, padding:1}}>
            {messageDetail?.rule_id ? <WidgetLoader 
              id="cji1ttq8go5i051pl1t1"
              range={{ 
                from: timeRange.min || "now-7d", 
                to: timeRange.max || "now"
              }}
              queryParams={{
                rule_id: messageDetail?.rule_id,
                resource_id: messageDetail?.resource_id,
                ...(messageDetail?.status === "recovered" ? {} : { state: "alerting" }),
              }}
              onGlobalQueriesChange={(queries = {}) => {
                if (!queries?.range?.from || !queries?.range?.to) {
                  return;
                }
                handleTimeChange({
                  start: queries.range.from,
                  end: queries.range.to,
                });
              }}
            /> : null}
          </Card>
      </div>
      {messageDetail.message_id && <Tabs>
        <Tabs.TabPane tab={formatMessage({ id: "alert.rule.detail.title.alert_history" })} key="alert-history">
          <RuleRecords
            ruleID={messageDetail?.rule_id}
            resourceID={messageDetail?.resource_id}
            resolveEventID={messageDetail?.resolve_event_id}
            messageStatus={messageDetail?.status}
            timeRange={timeRange}
          />
        </Tabs.TabPane>
      </Tabs>
  }
    </Card>
  );
};

export default MessageDetail;
