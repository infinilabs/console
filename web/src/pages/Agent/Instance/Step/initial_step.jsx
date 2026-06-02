import {
  Form,
  Input,
  Switch,
  Icon,
  Divider,
  Spin,
  message,
  Tooltip,
  Popover,
  Radio,
} from "antd";
import React from "react";
import { formatMessage } from "umi/locale";
import { CopyToClipboard } from "react-copy-to-clipboard";
import request from "@/utils/request";
import {
  isTLS,
  isValidEndpointHost,
  normalizeEndpointHost,
  removeHttpSchema,
} from "@/utils/utils";

const AUTH_TYPE_ACCESS_TOKEN = "access_token";
const AUTH_TYPE_BASIC_AUTH = "basic_auth";

const renderCopyButton = (text, style = {}) => {
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
        message.open({
          type: "success",
          key: "agent-registration-copy-success",
          content: formatMessage({
            id: "agent.install.setup.copy.success",
          }),
        });
      }}
    >
      {button}
    </CopyToClipboard>
  );
};

const renderReadonlyBlock = (text) => (
  <div
    style={{
      position: "relative",
      borderRadius: 6,
      fontSize: 14,
      padding: "12px 40px 12px 12px",
      background: "rgb(241, 242, 245)",
      textAlign: "left",
      lineHeight: 1.6,
      overflow: "hidden",
      fontFamily:
        '"SFMono-Regular", Monaco, Menlo, Consolas, "Liberation Mono", "Ubuntu Mono", monospace',
    }}
  >
    <div
      style={{
        overflowX: "auto",
        overflowY: "hidden",
        whiteSpace: "nowrap",
        wordBreak: "normal",
        paddingBottom: 2,
      }}
    >
      {text || "-"}
    </div>
    {renderCopyButton(text)}
  </div>
);

const renderLabel = (labelId, tip) => {
  const label = formatMessage({
    id: labelId,
  });
  if (!tip) {
    return label;
  }
  return (
    <span>
      {label}
      <Tooltip title={tip}>
        <Icon
          type="info-circle"
          style={{ marginLeft: 8, color: "rgba(0,0,0,0.45)" }}
        />
      </Tooltip>
    </span>
  );
};

