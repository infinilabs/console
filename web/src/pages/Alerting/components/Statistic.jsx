import { Icon } from "antd";
import { PriorityColor } from "../utils/constants";
import { formatMessage } from "umi/locale";
import "./statistic.scss";
import Notification from "@/components/Icons/Notification";
import Mute from "@/components/Icons/Mute";

export default ({ stats = {}, dispatch }) => {
  const keys = ["critical", "high", "medium", "low", "info", "ignored"];
  let total = 0;
  for (let key of keys) {
    total += stats[key] || 0;
  }

  return (
    <div className="alert-statistic">
      <div className="st-item total" style={{ background: total === 0 ? '#00bb1b' : 'rgb(255, 81, 1)'}}>
        <dl>
          <dt className="num" onClick={()=>{dispatch({ type: "status", value: "alerting" })}}>{total}</dt>
          <dd className="text">ALERTING</dd>
        </dl>
      </div>
      <div className="st-item detail">
        <div className="list-w">
          <ul className="d-list">
            <li className="d-item">
              <span className="text">
                <Icon
                  type="alert"
                  theme="filled"
                  style={{ color: PriorityColor["critical"] }}
                />
                <span>
                  {formatMessage({
                    id: "alert.message.priority.critical",
                  })}
                </span>
              </span>
              <span className="num" onClick={()=>{dispatch({ type: "priority", value: "critical" })}}>{stats.critical}</span>
            </li>
            <li className="d-item">
              <span className="text">
                <Icon
                  type="close-circle"
                  theme="filled"
                  style={{ color: PriorityColor["high"] }}
                />
                <span>
                  {formatMessage({
                    id: "alert.message.priority.high",
                  })}
                </span>
              </span>
              <span className="num" onClick={()=>{dispatch({ type: "priority", value: "high" })}}>{stats.high}</span>
            </li>
            <li className="d-item">
              <span className="text">
                <Icon
                  type="warning"
                  theme="filled"
                  style={{ color: PriorityColor["medium"] }}
                />
                <span>
                  {formatMessage({
                    id: "alert.message.priority.medium",
                  })}
                </span>
              </span>
              <span className="num" onClick={()=>{dispatch({ type: "priority", value: "medium" })}}>{stats.medium}</span>
            </li>
          </ul>
        </div>
        <div className="list-w">
          <ul className="d-list mr">
            <li className="d-item">
              <span className="text">
                <Icon
                  component={Notification}
                  theme="filled"
                  style={{ color: PriorityColor["low"] }}
                />
                <span>
                  {formatMessage({
                    id: "alert.message.priority.low",
                  })}
                </span>
              </span>
              <span className="num" onClick={()=>{dispatch({ type: "priority", value: "low" })}}>{stats.low}</span>
            </li>
            <li className="d-item">
              <span className="text">
                <Icon
                  type="info-circle"
                  theme="filled"
                  style={{ color: PriorityColor["info"] }}
                />
                <span>
                  {formatMessage({
                    id: "alert.message.priority.info",
                  })}
                </span>
              </span>
              <span className="num" onClick={()=>{dispatch({ type: "priority", value: "info" })}}>{stats.info}</span>
            </li>
            <li className="d-item">
              <span className="text">
                <Icon
                  component={Mute}
                  theme="filled"
                  style={{ color: PriorityColor["ignored"] }}
                />
                <span>
                  {formatMessage({
                    id: "alert.message.priority.ignored",
                  })}
                </span>
              </span>
              <span className="num" onClick={()=>{dispatch({ type: "status", value: "ignored" })}}>{stats.ignored}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export const PriorityIconText = ({ priority }) => {
  let Com = null;
  let type = "";
  switch (priority) {
    case "critical":
      type = "alert";
      break;
    case "high":
      type = "close-circle";
      break;
    case "medium":
      type = "warning";
      break;
    case "low":
      Com = Notification;
      break;
    case "info":
      type = "info-circle";
      break;
    case "low":
      Com = Mute;
      break;
    default:
      return null;
  }
  return (
    <span className="text">
      <Icon
        type={type}
        theme="filled"
        component={Com}
        style={{ color: PriorityColor[priority], marginRight: 3 }}
      />
      <span>
        {formatMessage({
          id: "alert.message.priority." + priority,
        })}
      </span>
    </span>
  );
};
