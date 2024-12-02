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
  import { useCallback, useEffect, useMemo, useState } from "react";
  import { formatMessage } from "umi/locale";
  import { cloneDeep } from "lodash";
  import CopyTextIcon from "../../CopyTextIcon";
  
  const { Option } = Select;
  const { TextArea } = Input;
  const InputGroup = Input.Group;
  
  export default (props) => {
    const { funcs = [], value = {}, onChange, alertObjectIndex = 0 } = props;
  
    const { items = [], sort = [{ key: '_count', direction: 'desc'}] } = value;
  
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
  
    const handleItemChange = (item, i) => {
      const newValue = cloneDeep(value)
      if (!newValue.items) newValue.items = []
      newValue['items'][i] = item;
      onChange(newValue)
    }
  
    const onRemove = (index) => {
      const newValue = cloneDeep(value)
      const newSort = cloneDeep(sort)
      if (newSort[0]?.key === newValue.items[index].name) {
        newSort.splice(0, 1)
        newSort.push({ key: '_count', direction: 'desc'})
      }
      newValue['items'].splice(index, 1)
      newValue['sort'] = newSort
      onChange(newValue)
    }
  
    return (
      <div className="group-wrapper">
  
        {items.map((metricItem, i) => {
          return (
            <div key={i}>
              <InputGroup compact>
                <Form.Item>
                  <Input
                    style={{
                      width: 38,
                      textAlign: "center",
                      pointerEvents: "none",
                      backgroundColor: "#fafafa",
                      color: "rgba(0, 0, 0, 0.65)",
                    }}
                    disabled
                    value={metricItem.name}
                  />
                </Form.Item>
                <Form.Item>
                  
                <Select
                      allowClear
                      showSearch
                      style={{ width: 'calc(672px - 38px - 120px - 25px)' }}
                      dropdownClassName={"dropdownStyleWidth"}
                      dropdownMatchSelectWidth={false}
                      onSearch={(value) =>
                        props.onSearchObjectFields({
                          keyword: value,
                          aggregatable: true,
                          state_key: `metrics_any_${alertObjectIndex}_${i}`,
                        })
                      }
                      placeholder={"Type to search field"}
                      onChange={(value, option) => {
                        setFieldsType({
                          ...fieldsType,
                          [`type${i}`]: option?.props?.type || "",
                        });
                        handleItemChange({
                          ...metricItem,
                          field: value,
                          statistic: ''
                        }, i)
                      }}
                      value={metricItem.field}
                      clearIcon={<CopyTextIcon text={metricItem.field} />}
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
                </Form.Item>
                <Form.Item>
                  <Select
                    allowClear
                    showSearch
                    style={{ width: 120 }}
                    placeholder={"function"}
                    onChange={(value) => {
                      handleItemChange({
                        ...metricItem,
                        statistic: value
                      }, i)
                    }}
                    value={metricItem.statistic}
                  >
                    {getFunctions(fieldsType?.[`type${i}`]).map((item) => {
                      return (
                        <Option key={item} value={item}>
                          {item}
                        </Option>
                      );
                    })}
                  </Select>
                </Form.Item>
  
                {items.length > 1 && i > 0 ? (
                  <Icon
                    className="dynamic-delete-button"
                    type="close-circle"
                    onClick={() => {
                      onRemove(i)
                    }}
                  />
                ) : null}
              </InputGroup>
            </div>
          );
        })}
        <Form.Item>
          <Button
            type="primary"
            icon="plus"
            onClick={() => {
              if (items.length >= 5) {
                return;
              }
              const newItemName = items.length > 0 ? String.fromCharCode(items[items.length - 1].name.charCodeAt(0) + 1) : 'a'
              onChange({
                ...value,
                formula: items.length === 0 ? 'a' : value.formula,
                items: [
                  ...items,
                  { name: newItemName }
                ]
              });
            }}
            size="small"
            disabled={items.length >= 5 ? true : false}
          >
            {formatMessage({
              id:
                "alert.rule.form.label.alert_metric.button.add_metric",
            })}
          </Button>
        </Form.Item>
  
        {
          items.length > 0 && (
            <InputGroup compact>
              <Form.Item>
                <Input
                  addonBefore={<FunctionOutlined />}
                  style={{ width: 180, marginRight: 12 }}
                  placeholder="Formula, eg.2*a"
                  onChange={(e) => {
                    onChange({
                      ...value,
                      formula: e.target.value
                    })
                  }}
                  value={value.formula}
                />
              </Form.Item>
  
              <Form.Item>
                  <Input
                    style={{
                      width: 75,
                      textAlign: "center",
                      pointerEvents: "none",
                      backgroundColor: "#fafafa",
                      color: "rgba(0, 0, 0, 0.65)",
                    }}
                    defaultValue={"Sort by"}
                    disabled
                  />
              </Form.Item>
  
              <Form.Item>
                  <Select 
                    style={{ width: 80 }} 
                    value={sort[0]?.key}
                    onChange={(newValue) => {
                      onChange({
                        ...value,
                        sort: [{ 
                          ...(sort[0] || {}),
                          key: newValue
                        }]
                      })
                    }}
                  >
                    <Select.Option key={'_count'} value={'_count'}>
                        docs
                    </Select.Option>
                    {
                      items.map((item, i) => (
                        <Select.Option key={i} value={item.name}>
                          {item.name}
                        </Select.Option>
                      ))
                    }
                  </Select>
              </Form.Item>
  
              <Form.Item>
                  <Select 
                    style={{ width: 80, marginRight: 12 }} 
                    value={sort[0]?.direction}
                    onChange={(newValue) => {
                      onChange({
                        ...value,
                        sort: [{ 
                          ...(sort[0] || {}),
                          direction: newValue
                        }]
                      })
                    }}
                  >
                    {
                      ['desc', 'asc'].map((item, i) => (
                        <Select.Option key={i} value={item}>
                          {item}
                        </Select.Option>
                      ))
                    }
                  </Select>
              </Form.Item>
  
              <Form.Item>
                <Input 
                  style={{ width: 210 }} 
                  addonBefore={"Alias"} 
                  value={value.name} 
                  onChange={(e) => {
                    onChange({
                      ...value,
                      name: e.target.value
                    })
                  }} 
                />
              </Form.Item>
            </InputGroup>
          )
        }
      </div>
    );
  };
  