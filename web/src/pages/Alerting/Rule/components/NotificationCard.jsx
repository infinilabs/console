import Dingding, { DingdingWithColor } from '@/components/Icons/Dingding';
import Discord from '@/components/Icons/Discord';
import Email, { EmailWithColor } from '@/components/Icons/Email';
import Feishu, { FeishuWithColor } from '@/components/Icons/Feishu';
import {WechatWithColor} from '@/components/Icons/Wechat';
import useFetch from '@/lib/hooks/use_fetch';
import { Timeline, Icon, Card, Badge, Skeleton } from 'antd';
import HornVibration from '@/components/Icons/HornVibration';
import LowerVolume from '@/components/Icons/LowerVolume';
import { formatUtcTimeToLocal } from '@/utils/utils';
import Slack, { SlackWithColor } from '@/components/Icons/Slack';
import moment from 'moment';
import DiscordWithColor from '@/components/Icons/DiscordWithColor';
import { formatMessage } from "umi/locale";

export default ({notificationConfig, recoverNotificationConfig})=>{
  return (
  <Timeline>
    <Timeline.Item dot={<Icon  type="alert"  theme="filled"/>} color="red">
      <div>
        <span style={{color:"rgb(102, 102, 102)", fontWeight:700, lineHeight:"24px"}}>
          {formatMessage({
              id: "alert.rule.form.title.configure_alert_channel",
            })}
          </span>
        <div style={{display:"flex", gap:"3em", color:"rgb(102, 102, 102)", lineHeight:"24px"}}>
          <div>{formatMessage({ id: "alert.rule.form.label.accept_period" })}: {notificationConfig?.accept_time_range?.start}~{notificationConfig?.accept_time_range?.end}</div>
          <div>{formatMessage({ id: "alert.rule.form.label.silent_period" })}: {notificationConfig?.throttle_period}</div>
        </div>
        <div style={{marginTop:10}}>
          <Timeline>
            <Timeline.Item dot={<Icon component={LowerVolume} theme="filled" style={{color: notificationConfig?.enabled === true ? "rgb(0, 127, 255)": "rgb(187, 187, 187)"}}/>}>
              <span style={{color:"rgba(51,51,51,1)", fontWeight:400, lineHeight:"24px"}}>{formatMessage({id:"alert.rule.lable.alerting_channels"})}</span>
              <div>
                {(notificationConfig?.normal || []).map((item)=>{
                  const color = item.enabled === true ? '': "rgb(187, 187, 187)";
                  return  <div style={{marginTop:5}} title={item.enabled === false ? "channel is not enabled": ""}>
                  <Icon component={getChannelIcon(item.type, color)} style={{color:color}}/>
                  <span style={{color:"rgba(153,153,153,1)",lineHeight:"20px", marginRight:10}}>{item.name}</span>
                </div>
                })}
              </div>
            </Timeline.Item>
            {notificationConfig?.escalation ? <Timeline.Item dot={<Icon component={HornVibration} theme="filled" style={{color: notificationConfig?.escalation_enabled === true ? "rgb(0, 127, 255)": "rgb(187, 187, 187)"}}/>}>
              <span style={{color:"rgba(51,51,51,1)", fontWeight:400, lineHeight:"24px"}}>{formatMessage({id:"alert.rule.lable.escalation_channels"})}</span>
              {notificationConfig?.escalation_throttle_period ? <span style={{color:"rgba(0,127,255,1)", fontSize:12, background:"rgba(173, 173, 173, 0.15)", padding:"0 5px", marginLeft: 10}}>{formatMessage({id:"alert.rule.label.wait_time"})}: {notificationConfig?.escalation_throttle_period}</span>: null}
              <div>
              {(notificationConfig?.escalation || []).map((item)=>{
                  const color = item.enabled === true ? '': "rgb(187, 187, 187)";
                  return  <div style={{marginTop:5}} title={item.enabled === false ? "channel is not enabled": ""}>
                  <Icon component={getChannelIcon(item.type, color)} style={{color:color}}/>
                  <span style={{color:"rgba(153,153,153,1)",lineHeight:"20px", marginRight:10}}>{item.name}</span>
                </div>
                })}
              </div>
            </Timeline.Item>: null}
          </Timeline>
        </div>
      </div>
    </Timeline.Item>
    <Timeline.Item dot={<Icon type="check-circle" theme="filled" style={{color:"rgb(152, 205, 116)"}}/>}>
      <div>
        <span style={{color:"rgb(102, 102, 102)", fontWeight:700, lineHeight:"24px"}}>{formatMessage({
              id: "alert.rule.form.title.configure_alert_channel_recovery",
            })}</span>
      </div>
      <div style={{marginTop:10}}>
          {recoverNotificationConfig?.normal ? <Timeline>
            <Timeline.Item dot={<Icon component={LowerVolume} theme="filled" style={{color: recoverNotificationConfig?.enabled === true ? "rgb(0, 127, 255)": "rgb(187, 187, 187)"}}/>}>
              <span style={{color:"rgba(51,51,51,1)", fontWeight:400, lineHeight:"24px"}}>{formatMessage({id:"alert.rule.lable.recovery_channels"})}</span>
              <div>
              {(recoverNotificationConfig?.normal || []).map((item)=>{
                const color = item.enabled === true ? '': "rgb(187, 187, 187)";
                return  <div style={{marginTop:5}} title={item.enabled === false ? "channel is not enabled": ""}>
                <Icon component={getChannelIcon(item.type, color)} style={{color:color}}/>
                <span style={{color:"rgba(153,153,153,1)",lineHeight:"20px", marginRight:10}}>{item.name}</span>
              </div>
              })}
              </div>
            </Timeline.Item>
          </Timeline>: null}
        </div>
    </Timeline.Item>
  </Timeline>
  )
}

const getChannelIcon = (typ, color) => {
  switch(typ){
    case "email":
      return EmailWithColor({color});
    case "wechat":
      return WechatWithColor({color});
    case "dingtalk":
      return DingdingWithColor({color});
    case "feishu":
      return FeishuWithColor({color});
    case "slack":
      return color? SlackWithColor({color}): Slack;
    case "discord":
      if(!color){
        return DiscordWithColor;
      }
      return Discord;
  }
  return Slack;
}