import { Form, Input, Select, Button, Icon, Radio, InputNumber } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import "./form.scss";
import { formatMessage } from "umi/locale";
import { PriorityColor } from "../utils/constants";
import { cloneDeep } from "lodash";

const { Option } = Select;
const InputGroup = Input.Group;

const lastsPeriods = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15]
const operators = ['equals', 'gte', 'gt', 'lt', 'lte', 'range']

const FormAlertCondition = (props) => {
  const { conditions, bucketConditions } = props;
  const [type, setType] = useState('metrics_value')

  useEffect(() => {
    if (bucketConditions?.items?.length > 0) {
      setType('buckets_diff')
    }
  }, [JSON.stringify(conditions), JSON.stringify(bucketConditions)])

  return (
    <>
      <Radio.Group value={type} onChange={(e) => setType(e.target.value)}>
        {
          ['metrics_value', 'buckets_diff'].map((item) => (
            <Radio.Button key={item} value={item}>{formatMessage({
              id: `alert.rule.form.label.${item}`,
            })}</Radio.Button>
          ))
        }
      </Radio.Group>
      { type === 'metrics_value' ? <MetricsValue {...props} /> : <BucketsDiff {...props} /> }
    </>
  )
};

export default FormAlertCondition;

const MetricsValue = (props) => {
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
                    {
                      lastsPeriods.map((item) => (
                        <Option key={`${item}`} value={`${item}`}>
                          {formatMessage(
                            {
                              id: "alert.rule.form.label.lasts_periods",
                            },
                            { num: item }
                          )}
                        </Option>
                      ))
                    }
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
                    { operators.map((item) => <Option key={item} value={item}>{item}</Option>)}
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
}

const BucketsDiff = (props) => {
  const { getFieldDecorator } = props.form;
  const alertObjectIndex = props.alertObjectIndex || 0;
  const conditions = props.bucketConditions || {};
  const [conditionItems, setConditionItems] = useState(conditions?.items || [{ type: 'size' }]);

  return (
    <div className="group-wrapper">
      {conditionItems.map((conditionItem, i) => {
        return (
          <div key={i}>
            <InputGroup compact>
              <Form.Item>
                {getFieldDecorator(
                    `alert_objects[${alertObjectIndex}][bucket_conditions][items][${i}][type]`,
                    {
                      initialValue: conditionItem.type || "size",
                    }
                )(
                  <Select style={{ width: 120 }} onChange={(value) => {
                      const newItems = cloneDeep(conditionItems)
                      newItems[i].type = value
                      if (value === 'content') {
                        newItems[i].values = undefined
                        newItems[i].operator = undefined
                      }
                      setConditionItems(newItems)
                  }}>
                    <Option value={'size'}>{formatMessage({id: `alert.rule.form.label.size`})}</Option>
                    <Option value={'content'}>{formatMessage({id: `alert.rule.form.label.content`})}</Option>
                  </Select>
                )}
              </Form.Item>
              <Form.Item>
                <Input
                  style={{
                    width: 40,
                    textAlign: "center",
                    pointerEvents: "none",
                    backgroundColor: "#fafafa",
                    color: "rgba(0, 0, 0, 0.65)",
                  }}
                  defaultValue={formatMessage({
                    id: `alert.rule.form.label.in`,
                  })}
                  disabled
                />
              </Form.Item>
              <Form.Item>
                {getFieldDecorator(
                  `alert_objects[${alertObjectIndex}][bucket_conditions][items][${i}][bucket_count]`,
                  {
                    initialValue: conditionItem.bucket_count || 10,
                    rules: [
                      {
                        required: true,
                        message: "Please select period!",
                      },
                    ],
                  }
                )(
                  <InputNumber style={{ width: 60 }} min={2} max={50} precision={0} step={1}/>
                )}
              </Form.Item>
              <Form.Item>
                <Input
                  style={{
                    width: 100,
                    textAlign: "center",
                    pointerEvents: "none",
                    backgroundColor: "#fafafa",
                    color: "rgba(0, 0, 0, 0.65)",
                  }}
                  defaultValue={formatMessage({
                    id: `alert.rule.form.label.stat_period`,
                  })}
                  disabled
                />
              </Form.Item>
              <Form.Item>
                {getFieldDecorator(
                  `alert_objects[${alertObjectIndex}][bucket_conditions][items][${i}][minimum_period_match]`,
                  {
                    initialValue: conditionItem.minimum_period_match || 1,
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
                    style={{ width: 140 }}
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
                    {
                      lastsPeriods.map((item) => (
                        <Option key={item} value={item}>
                          {formatMessage(
                            {
                              id: "alert.rule.form.label.lasts_periods",
                            },
                            { num: item }
                          )}
                        </Option>
                      ))
                    }
                  </Select>
                )}
              </Form.Item>
              <>
                  <Form.Item>
                    {getFieldDecorator(
                      `alert_objects[${alertObjectIndex}][bucket_conditions][items][${i}][operator]`,
                      {
                        initialValue: conditionItem.operator,
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
                        style={{ width: 80 }}
                        placeholder={"equals"}
                        onChange={(value) => {
                          props.onPreviewChartChange();
                          const newItems = cloneDeep(conditionItems)
                          newItems[i].operator = value
                          setConditionItems(newItems)
                        }}
                      >
                        { operators.map((item) => <Option key={item} value={item}>{item}</Option>)}
                      </Select>
                    )}
                  </Form.Item>

                  {conditionItem.operator === "range" ? (
                    <>
                      <Form.Item>
                        {getFieldDecorator(
                          `alert_objects[${alertObjectIndex}][bucket_conditions][items][${i}][values][0]`,
                          {
                            initialValue: conditionItem.values?.[0],
                            rules: [
                              {
                                required: true,
                                message: "Please input min value!",
                              },
                            ],
                          }
                        )(
                          <Input
                            style={{ width: 80 }}
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
                          `alert_objects[${alertObjectIndex}][bucket_conditions][items][${i}][values][1]`,
                          {
                            initialValue: conditionItem.values?.[1],
                            rules: [
                              {
                                required: true,
                                message: "Please input max value!",
                              },
                            ],
                          }
                        )(
                          <Input
                            style={{ width: 80 }}
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
                        `alert_objects[${alertObjectIndex}][bucket_conditions][items][${i}][values][0]`,
                        {
                          initialValue: conditionItem.values?.[0],
                          rules: [
                            {
                              required: true,
                              message: "Please input value!",
                            },
                          ],
                        }
                      )(
                        <Input
                          style={{ width: 80 }}
                          placeholder="value"
                          onChange={(e) => {
                            props.onPreviewChartChange();
                          }}
                        />
                      )}
                    </Form.Item>
                  )}
                </>
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
                  `alert_objects[${alertObjectIndex}][bucket_conditions][items][${i}][priority]`,
                  {
                    initialValue: conditionItem.priority,
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
                    setConditionItems(conditionItems.filter((_, key) => key !== i));
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
                      setConditionItems([...conditionItems, { type: 'size' }]);
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
        )
      })}
    </div>
  );
}