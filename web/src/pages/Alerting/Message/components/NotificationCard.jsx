import Dingding from '@/components/Icons/Dingding';
import Discord from '@/components/Icons/Discord';
import Email from '@/components/Icons/Email';
import Feishu from '@/components/Icons/Feishu';
import Wechat from '@/components/Icons/Wechat';
import useFetch from '@/lib/hooks/use_fetch';
import { Timeline, Icon, Card, Badge, Skeleton, Tooltip } from 'antd';
import HornVibration from '@/components/Icons/HornVibration';
import LowerVolume from '@/components/Icons/LowerVolume';
import { formatUtcTimeToLocal } from '@/utils/utils';
import Slack from '@/components/Icons/Slack';
import moment from 'moment';
import { formatMessage } from "umi/locale";
import "./notification.scss";

export default ({msgItem})=>{
 const {value, loading, error} = useFetch(`/alerting/message/${msgItem?.message_id}/notification`, [msgItem?.message_id])
  const normalStats = value?.alerting?.normal_stats || [];
  const escalationStats = value?.alerting?.escalation_stats || [];
  const lastTime = normalStats[0]?.last_time;
  const lastEscalationTime = escalationStats[0]?.last_time;
  let willSend =  null;
  if(msgItem.status === "alerting" && value?.alerting?.escalation_enabled === true){
    if(lastEscalationTime){
      const tp = moment.duration("PT" + value?.alerting?.throttle_period?.toUpperCase());
      willSend = moment(lastEscalationTime).add(tp);
    }else{
      const tp = moment.duration("PT" + value?.alerting?.escalation_throttle_period?.toUpperCase());
      willSend = moment(msgItem.created).add(tp);
    }
  }
  const recoverStats = value?.recovery?.stats || [];
  const recoveryTime = recoverStats[0]?.last_time;
 
  return (
   <Skeleton loading={loading}>
  <Timeline>
    <Timeline.Item dot={<Icon  type="alert"  theme="filled"/>} color="red">
      <div>
        <span style={{color:"rgb(102, 102, 102)", fontWeight:700, lineHeight:"24px"}}>{formatMessage({
              id: "alert.rule.form.title.configure_alert_channel",
            })}</span>
        <div style={{display:"flex", gap:"3em", color:"rgb(102, 102, 102)", lineHeight:"24px"}}>
          <div>{formatMessage({ id: "alert.rule.form.label.accept_period" })}: {value?.alerting?.accept_time_range?.start}~{value?.alerting?.accept_time_range?.end}</div>
          <div>{formatMessage({ id: "alert.rule.form.label.silent_period" })}: {value?.alerting?.throttle_period}</div>
        </div>
        <div style={{marginTop:10}}>
          <Timeline>
            <Timeline.Item dot={<Icon component={LowerVolume} theme="filled" style={{color: "rgb(16, 16, 16)"}}/>}>
              <span style={{color:"rgba(51,51,51,1)", fontWeight:400, lineHeight:"24px"}}>{formatMessage({id:"alert.rule.lable.alerting_channels"})}</span>
              <div style={{color:"rgba(153,153,153,1)", lineHeight:"20px"}}>Sent on: {formatUtcTimeToLocal(lastTime)}</div>
              <div>
                {normalStats.map((item)=>{
                  return  <div style={{marginTop:5}}>
                  <Icon component={getChannelIcon(item.channel_type)}/>
                  <span style={{color:"rgba(153,153,153,1)",lineHeight:"20px", marginRight:10}}>{item.channel_name}</span>
                  <Badge count={item.count}/>
                  {item.error? <Tooltip title={item.error}><Icon style={{marginLeft:5, color:"#FFB449"}}  theme="filled" type="warning"/></Tooltip> :null}
                </div>
                })}
              </div>
            </Timeline.Item>
            <Timeline.Item dot={<Icon component={HornVibration} theme="filled" style={{color: "rgb(16, 16, 16)"}}/>}>
              <span style={{color:"rgba(51,51,51,1)", fontWeight:400, lineHeight:"24px"}}>{formatMessage({id:"alert.rule.lable.escalation_channels"})}</span>
              {value?.alerting?.escalation_throttle_period ? <span style={{color:"rgba(0,127,255,1)", fontSize:12, background:"rgba(173, 173, 173, 0.15)", padding:"0 5px", marginLeft: 10}}>{formatMessage({id:"alert.rule.label.wait_time"})}: {value?.alerting?.escalation_throttle_period}</span>: null}
              {willSend ? <div  style={{color:"rgba(153,153,153,1)", lineHeight:"20px"}}>It will be sent at：{formatUtcTimeToLocal(willSend)}</div>: null}
              <div>
                {escalationStats.map((item)=>{
                  return  <div style={{marginTop:5}}>
                  <Icon component={getChannelIcon(item.channel_type)}/>
                  <span style={{color:"rgba(153,153,153,1)",lineHeight:"20px", marginRight:10}}>{item.channel_name}</span>
                  <Badge count={item.count}/>
                </div>
                })}
              </div>
            </Timeline.Item>
          </Timeline>
        </div>
      </div>
    </Timeline.Item>
    <Timeline.Item dot={<Icon type="check-circle" theme="filled" style={{color: msgItem.status === "recovered" ? "rgb(152, 205, 116)":"rgb(153, 153, 153)"}}/>}>
      <div>
        <span style={{color:"rgb(102, 102, 102)", fontWeight:700, lineHeight:"24px"}}>{formatMessage({
              id: "alert.rule.form.title.configure_alert_channel_recovery",
            })}</span>
      </div>
      <div style={{marginTop:10}}>
          <Timeline>
            <Timeline.Item dot={<Icon component={LowerVolume} theme="filled" style={{color: "rgb(16, 16, 16)"}}/>}>
              <span style={{color:"rgba(51,51,51,1)", fontWeight:400, lineHeight:"24px"}}>{formatMessage({id:"alert.rule.lable.recovery_channels"})}</span>
              {recoveryTime ? <div style={{color:"rgba(153,153,153,1)", lineHeight:"20px"}}>Sent on: {formatUtcTimeToLocal(recoveryTime)}</div>: null}
              <div>
              {recoverStats.map((item)=>{
                return  <div style={{marginTop:5}}>
                <Icon component={getChannelIcon(item.channel_type)}/>
                <span style={{color:"rgba(153,153,153,1)",lineHeight:"20px", marginRight:10}}>{item.channel_name}</span>
              </div>
              })}
              </div>
            </Timeline.Item>
          </Timeline>
        </div>
    </Timeline.Item>
  </Timeline>
  </Skeleton> 
  )
}

const getChannelIcon = (typ) => {
  switch(typ){
    case "email":
      return Email;
    case "wechat":
      return Wechat;
    case "dingtalk":
      return Dingding;
    case "feishu":
      return Feishu;
    case "slack":
      return Slack;
    case "discord":
      return Discord;
  }
  return Slack;
}