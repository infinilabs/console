import { Form, Input, Switch, Icon, Button, Divider, Spin, message } from "antd";
import React from "react";
import { formatMessage } from "umi/locale";
import { CopyToClipboard } from "react-copy-to-clipboard";
import request from "@/utils/request";
import { isTLS, removeHttpSchema } from "@/utils/utils";

@Form.create()
export class InitialStep extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isPageTLS: isTLS(props.initialValue?.endpoint),
      preparingRegistration: false,
    };
  }

  componentDidMount() {
    if (!this.props.initialValue?.registration_id) {
      this.prepareRegistration();
    }
  }

  prepareRegistration = async () => {
    this.setState({
      preparingRegistration: true,
    });
    const res = await request("/instance/_prepare_registration", {
      method: "POST",
    });
    this.setState({
      preparingRegistration: false,
    });
    if (res?.error) {
      return;
    }
    this.props.form.setFieldsValue({
      registration_id: res.id,
      console_endpoint: res.endpoint,
      manager_token: res.token,
    });
  };

  handleEndpointChange = (event) => {
    const val = event.target.value;
    this.setState({
      isPageTLS: isTLS(val),
    });
  };

  isPageTLSChange = (val) => {
    this.setState({
      isPageTLS: val,
    });
  };

  renderCopyButton = (text) => {
    if (!text) {
      return (
        <Button disabled style={{ marginLeft: 8 }}>
          {formatMessage({
            id: "agent.instance.registration.copy",
          })}
        </Button>
      );
    }
    return (
      <CopyToClipboard
        text={text}
        onCopy={() => {
          message.success(
            formatMessage({
              id: "agent.install.setup.copy.success",
            })
          );
        }}
      >
        <Button style={{ marginLeft: 8 }}>
          {formatMessage({
            id: "agent.instance.registration.copy",
          })}
        </Button>
      </CopyToClipboard>
    );
  };

  render() {
    const {
      form: { getFieldDecorator, getFieldValue },
      initialValue,
    } = this.props;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 },
      },
    };
    const consoleEndpoint = getFieldValue("console_endpoint") || initialValue?.console_endpoint;
    const managerToken = getFieldValue("manager_token") || initialValue?.manager_token;

    return (
      <Spin spinning={this.state.preparingRegistration}>
        <Form {...formItemLayout} form={this.props.formRef}>
          {getFieldDecorator("registration_id", {
            initialValue: initialValue?.registration_id,
          })(<Input type="hidden" />)}

          <Divider orientation="left">
            {formatMessage({
              id: "agent.instance.registration.console.title",
            })}
          </Divider>

          <Form.Item
            label={formatMessage({
              id: "agent.instance.registration.console.endpoint",
            })}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              {getFieldDecorator("console_endpoint", {
                initialValue: initialValue?.console_endpoint,
              })(<Input readOnly />)}
              {this.renderCopyButton(consoleEndpoint)}
            </div>
            <div style={{ color: "rgba(0,0,0,0.45)", marginTop: 8 }}>
              {formatMessage({
                id: "agent.instance.registration.console.endpoint.tip",
              })}
            </div>
          </Form.Item>

          <Form.Item
            label={formatMessage({
              id: "agent.instance.registration.console.token",
            })}
          >
            <div style={{ display: "flex", alignItems: "flex-start" }}>
              {getFieldDecorator("manager_token", {
                initialValue: initialValue?.manager_token,
              })(
                <Input.TextArea
                  readOnly
                  autoSize={{ minRows: 3, maxRows: 4 }}
                />
              )}
              {this.renderCopyButton(managerToken)}
            </div>
            <div style={{ color: "rgba(0,0,0,0.45)", marginTop: 8 }}>
              {formatMessage({
                id: "agent.instance.registration.console.token.tip",
              })}
            </div>
          </Form.Item>

          <Divider orientation="left">
            {formatMessage({
              id: "agent.instance.registration.agent.title",
            })}
          </Divider>

          <Form.Item
            label={formatMessage({
              id: "gateway.instance.field.endpoint.label",
            })}
          >
            {getFieldDecorator("endpoint", {
              initialValue: removeHttpSchema(initialValue?.endpoint || ""),
              normalize: (value) => {
                return removeHttpSchema(value || "").trim();
              },
              validateTrigger: ["onChange", "onBlur"],
              rules: [
                {
                  required: true,
                  message: formatMessage({
                    id: "agent.instance.field.endpoint.form.required",
                  }),
                },
                {
                  type: "string",
                  pattern: /^[\w\.\-_~%]+(\:\d+)?\s*$/,
                  message: formatMessage({
                    id: "cluster.regist.form.verify.valid.endpoint",
                  }),
                },
              ],
            })(
              <Input
                placeholder={formatMessage({
                  id: "agent.instance.field.endpoint.placeholder",
                })}
                onChange={this.handleEndpointChange}
              />
            )}
          </Form.Item>

          <Form.Item
            label={formatMessage({
              id: "gateway.instance.field.tls.label",
            })}
          >
            {getFieldDecorator("isTLS", {
              initialValue: isTLS(initialValue?.endpoint),
            })(
              <Switch
                defaultChecked={isTLS(initialValue?.endpoint)}
                checkedChildren={<Icon type="check" />}
                unCheckedChildren={<Icon type="close" />}
                checked={this.state.isPageTLS}
                onChange={this.isPageTLSChange}
              />
            )}
          </Form.Item>

          <Form.Item
            label={formatMessage({
              id: "agent.instance.registration.agent.token",
            })}
          >
            {getFieldDecorator("access_token", {
              initialValue: initialValue?.access_token || "",
              rules: [
                {
                  required: true,
                  message: formatMessage({
                    id: "agent.instance.registration.agent.token.required",
                  }),
                },
              ],
            })(
              <Input.TextArea
                autoComplete="off"
                autoSize={{ minRows: 3, maxRows: 4 }}
                placeholder={formatMessage({
                  id: "agent.instance.registration.agent.token.placeholder",
                })}
              />
            )}
            <div style={{ color: "rgba(0,0,0,0.45)", marginTop: 8 }}>
              {formatMessage({
                id: "agent.instance.registration.agent.token.tip",
              })}
            </div>
          </Form.Item>
        </Form>
      </Spin>
    );
  }
}
