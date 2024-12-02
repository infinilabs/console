import React, { PureComponent, Fragment } from "react";
import { connect } from "dva";
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
  Table,
  AutoComplete,
  Switch,
  Popconfirm,
} from "antd";

import styles from "../../List/TableList.less";

const FormItem = Form.Item;
const { TextArea } = Input;

const UpdateForm = Form.create()((props) => {
  const {
    updateModalVisible,
    handleUpdateModalVisible,
    handleUpdate,
    values,
    form,
    indices,
  } = props;

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
      title="别名设置"
      visible={updateModalVisible}
      width={640}
      onOk={okHandle}
      onCancel={() => handleUpdateModalVisible()}
    >
      <FormItem labelCol={{ span: 4 }} wrapperCol={{ span: 20 }} label="别名">
        {form.getFieldDecorator("alias", {
          initialValue: values.alias,
          rules: [{ required: true }],
        })(<Input placeholder="请输入别名" disabled={!!values.alias} />)}
      </FormItem>
      <FormItem labelCol={{ span: 4 }} wrapperCol={{ span: 20 }} label="索引">
        {form.getFieldDecorator("index", {
          initialValue: values.index,
          rules: [{ required: true }],
        })(<IndexComplete disabled={!!values.alias} dataSource={indices} />)}
      </FormItem>
      <FormItem
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        label="是否为写索引"
      >
        {form.getFieldDecorator("is_write_index", {
          valuePropName: "checked",
          initialValue: values.is_write_index,
          rules: [],
        })(<Switch />)}
      </FormItem>
      <FormItem
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        label="过滤查询"
      >
        {form.getFieldDecorator("filter", {
          initialValue: values.filter
            ? JSON.stringify(values.filter, "", 2)
            : "",
          rules: [{}],
        })(
          <TextArea
            style={{ minHeight: 16 }}
            placeholder='示例：{"match":{"field_name":"field_value"}}'
            rows={5}
          />
        )}
      </FormItem>
      <Row>
        <Col span={12}>
          <FormItem
            label="索引路由"
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
          >
            {form.getFieldDecorator("index_routing", {
              initialValue: values.index_routing,
              rules: [],
            })(<Input />)}
          </FormItem>
        </Col>
        <Col span={12}>
          <FormItem
            label="搜索路由"
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
          >
            {form.getFieldDecorator("search_routing", {
              initialValue: values.search_routing,
              rules: [],
            })(<Input />)}
          </FormItem>
        </Col>
      </Row>
    </Modal>
  );
});

