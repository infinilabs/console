import { Modal, Form, Radio } from "antd";
import { useEffect, useState } from "react";
import { formatMessage } from "umi/locale";
import { useGlobal } from "@/layouts/GlobalContext";
import styles from "./CollectMode.less";

export default (props) => {
  const { clusterStatus } = useGlobal();
  const { editValue, form, onChange} = props;
  const { getFieldDecorator } = form;

  const [mode, setMode] = useState(
    editValue?.metric_collection_mode || "agentless"
  );

  useEffect(() => {
    const monitor_configs = form.getFieldValue("monitor_configs");
    if (mode === "agent") {
      monitor_configs["node_stats"] = { enabled: false };
      monitor_configs["index_stats"] = { enabled: false };
    }else {
      monitor_configs["node_stats"] = { enabled: true };
      monitor_configs["index_stats"] = { enabled: true };
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
              const value = e.target.value;
              const isAgentless = value === "agentless";
              const clusterID = editValue?.id;
              const number_of_nodes = clusterStatus?.[clusterID]?.health?.number_of_nodes || 0;
              const isLargeCluster = number_of_nodes >= 10;
              Modal.confirm({
                title: formatMessage({ id: "cluster.manage.metric_collection_mode.confirm.title" }),
                content: (
                  <>
                    <div>
                      {formatMessage({id: "cluster.manage.metric_collection_mode.confirm.message"}, { mode: value === "agent" ? "Agent" : "Agentless" })}
                    </div>
                    {isAgentless && isLargeCluster && (
                      <div style={{ marginTop: 10, color: "red",fontWeight: "bold" }}>
                        {formatMessage({id: "cluster.manage.metric_collection_mode.warning.large_cluster"}, { number_of_nodes })}
                      </div>
                    )}
                  </>
                ),
                okText: formatMessage({ id: "cluster.manage.metric_collection_mode.confirm.button.ok"}),
                cancelText: formatMessage({ id: "cluster.manage.metric_collection_mode.confirm.button.cancel"}),
                okType: isAgentless && isLargeCluster ? "danger" : "primary",
                onOk() {
                  setMode(value);
                  onChange(value);
                },
                onCancel() {
                  form.setFieldsValue({"metric_collection_mode": mode})
                },
              });
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