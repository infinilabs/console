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
  Tree,
} from "antd";
import { FunctionOutlined } from "@ant-design/icons";
import { useCallback, useMemo, useState } from "react";
import "./form.scss";
import { formatMessage } from "umi/locale";
import Group from "@/components/Icons/Group";

const { Option } = Select;
const InputGroup = Input.Group;
const { TreeNode } = Tree;

const FormAlertMetricGroups = (props) => {
  const { getFieldDecorator } = props.form;
  const alertObjectIndex = props.alertObjectIndex || 0;
  const metrics = props.metrics || {};
  const [metricGroups, setMetricGroups] = useState(metrics?.groups || [{}]);

  const [searchValue, setSearchValue] = useState();

  const addButton = (
    <Button
      type="primary"
      icon="plus"
      onClick={() => {
        if (metricGroups.length >= 5) {
          return;
        }
        setMetricGroups([...metricGroups, {}]);
      }}
      size="small"
      style={{ marginLeft: metricGroups.length === 0 ? 0 : 10 }}
      disabled={metricGroups.length >= 5 ? true : false}
    >
      {formatMessage({
        id: "alert.rule.form.label.alert_metric.button.add_group",
      })}
    </Button>
  )

  const size = props.atLeast ?? 1

  return (
    <div className="group-wrapper">

      { metricGroups.length === 0 && addButton }
      
      {metricGroups.map((metricGroup, i) => {
        return (
          <div key={i}>
            <InputGroup compact>
              {i > 0 ? (
                <Form.Item>
                  <span
                    style={{
                      fontSize: 18,
                      width: 20,
                      textAlign: "center",
                      marginLeft: (i - 1) * 30,
                    }}
                  >
                    <Icon style={{ fontSize: 30, position: 'relative', left: 4, top: '-8px'}} component={Group} />
                  </span>
                </Form.Item>
              ) : null}

              <Form.Item>
                <Input
                  style={{
                    width: 90,
                    textAlign: "center",
                    pointerEvents: "none",
                    backgroundColor: "#fafafa",
                    color: "rgba(0, 0, 0, 0.65)",
                  }}
                  defaultValue={"Group by"}
                  disabled
                />
              </Form.Item>
              <Form.Item>
                {getFieldDecorator(
                  `alert_objects[${alertObjectIndex}][metrics][groups][${i}][field]`,
                  {
                    initialValue: metricGroup.field,
                    rules: [],
                  }
                )(
                  <Select
                    allowClear
                    showSearch
                    style={{ width: 400 }}
                    dropdownClassName={"dropdownStyleWidth"}
                    placeholder={"everything"}
                    onSearch={(value) =>{
                      setSearchValue(value)
                      props.onSearchObjectFields({
                        keyword: value,
                        aggregatable: true,
                        es_type: "keyword",
                        state_key: `metrics_keyword_${alertObjectIndex}_${i}`,
                      })
                    }}
                    onChange={(value) => {
                      setSearchValue()
                      props.onPreviewChartChange();
                    }}
                    onBlur={() => {
                      if (searchValue) {
                        props.form.setFieldsValue({ [`alert_objects[${alertObjectIndex}][metrics][groups][${i}][field]`]: searchValue })
                      }
                    }}
                  >
                    {(
                      props?.objectFields?.[
                        `metrics_keyword_${alertObjectIndex}_${i}`
                      ] || props?.objectFields?.metric_keyword_field
                    )?.map((item, i) => {
                      return (
                        <Option key={i} value={item.name}>
                          {item.label}
                        </Option>
                      );
                    })}
                  </Select>
                )}
              </Form.Item>
              <Form.Item>
                <Input
                  style={{
                    width: 60,
                    textAlign: "center",
                    pointerEvents: "none",
                    backgroundColor: "#fafafa",
                    color: "rgba(0, 0, 0, 0.65)",
                  }}
                  defaultValue={"Limit"}
                  disabled
                />
              </Form.Item>
              <Form.Item>
                {getFieldDecorator(
                  `alert_objects[${alertObjectIndex}][metrics][groups][${i}][limit]`,
                  {
                    initialValue: metricGroup.limit || 5,
                    rules: [],
                  }
                )(
                  <InputNumber
                    style={{
                      width: 100,
                    }}
                    min={1}
                    max={1000}
                    placeholder={"limit"}
                    onChange={(value) => {
                      props.onPreviewChartChange();
                    }}
                  />
                )}
              </Form.Item>

              {metricGroups.length > size && i > ( size - 1) ? (
                <Icon
                  className="dynamic-delete-button"
                  type="close-circle"
                  onClick={() => {
                    setMetricGroups(metricGroups.filter((_, key) => key != i));
                  }}
                />
              ) : null}

              {i == 0 ? (
                <Form.Item>
                  { addButton }
                </Form.Item>
              ) : null}
            </InputGroup>
          </div>
        );
      })}
    </div>
  );
};

export default FormAlertMetricGroups;
