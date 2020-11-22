import React, { PureComponent, Fragment } from 'react';
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
} from 'antd';
import StandardTable from '@/components/StandardTable';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';

import styles from '../../List/TableList.less';

const FormItem = Form.Item;
const { TextArea } = Input;

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
      title="新建索引"
      visible={modalVisible}
      width={640}
      onOk={okHandle}
      onCancel={() => handleModalVisible()}
    >
       <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="索引名称">
        {form.getFieldDecorator('index', {
          rules: [{ required: true, message: '请输入至少五个字符的名称！', min: 5 }],
        })(<Input placeholder="请输入名称" />)}
      </FormItem>
      <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="索引设置">
        {form.getFieldDecorator('settings', {
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
      title="索引设置"
      visible={updateModalVisible}
      width={640}
      onOk={okHandle}
      onCancel={() => handleUpdateModalVisible()}
    >
       <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="索引名称">
        {form.getFieldDecorator('index', {
          initialValue: values.index,
          rules: [{ required: true, message: '请输入至少五个字符的名称！', min: 5 }],
        })(<Input placeholder="请输入名称" />)}
      </FormItem>
      <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="索引设置">
        {form.getFieldDecorator('settings', {
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
class AliasManage extends PureComponent {
  state = {
    modalVisible: false,
    updateModalVisible: false,
    expandForm: false,
    selectedRows: [],
    formValues: {},
    updateFormValues: {},
  };
  datasource = `[{"health":"green","status":"open","index":"blogs_fixed","uuid":"Q6zngGf9QVaWqpV0lF-0nw","pri":"1","rep":"1","docs.count":"1594","docs.deleted":"594","store.size":"17.9mb","pri.store.size":"8.9mb"},{"health":"red","status":"open","index":"elastic_qa","uuid":"_qkVlQ5LRoOKffV-nFj8Uw","pri":"1","rep":"1","docs.count":null,"docs.deleted":null,"store.size":null,"pri.store.size":null},{"health":"green","status":"open","index":".kibana-event-log-7.9.0-000001","uuid":"fgTtyl62Tc6F1ddJfPwqHA","pri":"1","rep":"1","docs.count":"20","docs.deleted":"0","store.size":"25kb","pri.store.size":"12.5kb"},{"health":"green","status":"open","index":"blogs","uuid":"Mb2n4wnNQSKqSToI_QO0Yg","pri":"1","rep":"1","docs.count":"1594","docs.deleted":"0","store.size":"11mb","pri.store.size":"5.5mb"},{"health":"green","status":"open","index":".kibana-event-log-7.9.0-000002","uuid":"8GpbwnDXR2KJUsw6srLnWw","pri":"1","rep":"1","docs.count":"9","docs.deleted":"0","store.size":"96.9kb","pri.store.size":"48.4kb"},{"health":"green","status":"open","index":".apm-agent-configuration","uuid":"vIaV9k2VS-W48oUOe2xNWA","pri":"1","rep":"1","docs.count":"0","docs.deleted":"0","store.size":"416b","pri.store.size":"208b"},{"health":"green","status":"open","index":"logs_server1","uuid":"u56jv2AyR2KOkruOfxIAnA","pri":"1","rep":"1","docs.count":"5386","docs.deleted":"0","store.size":"5.1mb","pri.store.size":"2.5mb"},{"health":"green","status":"open","index":".kibana_1","uuid":"dBCrfVblRPGVlYAIlP_Duw","pri":"1","rep":"1","docs.count":"3187","docs.deleted":"50","store.size":"24.8mb","pri.store.size":"12.4mb"},{"health":"green","status":"open","index":".tasks","uuid":"3RafayGeSNiqglO2BHof9Q","pri":"1","rep":"1","docs.count":"3","docs.deleted":"0","store.size":"39.9kb","pri.store.size":"19.9kb"},{"health":"green","status":"open","index":"filebeat-7.9.0-elastic_qa","uuid":"tktSYU14S3CrsrJb0ybpSQ","pri":"1","rep":"1","docs.count":"3009880","docs.deleted":"0","store.size":"1.6gb","pri.store.size":"850.1mb"},{"health":"green","status":"open","index":"analysis_test","uuid":"6ZHEAW1ST_qfg7mo4Bva4w","pri":"1","rep":"1","docs.count":"0","docs.deleted":"0","store.size":"416b","pri.store.size":"208b"},{"health":"green","status":"open","index":".apm-custom-link","uuid":"Y4N2TeVERrGacEGwY-NPAQ","pri":"1","rep":"1","docs.count":"0","docs.deleted":"0","store.size":"416b","pri.store.size":"208b"},{"health":"green","status":"open","index":"kibana_sample_data_ecommerce","uuid":"4FIWJKhGSr6bE72R0xEQyA","pri":"1","rep":"1","docs.count":"4675","docs.deleted":"0","store.size":"9.2mb","pri.store.size":"4.6mb"},{"health":"green","status":"open","index":".kibana_task_manager_1","uuid":"9afyndU_Q26oqOiEIoqRJw","pri":"1","rep":"1","docs.count":"6","docs.deleted":"2","store.size":"378.8kb","pri.store.size":"12.5kb"},{"health":"green","status":"open","index":".async-search","uuid":"2VbJgnN7SsqC-DWN64yXUQ","pri":"1","rep":"1","docs.count":"0","docs.deleted":"0","store.size":"3.9kb","pri.store.size":"3.7kb"}]`;

  columns = [
    {
      title: '索引名称',
      dataIndex: 'index',
    },
    {
      title: '文档数',
      dataIndex: 'docs.count',
    },
    {
      title: '主分片数',
      dataIndex: 'pri'
    },
    {
      title: '从分片数',
      dataIndex: 'rep'
    },
    {
      title: '存储大小',
      dataIndex: 'store.size'
    },
    {
      title: '操作',
      render: (text, record) => (
        <Fragment>
          <a onClick={() => this.handleUpdateModalVisible(true, record)}>别名设置</a>
          <Divider type="vertical" />
          <a onClick={() => {
            this.state.selectedRows.push(record);
            this.handleDeleteClick();
          }}>删除</a>
          <Divider type="vertical" />
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

  renderSimpleForm() {
    const {
      form: { getFieldDecorator },
    } = this.props;
    return (
      <Form onSubmit={this.handleSearch} layout="inline">
        <Row gutter={{ md: 8, lg: 24, xl: 48 }}>
          <Col md={8} sm={24}>
            <FormItem label="索引名称">
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

  render() {
    const data = {
      list: JSON.parse(this.datasource),
      pagination: {
        pageSize: 5,
      },
    };
    const { selectedRows, modalVisible, updateModalVisible, updateFormValues } = this.state;
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
              data={data}
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
      </Fragment>
    );
  }
}

export default AliasManage;
