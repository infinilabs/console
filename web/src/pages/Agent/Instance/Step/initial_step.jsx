import {
  Form,
  Input,
  Switch,
  Icon,
  Divider,
  Spin,
  message,
  Tooltip,
  Collapse,
} from "antd";
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
      registration_expired_at: res.expired_at,
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

  renderCopyButton = (text, style = {}) => {
    const button = (
      <Tooltip
        title={formatMessage({
          id: "agent.instance.registration.copy",
        })}
      >
        <Icon
          type="copy"
          style={{
            color: text ? "#007fff" : "rgba(0,0,0,0.25)",
            cursor: text ? "pointer" : "not-allowed",
            position: "absolute",
            right: 8,
            top: 8,
            zIndex: 1,
            fontSize: 16,
            ...style,
          }}
        />
      </Tooltip>
    );

    if (!text) {
      return button;
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
        {button}
      </CopyToClipboard>
    );
  };

  renderReadonlyBlock = (text) => (
    <div
      style={{
        position: "relative",
        borderRadius: 6,
        fontSize: 14,
        padding: "12px 36px 12px 12px",
        background: "rgb(241, 242, 245)",
        textAlign: "left",
        lineHeight: 1.6,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        fontFamily:
          '"SFMono-Regular", Monaco, Menlo, Consolas, "Liberation Mono", "Ubuntu Mono", monospace',
      }}
    >
      {text || "-"}
      {this.renderCopyButton(text)}
    </div>
  );

  renderLabel = (labelId, tip) => {
    const label = formatMessage({
      id: labelId,
    });
    if (!tip) {
      return label;
    }
    return (
      <span>
        {label}
        <Tooltip
          title={tip}
        >
          <Icon
            type="info-circle"
            style={{ marginLeft: 8, color: "rgba(0,0,0,0.45)" }}
          />
        </Tooltip>
      </span>
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
    const registrationExpiredAt =
      getFieldValue("registration_expired_at") || initialValue?.registration_expired_at;
    const managerTokenTip = [
      formatMessage({
        id: "agent.instance.registration.console.token.tip",
      }),
    ];
    if (registrationExpiredAt) {
      managerTokenTip.push(
        formatMessage(
          {
            id: "agent.instance.registration.console.token.expire.tip",
          },
          {
            time: new Date(registrationExpiredAt).toLocaleString(),
          }
        )
      );
    }
    const agentAccessTokenTip = [
      formatMessage({
        id: "agent.instance.registration.agent.token.tip",
      }),
      formatMessage({
        id: "agent.instance.registration.agent.token.expire.tip",
      }),
    ].join(" ");
    const { Panel } = Collapse;

    return (
      <Spin spinning={this.state.preparingRegistration}>
        <Form {...formItemLayout} form={this.props.formRef}>
          {getFieldDecorator("registration_id", {
            initialValue: initialValue?.registration_id,
          })(<Input type="hidden" />)}
          {getFieldDecorator("registration_expired_at", {
            initialValue: initialValue?.registration_expired_at,
          })(<Input type="hidden" />)}
          {getFieldDecorator("console_endpoint", {
            initialValue: initialValue?.console_endpoint,
          })(<Input type="hidden" />)}
          {getFieldDecorator("manager_token", {
            initialValue: initialValue?.manager_token,
          })(<Input type="hidden" />)}

          <Divider orientation="left">
            {formatMessage({
              id: "agent.instance.registration.agent.title",
            })}
          </Divider>

          <Form.Item
            label={this.renderLabel(
              "agent.instance.registration.access.endpoint",
              formatMessage({
                id: "agent.instance.registration.agent.endpoint.tip",
              })
            )}
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
            label={this.renderLabel(
              "agent.instance.registration.access.credential",
              agentAccessTokenTip
            )}
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
          </Form.Item>

          <Collapse style={{ marginTop: 24 }}>
            <Panel
              header={formatMessage({
                id: "agent.instance.registration.console.title",
              })}
              key="console-access-info"
            >
              <Form.Item
                {...formItemLayout}
                label={this.renderLabel(
                  "agent.instance.registration.access.endpoint",
                  formatMessage({
                    id: "agent.instance.registration.console.endpoint.tip",
                  })
                )}
                style={{ marginBottom: 16 }}
              >
                {this.renderReadonlyBlock(consoleEndpoint)}
              </Form.Item>

              <Form.Item
                {...formItemLayout}
                label={this.renderLabel(
                  "agent.instance.registration.access.credential",
                  managerTokenTip.join(" ")
                )}
                style={{ marginBottom: 0 }}
              >
                {this.renderReadonlyBlock(managerToken)}
              </Form.Item>
            </Panel>
          </Collapse>
        </Form>
      </Spin>
    );
  }
}
