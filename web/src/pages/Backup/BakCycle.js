import React, { PureComponent, Fragment,forwardRef } from 'react';
import { connect } from 'dva';
import {
  Row,
  Col,
  Card,
  Form,
  Input,
  Button,
  Modal,
  message,
  Divider,
  Drawer,
  Steps,
  Select,
  TimePicker,
  Switch,
  Icon, Table,
} from 'antd';
import moment from 'moment';

const FormItem = Form.Item;
const { TextArea } = Input;

let RightSwitch = forwardRef((props, _ref) => {
  return (
    <div>
      <Switch
        name={props.id}
        checkedChildren={<Icon type="check" />}
        unCheckedChildren={<Icon type="close" />}
        checked={props.value}
        style={{marginRight:5}}
        onChange={(v)=>{props.onChange(v)}}
      />
      {props.description}
  </div>
  )
});

@Form.create()
class NewForm extends PureComponent {
  state = {
    currentStep: 0,
  }
  
    renderStep=()=>{
      let {form} = this.props;
      let retDom = '';
      let formLayout = {
        labelCol:{span:5},
        wrapperCol:{span:15}
      };
      let sformLayout = {
        labelCol:{span:15},
        wrapperCol:{span:5}
      };
      const format = 'HH:mm';
      switch(this.state.currentStep){
        case 0:
          retDom = (
            <Form>
              <Form.Item label="策略名称" {...formLayout}>
                {form.getFieldDecorator('name', {
                  rules: [{ required: true }],
                })(<Input placeholder="请输入策略名称"  />)}
              </Form.Item>
              <Form.Item label="快照名称" {...formLayout}>
                {form.getFieldDecorator('snapshot', {
                  rules: [{ required: true }],
                })(<Input placeholder="请输入快照名称" />)}
              </Form.Item>
              <Form.Item label="选择仓库" {...formLayout}>
                {form.getFieldDecorator('repo', {
                  rules: [{ required: true }],
                })(
                  <Select>
                    <Select.Option value="my_local_repo">
                      my_local_repo
                    </Select.Option>
                    <Select.Option value="my_local_repo">
                      my_remote_repo
                    </Select.Option>
                  </Select>
                )}
              </Form.Item>
              <Form.Item label="频率" {...formLayout}>
                {form.getFieldDecorator('frequency', {
                  rules: [{ required: true }],
                })(
                  <Select>
                    <Select.Option value="day">
                      每天
                    </Select.Option>
                    <Select.Option value="month">
                      每月
                    </Select.Option>
                  </Select>
                )}
              </Form.Item>
              <Form.Item label="时间" {...formLayout}>
                {form.getFieldDecorator('time', {
                  rules: [{ required: true }],
                })(
                  <TimePicker format={format} />
                )}
              </Form.Item>
            </Form>
          );
          break;
        case 1:
          retDom = (
            <Form>
              <Form.Item label="">
                {form.getFieldDecorator('indices', {
                  initialValue: true,
                })(
                  <RightSwitch description="all data streams and indices, including system indices"/>
                )}
              </Form.Item>
              <Form.Item>
                {form.getFieldDecorator('unavaiable', {
                initialValue: false,
                })(
                  <RightSwitch description="Ignore unavaiable indices"/>
                )}
              </Form.Item>
              <Form.Item label="">
                {form.getFieldDecorator('partial', {
                // initialValue: true,
                })(
                  <RightSwitch description="Allow partial indices"/>
                )}
              </Form.Item>
              <Form.Item label="" >
                {form.getFieldDecorator('global', {
                initialValue: true,
                })(
                  <RightSwitch description="Include global state"/>
                )}
              </Form.Item>
            </Form>
          );
          break;
        case 2:
          break;
      }
      return retDom;
    }
    handleNext(currentStep){
      const {form} = this.props;
      form.validateFieldsAndScroll((err, values) => {
        console.log(values);
      });
      form.validate
      this.setState({
        currentStep: currentStep +1,
      });
    }
    backward(){
      this.setState(preState=>{
        if(preState.currentStep < 1) {
          return preState;
        }
        return {
          currentStep: preState.currentStep - 1
        };
      });
    }
    
