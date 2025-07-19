import { Form, Input, Switch, Icon } from "antd";
import { formatMessage } from "umi/locale";
import { isTLS, removeHttpSchema } from "@/utils/utils";

@Form.create()
export class InitialStep extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      needAuth: props.initialValue?.basic_auth !== undefined,
      isPageTLS: isTLS(props.initialValue?.endpoint)
    };
  }
  handleAuthChange = (val) => {
    this.setState({
      needAuth: val,
    });
  };
  handleEndpointChange = (event) => {
    const val = event.target.value;
    this.setState({
      isPageTLS: isTLS(val)
    })
  };
  isPageTLSChange = (val) => {
    this.setState({
      isPageTLS: val,
    });
  };
  render() {
    const {
      form: { getFieldDecorator },
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
    return (
      <Form {...formItemLayout} form={this.props.formRef}>
        <Form.Item label="Endpoint">
          {getFieldDecorator("endpoint", {
            initialValue: removeHttpSchema(initialValue?.endpoint || ""),
            normalize: (value) => {
              return removeHttpSchema(value || "").trim()
            },
            validateTrigger: ["onChange", "onBlur"],
            rules: [
              {
                required: true,
                message: formatMessage({
                  id: "gateway.instance.field.endpoint.form.required",
                }),
              },
              {
                type: "string",
                pattern: /^([\w.-]+(:\d+)?)([/][\w.-]*)*\/?$/, //(https?:\/\/)?
                message: formatMessage({
                  id: "cluster.regist.form.verify.valid.endpoint",
                }),
              },
            ],
          })(
            <Input placeholder="Instance api endpoint eg: 127.0.0.1:2900" onChange={this.handleEndpointChange}/>
          )}
        </Form.Item>
        <Form.Item label="TLS">
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
          <Switch
            defaultChecked={this.state.needAuth}
            onChange={this.handleAuthChange}
            checkedChildren={<Icon type="check" />}
            unCheckedChildren={<Icon type="close" />}
          />
        </Form.Item>
        {this.state.needAuth === true ? (
          <div>
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
                    message: "Please input auth username!",
                  },
                ],
              })(<Input autoComplete="off" placeholder="auth user name" />)}
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
                    message: "Please input auth password!",
                  },
                ],
              })(
                <Input.Password
                  autoComplete="off"
                  placeholder="auth user password"
                />
              )}
            </Form.Item>
          </div>
        ) : null}
      </Form>
    );
  }
}
