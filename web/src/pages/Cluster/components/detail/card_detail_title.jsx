import { HealthStatusView } from "@/components/infini/health_status_view";

export const CardDetailTitle = (props) => {
  const labels = props.labels || [];
  const status = props.status || "";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ borderLeft: "3px solid #1890ff" }}>
        {labels.map((item, i) => {
          if (!item) {
            return "";
          }
          return (
            <span key={i}>
              <span style={{ padding: "0 5px" }}>{item}</span>{" "}
              {i < labels.length - 1 ? "/" : ""}
            </span>
          );
        })}
      </div>
      {status ? (
        <div style={{ paddingRight: 120 }}>
          <HealthStatusView status={status} />
        </div>
      ) : (
        ""
      )}
    </div>
  );
};
