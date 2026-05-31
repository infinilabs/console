import { Form, Input, InputNumber, Icon, Switch } from "antd";
import { formatMessage } from "umi/locale";

const InputGroup = Input.Group;

const configs = [
  { key: "cluster_health", enabled: true },
  { key: "cluster_stats", enabled: true },
  { key: "node_stats", enabled: true },
  { key: "index_stats", enabled: true },
];

const MonitorConfigsForm = (props) => {
  const editValue = props.editValue;
  const { getFieldDecorator } = props.form;
  const enabledLabel = formatMessage({
    id: "cluster.manage.config_item.enabled",
  });
  const intervalLabel = formatMessage({
    id: "cluster.manage.config_item.interval",
  });
  const intervalUnit = formatMessage({
    id: "cluster.manage.config_item.interval.unit",
  });

  const getIntervalInitialValue = (value) => {
    const normalized = `${value || ""}`.replace(/[^\d]/g, "");
    return normalized ? Number(normalized) : 10;
  };

  return (
    <div
      style={{
        borderTop: "1px solid #e8e8e8",
        borderBottom: "1px solid #e8e8e8",
        marginBottom: 10,
        paddingTop: 10,
        display: props.visible ? "block" : "none",
      }}
    >
      {configs.filter((item) => {
          if (props.collectMode !== "agent") return true;
          return !["node_stats", "index_stats"].includes(item.key);
        }).map((item) => {
        return (
          <Form.Item
            key={item.key}
            label={formatMessage({
              id: `cluster.manage.monitor_configs.${item.key}`,
            })}
          >
            <InputGroup compact>
              <Form.Item>
                <span
                  style={{
                    width: 120,
                    textAlign: "right",
                    paddingLeft: 20,
                    paddingRight: 10,
                  }}
                >
                  {enabledLabel}
                </span>
                {getFieldDecorator(`monitor_configs.${item.key}.enabled`, {
                  valuePropName: "checked",
                  initialValue:
                    editValue?.monitor_configs?.[item.key]?.enabled ??
                    item.enabled,
                })(
                  <Switch
                    checkedChildren={<Icon type="check" />}
                    unCheckedChildren={<Icon type="close" />}
                  />
                )}
              </Form.Item>
              <Form.Item>
                <span
                  style={{
                    width: 120,
                    textAlign: "right",

                    paddingLeft: 20,
                    paddingRight: 10,
                  }}
                >
                  {intervalLabel}
                </span>
                {getFieldDecorator(`monitor_configs.${item.key}.interval`, {
                  initialValue: getIntervalInitialValue(
                    editValue?.monitor_configs?.[item.key]?.interval
                  ),
                  rules: [],
                })(
                  <InputNumber
                    min={10}
                    max={3600}
                    step={10}
                    formatter={(value) => `${value}${intervalUnit}`}
                    parser={(value) => `${value || ""}`.replace(/[^\d]/g, "")}
                  />
                )}
              </Form.Item>
            </InputGroup>
          </Form.Item>
        );
      })}
    </div>
  );
};

export default MonitorConfigsForm;
