import { Form, Radio } from "antd";
import { useEffect, useState } from "react";
import { formatMessage } from "umi/locale";
import styles from "./CollectMode.less";

export default (props) => {
  const { editValue, form, onChange } = props;
  const { getFieldDecorator } = form;

  const [mode, setMode] = useState(
    editValue?.metric_collection_mode || "agentless"
  );

  useEffect(() => {
    const monitor_configs = form.getFieldValue("monitor_configs");
    if (mode === "agent") {
      monitor_configs["node_stats"] = { enabled: false };
      monitor_configs["index_stats"] = { enabled: false };
    }
    form.setFieldsValue({ monitor_configs });
  }, [mode]);

  return (
    <>
      <Form.Item
        label={formatMessage({ id: "cluster.manage.metric_collection_mode" })}
      >
        {getFieldDecorator(`metric_collection_mode`, {
          initialValue: mode,
        })(
          <Radio.Group
            className={styles.mode}
            onChange={(e) => {
              setMode(e.target.value)
              onChange(e.target.value)
            }}
          >
            <Radio.Button value="agentless">Agentless</Radio.Button>
            <Radio.Button value="agent">Agent</Radio.Button>
          </Radio.Group>
        )}
      </Form.Item>
    </>
  );
};