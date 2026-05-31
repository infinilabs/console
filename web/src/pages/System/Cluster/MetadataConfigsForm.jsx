import { Form, Input, InputNumber, Icon, Switch } from "antd";
import { formatMessage } from "umi/locale";

const InputGroup = Input.Group;

const configs = [
  "health_check",
  "node_availability_check",
  "metadata_refresh",
  "cluster_settings_check",
];

const MetadataConfigsForm = (props) => {
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
    <>
      {configs.map((item, i) => {
        return (
          <Form.Item
            key={i}
            label={formatMessage({
              id: `cluster.manage.metadata_configs.${item}`,
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
                {getFieldDecorator(`metadata_configs.${item}.enabled`, {
                  valuePropName: "checked",
                  initialValue:
                    editValue?.metadata_configs?.[item]?.enabled ?? true,
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
                {getFieldDecorator(`metadata_configs.${item}.interval`, {
                  initialValue: getIntervalInitialValue(
                    editValue?.metadata_configs?.[item]?.interval
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
    </>
  );
};

export default MetadataConfigsForm;
