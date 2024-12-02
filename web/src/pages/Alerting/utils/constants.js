import { Icon } from "antd";
import Notification from "@/components/Icons/Notification";
import Mute from "@/components/Icons/Mute";

export const PriorityColor = {
  critical: "#C91010",
  high: "rgb(255, 81, 0)",
  medium: "#FFB449",
  low: "rgb(0, 127, 255)",
  info: "rgb(0, 196, 52)",
  ignored: "rgb(187, 187, 187)",
};

export const MessageStautsColor = {
  alerting: "rgb(255, 81, 1)",
  ignored: "rgb(187, 187, 187)",
  recovered: "rgb(152, 205, 116)",
  ok: "rgb(0, 187, 27)",
  error: "#C91010",
  nodata: "gray",
};

export const RuleStautsColor = {
  alerting: "red",
  error: "error",
  ok: "green",
  nodata: "gray",
};

export const PriorityToIconType = {
  critical: () => (
    <Icon
      type="alert"
      theme="filled"
      style={{ color: PriorityColor["critical"] }}
    />
  ),
  high: () => (
    <Icon
      type="close-circle"
      theme="filled"
      style={{ color: PriorityColor["high"] }}
    />
  ),
  medium: () => (
    <Icon
      type="warning"
      theme="filled"
      style={{ color: PriorityColor["warning"] }}
    />
  ),
  low: () => (
    <Icon
      theme="filled"
      component={Notification}
      style={{ color: PriorityColor["low"] }}
    />
  ),
  info: () => (
    <Icon
      type="info-circle"
      theme="filled"
      style={{ color: PriorityColor["info"] }}
    />
  ),
  ignored: () => (
    <Icon
      component={Mute}
      theme="filled"
      style={{ color: PriorityColor["ignored"] }}
    />
  ),
};
