import { Tag, Tooltip, Icon } from "antd";
import { MessageStautsColor } from "../../utils/constants";
import { formatUtcTimeToLocal, firstUpperCase } from "@/utils/utils";

export default ({ record }) => {
  const text = record.status;
  const title = (
    <div style={{ fontSize: 12, lineHeight: "22px" }}>
      <span>Ignored time: {formatUtcTimeToLocal(record.ignored_time)}</span>
      <br />
      <span>Operator: {record.ignored_user}</span>
      <br />
      <p>Message: {record.ignored_reason}</p>
    </div>
  );
  return (
    <div>
      <Tag style={{ backgroundColor: MessageStautsColor[text], color: "#fff" }}>
        {firstUpperCase(text)}
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
