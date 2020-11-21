import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import moment from 'moment';
import {
  Row,
  Col,
  Card,
  Form,
  Input,
  Select,
  Icon,
  Button,
  Dropdown,
  Menu,
  InputNumber,
  DatePicker,
  Modal,
  message,
  Badge,
  Divider,
  Steps,
  Drawer
} from 'antd';
import StandardTable from '@/components/StandardTable';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';

import styles from '../List/TableList.less';

const FormItem = Form.Item;
const { Step } = Steps;
const { TextArea } = Input;
const { Option } = Select;
const getValue = obj =>
  Object.keys(obj)
    .map(key => obj[key])
    .join(',');

const CreateForm = Form.create()(props => {
  const { modalVisible, form, handleAdd, handleModalVisible } = props;
  const okHandle = () => {
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      form.resetFields();
      handleAdd(fieldsValue);
    });
  };
  return (
    <Modal
      destroyOnClose
      title="新建Pipeline"
      visible={modalVisible}
      width={640}
      onOk={okHandle}
      onCancel={() => handleModalVisible()}
    >
       <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="名称">
        {form.getFieldDecorator('name', {
          rules: [{ required: true, message: '请输入至少五个字符的名称！', min: 5 }],
        })(<Input placeholder="请输入名称" />)}
      </FormItem>
      <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="描述">
        {form.getFieldDecorator('desc', {
          rules: [{ required: false }],
        })(<Input placeholder="请输入" />)}
      </FormItem>
      <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="处理器">
        {form.getFieldDecorator('processors', {
          rules: [{ required: true }],
        })(<TextArea
          style={{ minHeight: 24 }}
          placeholder="请输入"
          rows={9}
      />)}
      </FormItem>
    </Modal>
  );
});

const UpdateForm = Form.create()(props => {
  const { updateModalVisible, handleUpdateModalVisible, handleUpdate,values,form } = props;

  const okHandle = () => {
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      form.resetFields();
      handleUpdate(fieldsValue);
    });
  };
  
  return (
    <Modal
      destroyOnClose
      title="更新Pipeline"
      visible={updateModalVisible}
      width={640}
      onOk={okHandle}
      onCancel={() => handleUpdateModalVisible()}
    >
       <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="名称">
        {form.getFieldDecorator('name', {
          initialValue: values.name,
          rules: [{ required: true, message: '请输入至少五个字符的名称！', min: 5 }],
        })(<Input placeholder="请输入名称" />)}
      </FormItem>
      <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="描述">
        {form.getFieldDecorator('desc', {
          initialValue: values.desc,
          rules: [{ required: false }],
        })(<Input placeholder="请输入" />)}
      </FormItem>
      <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="处理器">
        {form.getFieldDecorator('processors', {
          initialValue: values.processors,
          rules: [{ required: true }],
        })(<TextArea
          style={{ minHeight: 24 }}
          placeholder="请输入"
          rows={9}
      />)}
      </FormItem>
    </Modal>
  );
});

/* eslint react/no-multi-comp:0 */
@connect(({ pipeline, loading }) => ({
  pipeline,
  loading: loading.models.pipeline,
}))
@Form.create()
class IngestPipeline extends PureComponent {
  state = {
    modalVisible: false,
    updateModalVisible: false,
    expandForm: false,
    selectedRows: [],
    formValues: {},
    updateFormValues: {},
    drawerVisible: false,
    btnSaveExtraLoading: false,
  };

  columns = [
    {
      title: '名称',
      dataIndex: 'name',
    },
    {
      title: '描述',
      dataIndex: 'desc',
    },
    {
      title: '处理器',
      dataIndex: 'processors',
      ellipsis: true,
    },
    {
      title: '操作',
      render: (text, record) => (
        <Fragment>
          <a onClick={() => this.handleUpdateModalVisible(true, record)}>编辑</a>
          <Divider type="vertical" />
          <a onClick={() => {
            this.state.selectedRows.push(record);
            this.handleDeleteClick();
          }}>删除</a>
          <Divider type="vertical"/>
          <a onClick={() => {
            this.handlePipelineClick(record);
          }}>管道参数配置</a>
        </Fragment>
      ),
    },
  ];

