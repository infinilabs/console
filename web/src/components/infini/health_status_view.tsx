import { HealthStatusCircle } from "@/components/infini/health_status_circle";

export const HealthStatusView = ({ status, label }: props) => {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <HealthStatusCircle status={status} />
      <span style={{ textTransform: "capitalize" }}>
        {label || status || "N/A"}
      </span>
    </span>
  );
};
