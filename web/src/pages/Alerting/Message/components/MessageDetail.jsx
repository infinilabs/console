import { Button,message, Divider, Typography, Tabs,Card } from "antd";
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

const { Title } = Typography;

const MessageDetail = (props) => {
  const messageID = props?.messageID;

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
    min: "",
    max: "",
    timeFormatter: formatter.dates(1),
  });

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

  useEffect(() => {
    if (messageID) {
      fetchMessageDetail(messageID);
    }
  }, []);

  return (
    <div>
      {/* <MessageCard data={messageDetail} /> */}
      <ExpressionCard ruleID={messageDetail?.rule_id} expression={messageDetail?.expression}/>
      <div style={{marginTop: 15}}></div>
      <EventMessageCard message={messageDetail.message}/>
      <div style={{marginTop: 15}}></div>
      <Tabs defaultActiveKey="summary">
        <Tabs.TabPane tab={formatMessage({ id: "alert.message.detail.title.summary" })} key="summary">
          {messageDetail?.status ? <EventDetailCard msgItem={messageDetail}/>: null}
          <div style={{marginTop: 15}}>
            {<AlertChartCard msgItem={messageDetail}/>}
          </div>
        </Tabs.TabPane>
        <Tabs.TabPane tab={formatMessage({ id: "alert.message.detail.title.notification" })} key="notification">
        <Card size='small'>
          {messageDetail?.status ? <NotificationCard msgItem={messageDetail}/>: null}
        </Card>
        </Tabs.TabPane>
      </Tabs>
      {/* <Title level={4} style={{ marginTop: 20 }}>{formatMessage({id:"alert.message.detail.alert_metric_status"})}</Title>
      <RuleRecordChart data={messageDetail} />
      <Title level={4} style={{ marginTop: 20 }}>{formatMessage({id:"alert.message.detail.execution_record"})}</Title>
      <RuleRecords ruleID={messageDetail?.rule_id} timeRange={timeRange} /> */}
    </div>
  );
};

export default MessageDetail;
