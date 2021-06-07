import {Form, Input, Switch, Icon} from 'antd';
import {useState} from 'react';

@Form.create()
class InitialStep extends React.Component {
  state = {
    needAuth: false,
  }
  handleAuthChange = (val) => {
    this.setState({
      needAuth: val,
    })
  }
  render(){
    const {form:{getFieldDecorator}} = this.props;
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
      <Form {...formItemLayout} style={{marginTop:15}} form={this.props.formRef}>
        <Form.Item label="集群名称" >
          {getFieldDecorator('name', {
            initialValue: '',
            rules: [
              {
                required: true,
                message: 'Please input cluster name!',
              },
            ],
          })(<Input autoComplete='off' placeholder="cluster-name" />)}
        </Form.Item>
        <Form.Item label="集群 URL">
          {getFieldDecorator('endpoint', {
            initialValue: '',
            rules: [
              {
                type: 'url', 
                message: 'The input is not valid url!',
              },
              {
                required: true,
                message: 'Please input cluster endpoint!',
              },
            ],
          })(<Input placeholder="http://127.0.0.1:9200" />)}
        </Form.Item>
        <Form.Item label="是否需要身份验证">
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
            initialValue: '',
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
            initialValue: '',
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

export default InitialStep;