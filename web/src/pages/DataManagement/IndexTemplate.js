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

import styles from '../List/TableList.less';

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
      title="新建索引模板"
      visible={modalVisible}
      width={640}
      onOk={okHandle}
      onCancel={() => handleModalVisible()}
    >
       <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="索引模板名称">
        {form.getFieldDecorator('name', {
          rules: [{ required: true, message: '请输入至少五个字符的名称！', min: 5 }],
        })(<Input placeholder="请输入名称" />)}
      </FormItem>
      <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="模板设置">
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
      title="索引模板设置"
      visible={updateModalVisible}
      width={640}
      onOk={okHandle}
      onCancel={() => handleUpdateModalVisible()}
    >
       <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="索引模板名称">
        {form.getFieldDecorator('name', {
          initialValue: values.name,
          rules: [{ required: true, message: '请输入至少五个字符的名称！', min: 5 }],
        })(<Input placeholder="请输入名称" />)}
      </FormItem>
      <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="索引模板设置">
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
class IndexTemplate extends PureComponent {
  state = {
    modalVisible: false,
    updateModalVisible: false,
    expandForm: false,
    selectedRows: [],
    formValues: {},
    updateFormValues: {},
  };
  //index template detail example
  // {
  //   ".ml-state" : {
  //     "order" : 0,
  //     "version" : 7090199,
  //     "index_patterns" : [
  //       ".ml-state*"
  //     ],
  //     "settings" : {
  //       "index" : {
  //         "hidden" : "true",
  //         "lifecycle" : {
  //           "name" : "ml-size-based-ilm-policy",
  //           "rollover_alias" : ".ml-state-write"
  //         },
  //         "auto_expand_replicas" : "0-1"
  //       }
  //     },
  //     "mappings" : {
  //       "_meta" : {
  //         "version" : "7090199"
  //       },
  //       "enabled" : false
  //     },
  //     "aliases" : { }
  //   }
  // }
  datasource = `
  [
    {
      "name" : "filebeat-7.9.1",
      "index_patterns" : "[filebeat-7.9.1-*]",
      "order" : "1",
      "version" : null,
      "composed_of" : ""
    },
    {
      "name" : "apm-7.9.1-span",
      "index_patterns" : "[apm-7.9.1-span*]",
      "order" : "2",
      "version" : null,
      "composed_of" : ""
    },
    {
      "name" : ".lists-default",
      "index_patterns" : "[.lists-default-*]",
      "order" : "0",
      "version" : null,
      "composed_of" : ""
    },
    {
      "name" : ".monitoring-es",
      "index_patterns" : "[.monitoring-es-7-*]",
      "order" : "0",
      "version" : "7000199",
      "composed_of" : ""
    },
    {
      "name" : ".monitoring-beats",
      "index_patterns" : "[.monitoring-beats-7-*]",
      "order" : "0",
      "version" : "7000199",
      "composed_of" : ""
    }]`;

  columns = [
    {
      title: '模板名称',
      dataIndex: 'name',
    },
    {
      title: '索引模式',
      dataIndex: 'index_patterns',
    },
    {
      title: 'order',
      dataIndex: 'order'
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

  renderSimpleForm() {
    const {
      form: { getFieldDecorator },
    } = this.props;
    return (
      <Form onSubmit={this.handleSearch} layout="inline">
        <Row gutter={{ md: 8, lg: 24, xl: 48 }}>
          <Col md={8} sm={24}>
            <FormItem label="索引模板名称">
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

export default IndexTemplate;
