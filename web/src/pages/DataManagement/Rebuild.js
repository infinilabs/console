import React, { Component } from 'react';
import { connect } from 'dva';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import {Steps, Card, Form, Select, Input,Button, Divider,message, InputNumber} from 'antd';
import InputSelect from '@/components/infini/InputSelect';

const {Step} = Steps;
const {Option} = Select;
const {TextArea} = Input;

@Form.create()
@connect(({document}) => ({
  document
}))
class Rebuild extends Component {
  state = {
    currentStep: 0,
    configData: {
      source:{},
      dest:{},
    },
  }
  componentDidMount(){
    const {dispatch} = this.props;
    dispatch({
      type:'document/fetchIndices',
      payload:{
        cluster: 'sinlge-es'
      }
    })
  }
  renderSteps = (currentStep) => {
    let {clusterIndices} = this.props.document;
    clusterIndices = clusterIndices || [];
    let indices = clusterIndices.map((item)=>{
      return {
        label: item,
        value: item,
      }
    });
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
      style: {
        marginBottom: 10,
      }
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
            <Form.Item {...formItemLayout}  label="Task Name">
              {getFieldDecorator('name', {
                initialValue: this.state.configData.name,
                rules: [{ required: true, message: 'please input a task name' }],
              })(
               <Input autoComplete="off" style={{width: 200}}/>
              )}
            </Form.Item>
            <Form.Item {...formItemLayout} label="Task Description">
                {getFieldDecorator('desc', {
                initialValue: this.state.configData.creterial,
                rules: [
                ],
                })(
                <TextArea
                    style={{ width: '80%' }}
                    rows={6}
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
            <Form.Item {...formItemLayout}  label="选择源索引">
              {getFieldDecorator('source_index', {
                initialValue: this.state.configData.source.index,
                rules: [{ required: true, message: '请选择要重建的索引' }],
              })(
                <InputSelect data={indices} style={{width: 200}}/>
              )}
            </Form.Item>
            <Form.Item {...formItemLayout} label="Query">
                {getFieldDecorator('source_query', {
                initialValue: this.state.configData.source.query,
                rules: [
                    {required: true, },
                ],
                })(
                <TextArea
                    style={{ width: '80%' }}
                    rows={6}
                />
                )}
              </Form.Item>
              <Form.Item {...formItemLayout} label="max_docs">
                {getFieldDecorator('source_max_docs', {
                initialValue: this.state.configData.source_max_docs,
                rules: [
                ],
                })(
                  <InputNumber min={1} style={{width:200}}/>
                )}
              </Form.Item>
              <Form.Item {...formItemLayout} label="_source">
                {getFieldDecorator('source__source', {
                initialValue: this.state.configData.source__source,
                rules: [
                ],
                })(
                  <Input style={{width:'50%'}}/>
                )}
              </Form.Item>
              <Form.Item {...formItemLayout} label="sort">
                {getFieldDecorator('source_sort', {
                initialValue: this.state.configData.source_sort,
                rules: [
                ],
                })(
                  <Input style={{width:'50%'}}/>
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
            <div style={{marginTop:20}}>
              <span style={{height:1}}/>
              <Form.Item {...formItemLayout}  label="目标索引名">
                {getFieldDecorator('dest_index', {
                  initialValue: this.state.configData.dest.index || '',
                  rules: [{ required: true, message: '请输入目标索引名称' }],
                })(
                  <InputSelect data={indices} style={{width: 200}}/>
                )}
              </Form.Item>
              <Form.Item {...formItemLayout} label="Pipeline">
                  {getFieldDecorator('dest_pipeline', {
                  initialValue: this.state.configData.dest.source,
                  rules: [
                  ],
                  })(
                    <Input style={{width:200}}/>
                  )}
                </Form.Item>
              <Form.Item {...tailFormItemLayout}>
                 {this.renderFooter(currentStep)}
              </Form.Item>
            </div>
          )
          break;
    }
    return stepDom;
  }

  handleNext(currentStep){
    const { form, dispatch } = this.props;
    const { configData: oldValue } = this.state;
    var formValues = {};
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      let newValue = {};
      if(fieldsValue['source_query']){
        fieldsValue['source_query'] = JSON.parse(fieldsValue['source_query'])
      }
      for(let key in fieldsValue){
        if(key.startsWith('source_')){
          !newValue.source && (newValue.source ={})
          newValue.source[key.slice(7)] = fieldsValue[key]
        }else if(key.startsWith('dest_')){
          !newValue.dest && (newValue.dest ={})
          newValue.dest[key.slice(5)] = fieldsValue[key]
        }else{
          newValue[key] = fieldsValue[key];
        }
      }
      if(currentStep == 2){
        currentStep = 1;
        dispatch({
          type: 'rebuild/addTask',
          payload: {
            ...oldValue,
            ...newValue,
          }
        })
      }
      this.setState({
        configData: {
          ...oldValue,
          ...newValue,
        },
        currentStep: currentStep+1
      },()=>{
        message.info(JSON.stringify(this.state));
      });
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
    if (currentStep === 1) {
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
    if (currentStep === 2) {
      return [
        <Button key="back" style={{ float: 'left' }} onClick={()=>this.backward(currentStep)}>
          上一步
        </Button>,
        <Button key="cancel" style={{margin:'auto 2em'}} onClick={() => {}}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={() =>this.handleNext(currentStep)}>
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
            <Step title="基本信息" />
            <Step title="源索引信息"  /> 
            <Step title="目标索引信息" />
          </Steps>
          <Divider/>
          {this.renderSteps(this.state.currentStep)}
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default Rebuild;