    render(){
      const {currentStep} = this.state;
      return (
        <div>
          <Steps current={this.state.currentStep}>
            <Steps.Step title="基本设置" description=""/>
            <Steps.Step title="快照设置" description=""/>
            <Steps.Step title="快照保存设置" description=""/>
            <Steps.Step title="确认" description=""/>
          </Steps>
          <Divider />
          {this.renderStep()}
          <div style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: '100%',
              borderTop: '1px solid #e9e9e9',
              padding: '10px 16px',
              background: '#fff',
            }}>
            <Button key="back" onClick={()=>this.backward(currentStep)}>
            上一步
            </Button>
            <Button key="forward" style={{marginLeft:'2em'}}  type="primary" onClick={() => this.handleNext(currentStep)}>
              下一步
            </Button>
            <Button key="cancel"  style={{float:'right'}} onClick={() =>{}}>
              取消
            </Button>         
          </div>
        </div>
      )
    }
}

/* eslint react/no-multi-comp:0 */
@connect(({ pipeline, loading }) => ({
  pipeline,
  loading: loading.models.pipeline,
}))
@Form.create()
class BakCycle extends PureComponent {
  state = {
    modalVisible: false,
    updateModalVisible: false,
    expandForm: false,
    selectedRows: [],
    formValues: {},
    updateFormValues: {},
    drawerVisible: false,
  };
  datasource = `{"ilm-history-ilm-policy":{"version":1,"modified_date":"2020-08-28T13:19:39.550Z","policy":{"phases":{"hot":{"min_age":"0ms","actions":{"rollover":{"max_size":"50gb","max_age":"30d"}}},"delete":{"min_age":"90d","actions":{"delete":{"delete_searchable_snapshot":true}}}}}},"watch-history-ilm-policy":{"version":1,"modified_date":"2020-08-28T13:19:39.460Z","policy":{"phases":{"delete":{"min_age":"7d","actions":{"delete":{"delete_searchable_snapshot":true}}}}}},"kibana-event-log-policy":{"version":1,"modified_date":"2020-08-28T13:43:28.035Z","policy":{"phases":{"hot":{"min_age":"0ms","actions":{"rollover":{"max_size":"50gb","max_age":"30d"}}},"delete":{"min_age":"90d","actions":{"delete":{"delete_searchable_snapshot":true}}}}}},"metrics":{"version":1,"modified_date":"2020-08-28T13:19:39.367Z","policy":{"phases":{"hot":{"min_age":"0ms","actions":{"rollover":{"max_size":"50gb","max_age":"30d"}}}}}},"ml-size-based-ilm-policy":{"version":1,"modified_date":"2020-08-28T13:19:39.166Z","policy":{"phases":{"hot":{"min_age":"0ms","actions":{"rollover":{"max_size":"50gb"}}}}}},"filebeat":{"version":1,"modified_date":"2020-08-29T10:49:38.774Z","policy":{"phases":{"hot":{"min_age":"0ms","actions":{"rollover":{"max_size":"50gb","max_age":"30d"}}}}}},"logs":{"version":1,"modified_date":"2020-08-28T13:19:39.289Z","policy":{"phases":{"hot":{"min_age":"0ms","actions":{"rollover":{"max_size":"50gb","max_age":"30d"}}}}}},"slm-history-ilm-policy":{"version":1,"modified_date":"2020-08-28T13:19:39.637Z","policy":{"phases":{"hot":{"min_age":"0ms","actions":{"rollover":{"max_size":"50gb","max_age":"30d"}}},"delete":{"min_age":"90d","actions":{"delete":{"delete_searchable_snapshot":true}}}}}}}`;
  parseData = ()=>{
    let ds = JSON.parse(this.datasource);
    var values = [];
    for(let key in ds){
      values.push({
        name: key,
        ...ds[key],
        policy: JSON.stringify(ds[key].policy),
      });
    }
    return values;
  }
  columns = [
    {
      title: '策略名称',
      dataIndex: 'name',
    },
    {
      title: '修改日期',
      dataIndex: 'modified_date',
    },
    {
      title: '版本',
      dataIndex: 'version'
    },
    {
      title: '操作',
      render: (text, record) => (
        <Fragment>
          <a onClick={() => this.handleUpdateModalVisible(true, record)}>设置</a>
          <Divider type="vertical" />
          <a onClick={() => {
            this.state.selectedRows.push(record);
            this.handleDeleteClick();
          }}>删除</a>
        </Fragment>
      ),
    },
  ];

