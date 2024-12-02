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

export default (props) => {
  const { value = {}, handleTest, testState } = props;
  const { getFieldDecorator } = props.form;

  const [channelEnabled, setChannelEnabled] = useState(
    value.enabled || false
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
        {getFieldDecorator(`recovery_notification_config.title`, {
          initialValue: value.title || '🌈 [{{.rule_name}}] Resolved',
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
        {getFieldDecorator(`recovery_notification_config.message`, {
          initialValue:
          value.message ||
            `- EventID: {{.event_id}}
- Target: {{.resource_name}}-{{.objects}}
- TriggerAt: {{.trigger_at | datetime}}
- ResolveAt: {{.timestamp | datetime}}
- Duration: {{.duration}}`,
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
        {getFieldDecorator("recovery_notification_config[enabled]", {
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
            getFieldDecorator("recovery_notification_config[normal]", {
                initialValue: formatChannels(value.normal),
                rules: [],
            })(
              <FormAlertChannelTabs form={props.form} valueProps="recovery_notification_config.normal" handleTest={(params) => {
                handleTest({
                  ...params,
                  category: 'recover_notification'
                })
              }} testState={testState}/>
            )
          )
        }
      </div>
    </div>
  );
};
