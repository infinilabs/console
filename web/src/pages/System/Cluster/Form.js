import React from 'react';
import {Card, Form, Icon, Input, InputNumber, Button, Switch} from 'antd';
import router from 'umi/router';

import  styles from './Form.less';
import {connect} from "dva";

@Form.create()
@connect(({clusterConfig}) =>({
  clusterConfig
}))
class ClusterForm extends React.Component{
  state = {
    confirmDirty: false,
  }
  componentDidMount() {
    //console.log(this.props.clusterConfig.editMode)
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

  handleSubmit = () =>{
    const {form, dispatch, clusterConfig} = this.props;
    form.validateFields((errors, values) => {
      if(errors){
        return
      }
      //console.log(values);
      let newVals = {
        ...values
      }
      delete(newVals['confirm']);
      if(clusterConfig.editMode === 'NEW') {
        dispatch({
          type: 'clusterConfig/addCluster',
          payload: newVals,
        }).then(function (rel){
          if(rel){
            router.push('/system/cluster');
          }
        });
      }else{
        newVals.id = clusterConfig.editValue.id;
        dispatch({
          type: 'clusterConfig/updateCluster',
          payload: newVals,
        }).then(function (rel){
          if(rel){
            router.push('/system/cluster');
          }
        });
      }
    })
  }

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
    const {editValue, editMode} = this.props.clusterConfig;
    return (
      <Card title={editMode === 'NEW' ? '注册集群': '修改集群配置'}>
      <Form {...formItemLayout}>
        <Form.Item label="集群名称">
          {getFieldDecorator('name', {
            initialValue: editValue.name,
            rules: [
              {
                required: true,
                message: 'Please input cluster name!',
              },
            ],
          })(<Input autoComplete='off' />)}
        </Form.Item>
        <Form.Item label="集群 URL">
          {getFieldDecorator('endpoint', {
            initialValue: editValue.endpoint,
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
            initialValue: editValue.username,
            rules: [
            ],
          })(<Input autoComplete='off' />)}
        </Form.Item>
        <Form.Item label="ES 密码" hasFeedback>
          {getFieldDecorator('password', {
            initialValue: editValue.password,
            rules: [
              {
                validator: this.validateToNextPassword,
              },
            ],
          })(<Input.Password />)}
        </Form.Item>
        <Form.Item label="ES 确认密码" hasFeedback>
          {getFieldDecorator('confirm', {
            initialValue: editValue.password,
            rules: [
              {
                validator: this.compareToFirstPassword,
              },
            ],
          })(<Input.Password onBlur={this.handleConfirmBlur} />)}
        </Form.Item>
        <Form.Item label="排序权重">
          {getFieldDecorator('order', {
            initialValue: editValue.order,
          })(<InputNumber />)}
        </Form.Item>
        <Form.Item label="描述">
          {getFieldDecorator('description', {
            initialValue: editValue.description,
          })(<Input.TextArea />)}
        </Form.Item>
        <Form.Item label="是否启用">
          {getFieldDecorator('enabled', {
            valuePropName: 'checked',
            initialValue: typeof editValue.enabled === 'undefined' ? true: editValue.enabled,
          })(<Switch
            checkedChildren={<Icon type="check" />}
            unCheckedChildren={<Icon type="close" />}
          />)}
        </Form.Item>
        <Form.Item {...tailFormItemLayout}>
          <Button type="primary" onClick={this.handleSubmit}>
            {editMode === 'NEW' ? 'Register': 'Save'}
          </Button>
        </Form.Item>
      </Form>
      </Card>
    )
  }
}

export default  ClusterForm;