  handlePipelineClick = (r)=>{
    this.setState((prevState)=>{
      let newState =  {
        drawerVisible: !prevState.drawerVisible,
      };
      if(r) {
        newState["editingRecord"] = r;
      }
      return newState;
    });
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'pipeline/fetch',
    });
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
    Modal.confirm({
      title: '删除Pipeline',
      content: '确定删除该Pipeline吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => this.deleteItem(),
    });
  };
  deleteItem = ()=>{
    const { dispatch } = this.props;
    const { selectedRows } = this.state;

    if (!selectedRows) return;
    dispatch({
      type: 'pipeline/delete',
      payload: {
        key: selectedRows.map(row => row.name),
      },
      callback: (res) => {
        if(res.message == "Ok"){
          this.setState({
            selectedRows: [],
          });
        }
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

  renderSimpleForm() {
    const {
      form: { getFieldDecorator },
    } = this.props;
    return (
      <Form onSubmit={this.handleSearch} layout="inline">
        <Row gutter={{ md: 8, lg: 24, xl: 48 }}>
          <Col md={8} sm={24}>
            <FormItem label="Pipeline 名称">
              {getFieldDecorator('name')(<Input placeholder="请输入" />)}
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <span className={styles.submitButtons}>
              <Button type="primary" htmlType="submit">
                查询
              </Button>
              <Button style={{ marginLeft: 8 }} onClick={this.handleFormReset}>
                重置
              </Button>
            </span>
          </Col>
        </Row>
      </Form>
    );
  }

  renderForm() {
    return this.renderSimpleForm();
  }

  handleSaveExtra = (r)=>{
    this.setState({btnSaveExtraLoading:true});
    const {form, dispatch} = this.props;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      console.log(fieldsValue);
      for(let key in fieldsValue){
        if(fieldsValue[key]){
          r[key] = fieldsValue[key];
        }
      }
      dispatch({
        type: 'pipeline/update',
        payload: r,
        callback: (res) => {
          if(res.message == "Ok"){
            this.setState({
              drawerVisible: false,
              editingRecord: null,
              btnSaveExtraLoading: false,
            });
          }
        },
      });
    });
  };

  render() {
    let {pipeline, loading, form} = this.props;
    const { selectedRows, modalVisible, updateModalVisible, updateFormValues,drawerVisible, editingRecord} = this.state;
    const parentMethods = {
      handleAdd: this.handleAdd,
      handleModalVisible: this.handleModalVisible,
    };
    const updateMethods = {
      handleUpdateModalVisible: this.handleUpdateModalVisible,
      handleUpdate: this.handleUpdate,
    };
    return (
      <Fragment>
        <Card bordered={false}>
          <div className={styles.tableList}>
            <div className={styles.tableListForm}>{this.renderForm()}</div>
            <div className={styles.tableListOperator}>
              <Button icon="plus" type="primary" onClick={() => this.handleModalVisible(true)}>
                新建
              </Button>
              {selectedRows.length > 0 && (
                <span>
                  <Button onClick={() => this.handleDeleteClick()}>删除</Button>
                </span>
              )}
            </div>
            <StandardTable
              selectedRows={selectedRows}
              loading={loading}
              data={pipeline.datalist}
              columns={this.columns}
              onSelectRow={this.handleSelectRows}
              onChange={this.handleStandardTableChange}
            />
          </div>
        </Card>
        <CreateForm {...parentMethods} modalVisible={modalVisible} />
        {updateFormValues && Object.keys(updateFormValues).length ? (
          <UpdateForm
            {...updateMethods}
            updateModalVisible={updateModalVisible}
            values={updateFormValues}
          />
        ) : null}
        { editingRecord &&(
        <Drawer title="管道参数配置" 
          width={640}
          onClose={this.handlePipelineClick}
          visible={drawerVisible}>
          <Form name="edit_extra">
          <FormItem labelCol={{ span: 6 }} wrapperCol={{ span: 15 }} label="工作线程数">
            {form.getFieldDecorator('thread_num', {
              initialValue: editingRecord.thread_num,
              rules: [{ required: true }],
            })(<Input placeholder="Number of cpu cores" />)}
          </FormItem>
          <FormItem labelCol={{ span: 6 }} wrapperCol={{ span: 15 }} label="管道批大小">
            {form.getFieldDecorator('batch_size', {
              initialValue: editingRecord.batch_size,
              rules: [{ required: true }],
            })(<Input placeholder="pipeline batch size" />)}
          </FormItem>
          <FormItem labelCol={{ span: 6 }} wrapperCol={{ span: 15 }} label="管道批延迟">
            {form.getFieldDecorator('batch_delay', {
              initialValue: editingRecord.batch_delay,
              rules: [{ required: true }],
            })(<Input placeholder="pipeline batch delay, eg: 50" />)}
          </FormItem>
          <FormItem labelCol={{ span: 6 }} wrapperCol={{ span: 15 }} label="队列类型">
            {form.getFieldDecorator('queue_type', {
              initialValue: editingRecord.queue_type,
              rules: [{ required: true }],
            })(
              <Select>
                <Select.Option value="memory">
                  Memory
                </Select.Option>
              </Select>
            )}
          </FormItem>
          <FormItem labelCol={{ span: 6 }} wrapperCol={{ span: 15 }} label="队列最大字节数">
            {form.getFieldDecorator('queue_max_bytes', {
              initialValue: editingRecord.queue_max_bytes,
              rules: [{ required: true }],
            })(<Input placeholder="size of max queue bytes, eg: 1024" />)}
          </FormItem>
          <FormItem labelCol={{ span: 6 }} wrapperCol={{ span: 15 }} label="队列检查点写入数">
            {form.getFieldDecorator('queue_checkpoint_num', {
              initialValue: editingRecord.queue_checkpoint_num,
              rules: [{ required: true }],
            })(<Input placeholder="number of writing queue checkpoint, eg: 1024" />)}
          </FormItem>
          <div style={{position:"absolute", bottom:20, textAlign: 'center', width: '100%'}}>
            <Button type="primary" loading={this.state.btnSaveExtraLoading} onClick={()=>this.handleSaveExtra(editingRecord)}>保存</Button>
            <Button style={{marginLeft: '2em'}}>保存并部署</Button>
          </div>
          </Form>
        
        </Drawer>
        )}
      </Fragment>
    );
  }
}

export default IngestPipeline;
