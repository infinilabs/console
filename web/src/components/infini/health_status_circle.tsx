import { Icon } from "antd";
import * as Color from "@/components/infini/color";

export type ClusterHealthStatus =
  | "green"
  | "yellow"
  | "red"
  | "available"
  | "unavailable"
  | "online"
  | "offline";

const statusColorMap: Record<string, string> = {
  green: Color.GREEN,
  yellow: Color.YELLOW,
  red: Color.RED,
  available: Color.GREEN,
  unavailable: Color.UNAVAILABLE,
  online: Color.GREEN,
  offline: Color.UNAVAILABLE,
  //扩展状态
  active: Color.YELLOW,
  normal: Color.GREEN,
  acknowledged: Color.GREEN,
  error: Color.RED,
  gray: Color.GREY,
};

export function convertStatusToColor(status: ClusterHealthStatus) {
  return statusColorMap[status];
}

interface props {
  status: ClusterHealthStatus;
  size?: number;
}

export const HealthStatusCircle = ({ status, size = 14 }: props) => {
  if (status == "unavailable" || !statusColorMap[status]) {
    return (
      <span>
        <Icon
          type="close-circle"
          style={{
            fontSize: 14,
            color: Color.UNAVAILABLE,
            // boxShadow: "0px 0px 5px #555",
          }}
        />
      </span>
    );
  }
  const color = convertStatusToColor(status);
  return (
    <div
      style={{
        background: color,
        height: size,
        width: size,
        borderRadius: size,
        // boxShadow: "0px 0px 5px #999",
        display: "inline-block",
        verticalAlign: "text-bottom",
      }}
    ></div>
  );
};
