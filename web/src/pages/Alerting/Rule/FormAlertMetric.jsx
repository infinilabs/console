import {
  Form,
  InputNumber,
  Input,
  Select,
  Button,
  Divider,
  Icon,
  Row,
  Col,
} from "antd";
import { FunctionOutlined } from "@ant-design/icons";
import { useCallback, useMemo, useState } from "react";
import "./form.scss";
import { formatMessage } from "umi/locale";

const { Option } = Select;
const { TextArea } = Input;
const InputGroup = Input.Group;

const FormAlertMetric = (props) => {
  const { funcs = [], showFormatType = true } = props;
  const { getFieldDecorator } = props.form;
  const alertObjectIndex = props.alertObjectIndex || 0;
  const metrics = props.metrics || {};
  const [metricItems, setMetricItems] = useState(metrics?.items || [{}]);
  let defaultShowFormula = React.useMemo(() => {
    if (metrics?.formula) {
      return true;
    }
    if (metricItems.length > 1) {
      return true;
    }
    return false;
  }, [metricItems]);
  const [showFormula, setShowFormula] = useState(defaultShowFormula);

  const [fieldsType, setFieldsType] = useState({});
  const getFunctions = (type) => {
    if (type == "string") {
      return ["count",  "cardinality",];
    }
    return [
      "count",
      "cardinality",
      "avg",
      "max",
      "min",
      "sum",
      "medium",
      "derivative",
      "p99",
      "p95",
      "p90",
      "p80",
      "p50",
    ].concat(funcs);
  };

  const addButton = (
    <Button
      type="primary"
      icon="plus"
      onClick={() => {
        if (metricItems.length >= 5) {
          return;
        }
        setMetricItems([...metricItems, {}]);
        if (metricItems.length > 0 && !showFormula) {
          setShowFormula(true);
        }
      }}
      size="small"
      style={{ marginLeft: metricItems.length === 0 ? 0 : 10 }}
      disabled={metricItems.length >= 5 ? true : false}
    >
      {formatMessage({
        id:
          "alert.rule.form.label.alert_metric.button.add_metric",
      })}
    </Button>
  )

  return (
    <div className="group-wrapper">

      { metricItems.length === 0 && addButton }

      {metricItems.map((metricItem, i) => {
        return (
          <div key={i}>
            <InputGroup compact>
              <Form.Item>
                {getFieldDecorator(
                  `alert_objects[${alertObjectIndex}][metrics][items][${i}][name]`,
                  {
                    initialValue:
                      metricItem?.name ||
                      String.fromCharCode(65 + i).toLowerCase(),
                    rules: [],
                  }
                )(
                  <Input
                    style={{
                      width: 38,
                      textAlign: "center",
                      pointerEvents: "none",
                      backgroundColor: "#fafafa",
                      color: "rgba(0, 0, 0, 0.65)",
                    }}
                    disabled
                  />
                )}
              </Form.Item>
              <Form.Item>
                {getFieldDecorator(
                  `alert_objects[${alertObjectIndex}][metrics][items][${i}][field]`,
                  {
                    initialValue: metricItem?.field,
                    rules: [
                      {
                        required: true,
                        message: "Please select field!",
                      },
                    ],
                  }
                )(
                  <Select
                    allowClear
                    showSearch
                    style={{ width: 400 }}
                    dropdownClassName={"dropdownStyleWidth"}
                    onSearch={(value) =>
                      props.onSearchObjectFields({
                        keyword: value,
                        aggregatable: true,
                        state_key: `metrics_any_${alertObjectIndex}_${i}`,
                      })
                    }
                    placeholder={"Type to search field"}
                    onChange={(value, option) => {
                      props.onPreviewChartChange();
                      setFieldsType({
                        ...fieldsType,
                        [`type${i}`]: option?.props?.type || "",
                      });
                    }}
                  >
                    {props?.objectFields?.[
                      `metrics_any_${alertObjectIndex}_${i}`
                    ] || props?.objectFields?.metric_keyword_field ? (
                      <Option key={"*"} value={"*"} type={"string"}>
                        {"*"}
                      </Option>
                    ) : null}
                    {(
                      props?.objectFields?.[
                        `metrics_any_${alertObjectIndex}_${i}`
                      ] || props?.objectFields?.metric_keyword_field
                    )?.map((item, ii) => {
                      return (
                        <Option key={ii} value={item.name} type={item.type}>
                          {item.label}
                        </Option>
                      );
                    })}
                  </Select>
                )}
              </Form.Item>
              <Form.Item>
                {getFieldDecorator(
                  `alert_objects[${alertObjectIndex}][metrics][items][${i}][statistic]`,
                  {
                    initialValue: metricItem?.statistic,
                    rules: [
                      {
                        required: true,
                        message: "Please select function!",
                      },
                    ],
                  }
                )(
                  <Select
                    allowClear
                    showSearch
                    style={{ width: 120 }}
                    placeholder={"function"}
                    onChange={(value) => {
                      props.onPreviewChartChange();
                    }}
                  >
                    {getFunctions(fieldsType?.[`type${i}`]).map((item) => {
                      return (
                        <Option key={item} value={item}>
                          {item}
                        </Option>
                      );
                    })}
                  </Select>
                )}
              </Form.Item>

              {metricItems.length > 1 && i > 0 ? (
                <Icon
                  className="dynamic-delete-button"
                  type="close-circle"
                  onClick={() => {
                    setMetricItems(metricItems.filter((_, key) => key != i));
                  }}
                />
              ) : null}
              {i == 0 ? (
                <Form.Item>
                  { addButton }
                  {metricItems.length > 0 && !showFormula ? (
                    <Button
                      type="primary"
                      icon="caret-down"
                      onClick={() => {
                        setShowFormula(true);
                      }}
                      size="small"
                      style={{ marginLeft: 10 }}
                    >
                      {formatMessage({
                        id:
                          "alert.rule.form.label.alert_metric.button.advanced",
                      })}
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      icon="caret-up"
                      onClick={() => {
                        setShowFormula(false);
                      }}
                      size="small"
                      style={{ marginLeft: 10 }}
                    >
                      {formatMessage({
                        id: "alert.rule.form.label.alert_metric.button.simple",
                      })}
                    </Button>
                  )}
                </Form.Item>
              ) : null}
            </InputGroup>
          </div>
        );
      })}
      <div style={{ display: showFormula ? "block" : "none" }}>
        <InputGroup compact>
          <Form.Item>
            {getFieldDecorator(
              `alert_objects[${alertObjectIndex}][metrics][formula]`,
              {
                initialValue: metrics?.formula || "a",
                rules: [
                  {
                    required: true,
                    message: "Please input formula!",
                  },
                ],
              }
            )(
              <Input
                addonBefore={<FunctionOutlined />}
                style={{ width: 180 }}
                placeholder="Formula, eg.2*a"
                onChange={(value) => {
                  props.onPreviewChartChange();
                }}
              />
            )}
          </Form.Item>
          {
            showFormatType && (
              <>
                <Form.Item>
                  <Input
                    style={{
                      width: 110,
                      textAlign: "center",
                      pointerEvents: "none",
                      backgroundColor: "#fafafa",
                      color: "rgba(0, 0, 0, 0.65)",
                    }}
                    defaultValue={"Format Type"}
                    disabled
                  />
                </Form.Item>
                <Form.Item>
                  {getFieldDecorator(
                    `alert_objects[${alertObjectIndex}][metrics][format_type]`,
                    {
                      initialValue: metrics?.format_type || "num",
                      rules: [],
                    }
                  )(
                    <Select style={{ width: 80 }} placeholder={"Format type"}>
                      <Option value="num">Num</Option>
                      <Option value="bytes">Bytes</Option>
                      <Option value="ratio">Ratio</Option>
                    </Select>
                  )}
                </Form.Item>
              </>
            )
          }
          <Form.Item>
            <Input
              style={{
                width: 100,
                textAlign: "center",
                pointerEvents: "none",
                backgroundColor: "#fafafa",
                color: "rgba(0, 0, 0, 0.65)",
                marginLeft: 30,
              }}
              defaultValue={formatMessage({
                id: "alert.rule.form.label.bucket_size",
              })}
              disabled
            />
          </Form.Item>
          <Form.Item>
            {getFieldDecorator(
              `alert_objects[${alertObjectIndex}][metrics][bucket_size]`,
              {
                initialValue: metrics?.bucket_size || props.statPeriod,
                rules: [
                  {
                    required: true,
                    message: "Please select period!",
                  },
                ],
              }
            )(
              <Select
                placeholder="Please select period"
                onChange={(value) => {
                  props.onPreviewChartChange();
                }}
              >
                <Option value="auto">Auto</Option>
                <Option value="10s">10 seconds</Option>
                <Option value="30s">30 seconds</Option>
                <Option value="1m">1 minutes</Option>
                <Option value="5m">5 minutes</Option>
                <Option value="10m">10 minutes</Option>
                <Option value="30m">30 minutes</Option>
                <Option value="1h">1 hours</Option>
                <Option value="24h">1 days</Option>
                <Option value="168h">1 weeks</Option>
                <Option value="720h">1 months</Option>
              </Select>
            )}
          </Form.Item>
        </InputGroup>
      </div>
    </div>
  );
};

export default FormAlertMetric;
