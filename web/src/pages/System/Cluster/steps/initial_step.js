import {Form, Input, Switch, Icon} from 'antd';

@Form.create()
export class InitialStep extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      needAuth: props.initialValue?.username !== undefined,
    }
  }
  handleAuthChange = (val) => {
    this.setState({
      needAuth: val,
    })
  }
  render(){
    const {form:{getFieldDecorator}, initialValue} = this.props;
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
        <Form.Item label="集群地址">
          {getFieldDecorator('host', {
            initialValue: initialValue?.host || '',
            rules: [
              {
                type: 'string',
                pattern: /^[\w\.]+\:\d+$/, //(https?:\/\/)?
                message: '请输入域名或 IP 地址和端口号',
              },
              {
                required: true,
                message: '请输入集群地址!',
              },
            ],
          })(<Input placeholder="127.0.0.1:9200" />)}
        </Form.Item>
        <Form.Item label="TLS">
        {getFieldDecorator('isTLS', {
            initialValue: initialValue?.isTLS || false,
        })(
          <Switch
            checkedChildren={<Icon type="check" />}
            unCheckedChildren={<Icon type="close" />}
          />)}
        </Form.Item>
        <Form.Item label="身份验证">
          <Switch
            defaultChecked={this.state.needAuth}
            onChange={this.handleAuthChange}
            checkedChildren={<Icon type="check" />}
            unCheckedChildren={<Icon type="close" />}
          />
        </Form.Item>
        {this.state.needAuth === true ? (<div>
        <Form.Item label="用户名">
          {getFieldDecorator('username', {
            initialValue: initialValue?.username || '',
            rules: [
              {
                required: true,
                message: 'Please input auth username!',
              },
            ],
          })(<Input autoComplete='off'  placeholder="auth user name"  />)}
        </Form.Item>
        <Form.Item label="密码" hasFeedback>
          {getFieldDecorator('password', {
            initialValue: initialValue?.password || '',
            rules: [
              {
                required: true,
                message: 'Please input auth password!',
              },
            ],
          })(<Input.Password autoComplete='off' placeholder="auth user password"/>)}
        </Form.Item>
        </div>):null}
      </Form>
      )
    }
}