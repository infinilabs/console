import request from "@/utils/request";
import {
  Form,
  Input,
  Select,
  Button,
  Switch,
  InputNumber,
  message,
} from "antd";
import { useCallback, useState } from "react";
import CredentialForm from "./CredentialForm";
import { hasAuthority } from "@/utils/authority";

export default Form.create({ name: "email_server_cfg" })((props) => {
  const { form, config = {}, setState, onSaveClick } = props;
  const { getFieldDecorator } = form;
  const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 5 },
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 17 },
    },
  };
  const tailFormItemLayout = {
    wrapperCol: {
      xs: {
        span: 24,
        offset: 0,
      },
      sm: {
        span: 16,
        offset: 5,
      },
    },
  };
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setIsLoading(true);
      form.validateFields(async (err, values) => {
        if (err) {
          return false;
        }
        if (typeof onSaveClick == "function") {
          let newVals = {
            ...config,
            ...values,
          };
          if (newVals.credential_id === "manual") {
            delete newVals.credential_id;
          }
          await onSaveClick(newVals);
          setIsLoading(false);
        }
      });
    },
    [form, config]
  );

  const onSendTestClick = async () => {
    form.validateFields(async (err, values) => {
      if (err) {
        return false;
      }
      const { sendTo } = values;
      const emailRegexp = /^[\w-]+(\.[\w-]+)*@([a-z0-9-]+\.)+[a-z]{2,}$/i;
      if (!sendTo || !emailRegexp.test(sendTo.trim())) {
        message.error("Receive Email is invalid");
        return;
      }
      const send_to = [sendTo.trim()];
      delete values.sendTo;
      const testRes = await request("/email/server/_test", {
        method: "POST",
        body: {
          ...config,
          ...values,
          send_to,
        },
      });
      if (testRes && testRes.acknowledged === true) {
        message.success("send succed");
      }
    });
  };

  const isEdit = !config.id.startsWith("tmp_");

  return (
    <div>
      <Form {...formItemLayout}>
        <Form.Item label="Name">
          {getFieldDecorator("name", {
            initialValue: config.name,
            rules: [
              {
                required: true,
                message: "Please input name!",
              },
            ],
            onChange: (ev) => {
              const nameVal = ev.target.value;
              setState((st) => {
                const servers = st.servers.map((srv) => {
                  if (srv.id == config.id) {
                    srv.name = nameVal;
                  }
                  return srv;
                });
                return {
                  ...st,
                  servers: servers,
                };
              });
            },
          })(<Input />)}
        </Form.Item>
        <Form.Item label="Host">
          {getFieldDecorator("host", {
            initialValue: config.host,
            rules: [
              {
                required: true,
                message: "Please input smtp server host!",
              },
            ],
          })(<Input />)}
        </Form.Item>
        <Form.Item label="Port">
          {getFieldDecorator("port", {
            initialValue: config.port,
            rules: [
              {
                required: true,
                message: "Please input smtp server port!",
              },
            ],
          })(<InputNumber />)}
        </Form.Item>
        <Form.Item label="TLS Min Version">
          {getFieldDecorator("tls_min_version", {
            initialValue: config.tls_min_version,
            rules: [
            ],
          })(<Select>
            <Option value="TLS10">TLS10</Option>
            <Option value="TLS11">TLS11</Option>
            <Option value="TLS12">TLS12</Option>
            <Option value="TLS13">TLS13</Option>
          </Select>)}
        </Form.Item>
        <Form.Item label="TLS">
          {getFieldDecorator("tls", {
            initialValue: config.tls,
            valuePropName: "checked",
          })(<Switch />)}
        </Form.Item>
        <CredentialForm form={form} initialValue={config} isEdit={isEdit} />
        <Form.Item label="Enabled">
          {getFieldDecorator("enabled", {
            initialValue: config.enabled,
            valuePropName: "checked",
          })(<Switch />)}
        </Form.Item>
        <Form.Item label="Recipient">
          <div className="receive-test">
            {getFieldDecorator(
              "sendTo",
              {}
            )(
              <Input className="send-to" placeholder="Please input recipient" />
            )}
            <Button
              className="btn-send"
              type="primary"
              onClick={onSendTestClick}
              disabled={hasAuthority("alerting.rule:all") ? false : true}
            >
              Send A Test Email
            </Button>
          </div>
        </Form.Item>
        <Form.Item {...tailFormItemLayout}>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={isLoading}
            disabled={hasAuthority("alerting.rule:all") ? false : true}
          >
            Save
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
});
