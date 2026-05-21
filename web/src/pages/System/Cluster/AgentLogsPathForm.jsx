import React from "react";
import { Form, Select } from "antd";
import { formatMessage } from "umi/locale";

export default ({ form, initialValue, visible = true }) => {
  if (!visible) {
    return null;
  }

  const { getFieldDecorator } = form;

  return (
    <Form.Item
      label={formatMessage({
        id: "cluster.manage.agent_logs_paths.label",
      })}
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
      <div style={{ marginTop: 8, color: "rgba(130,129,136,1)", lineHeight: "20px" }}>
        {formatMessage({
          id: "cluster.manage.agent_logs_paths.tips",
        })}
      </div>
    </Form.Item>
  );
};
