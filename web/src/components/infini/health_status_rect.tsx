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
  // 扩展状态
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

export const HealthStatusRect = ({ status }: props) => {
  const color = convertStatusToColor(status);
  return (
    <div
      style={{
        background: color,
        height: 16,
        width: 5,
        display: "inline-block",
      }}
    ></div>
  );
};