/* eslint react/no-multi-comp:0 */
@connect(({ global, alias }) => ({
  selectedClusterID: global.selectedClusterID,
  alias,
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

  columns = [
    {
      title: "别名",
      dataIndex: "alias",
    },
    {
      title: "写索引",
      dataIndex: "write_index",
    },
    {
      title: "操作",
      render: (text, record) => (
        <Fragment>
          {/*<a onClick={() => this.handleUpdateModalVisible(true, record)}>别名设置</a>*/}
          {/*<Divider type="vertical" />*/}
          <Popconfirm
            title="确定要删除？"
            onConfirm={() => this.handleDeleteAliasClick(record)}
          >
            {" "}
            <a>删除</a>
          </Popconfirm>
        </Fragment>
      ),
    },
  ];
  handleDeleteAliasClick = (record) => {
    let indices = [];
    for (let index of record.indexes) {
      indices.push(index.index);
    }
    let vals = {
      alias: record.alias,
      indices,
    };
    this.handleDeleteClick(vals);
  };

  componentDidMount() {
    this.fetchAliasList();
    this.fetchIndices();
  }
  fetchAliasList = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "alias/fetchAliasList",
      payload: {
        clusterID: this.props.selectedClusterID,
      },
    });
  };
  fetchIndices = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "alias/fetchIndices",
      payload: {
        clusterID: this.props.selectedClusterID,
      },
    });
  };
  componentDidUpdate(oldProps, newState, snapshot) {
    if (oldProps.selectedClusterID != this.props.selectedClusterID) {
      this.fetchAliasList();
      this.fetchIndices();
    }
  }

  handleStandardTableChange = (pagination, filtersArg, sorter) => {};

  handleFormReset = () => {
    const { form, dispatch } = this.props;
    form.resetFields();
    this.setState({
      formValues: {},
      keyword: "",
    });
  };

  handleDeleteClick = (record) => {
    const { dispatch } = this.props;
    dispatch({
      type: "alias/delete",
      payload: {
        clusterID: this.props.selectedClusterID,
        index: record.index,
        alias: record.alias,
        indices: record.indices,
      },
    });
  };

  handleSelectRows = (rows) => {
    this.setState({
      selectedRows: rows,
    });
  };

  handleSearch = (e) => {
    let values = this.props.form.getFieldsValue();
    this.setState({
      keyword: values.keyword,
    });
  };

  handleModalVisible = (flag) => {
    this.setState({
      modalVisible: !!flag,
    });
  };

  handleUpdateModalVisible = (flag, record) => {
    let values = record || {};
    let newState = {
      updateModalVisible: !!flag,
      updateFormValues: values,
    };
    if (!values.alias) {
      newState.editMode = "NEW";
    }

    this.setState(newState);
  };

  handleAdd = (fields) => {
    const { dispatch } = this.props;
    dispatch({
      type: "pipeline/add",
      payload: {
        name: fields.name,
        desc: fields.desc,
        processors: fields.processors,
      },
    });

    message.success("添加成功");
    this.handleModalVisible();
  };

  handleUpdate = (fields) => {
    let upVals = {};
    for (let k in fields) {
      if (fields[k]) {
        if (k === "filter") {
          upVals[k] = JSON.parse(fields[k]);
        } else {
          upVals[k] = fields[k];
        }
      }
    }
    const { dispatch } = this.props;
    dispatch({
      type: "alias/update",
      payload: {
        actionBody: upVals,
        clusterID: this.props.selectedClusterID,
      },
    });

    message.success("修改成功");
    this.handleUpdateModalVisible();
  };

  renderSimpleForm() {
    const {
      form: { getFieldDecorator },
    } = this.props;
    return (
      <Form layout="inline">
        <Row gutter={{ md: 8, lg: 24, xl: 48 }}>
          <Col md={8} sm={24}>
            <FormItem label="别名">
              {getFieldDecorator("keyword")(<Input placeholder="请输入" />)}
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <span className={styles.submitButtons}>
              <Button type="primary" onClick={this.handleSearch}>
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
    const { selectedRows, updateModalVisible, updateFormValues } = this.state;
    const updateMethods = {
      handleUpdateModalVisible: this.handleUpdateModalVisible,
      handleUpdate: this.handleUpdate,
    };
    let aliasList = [...(this.props.alias.aliasList || [])];
    if (this.state.keyword) {
      aliasList = aliasList.filter((al) =>
        al.alias.includes(this.state.keyword)
      );
    }
    const { indices } = this.props.alias;
    return (
      <Fragment>
        <Card bordered={false}>
          <div className={styles.tableList}>
            <div className={styles.tableListForm}>{this.renderForm()}</div>
            <div className={styles.tableListOperator}>
              <Button
                icon="plus"
                type="primary"
                onClick={() => this.handleUpdateModalVisible(true)}
              >
                新建
              </Button>
            </div>
            <Table
              size="small"
              bordered
              selectedRows={selectedRows}
              rowKey="alias"
              dataSource={aliasList}
              expandedRowRender={(record) => {
                return (
                  <div>
                    <AliasIndexTable
                      rawData={record}
                      handleDeleteClick={this.handleDeleteClick}
                      handleUpdateModalVisible={this.handleUpdateModalVisible}
                      data={record.indexes}
                    />
                  </div>
                );
              }}
              columns={this.columns}
              onSelectRow={this.handleSelectRows}
              onChange={this.handleStandardTableChange}
              pagination={{
                size: "small",
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
              }}
            />
          </div>
        </Card>
        <UpdateForm
          {...updateMethods}
          updateModalVisible={updateModalVisible}
          values={updateFormValues}
          indices={indices || []}
        />
      </Fragment>
    );
  }
}

export default AliasManage;

class AliasIndexTable extends React.Component {
  columns = [
    {
      title: "索引",
      dataIndex: "index",
    },
    {
      title: "索引路由",
      dataIndex: "index_routing",
    },
    {
      title: "搜索路由",
      dataIndex: "search_routing",
    },
    {
      title: "过滤查询",
      dataIndex: "filter",
      render: (text) => {
        return text ? JSON.stringify(text) : "";
      },
    },
    {
      title: "操作",
      render: (text, record) => (
        <div>
          <a
            onClick={() =>
              this.props.handleUpdateModalVisible(true, {
                ...record,
                alias: this.props.rawData.alias,
              })
            }
          >
            设置
          </a>
          <Divider type="vertical" />
          <Popconfirm
            title="确定要删除？"
            onConfirm={() => {
              this.props.handleDeleteClick({
                ...record,
                alias: this.props.rawData.alias,
              });
            }}
          >
            <a>删除</a>
          </Popconfirm>
        </div>
      ),
    },
  ];
  render() {
    return (
      <Table
        columns={this.columns}
        size={"small"}
        pagination={{
          size: "small",
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        rowKey="index"
        dataSource={this.props.data}
      />
    );
  }
}

class IndexComplete extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dataSource: [...props.dataSource],
    };
  }
  handleSearch = (v) => {
    let data = this.props.dataSource.filter((d) =>
      d.includes(v.replace(/\*$/, ""))
    );
    // if(data.length > 0 && v.length >0) {
    //   data.push(v+'*');
    // }
    this.setState({
      dataSource: data,
    });
  };
  render() {
    return (
      <AutoComplete
        style={{ width: "100%" }}
        disabled={this.props.disabled}
        onChange={this.props.onChange}
        value={this.props.value}
        onSearch={this.handleSearch}
        dataSource={this.state.dataSource}
      />
    );
  }
}