export const ConsoleAccessInfo = ({ consoleEndpoint, managerToken, registrationExpiredAt }) => {
  const hasConsoleAccessInfo = !!(consoleEndpoint || managerToken);
  const title = formatMessage({
    id: "agent.instance.registration.console.title",
  });
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

  const content = (
    <div style={{ width: 420, maxWidth: "calc(100vw - 64px)" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
          {renderLabel(
            "agent.instance.registration.access.endpoint",
            formatMessage({
              id: "agent.instance.registration.console.endpoint.tip",
            })
          )}
        </div>
        {renderReadonlyBlock(consoleEndpoint)}
      </div>

      <div>
        <div style={{ marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
          {renderLabel(
            "agent.instance.registration.access.credential",
            managerTokenTip.join(" ")
          )}
        </div>
        {renderReadonlyBlock(managerToken)}
      </div>
    </div>
  );

  const trigger = (
    <Tooltip title={title}>
      <span
        style={{
          color: hasConsoleAccessInfo ? "#1890ff" : "rgba(0,0,0,0.25)",
          cursor: hasConsoleAccessInfo ? "pointer" : "not-allowed",
          fontSize: 14,
          fontWeight: 500,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          whiteSpace: "nowrap",
        }}
      >
        <span>{title}</span>
        <Icon type="down" style={{ fontSize: 12 }} />
      </span>
    </Tooltip>
  );

  if (!hasConsoleAccessInfo) {
    return trigger;
  }

  return (
    <Popover
      trigger="click"
      placement="bottomRight"
      title={
        <span style={{ fontSize: 16, fontWeight: 600, lineHeight: "24px" }}>
          {title}
        </span>
      }
      content={content}
    >
      {trigger}
    </Popover>
  );
};

@Form.create()
export class InitialStep extends React.Component {
  constructor(props) {
    super(props);
    const hasAccessToken = !!props.initialValue?.access_token;
    const hasBasicAuth = !!props.initialValue?.basic_auth?.username;
    this.state = {
      isPageTLS: isTLS(props.initialValue?.endpoint),
      preparingRegistration: false,
      needAuth: hasAccessToken || hasBasicAuth,
      authType: hasBasicAuth ? AUTH_TYPE_BASIC_AUTH : AUTH_TYPE_ACCESS_TOKEN,
    };
  }

  componentDidMount() {
    this.syncRegistrationInfo(this.props.initialValue);
    if (!this.props.initialValue?.registration_id) {
      this.prepareRegistration();
    }
  }

  syncRegistrationInfo = (values = {}) => {
    if (typeof this.props.onRegistrationInfoChange === "function") {
      this.props.onRegistrationInfoChange({
        console_endpoint: values?.console_endpoint,
        manager_token: values?.manager_token,
        registration_expired_at: values?.registration_expired_at,
      });
    }
  };

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
    this.syncRegistrationInfo({
      console_endpoint: res.endpoint,
      manager_token: res.token,
      registration_expired_at: res.expired_at,
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

  handleAuthChange = (val) => {
    this.setState({
      needAuth: val,
    });
    if (!val) {
      this.props.form.setFieldsValue({
        access_token: "",
        "basic_auth.username": undefined,
        "basic_auth.password": undefined,
      });
    }
  };

  handleAuthTypeChange = (event) => {
    const nextType = event.target.value;
    this.setState({
      authType: nextType,
    });
    if (nextType === AUTH_TYPE_ACCESS_TOKEN) {
      this.props.form.setFieldsValue({
        "basic_auth.username": undefined,
        "basic_auth.password": undefined,
      });
      return;
    }
    this.props.form.setFieldsValue({
      access_token: "",
    });
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
    const agentAccessTokenTip = [
      formatMessage({
        id: "agent.instance.registration.agent.token.tip",
      }),
      formatMessage({
        id: "agent.instance.registration.agent.token.expire.tip",
      }),
    ].join(" ");
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
            label={renderLabel(
              "agent.instance.registration.access.endpoint",
              formatMessage({
                id: "agent.instance.registration.agent.endpoint.tip",
              })
            )}
          >
            {getFieldDecorator("endpoint", {
              initialValue: removeHttpSchema(initialValue?.endpoint || ""),
              normalize: (value) => {
                return normalizeEndpointHost(value);
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
                  validator: (rule, value, callback) => {
                    if (!value || isValidEndpointHost(value)) {
                      callback();
                      return;
                    }
                    callback(formatMessage({
                      id: "cluster.regist.form.verify.valid.endpoint",
                    }));
                  },
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
              id: "cluster.regist.step.connect.label.auth",
            })}
          >
            {getFieldDecorator("isAuth", {
              initialValue: this.state.needAuth,
              valuePropName: "checked",
            })(
              <Switch
                onChange={this.handleAuthChange}
                checkedChildren={<Icon type="check" />}
                unCheckedChildren={<Icon type="close" />}
              />
            )}
          </Form.Item>

          {this.state.needAuth ? (
            <>
              <Form.Item
                label={formatMessage({
                  id: "agent.instance.registration.auth.type",
                })}
              >
                {getFieldDecorator("auth_type", {
                  initialValue: this.state.authType,
                })(
                  <Radio.Group onChange={this.handleAuthTypeChange}>
                    <Radio.Button value={AUTH_TYPE_ACCESS_TOKEN}>
                      {formatMessage({
                        id: "agent.instance.registration.auth.type.access_token",
                      })}
                    </Radio.Button>
                    <Radio.Button value={AUTH_TYPE_BASIC_AUTH}>
                      {formatMessage({
                        id: "agent.instance.registration.auth.type.basic_auth",
                      })}
                    </Radio.Button>
                  </Radio.Group>
                )}
              </Form.Item>

              {this.state.authType === AUTH_TYPE_ACCESS_TOKEN ? (
                <Form.Item
                  label={renderLabel(
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
              ) : (
                <>
                  <Form.Item
                    label={formatMessage({
                      id: "cluster.regist.step.connect.label.username",
                    })}
                  >
                    {getFieldDecorator("basic_auth.username", {
                      initialValue: initialValue?.basic_auth?.username || "",
                      rules: [
                        {
                          required: true,
                          message: formatMessage({
                            id: "cluster.regist.form.verify.required.auth_username",
                          }),
                        },
                      ],
                    })(
                      <Input
                        autoComplete="off"
                        placeholder={formatMessage({
                          id: "credential.manage.form.username",
                        })}
                      />
                    )}
                  </Form.Item>
                  <Form.Item
                    label={formatMessage({
                      id: "cluster.regist.step.connect.label.password",
                    })}
                    hasFeedback
                  >
                    {getFieldDecorator("basic_auth.password", {
                      initialValue: initialValue?.basic_auth?.password || "",
                      rules: [
                        {
                          required: true,
                          message: formatMessage({
                            id: "cluster.regist.form.verify.required.auth_password",
                          }),
                        },
                      ],
                    })(
                      <Input.Password
                        autoComplete="off"
                        placeholder={formatMessage({
                          id: "credential.manage.form.password",
                        })}
                      />
                    )}
                  </Form.Item>
                </>
              )}
            </>
          ) : null}
        </Form>
      </Spin>
    );
  }
}
