import React from "react";
import { Form, Select, Tooltip, Icon } from "antd";
import { formatMessage } from "umi/locale";

export default ({ form, initialValue, visible = true }) => {
  if (!visible) {
    return null;
  }

  const { getFieldDecorator } = form;

  return (
    <Form.Item
      label={
        <span>
          {formatMessage({
            id: "cluster.manage.agent_logs_paths.label",
          })}
          <Tooltip
            title={formatMessage({
              id: "cluster.manage.agent_logs_paths.tips",
            })}
          >
            <Icon
              type="info-circle"
              style={{ marginLeft: 8, color: "#1890ff" }}
            />
          </Tooltip>
        </span>
      }
    >
      {getFieldDecorator("agent_logs_paths", {
        initialValue: initialValue?.agent_logs_paths || [],
      })(
        <Select
          mode="tags"
          style={{ width: "100%" }}
          tokenSeparators={[","]}
          placeholder={formatMessage({
            id: "cluster.manage.agent_logs_paths.placeholder",
          })}
        />
      )}
    </Form.Item>
  );
};
