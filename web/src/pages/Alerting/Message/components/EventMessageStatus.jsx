import { Tag, Tooltip, Icon } from "antd";
import { MessageStautsColor } from "../../utils/constants";
import { formatUtcTimeToLocal } from "@/utils/utils";
import { formatMessage } from "umi/locale";

export default ({ record }) => {
  const text = record.status;
  const statusLabel = formatMessage({
    id: `alert.message.status.${text}`,
    defaultMessage: text,
  });
  const title = (
    <div style={{ fontSize: 12, lineHeight: "22px" }}>
      <span>
        {formatMessage({ id: "alert.message.ignored.time" })}:{" "}
        {formatUtcTimeToLocal(record.ignored_time)}
      </span>
      <br />
      <span>
        {formatMessage({ id: "alert.message.ignored.operator" })}:{" "}
        {record.ignored_user}
      </span>
      <br />
      <p>
        {formatMessage({ id: "alert.message.ignored.reason" })}:{" "}
        {record.ignored_reason}
      </p>
    </div>
  );
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        whiteSpace: "nowrap",
      }}
    >
      <Tag style={{ backgroundColor: MessageStautsColor[text], color: "#fff" }}>
        {statusLabel}
      </Tag>
      {text === "ignored" ? (
        <Tooltip title={title}>
          <Icon
            type="info-circle"
            style={{ color: MessageStautsColor[text] }}
            theme="filled"
          />
        </Tooltip>
      ) : null}
    </div>
  );
};
