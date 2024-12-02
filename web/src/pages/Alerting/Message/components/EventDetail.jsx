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
import { useHistory } from "react-router-dom";
import WidgetLoader from "@/pages/DataManagement/View/WidgetLoader";
import DatePicker from "@/common/src/DatePicker";
import { getLocale } from "umi/locale";
import { getTimezone } from "@/utils/utils";
import { JsonParam, QueryParamProvider, useQueryParam } from "use-query-params";

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
    min: param?.timeRange?.min || "now-7d",
    max: param?.timeRange?.max || "now",
    timeFormatter: formatter.dates(1),
  });

  const [refresh, setRefresh] = useState({ isRefreshPaused: true });
  const [timeZone, setTimeZone] = useState(() => getTimezone());

  useMemo(() => {
    setParam({ ...param, timeRange: timeRange });
  }, [timeRange]);

  const updateTimeRange = (messageDetail) => {
    let startTimestamp = moment(messageDetail.created).valueOf();
    let endTimestamp = moment().valueOf();

    if (messageDetail?.status == "recovered") {
      endTimestamp = moment(messageDetail.updated).valueOf();
    }
    setTimeRange({
      ...timeRange,
      min: moment(startTimestamp).format(),
      max: moment(endTimestamp).format("YYYY-MM-DDTHH:mm:ss.SSS"),
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

  return (
    <Card title={messageDetail.title} bordered={false} extra={<Button
      type="primary"
      onClick={() => {
        history.goBack();
      }}
    >
      {formatMessage({ id: "form.button.goback" })}
    </Button>}>
      <ExpressionCard ruleID={messageDetail?.rule_id} expression={messageDetail?.expression}/>
      <div style={{marginTop: 15}}></div>
      <EventMessageCard message={messageDetail.message}/>
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
        <Button
          onClick={() => {
            handleTimeChange({
              start: timeRange.min,
              end: timeRange.max,
            });
          }}
          icon={"reload"}
          type="primary"
        >
          {formatMessage({ id: "form.button.refresh" })}
        </Button>
      </div>
      <div style={{marginTop: 15,display:"flex", gap: 15, marginBottom:10}}>
        <div style={{flex: "1 1 50%"}}>
          <AlertChartCard
            msgItem={messageDetail}
            range={{ 
              from: timeRange.min || "now-7d", 
              to: timeRange.max || "now"
            }}/>
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
              queryParams={{state:"alerting", rule_id: messageDetail?.rule_id}}
            /> : null}
          </Card>
      </div>
      <Tabs>
        <Tabs.TabPane tab={formatMessage({ id: "alert.rule.detail.title.alert_history" })}>
          <RuleRecords ruleID={messageDetail?.rule_id} timeRange={timeRange} />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  );
};

export default MessageDetail;
