import React, { Component } from 'react';
import { connect } from 'dva';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import {Steps, Card, Form, Select, Input,Button, Divider,message, InputNumber} from 'antd';
import InputSelect from '@/components/infini/InputSelect';

const {Step} = Steps;
const {Option} = Select;
const {TextArea} = Input;

@Form.create()
@connect(({document,rebuild}) => ({
  document,
  rebuild,
}))
class Rebuild extends Component {
  state = {
   selectedSourceIndex: ''
  }
  componentDidMount(){
    const {dispatch} = this.props;
    dispatch({
      type:'document/fetchIndices',
      payload:{
        cluster: 'sinlge-es'
      }
    })
    dispatch({
      type: 'rebuild/fetchMappings',
      payload: {
        index: ''
      }
    })
  }
  getFields = (index)=>{
    if(!index){
      return [];
    }
    let {mappings} = this.props.rebuild;
    let filterMappings = {};
    if(index.indexOf("*")>0){
      index = index.replace("*", '');
      for(let key in mappings){
        if(key.startsWith(index)){
          filterMappings['key'] = mappings[key];
        }
      }
    }else{
      if(!mappings[index]){
        return [];
      }
      filterMappings[index] = mappings[index];
    }
    
    let fields = [];
    for(let key in filterMappings){
      for(let fi in filterMappings[key].mappings.properties){
        fields.push(fi);
      }
    }

    return fields;
  }
  handleSourceIndexChange = (v) =>{
    const {dispatch, form} = this.props;
    form.setFieldsValue({
      source__source: [],
    });
    dispatch({
      type: 'rebuild/saveData',
      payload: {
        selectedSourceIndex: v
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
    let {configData, selectedSourceIndex} = this.props.rebuild;
   
    switch(currentStep){
      case 0:
        stepDom = (
          <div style={{marginTop:20}}>
            <Form.Item {...formItemLayout}  label="Task Name">
              {getFieldDecorator('name', {
                initialValue: configData.name,
                rules: [{ required: true, message: 'please input a task name' }],
              })(
               <Input autoComplete="off" style={{width: 200}}/>
              )}
            </Form.Item>
            <Form.Item {...formItemLayout} label="Task Description">
                {getFieldDecorator('desc', {
                initialValue: configData.desc,
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
                initialValue: configData.source.index,
                rules: [{ required: true, message: '请选择要重建的索引' }],
              })(
                <InputSelect onChange={this.handleSourceIndexChange} data={indices} style={{width: 200}}/>
              )}
            </Form.Item>
            <Form.Item {...formItemLayout} label="Query">
                {getFieldDecorator('source_query', {
                initialValue: configData.source.query,
                rules: [
                ],
                })(
                <TextArea
                    style={{ width: '80%' }}
                    rows={6}
                />
                )}
              </Form.Item>
              <Form.Item {...formItemLayout} label="_source">
                {getFieldDecorator('source__source', {
                initialValue: configData.source__source,
                rules: [
                ],
                })(
                  <Select mode="multiple" style={{width:'80%'}}>
                    {  this.getFields(selectedSourceIndex).map(item=>{
                      return (<Select.Option key={item} value={item}>{item}</Select.Option>)
                    })}
                  </Select>
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
                  initialValue: configData.dest.index || '',
                  rules: [{ required: true, message: '请输入目标索引名称' }],
                })(
                  <InputSelect data={indices} style={{width: 200}}/>
                )}
              </Form.Item>
              <Form.Item {...formItemLayout} label="Pipeline">
                  {getFieldDecorator('dest_pipeline', {
                  initialValue: configData.dest.source,
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
    const { configData: oldValue } = this.props.rebuild;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      let newValue = {};
      if(fieldsValue['source_query']){
        fieldsValue['source_query'] = JSON.parse(fieldsValue['source_query'])
      }
      for(let key in fieldsValue){
        if(key.startsWith('source_') && fieldsValue[key]){
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
      dispatch({
        type:"rebuild/saveData",
        payload: {
          configData: {
            ...oldValue,
            ...newValue,
          },
          currentStep: currentStep+1
        }
      })
       // message.info(JSON.stringify(this.state));
    });
   
  }
  backward(currentStep){
    const {dispatch} = this.props;
    if(currentStep > 0){
      currentStep = currentStep - 1;
    }
    dispatch({
      type: 'rebuild/saveData',
      payload: {
        currentStep: currentStep,
      }
    })
  }
  renderFooter = currentStep => {
    if (currentStep === 1) {
      return [
        <Button key="back" onClick={()=>this.backward(currentStep)}>
          上一步
        </Button>,
        // <Button key="cancel"  style={{margin:'auto 2em'}} onClick={() =>{}}>
        //   取消
        // </Button>,
        <Button key="forward" style={{ marginLeft: '2em' }} type="primary" onClick={() => this.handleNext(currentStep)}>
          下一步
        </Button>,
      ];
    }
    if (currentStep === 2) {
      return [
        <Button key="back" onClick={()=>this.backward(currentStep)}>
          上一步
        </Button>,
        // <Button key="cancel" style={{margin:'auto 2em'}} onClick={() => {}}>
        //   取消
        // </Button>,
        <Button key="submit"  style={{ marginLeft: '2em' }} type="primary" onClick={() =>this.handleNext(currentStep)}>
          完成
        </Button>,
      ];
    }
    return [
      // <Button key="cancel" onClick={() => {}}>
      //   取消
      // </Button>,
      <Button key="forward" type="primary" onClick={() => this.handleNext(currentStep)}>
        下一步
      </Button>,
    ];
  };
  render() {
    const {currentStep} = this.props.rebuild;
    return (
      <PageHeaderWrapper >
        <Card>
          <Steps current={currentStep}>
            <Step title="基本信息" />
            <Step title="源索引信息"  /> 
            <Step title="目标索引信息" />
          </Steps>
          <Divider/>
          {this.renderSteps(currentStep)}
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default Rebuild;