  componentDidMount() {
    const { dispatch } = this.props;
    // dispatch({
    //   type: 'pipeline/fetch',
    // });
  }

  handleStandardTableChange = (pagination, filtersArg, sorter) => {
    const { dispatch } = this.props;
    const { formValues } = this.state;

    const filters = Object.keys(filtersArg).reduce((obj, key) => {
      const newObj = { ...obj };
      newObj[key] = getValue(filtersArg[key]);
      return newObj;
    }, {});

    const params = {
      currentPage: pagination.current,
      pageSize: pagination.pageSize,
      ...formValues,
      ...filters,
    };
    if (sorter.field) {
      params.sorter = `${sorter.field}_${sorter.order}`;
    }

    dispatch({
      type: 'pipeline/fetch',
      payload: params,
    });
  };

  handleFormReset = () => {
    const { form, dispatch } = this.props;
    form.resetFields();
    this.setState({
      formValues: {},
    });
    dispatch({
      type: 'pipeline/fetch',
      payload: {},
    });
  };

  handleDeleteClick = e => {
    const { dispatch } = this.props;
    const { selectedRows } = this.state;

    if (!selectedRows) return;
        dispatch({
          type: 'pipeline/delete',
          payload: {
            key: selectedRows.map(row => row.name),
          },
          callback: () => {
            this.setState({
              selectedRows: [],
            });
          },
        });
  };

  handleSelectRows = rows => {
    this.setState({
      selectedRows: rows,
    });
  };

  handleSearch = e => {
    e.preventDefault();

    const { dispatch, form } = this.props;

    form.validateFields((err, fieldsValue) => {
      if (err) return;

      const values = {
        ...fieldsValue,
        updatedAt: fieldsValue.updatedAt && fieldsValue.updatedAt.valueOf(),
      };

      this.setState({
        formValues: values,
      });

      dispatch({
        type: 'rule/fetch',
        payload: values,
      });
    });
  };

  handleModalVisible = flag => {
    this.setState({
      modalVisible: !!flag,
    });
  };

  handleUpdateModalVisible = (flag, record) => {
    this.setState({
      updateModalVisible: !!flag,
      updateFormValues: record || {},
    });
  };

  handleAdd = fields => {
    const { dispatch } = this.props;
    dispatch({
      type: 'pipeline/add',
      payload: {
        name: fields.name,
        desc: fields.desc,
        processors: fields.processors,
      },
    });

    message.success('添加成功');
    this.handleModalVisible();
  };

  handleUpdate = fields => {
    const { dispatch } = this.props;
    dispatch({
      type: 'pipeline/update',
      payload: {
        name: fields.name,
        desc: fields.desc,
        processors: fields.processors,
      },
    });

    message.success('修改成功');
    this.handleUpdateModalVisible();
  };

  handleNewClick = ()=>{
    this.setState({
      drawerVisible: true,
    });
  };

  onCloseDrawer = ()=>{
    this.setState({
      drawerVisible: false,
    });
  };

  render() {
    const {
      form: { getFieldDecorator },
    } = this.props;

    return (
      <Fragment>
        <Card bordered={false}>
          <div >
            <div>
                <Row gutter={{md:16, sm:8}}>
                  <Col md={16}  lg={8}>
                    备份策略模板名称：<Input style={{width:200}} placeholder="请输入" />
                  </Col>
                  <Col md={8} lg={16}>
                    <span>
                      <Button type="primary" htmlType="submit">
                        查询
                      </Button>
                      <Button style={{ marginLeft: 8 }} onClick={this.handleFormReset}>
                        重置
                      </Button>
                    </span>
                  </Col>
                </Row>
            </div>
            <div style={{marginBottom: 10, marginTop:10}}>
              <Button icon="plus" type="primary" onClick={() => this.handleNewClick(true)}>
                新建
              </Button>
            </div>
            <Table
              size={"small"}
              dataSource={this.parseData()}
              columns={this.columns}
              rowKey="name"
              bordered
            />
          </div>
        </Card>
          <Drawer
              title="备份策略"
              placement="right"
              width={640}
              onClose={this.onCloseDrawer}
              visible={this.state.drawerVisible}
            >
             <NewForm />
          </Drawer>
      </Fragment>
    );
  }
}

export default BakCycle;
