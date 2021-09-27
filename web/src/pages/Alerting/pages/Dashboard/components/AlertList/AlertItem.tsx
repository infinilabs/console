import {List, Icon} from 'antd';
import './alertitem.scss';
import moment from 'moment';

type TimeValue = number | null;

interface ActionExecutionResult {
  action_id: string;
  last_execution_time: TimeValue,
  result?: string;
}

export interface AlertRecord {
  acknowledged_time: TimeValue,
  action_execution_results?: ActionExecutionResult[];
  cluster_id: string;
  end_time: TimeValue;
  error_message: string;
  id: string;
  last_notification_time: TimeValue;
  monitor_id: string;
  monitor_name: string;
  severity: string;
  start_time: TimeValue;
  state: string;
  trigger_id: string; 
  trigger_name: string;
}

interface AlertItemProps {
  item: AlertRecord;
  onClick: (item: AlertRecord)=>void
}

export const AlertItem = ({
  item,
  onClick
}: AlertItemProps)=>{
  return (
    <List.Item
      onClick={()=>{onClick(item)}}
      key={item.id}
      className="alert"
      >
        <div className="wrapper">
          <div className={"status" + ` ${item.state}`}>
            <div>{item.severity}</div>
          </div>
          <div className="content">{item.monitor_name+":"+item.trigger_name}</div>
          <div className="right">
            <div className="time">{moment(item.start_time).fromNow()}</div>
            <div className="arrow">
              <Icon type="right"/>
            </div>
          </div>
        </div>
    </List.Item>
  )
}

