import {
  Form,
  Input,
  Switch,
  Select,
  Button,
  Divider,
  Icon,
  Tabs,
  TimePicker,
} from "antd";
import { FunctionOutlined, SendOutlined } from "@ant-design/icons";
import { useCallback, useMemo, useState } from "react";
import "./form.scss";
import FormAlertChannelTabs from "./FormAlertChannelTabs";
import moment from "moment";
import { formatMessage } from "umi/locale";
import VariablesExampleLabel from "../components/VariablesExampleLabel";
import { generateId } from "@/utils/utils";

const { Option } = Select;
const { TextArea } = Input;
const InputGroup = Input.Group;

const FormAlertChannel = (props) => {
  const { notificationConfig = {}, handleTest, testState } = props;
  const { getFieldDecorator } = props.form;

  const [channelEnabled, setChannelEnabled] = useState(
    notificationConfig.enabled || false
  );

  const [escalationEnabled, setEscalationEnabled] = useState(
    notificationConfig?.escalation_enabled || false
  );

  const formatChannels = (channels) => {
    if (!channels) return [];
    return channels.map((item) => {
      const { id, webhook, email } = item;
      return {
        ...item,
        id: id ? id : '_tmp_' + generateId(8),
        isAdvanced: !!webhook || !!email
      }
    })
  }

  return (
    <div>
      <Form.Item
        label={formatMessage({ id: "alert.rule.form.label.event_title" })}
      >
        {getFieldDecorator(`notification_config.title`, {
          initialValue: notificationConfig.title || '🔥 [{{.rule_name}}] Alerting',
          rules: [
            {
              required: true,
              message: "Please input event title!",
            },
          ],
        })(
          <Input
            placeholder={"Node disk usage > 80%"}
          />
        )}
      </Form.Item>
      <Form.Item
        label={formatMessage({
          id: "alert.rule.form.label.event_message",
        })}
        extra={<VariablesExampleLabel />}
      >
        {getFieldDecorator(`notification_config.message`, {
          initialValue:
          notificationConfig.message ||
            `- Priority:{{.priority}}
- EventID: {{.event_id}}
- Target: {{.resource_name}}-{{.objects}}
- TriggerAt: {{.trigger_at | datetime}}
            
{{range .results}}
Group:{{index .group_values 0}}; Value:{{.result_value}};
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
          />
        )}
      </Form.Item>

      <Form.Item
        label={formatMessage({ id: "alert.rule.form.label.alert_channel" })}
      >
        {getFieldDecorator("notification_config[enabled]", {
          valuePropName: "checked",
          initialValue: channelEnabled,
          rules: [],
        })(
          <Switch
            onChange={(checked) => {
              setChannelEnabled(checked);
            }}
          />
        )}
      </Form.Item>

      <div style={channelEnabled ? {} : { height: 0, overflow: 'hidden'}}>
        {
          (
            <>
              {getFieldDecorator("notification_config[normal]", {
                  initialValue: formatChannels(notificationConfig.normal),
                  rules: [],
              })(
                <FormAlertChannelTabs form={props.form} valueProps="notification_config.normal" handleTest={(params) => {
                  handleTest({
                    ...params,
                    category: 'notification'
                  })
                }} testState={testState}/>
              )}
              <Form.Item
                label={formatMessage({ id: "alert.rule.form.label.accept_upgrade" })}
              >
                {getFieldDecorator("notification_config[escalation_enabled]", {
                  valuePropName: "checked",
                  initialValue: escalationEnabled,
                  rules: [],
                })(
                  <Switch
                    onChange={(checked) => {
                      setEscalationEnabled(checked);
                    }}
                  />
                )}
              </Form.Item>
              <div style={escalationEnabled ? {} : { height: 0, overflow: 'hidden'}}>
                {(
                  <>
                    {getFieldDecorator("notification_config[escalation]", {
                        initialValue: formatChannels(notificationConfig.escalation),
                        rules: [],
                    })(
                      <FormAlertChannelTabs form={props.form} valueProps="notification_config.escalation" handleTest={(params) => {
                        handleTest({
                          ...params,
                          category: 'escalation'
                        })
                      }} testState={testState}/>
                    )}
                    <Form.Item
                      label={formatMessage({
                        id: "alert.rule.form.label.upgrade_notification_waiting_time",
                      })}
                    >
                      {getFieldDecorator("notification_config[escalation_throttle_period]", {
                        initialValue: notificationConfig?.escalation_throttle_period || '30m',
                        rules: [
                          {
                            required: true,
                            message: "Please select escalation throttle period!",
                          },
                        ],
                      })(
                        <Select showSearch placeholder="30 minutes">
                          <Option value="10m">10 minutes</Option>
                          <Option value="15m">15 minutes</Option>
                          <Option value="30m">30 minutes</Option>
                          <Option value="45m">45 minutes</Option>
                          <Option value="1h">1 hours</Option>
                          <Option value="2h">2 hours</Option>
                        </Select>
                      )}
                    </Form.Item>
                  </>
                )}
              </div>
              <Form.Item
                label={formatMessage({ id: "alert.rule.form.label.silent_period" })}
              >
                {getFieldDecorator("notification_config[throttle_period]", {
                  initialValue: notificationConfig?.throttle_period || "1h",
                  rules: [
                    {
                      required: true,
                      message: "Please select throttle period!",
                    },
                  ],
                })(
                  <Select
                    showSearch
                    placeholder="Please select throttle period"
                  >
                    <Option value="10s">10 seconds</Option>
                    <Option value="30s">30 seconds</Option>
                    <Option value="1m">1 minutes</Option>
                    <Option value="5m">5 minutes</Option>
                    <Option value="10m">10 minutes</Option>
                    <Option value="30m">30 minutes</Option>
                    <Option value="1h">1 hours</Option>
                    <Option value="3h">3 hours</Option>
                    <Option value="6h">6 hours</Option>
                    <Option value="12h">12 hours</Option>
                    <Option value="24h">24 hours</Option>
                  </Select>
                )}
              </Form.Item>
              <Form.Item
                label={formatMessage({ id: "alert.rule.form.label.accept_period" })}
              >
                <InputGroup compact>
                  <Form.Item>
                    {getFieldDecorator("notification_config[accept_time_range][start]", {
                      // initialValue: moment(`2022-04-18 10:10:00`, "HH:mm"),
                      initialValue: notificationConfig?.accept_time_range?.start
                        ? moment(notificationConfig?.accept_time_range?.start, "LT")
                        : moment("00:00", "LT"),
                      rules: [
                        {
                          type: "object",
                          required: true,
                          message: "Please select start time!",
                        },
                      ],
                    })(<TimePicker format={"HH:mm"} />)}
                  </Form.Item>
                  <Form.Item>~</Form.Item>
                  <Form.Item>
                    {getFieldDecorator("notification_config[accept_time_range][end]", {
                      initialValue: notificationConfig?.accept_time_range?.end
                        ? moment(notificationConfig?.accept_time_range?.end, "LT")
                        : moment("23:59", "LT"),
                      rules: [
                        {
                          type: "object",
                          required: true,
                          message: "Please select end time!",
                        },
                      ],
                    })(<TimePicker format={"HH:mm"} />)}
                  </Form.Item>
                </InputGroup>
              </Form.Item>
            </>
          )
        }
      </div>
    </div>
  );
};

export default FormAlertChannel;
