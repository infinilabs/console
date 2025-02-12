import { Form, Input, Select, Button, Divider, Icon, Switch } from "antd";
import { useState, useMemo } from "react";
import { formatMessage } from "umi/locale";
import FormAlertMetric from "./FormAlertMetric";
import FormAlertMetricGroups from "./FormAlertMetricGroups";
import FormAlertCondition from "./FormAlertCondition";
import VariablesExampleLabel from "../components/VariablesExampleLabel";
import RuleMetricChart from "./components/RuleMetricChart";
import FormBucketLabel from "./FormBucketLabel";

const { Option } = Select;
const { TextArea } = Input;
const InputGroup = Input.Group;

const newObjectFormItemLayout = {
  wrapperCol: {
    xs: {
      span: 24,
      offset: 0,
    },
    sm: {
      span: 20,
      offset: 4,
    },
  },
};

const FormAlertObject = (props) => {
  const { getFieldDecorator, setFieldsValue } = props.form;

  const [eventTitleState, setEventTitleState] = useState({});
  const onRuleNameChange = (i, value) => {
    if (!eventTitleState[`index${i}`]) {
      setFieldsValue({ [`alert_objects[${i}][metrics][title]`]: value });
    }
  };
  useMemo(() => {
    props?.alertObjects?.map((item, i) => {
      if (item?.metrics?.title) {
        setEventTitleState({ [`index${i}`]: true });
      }
    });
  }, [props.alertObjects]);

  const [alertObjects, setAlertObjects] = useState(props.alertObjects || [{}]);
  return (
    <div>
      {alertObjects.map((item, i) => {
        return (
          <div key={i}>
            {/* <div>
              <RuleMetricChart
                values={props.previewMetricData?.[i]}
                conditions={props.previewMetricData?.[i]?.conditions}
              />
            </div> */}
            <Form.Item
              label={formatMessage({
                id: "alert.rule.table.columnns.rule_name",
              })}
            >
              {getFieldDecorator(`alert_objects[${i}][name]`, {
                initialValue: item?.name,
                rules: [
                  {
                    required: true,
                    message: "Please input rule name!",
                  },
                ],
              })(
                <Input
                  placeholder={`Rule name`}
                  onChange={(e) => {
                    onRuleNameChange(i, e.target.value);
                  }}
                />
              )}
            </Form.Item>
            <Form.Item
              label={formatMessage({
                id: "alert.rule.form.label.alert_metric.groups",
              })}
            >
              <FormAlertMetricGroups
                form={props.form}
                objectFields={props.objectFields}
                onSearchObjectFields={props.onSearchObjectFields}
                alertObjectIndex={i}
                metrics={item?.metrics || {}}
                onPreviewChartChange={props.onPreviewChartChange}
              />
            </Form.Item>
            <Form.Item
              required={true}
              label={formatMessage({
                id: "alert.rule.form.label.alert_metric",
              })}
            >
              <FormAlertMetric
                form={props.form}
                objectFields={props.objectFields}
                onSearchObjectFields={props.onSearchObjectFields}
                alertObjectIndex={i}
                metrics={item?.metrics || {}}
                onPreviewChartChange={props.onPreviewChartChange}
                statPeriod={props.statPeriod}
              />
            </Form.Item>
            <Form.Item label={formatMessage({
                id: "alert.rule.form.label.bucket_label_template",
              })}>
              <FormBucketLabel form={props.form}  alertObjectIndex={i} initialValue={item?.metrics?.bucket_label || {}} />
            </Form.Item>
            <Form.Item
              required={true}
              label={formatMessage({
                id: "alert.rule.form.label.alert_condition",
              })}
            >
              <FormAlertCondition
                form={props.form}
                alertObjectIndex={i}
                conditions={item?.conditions}
                bucketConditions={item?.bucket_conditions}
                onPreviewChartChange={props.onPreviewChartChange}
              />
            </Form.Item>
            <Form.Item
              label={formatMessage({
                id: "alert.rule.form.label.schedule_interval",
              })}
            >
              {getFieldDecorator(`alert_objects[${i}][schedule][interval]`, {
                initialValue: item?.schedule?.interval || "1m",
                rules: [
                  {
                    required: true,
                    message: "Please select schedule period!",
                  },
                ],
              })(
                <Select allowClear placeholder="Please select schedule period">
                  <Option value="10s">10 seconds</Option>
                  <Option value="30s">30 seconds</Option>
                  <Option value="1m">1 minutes</Option>
                  <Option value="5m">5 minutes</Option>
                  <Option value="10m">10 minutes</Option>
                  <Option value="30m">30 minutes</Option>
                  <Option value="1h">1 hours</Option>
                  <Option value="24h">1 days</Option>
                </Select>
              )}
            </Form.Item>
            {/* <Form.Item
              label={formatMessage({ id: "alert.rule.form.label.event_title" })}
            >
              {getFieldDecorator(`alert_objects[${i}][metrics][title]`, {
                initialValue: item?.metrics?.title,
                rules: [
                  {
                    required: true,
                    message: "Please input event title!",
                  },
                ],
              })(
                <Input
                  placeholder={"Node disk usage > 80%"}
                  onChange={(e) => {
                    setEventTitleState({
                      ...eventTitleState,
                      [`index${i}`]: true,
                    });
                  }}
                />
              )}
            </Form.Item>
            <Form.Item
              label={formatMessage({
                id: "alert.rule.form.label.event_message",
              })}
              extra={<VariablesExampleLabel />}
            >
              {getFieldDecorator(`alert_objects[${i}][metrics][message]`, {
                initialValue:
                  item?.metrics?.message ||
                  `Priority:{{.priority}}
Timestamp:{{.timestamp | datetime_in_zone "Asia/Shanghai"}}
RuleID:{{.rule_id}}
EventID:{{.event_id}}
{{range .results}}
group_value_0:{{index .group_values 0}}; Current value:{{.result_value}};
{{end}}`,
                rules: [
                  {
                    required: true,
                    message: "Please input event message!",
                  },
                ],
              })(
                <TextArea
                  rows={7}
                  placeholder={`Event Title:{{.title}}
Event ID：{{.event_id}}，
Cluster Name：{{.resource_name}}，
Priority{{.priority}}，
Timestamp{{.timestamp}}，`}
                />
              )}
            </Form.Item> */}

            {!props.isEditMode ? (
              <Form.Item {...newObjectFormItemLayout}>
                {/* {i == alertObjects.length - 1 ? (
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => {
                      if (alertObjects.length >= 10) {
                        return;
                      }
                      setAlertObjects([...alertObjects, {}]);
                    }}
                    disabled={alertObjects.length >= 10 ? true : false}
                  >
                    <Icon type="plus" />
                    {formatMessage({
                      id: "alert.rule.form.button.add_new_config",
                    })}
                  </Button>
                ) : null} */}

                {alertObjects.length > 1 ? (
                  <Button
                    type="danger"
                    size="small"
                    onClick={() => {
                      setAlertObjects(
                        alertObjects.filter((_, key) => key != i)
                      );
                    }}
                    style={{ marginLeft: 10 }}
                  >
                    <Icon type="delete" />
                    {formatMessage({
                      id: "alert.rule.form.button.delete_config",
                    })}
                  </Button>
                ) : null}
              </Form.Item>
            ) : null}
            {i != alertObjects.length - 1 ? <Divider /> : null}
          </div>
        );
      })}
    </div>
  );
};

export default FormAlertObject;
