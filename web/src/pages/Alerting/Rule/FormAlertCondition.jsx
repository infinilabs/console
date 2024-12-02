import { Form, Input, Select, Button, Icon } from "antd";
import { useCallback, useMemo, useState } from "react";
import "./form.scss";
import { formatMessage } from "umi/locale";
import { PriorityColor } from "../utils/constants";

const { Option } = Select;
const InputGroup = Input.Group;

const FormAlertCondition = (props) => {
  const { getFieldDecorator } = props.form;
  const alertObjectIndex = props.alertObjectIndex || 0;
  const conditions = props.conditions || {};
  const [conditionItems, setConditionItems] = useState(
    conditions?.items || [{}]
  );
  const [operatorState, setOperatorState] = useState({});
  useMemo(() => {
    const tmp = {};
    conditions?.items?.map((item, i) => {
      tmp[`op${i}`] = item.operator;
    });
    setOperatorState({ ...operatorState, ...tmp });
  }, [conditions?.items]);

  return (
    <div className="group-wrapper">
      {conditionItems.map((conditionItem, i) => {
        return (
          <div key={i}>
            <InputGroup compact>
              <Form.Item>
                <Input
                  style={{
                    width: 120,
                    textAlign: "center",
                    pointerEvents: "none",
                    backgroundColor: "#fafafa",
                    color: "rgba(0, 0, 0, 0.65)",
                  }}
                  defaultValue={formatMessage({
                    id: "alert.rule.form.label.above_metric",
                  })}
                  disabled
                />
              </Form.Item>
              <Form.Item>
                {getFieldDecorator(
                  `alert_objects[${alertObjectIndex}][conditions][items][${i}][minimum_period_match]`,
                  {
                    initialValue:
                      conditionItem?.minimum_period_match?.toString() || "1",
                    rules: [
                      {
                        required: true,
                        message: "Please select periods match!",
                      },
                    ],
                  }
                )(
                  <Select
                    allowClear
                    showSearch
                    style={{ width: 150 }}
                    placeholder={formatMessage(
                      {
                        id: "alert.rule.form.label.lasts_periods",
                      },
                      { num: 1 }
                    )}
                    onChange={(value) => {
                      props.onPreviewChartChange();
                    }}
                  >
                    <Option value="1">
                      {formatMessage(
                        {
                          id: "alert.rule.form.label.lasts_periods",
                        },
                        { num: 1 }
                      )}
                    </Option>
                    <Option value="2">
                      {formatMessage(
                        {
                          id: "alert.rule.form.label.lasts_periods",
                        },
                        { num: 2 }
                      )}
                    </Option>
                    <Option value="3">
                      {formatMessage(
                        {
                          id: "alert.rule.form.label.lasts_periods",
                        },
                        { num: 3 }
                      )}
                    </Option>

                    <Option value="4">
                      {formatMessage(
                        {
                          id: "alert.rule.form.label.lasts_periods",
                        },
                        { num: 4 }
                      )}
                    </Option>
                    <Option value="5">
                      {formatMessage(
                        {
                          id: "alert.rule.form.label.lasts_periods",
                        },
                        { num: 5 }
                      )}
                    </Option>
                    <Option value="6">
                      {formatMessage(
                        {
                          id: "alert.rule.form.label.lasts_periods",
                        },
                        { num: 6 }
                      )}
                    </Option>
                    <Option value="7">
                      {formatMessage(
                        {
                          id: "alert.rule.form.label.lasts_periods",
                        },
                        { num: 7 }
                      )}
                    </Option>
                    <Option value="8">
                      {formatMessage(
                        {
                          id: "alert.rule.form.label.lasts_periods",
                        },
                        { num: 8 }
                      )}
                    </Option>
                    <Option value="9">
                      {formatMessage(
                        {
                          id: "alert.rule.form.label.lasts_periods",
                        },
                        { num: 9 }
                      )}
                    </Option>
                    <Option value="10">
                      {formatMessage(
                        {
                          id: "alert.rule.form.label.lasts_periods",
                        },
                        { num: 10 }
                      )}
                    </Option>
                    <Option value="15">
                      {formatMessage(
                        {
                          id: "alert.rule.form.label.lasts_periods",
                        },
                        { num: 15 }
                      )}
                    </Option>
                  </Select>
                )}
              </Form.Item>
              <Form.Item>
                {getFieldDecorator(
                  `alert_objects[${alertObjectIndex}][conditions][items][${i}][operator]`,
                  {
                    initialValue: conditionItem?.operator,
                    rules: [
                      {
                        required: true,
                        message: "Please select operator!",
                      },
                    ],
                  }
                )(
                  <Select
                    allowClear
                    showSearch
                    style={{ width: 100 }}
                    placeholder={"equals"}
                    onChange={(value) => {
                      props.onPreviewChartChange();
                      setOperatorState({ ...operatorState, [`op${i}`]: value });
                    }}
                  >
                    <Option value="equals">equals</Option>
                    <Option value="gte">gte</Option>
                    <Option value="gt">gt</Option>
                    <Option value="lt">lt</Option>
                    <Option value="lte">lte</Option>
                    <Option value="range">range</Option>
                  </Select>
                )}
              </Form.Item>

              {operatorState?.[`op${i}`] == "range" ? (
                <>
                  <Form.Item>
                    {getFieldDecorator(
                      `alert_objects[${alertObjectIndex}][conditions][items][${i}][values][0]`,
                      {
                        initialValue: conditionItem?.values?.[0],
                        rules: [
                          {
                            required: true,
                            message: "Please input min value!",
                          },
                        ],
                      }
                    )(
                      <Input
                        style={{ width: 100 }}
                        placeholder="min value"
                        onChange={(e) => {
                          props.onPreviewChartChange();
                        }}
                      />
                    )}
                  </Form.Item>
                  <span
                    style={{
                      display: "inline-block",
                      lineHeight: "40px",
                      textAlign: "center",
                    }}
                  >
                    <Icon type="minus" />
                  </span>
                  <Form.Item>
                    {getFieldDecorator(
                      `alert_objects[${alertObjectIndex}][conditions][items][${i}][values][1]`,
                      {
                        initialValue: conditionItem?.values?.[1],
                        rules: [
                          {
                            required: true,
                            message: "Please input max value!",
                          },
                        ],
                      }
                    )(
                      <Input
                        style={{ width: 100 }}
                        placeholder="max value"
                        onChange={(e) => {
                          props.onPreviewChartChange();
                        }}
                      />
                    )}
                  </Form.Item>
                </>
              ) : (
                <Form.Item>
                  {getFieldDecorator(
                    `alert_objects[${alertObjectIndex}][conditions][items][${i}][values][0]`,
                    {
                      initialValue: conditionItem?.values?.[0],
                      rules: [
                        {
                          required: true,
                          message: "Please input value!",
                        },
                      ],
                    }
                  )(
                    <Input
                      style={{ width: 120 }}
                      placeholder="value"
                      onChange={(e) => {
                        props.onPreviewChartChange();
                      }}
                    />
                  )}
                </Form.Item>
              )}
              <Form.Item>
                <Input
                  style={{
                    width: 80,
                    textAlign: "center",
                    pointerEvents: "none",
                    backgroundColor: "#fafafa",
                    color: "rgba(0, 0, 0, 0.65)",
                  }}
                  defaultValue={formatMessage({
                    id: "alert.rule.form.label.trigger",
                  })}
                  disabled
                />
              </Form.Item>

              <Form.Item>
                {getFieldDecorator(
                  `alert_objects[${alertObjectIndex}][conditions][items][${i}][priority]`,
                  {
                    initialValue: conditionItem?.priority,
                    rules: [
                      {
                        required: true,
                        message: "Please select priority!",
                      },
                    ],
                  }
                )(
                  <Select
                    allowClear
                    showSearch
                    style={{ width: 120 }}
                    placeholder={"P1(High)"}
                    onChange={(value) => {
                      props.onPreviewChartChange();
                    }}
                  >
                    {Object.keys(PriorityColor).map((item) => {
                      return (
                        <Option key={item} value={item}>
                          {formatMessage({
                            id: `alert.message.priority.${item}`,
                          })}
                        </Option>
                      );
                    })}
                  </Select>
                )}
              </Form.Item>

              {conditionItems.length > 1 && i > 0 ? (
                <Icon
                  className="dynamic-delete-button"
                  type="close-circle"
                  onClick={() => {
                    setConditionItems(
                      conditionItems.filter((_, key) => key != i)
                    );
                  }}
                />
              ) : null}

              {i == 0 ? (
                <Form.Item>
                  <Button
                    type="primary"
                    icon="plus"
                    onClick={() => {
                      if (conditionItems.length >= 5) {
                        return;
                      }
                      setConditionItems([...conditionItems, {}]);
                    }}
                    size="small"
                    style={{ marginLeft: 10 }}
                    disabled={conditionItems.length >= 5 ? true : false}
                  >
                    {formatMessage({
                      id: "alert.rule.form.button.add_condition",
                    })}
                  </Button>
                </Form.Item>
              ) : null}
            </InputGroup>
          </div>
        );
      })}
    </div>
  );
};

export default FormAlertCondition;
