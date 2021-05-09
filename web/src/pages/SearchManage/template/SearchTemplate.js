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
      console.log('create form:',fieldsValue);
      if (err) return;
      form.resetFields();
      handleAdd(fieldsValue);
    });
  };
  return (
    <Modal
      destroyOnClose
      title="新建模板"
      visible={modalVisible}
      width={640}
      onOk={okHandle}
      onCancel={() => handleModalVisible()}
    >
       <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="模板名称">
        {form.getFieldDecorator('name', {
          rules: [{ required: true, message: '请输入至少五个字符的名称！', min: 5 }],
        })(<Input placeholder="请输入名称" />)}
      </FormItem>
      <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="模板设置">
        {form.getFieldDecorator('source', {
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
      title="模板设置"
      visible={updateModalVisible}
      width={640}
      onOk={okHandle}
      onCancel={() => handleUpdateModalVisible()}
    >
      <FormItem>
        {form.getFieldDecorator('id', {
          initialValue: values.id,
        })(<Input type="hidden" />)}
      </FormItem>

       <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="模板名称">
        {form.getFieldDecorator('name', {
          initialValue: values.name,
          rules: [{ required: true, message: '请输入至少五个字符的名称！', min: 5 }],
        })(<Input placeholder="请输入名称" />)}
      </FormItem>
      <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="模板设置">
        {form.getFieldDecorator('source', {
          initialValue: values.source,
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
@connect(({ searchTemplate, loading ,global}) => ({
  searchTemplate,
  loading: loading.effects['searchTemplate/fetchList'],
  list:searchTemplate.list,
  pagination: searchTemplate.pagination,
}))

@Form.create()
class SearchTemplate extends PureComponent {
  state = {
    modalVisible: false,
    updateModalVisible: false,
    expandForm: false,
    selectedRows: [],
    formValues: {},
    updateFormValues: {},
  };

  columns = [
    {
      title: '模板名称',
      dataIndex: 'name',
    },
    {
      title: '创建时间',
      dataIndex: 'created'
    },
    {
      title: '更新时间',
      dataIndex: 'updated'
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
    //初始化拉取模版表格数据
    this.handleGetListData();
  }

  //获取基本数据列表
  handleGetListData = () => {
    const {dispatch} = this.props;
    let payload = {size: 10, from: 0};
    if (this.state.formValues.name) {
      payload.name = this.state.formValues.name;
    }
    dispatch({
      type: 'searchTemplate/fetchList',
      payload: payload,
    });
  };

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

    // dispatch({
    //   type: 'pipeline/fetch',
    //   payload: params,
    // });
  };

  handleFormReset = () => {
    const { form, dispatch } = this.props;
    form.resetFields();
    this.setState({
      formValues: {},
    });
  };

  handleDeleteClick = e => {
    const { dispatch} = this.props;
    const { selectedRows } = this.state;

    if (!selectedRows) return message.warn("请选择需要删除的行");
        dispatch({
          type: 'searchTemplate/delete',
          payload: {
            id: selectedRows.map(row => row.id),
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
      if (! values.name) {
        message.warn("请输入模版名称");
        return;
      }
      this.handleGetListData();
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
    const { dispatch} = this.props;
    dispatch({
      type: 'searchTemplate/add',
      payload: {
        name: fields.name,
        source: fields.source,
      },
    });

    message.success('添加成功');
    this.handleModalVisible();
  };

  handleUpdate = fields => {
    const { dispatch} = this.props;
    dispatch({
      type: 'searchTemplate/update',
      payload: {
        id: fields.id,
        name: fields.name,
        source: fields.source,
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
            <FormItem label="模板名称">
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
    const {pagination, list} = this.props;


    const data = {
      list: list,
      pagination: {
        size: pagination.size,
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

export default SearchTemplate;
