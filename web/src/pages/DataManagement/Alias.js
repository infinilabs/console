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
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import "@/assets/headercontent.scss";
import { formatMessage } from "umi/locale";
import { hasAuthority } from "@/utils/authority";
import { isMatch, sorter } from "@/utils/utils";
import { Link } from "umi";

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
      title={formatMessage({ id: "alias.settings.title" })}
      visible={updateModalVisible}
      width={640}
      onOk={okHandle}
      onCancel={() => handleUpdateModalVisible()}
    >
      <FormItem
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        label={formatMessage({ id: "alias.table.field.name" })}
      >
        {form.getFieldDecorator("alias", {
          initialValue: values.alias,
          rules: [{ required: true }],
        })(<Input placeholder="enter alias" disabled={!!values.alias} />)}
      </FormItem>
      <FormItem
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        label={formatMessage({ id: "alias.table.field.index" })}
      >
        {form.getFieldDecorator("index", {
          initialValue: values.index,
          rules: [{ required: true }],
        })(<IndexComplete disabled={!!values.alias} dataSource={indices} />)}
      </FormItem>
      <FormItem
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        label={formatMessage({ id: "alias.table.field.is_write_index" })}
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
        label={formatMessage({ id: "alias.table.field.filter" })}
      >
        {form.getFieldDecorator("filter", {
          initialValue: values.filter
            ? JSON.stringify(values.filter, "", 2)
            : "",
          rules: [{}],
        })(
          <TextArea
            style={{ minHeight: 16 }}
            placeholder='eg：{"match":{"field_name":"field_value"}}'
            rows={5}
          />
        )}
      </FormItem>
      <Row>
        <Col span={12}>
          <FormItem
            label={formatMessage({ id: "alias.table.field.index_routing" })}
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
            label={formatMessage({ id: "alias.table.field.search_routing" })}
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
    pageSize: 10,
  };

  columns = [
    {
      title: formatMessage({ id: "alias.table.field.name" }),
      dataIndex: "alias",
      sorter: (a, b) => sorter.string(a, b, "alias"),
    },
    {
      title: formatMessage({ id: "alias.table.field.write_index" }),
      dataIndex: "write_index",
      sorter: (a, b) => sorter.string(a, b, "write_index"),
      render: (text, record) => {
        return <Link to={`/insight/discover?index=${text}`}>{text}</Link>;
      },
    },
    {
      title: formatMessage({ id: "table.field.actions" }),
      render: (text, record) => {
        return (
          <Fragment>
            {/*<a onClick={() => this.handleUpdateModalVisible(true, record)}>别名设置</a>*/}
            {/*<Divider type="vertical" />*/}
            {hasAuthority("data.alias:all") ? (
              <Popconfirm
                title="Sure to delete？"
                onConfirm={() => this.handleDeleteAliasClick(record)}
              >
                {" "}
                <a>{formatMessage({ id: "form.button.delete" })}</a>
              </Popconfirm>
            ) : null}
          </Fragment>
        );
      },
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
    const { dispatch, selectedClusterID } = this.props;
    if (!selectedClusterID) {
      return;
    }
    dispatch({
      type: "alias/fetchAliasList",
      payload: {
        clusterID: selectedClusterID,
      },
    });
  };
  fetchIndices = () => {
    const { dispatch, selectedClusterID } = this.props;
    if (!selectedClusterID) {
      return;
    }
    dispatch({
      type: "alias/fetchIndices",
      payload: {
        clusterID: selectedClusterID,
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

  handleSearch = (keyword) => {
    this.setState({
      keyword,
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

    message.success("added successfully");
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

    message.success("updated successfully");
    this.handleUpdateModalVisible();
  };

  renderSimpleForm() {
    const {
      form: { getFieldDecorator },
    } = this.props;
    return (
      <Form layout="inline" style={{ flex: "1 1 auto" }}>
        <Row gutter={{ md: 8, lg: 24, xl: 48 }}>
          <Col md={8} sm={24}>
            <FormItem label={formatMessage({ id: "alias.table.field.name" })}>
              {getFieldDecorator("keyword")(
                <Input placeholder="enter alias" />
              )}
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <span>
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
      aliasList = aliasList.filter(
        (al) => isMatch(this.state.keyword, al.alias)
        // al.alias.includes(this.state.keyword)
      );
    }
    const { indices } = this.props.alias;
    return (
      <PageHeaderWrapper>
        <Card bordered={false}>
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 15,
              }}
            >
              <div style={{ maxWidth: 500, flex: "1 1 auto" }}>
                <Input.Search
                  allowClear
                  placeholder="Type keyword to search"
                  enterButton="Search"
                  onSearch={(value) => {
                    this.handleSearch(value);
                  }}
                  onChange={(e) => {
                    this.handleSearch(e.currentTarget.value);
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Button
                  icon="redo"
                  onClick={() => {
                    this.fetchAliasList();
                    this.fetchIndices();
                  }}
                >
                  {formatMessage({ id: "form.button.refresh" })}
                </Button>
                {hasAuthority("data.alias:all") ? (
                  <Button
                    icon="plus"
                    type="primary"
                    onClick={() => this.handleUpdateModalVisible(true)}
                  >
                    {formatMessage({ id: "form.button.new" })}
                  </Button>
                ) : null}
              </div>
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
              columns={this.columns.filter((item) => {
                if (item.dataIndex) return true;
                if (hasAuthority("data.alias:all")) return true
                return false
              })}
              onSelectRow={this.handleSelectRows}
              // onChange={this.handleStandardTableChange}
              pagination={{
                size: "small",
                pageSize: this.state.pageSize,
                showSizeChanger: true,
                onShowSizeChange: (_, size) => {
                  this.setState((st) => {
                    return {
                      ...st,
                      pageSize: size,
                    };
                  });
                },
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
      </PageHeaderWrapper>
    );
  }
}

export default AliasManage;

class AliasIndexTable extends React.Component {
  columns = [
    {
      title: formatMessage({ id: "alias.table.field.index" }),
      dataIndex: "index",
      render: (text, record) => {
        return <Link to={`/insight/discover?index=${text}`}>{text}</Link>;
      },
    },
    {
      title: formatMessage({ id: "alias.table.field.index_routing" }),
      dataIndex: "index_routing",
    },
    {
      title: formatMessage({ id: "alias.table.field.search_routing" }),
      dataIndex: "search_routing",
    },
    {
      title: formatMessage({ id: "alias.table.field.filter" }),
      dataIndex: "filter",
      render: (text) => {
        return text ? JSON.stringify(text) : "";
      },
    },
    {
      title: formatMessage({ id: "table.field.actions" }),
      render: (text, record) => {
        if (!hasAuthority("data.alias:all")) {
          return;
        }
        return (
          <div>
            <a
              onClick={() =>
                this.props.handleUpdateModalVisible(true, {
                  ...record,
                  alias: this.props.rawData.alias,
                })
              }
            >
              {formatMessage({ id: "alias.button.settings" })}
            </a>
            <Divider type="vertical" />
            <Popconfirm
              title="Sure to delete？"
              onConfirm={() => {
                this.props.handleDeleteClick({
                  ...record,
                  alias: this.props.rawData.alias,
                });
              }}
            >
              <a>{formatMessage({ id: "form.button.delete" })}</a>
            </Popconfirm>
          </div>
        );
      },
    },
  ];
  render() {
    return (
      <Table
        columns={this.columns.filter((item) => {
          if (item.dataIndex) return true;
          if (hasAuthority("data.alias:all")) return true
          return false
        })}
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
