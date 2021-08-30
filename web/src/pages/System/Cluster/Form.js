import React from 'react';
import {Card, Form, Icon, Input, InputNumber, Button, Switch, message, Spin} from 'antd';
import router from 'umi/router';

import  styles from './Form.less';
import {connect} from "dva";
import NewCluster from './Step';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';

@Form.create()
@connect(({clusterConfig}) =>({
  clusterConfig
}))
class ClusterForm extends React.Component{
  constructor(props) {
    super(props);
    let editValue = this.props.clusterConfig.editValue;
    let needAuth = false;
    if(editValue.basic_auth && typeof editValue.basic_auth.username !== 'undefined' && editValue.basic_auth.username !== ''){
      needAuth = true;
    }
    this.state = {
      confirmDirty: false,
      needAuth: needAuth,
      isLoading: false,
    }
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
        name: values.name,
        host: values.host,
        basic_auth: {
          username: values.username,
          password: values.password,
        },
        description: values.description,
        enabled: values.enabled,
        monitored: values.monitored,
        version: values.version,
        schema: values.isTLS === true ? 'https': 'http',
        // order: values.order,
      }
      if(clusterConfig.editMode === 'NEW') {
        dispatch({
          type: 'clusterConfig/addCluster',
          payload: newVals,
        }).then(function (rel){
          if(rel){
            message.success("添加成功")
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
            message.success("修改成功")
            router.push('/system/cluster');
          }
        });
      }
    })
  }

  handleAuthChange = (val) => {
    this.setState({
      needAuth: val,
    })
  }

  tryConnect = async ()=>{
    const {dispatch, form} = this.props;
    const values =  await form.validateFields((errors, values) => {
      if(errors){
        return false;
      }
      let newVals = {
        name: values.name,
        host: values.host,
        basic_auth: {
          username: values.username,
          password: values.password,
        },
        schema: values.isTLS === true ? 'https': 'http',
      }
      return values;
    });
    if(!values){
      return
    }
    this.setState({isLoading: true})
    const res = await dispatch({
      type: 'clusterConfig/doTryConnect',
      payload: values
    });
    if(res){
      message.success('连接成功！')
      form.setFieldsValue({
        version: res.version
      })
    }
    this.setState({isLoading: false})
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
    <PageHeaderWrapper>
      <Card title={editMode === 'NEW' ? '注册集群': '修改集群配置'}
        extra={[<Button type="primary" onClick={()=>{
          router.push('/system/cluster');
        }}>返回</Button>]}
      >
      <Spin spinning={this.state.isLoading}>
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
          })(<Input autoComplete='off' placeholder="cluster-name" />)}
        </Form.Item>
        <Form.Item label="集群地址">
          {getFieldDecorator('host', {
            initialValue: editValue.host,
            rules: [
              {
                type: 'string',
                pattern: /^[\w\.]+\:\d+$/, //(https?:\/\/)?
                message: '请输入域名或 IP 地址和端口号',
              },
              {
                required: true,
                message: '请输入域名或 IP 地址和端口号!',
              },
            ],
          })(<Input placeholder="127.0.0.1:9200" />)}
        </Form.Item>
        <Form.Item style={{marginBottom:0}}>
          {getFieldDecorator('version', {
            initialValue: editValue.version,
            rules: [
            ],
          })(<Input type="hidden"/>)}
        </Form.Item>
        <Form.Item label="TLS">
        {getFieldDecorator('isTLS', {
            initialValue: editValue?.schema === "https",
        })(
          <Switch
          defaultChecked={editValue?.schema === "https"}
            checkedChildren={<Icon type="check" />}
            unCheckedChildren={<Icon type="close" />}
          />)}
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
            initialValue: editValue.basic_auth?.username,
            rules: [
            ],
          })(<Input autoComplete='off' />)}
        </Form.Item>
        <Form.Item label="密码" hasFeedback>
          {getFieldDecorator('password', {
            initialValue: editValue.basic_auth?.password,
            rules: [
            ],
          })(<Input.Password />)}
        </Form.Item>
        </div>):''}
        {/* <Form.Item label="排序权重">
          {getFieldDecorator('order', {
            initialValue: editValue.order || 0,
          })(<InputNumber />)}
        </Form.Item> */}
        <Form.Item label="描述">
          {getFieldDecorator('description', {
            initialValue: editValue.description,
          })(<Input.TextArea placeholder="集群应用描述" />)}
        </Form.Item>
        {/* <Form.Item label="是否启用">
          {getFieldDecorator('enabled', {
            valuePropName: 'checked',
            initialValue: typeof editValue.enabled === 'undefined' ? true: editValue.enabled,
          })(<Switch
            checkedChildren={<Icon type="check" />}
            unCheckedChildren={<Icon type="close" />}
          />)}
        </Form.Item> */}
        <Form.Item label="启用监控">
          {getFieldDecorator('monitored', {
            valuePropName: 'checked',
            initialValue: typeof editValue.monitored === 'undefined' ? true: editValue.monitored,
          })(<Switch
            checkedChildren={<Icon type="check" />}
            unCheckedChildren={<Icon type="close" />}
          />)}
        </Form.Item>
        <Form.Item {...tailFormItemLayout}>
          <Button type="primary" onClick={this.handleSubmit}>
            {editMode === 'NEW' ? '注册': '保存'}
          </Button>
          <Button style={{marginLeft: 15}} onClick={this.tryConnect}>
              测试连接
          </Button>
        </Form.Item>
      </Form>
      </Spin>
      </Card>
      </PageHeaderWrapper>
    )
  }
}

export default  ClusterForm;
