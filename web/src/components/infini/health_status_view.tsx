import { HealthStatusCircle } from "@/components/infini/health_status_circle";
import { formatMessage } from "umi/locale";

const getStatusLabel = (status?: string, label?: string) => {
  if (label) {
    return label;
  }
  if (!status) {
    return "N/A";
  }

  switch (String(status).toLowerCase()) {
    case "available":
      return formatMessage({ id: "overview.status.available" });
    case "unavailable":
      return formatMessage({ id: "overview.status.unavailable" });
    default:
      return status;
  }
};

export const HealthStatusView = ({ status, label }: props) => {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <HealthStatusCircle status={status} />
      <span style={{ textTransform: "capitalize" }}>
        {getStatusLabel(status, label)}
      </span>
    </span>
  );
};
