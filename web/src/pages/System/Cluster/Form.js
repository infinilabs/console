import React from 'react';
import {Card, Form, Icon, Input, InputNumber, Button, Switch} from 'antd';

@Form.create()
class ClusterForm extends React.Component{
  state = {
    confirmDirty: false,
  }
  compareToFirstPassword = (rule, value, callback) => {
    const { form } = this.props;
    if (value && value !== form.getFieldValue('password')) {
      callback('Two passwords that you enter is inconsistent!');
    } else {
      callback();
    }
  };

  validateToNextPassword = (rule, value, callback) => {
    const { form } = this.props;
    if (value && this.state.confirmDirty) {
      form.validateFields(['confirm'], { force: true });
    }
    callback();
  };
  render() {
    const {getFieldDecorator} = this.props.form;
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
    const tailFormItemLayout = {
      wrapperCol: {
        xs: {
          span: 24,
          offset: 0,
        },
        sm: {
          span: 16,
          offset: 6,
        },
      },
    };
    return (
      <Card>
      <Form {...formItemLayout} onSubmit={this.handleSubmit}>
        <Form.Item label="集群名称">
          {getFieldDecorator('name', {
            rules: [
              {
                required: true,
                message: 'Please input cluster name!',
              },
            ],
          })(<Input />)}
        </Form.Item>
        <Form.Item label="集群 URL">
          {getFieldDecorator('endpoint', {
            rules: [
              {
                type: 'url', //https://github.com/yiminghe/async-validator#type
                message: 'The input is not valid url!',
              },
              {
                required: true,
                message: 'Please input cluster name!',
              },
            ],
          })(<Input />)}
        </Form.Item>
        <Form.Item label="ES 用户名">
          {getFieldDecorator('username', {
            rules: [
            ],
          })(<Input />)}
        </Form.Item>
        <Form.Item label="ES 密码" hasFeedback>
          {getFieldDecorator('password', {
            rules: [
              {
                validator: this.validateToNextPassword,
              },
            ],
          })(<Input.Password />)}
        </Form.Item>
        <Form.Item label="ES 确认密码" hasFeedback>
          {getFieldDecorator('confirm', {
            rules: [
              {
                validator: this.compareToFirstPassword,
              },
            ],
          })(<Input.Password onBlur={this.handleConfirmBlur} />)}
        </Form.Item>
        <Form.Item label="排序权重">
          {getFieldDecorator('order', {
            initialValue: 0
          })(<InputNumber />)}
        </Form.Item>
        <Form.Item label="描述">
          {getFieldDecorator('order', {
          })(<Input.TextArea />)}
        </Form.Item>
        <Form.Item label="是否启用">
          {getFieldDecorator('enabled', {
            valuePropName: 'checked',
            initialValue: true
          })(<Switch
            checkedChildren={<Icon type="check" />}
            unCheckedChildren={<Icon type="close" />}
          />)}
        </Form.Item>
        <Form.Item {...tailFormItemLayout}>
          <Button type="primary" htmlType="submit">
            Register
          </Button>
        </Form.Item>
      </Form>
      </Card>
    )
  }
}

export default  ClusterForm;