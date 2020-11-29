import React, { Component } from 'react';
import { connect } from 'dva';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import {Steps, Card, Form, Select, Input,Button, Divider,message,Spin, Row, Col,Result} from 'antd';

const {Step} = Steps;
const {Option} = Select;
const {TextArea} = Input;

@Form.create()
@connect()
class Rebuild extends Component {
  state = {
    currentStep: 0,
    configData: {},
  }
  renderSteps(currentStep){
    var stepDom = '';
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 8 },
        sm: { span: 8 },
        md:{span:4},
      },
      wrapperCol: {
        xs: { span: 16 },
        sm: { span: 16 },
        md:{span:20},
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
          offset: 8,
        },
        md:{
          span: 20,
          offset: 4,
        }
      },
    };
    switch(currentStep){
      case 0:
        stepDom = (
          <div style={{marginTop:20}}>
            <Form.Item {...formItemLayout}  label="选择源索引">
              {getFieldDecorator('source_index', {
                initialValue: this.state.configData.source_index,
                rules: [{ required: true, message: '请选择要重建的索引' }],
              })(
                <Select
                  showSearch
                  style={{ width: 200 }}
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                <Option value="logs">logs</Option>
                <Option value="blogs">blogs</Option>
                <Option value="filebeat">filebeat</Option>
              </Select>,
              )}
            </Form.Item>
            <Form.Item {...formItemLayout} label="过滤条件">
                {getFieldDecorator('creterial', {
                initialValue: this.state.configData.creterial,
                rules: [
                    {required: true, },
                ],
                })(
                <TextArea
                    style={{ width: '80%' }}
                    rows={8}
                />
                )}
              </Form.Item>
            <Form.Item {...tailFormItemLayout}>
               {this.renderFooter(currentStep)}
            </Form.Item>
          </div>
        )
        break;
        case 1:
          stepDom = (
            <div style={{marginTop:20}}>
              <Form.Item {...formItemLayout}  label="目标索引名">
                {getFieldDecorator('target_index', {
                  initialValue: this.state.configData.target_index,
                  rules: [{ required: true, message: '请输入目标索引名称' }],
                })(
                  <Input style={{width:200}} />
                )}
              </Form.Item>
              <Form.Item {...formItemLayout} label="目标索引设置">
                  {getFieldDecorator('target_setting', {
                  initialValue: this.state.configData.target_setting,
                  rules: [
                      {required: true, },
                  ],
                  })(
                  <TextArea
                      style={{ width: '80%' }}
                      rows={8}
                  />
                  )}
                </Form.Item>
              <Form.Item {...tailFormItemLayout}>
                 {this.renderFooter(currentStep)}
              </Form.Item>
            </div>
          )
          break;
        case 2:
          stepDom = (
            <div>
              <Spin tip="数据正在重建，请稍等...">
                <div style={{width:'100%', height: 200}}></div>
              </Spin>
              <div style={{textAlign:'center',}}>
                {this.renderFooter(currentStep)}
              </div>
            </div>
          )
          break;
        case 3:
          stepDom = (<Result
            status="success"
            title="数据重建成功"
            subTitle=""
            extra={[
              // <Button type="primary" key="console">
              // </Button>,
              <Button key="continue">继续重建</Button>,
            ]}
          />)
          break;
    }
    return stepDom;
  }

  handleNext(currentStep){
    const { form } = this.props;
    const { configData: oldValue } = this.state;
    var formValues = {};
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      switch(currentStep){
        case 0:
          break;
        case 1:
         
          break;
      }
      formValues = fieldsValue;
    });
    this.setState({
      configData: {
        ...oldValue,
        ...formValues,
      },
      currentStep: currentStep+1
    },()=>{
      message.info(JSON.stringify(this.state));
    });
  }
  backward(currentStep){
    if(currentStep > 0){
      currentStep = currentStep - 1;
    }
    this.setState({
      currentStep: currentStep,
    });
  }
  renderFooter = currentStep => {
    if (currentStep === 1 || currentStep ==2) {
      return [
        <Button key="back" onClick={()=>this.backward(currentStep)}>
          上一步
        </Button>,
        <Button key="cancel"  style={{margin:'auto 2em'}} onClick={() =>{}}>
          取消
        </Button>,
        <Button key="forward" type="primary" onClick={() => this.handleNext(currentStep)}>
          下一步
        </Button>,
      ];
    }
    if (currentStep === 3) {
      return [
        <Button key="back" style={{ float: 'left' }} onClick={()=>this.backward(currentStep)}>
          上一步
        </Button>,
        <Button key="cancel" style={{margin:'auto 2em'}} onClick={() => {}}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={() =>{}}>
          完成
        </Button>,
      ];
    }
    return [
      <Button key="cancel" onClick={() => {}}>
        取消
      </Button>,
      <Button style={{marginLeft:'2em'}} key="forward" type="primary" onClick={() => this.handleNext(currentStep)}>
        下一步
      </Button>,
    ];
  };
  render() {
    return (
      <PageHeaderWrapper >
        <Card>
          <Steps current={this.state.currentStep}>
            <Step title="源索引信息"  /> 
            <Step title="目标索引信息" />
            <Step title="数据重建中" subTitle="剩余 00:00:08"  />
            <Step title="重建结果" />
          </Steps>
          <Divider/>
          {this.renderSteps(this.state.currentStep)}
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default Rebuild;
