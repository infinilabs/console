import React, { PureComponent, Fragment } from "react";
import { connect } from "dva";
import { Link } from "umi";
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
  Tabs,
  Descriptions,
  Menu,
  Table,
  Dropdown,
  Icon,
  Popconfirm,
  Switch,
} from "antd";
import { Editor } from "@/components/monaco-editor";

import styles from "../List/TableList.less";
import { transformSettingsForApi } from "@/lib/elasticsearch/edit_settings";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import { formatMessage } from "umi/locale";
import "@/assets/headercontent.scss";
import { HealthStatusView } from "@/components/infini/health_status_view";
import { formatter } from "@/utils/format";
import { isMatch, sorter } from "@/utils/utils";
import { hasAuthority } from "@/utils/authority";
import DeleteIndexModal from "./components/DeleteIndexModal";
import IconText from "@/components/infini/IconText";

const { Search } = Input;

const FormItem = Form.Item;
const { TextArea } = Input;
const { TabPane } = Tabs;

class JSONWrapper extends PureComponent {
  state = {
    height: 400,
  };
  componentDidMount() {
    let getElementTop = (elem) => {
      var elemTop = elem.offsetTop;
      elem = elem.offsetParent;

      while (elem != null) {
        elemTop += elem.offsetTop;
        elem = elem.offsetParent;
      }

      return elemTop;
    };
    // console.log(getElementTop(this.refs.jsonw));
    this.setState({
      height: window.innerHeight - getElementTop(this.refs.jsonw) - 50,
    });
  }
  render() {
    return (
      <div
        id="jsonw"
        ref="jsonw"
        onClick={() => {
          console.log(document.getElementById("jsonw").offsetTop);
        }}
        style={{ overflow: "scroll", height: this.state.height }}
      >
        {" "}
        {this.props.children}
      </div>
    );
  }
}
@Form.create()
class CreateForm extends React.Component {
  okHandle = () => {
    const { handleAdd, form } = this.props;
    const me = this;

    form.validateFields((err, fieldsValue) => {
      if (err) return;
      fieldsValue["config"] = me.editor.getValue();
      handleAdd(fieldsValue);
      form.resetFields();
    });
  };
  onEditorDidMount = (editor) => {
    this.editor = editor;
  };

  render() {
    const { modalVisible, form, handleModalVisible } = this.props;
    return (
      <Modal
        destroyOnClose
        title={formatMessage({ id: "indices.new.title" })}
        visible={modalVisible}
        width={640}
        onOk={this.okHandle}
        onCancel={() => handleModalVisible()}
      >
        <FormItem
          labelCol={{ span: 5 }}
          wrapperCol={{ span: 15 }}
          label={formatMessage({ id: "indices.field.name" })}
        >
          {form.getFieldDecorator("index", {
            rules: [
              {
                required: true,
                message: formatMessage({
                  id: "indices.field.name.required_message",
                }),
                min: 5,
              },
            ],
          })(
            <Input
              placeholder={formatMessage({
                id: "indices.field.name.placeholder",
              })}
            />
          )}
        </FormItem>
        <FormItem
          labelCol={{ span: 5 }}
          wrapperCol={{ span: 15 }}
          label={formatMessage({ id: "indices.field.settings" })}
        >
          <div style={{ border: "1px solid rgb(232, 232, 232)" }}>
            <Editor
              height="300px"
              language="json"
              theme="light"
              options={{
                minimap: {
                  enabled: false,
                },
                tabSize: 2,
                wordBasedSuggestions: true,
              }}
              onMount={this.onEditorDidMount}
            />
          </div>
        </FormItem>
      </Modal>
    );
  }
}

/* eslint react/no-multi-comp:0 */
@connect(({ index, global }) => ({
  index,
  clusterID: global.selectedClusterID,
  selectedCluster: global.selectedCluster,
}))
@Form.create()
class Index extends PureComponent {
  state = {
    modalVisible: false,
    updateModalVisible: false,
    expandForm: false,
    formValues: {},
    drawerVisible: false,
    editingIndex: {},
    indexActiveKey: "overview",
    showSystemIndices: false,
    pageSize: 10,
    deleteIndexItems: [],
    deleteIndexVisible: false,
    deleteIndexConfirm: false,
    selectedRowKeys: [],
  };
  columns = [
    {
      title: formatMessage({ id: "indices.field.name" }),
      dataIndex: "index",
      render: (text, record) => (
        <IconText
          icon={<Icon type="table" />}
          text={<Link to={`/insight/discover?index=${text}`}>{text}</Link>}
        />
      ),
      sorter: (a, b) => sorter.string(a, b, "index"),
    },
    {
      title: formatMessage({ id: "indices.field.health" }),
      dataIndex: "health",
      render: (text, record) => <HealthStatusView status={record.health} />,
      sorter: (a, b) => sorter.string(a, b, "health"),
    },
    {
      title: formatMessage({ id: "indices.field.status" }),
      dataIndex: "status",
      sorter: (a, b) => sorter.string(a, b, "status"),
    },
    {
      title: formatMessage({ id: "indices.field.shards" }),
      dataIndex: "shards",
      render: (text, record) => <span>{text || 0}</span>,
      sorter: (a, b) => a.shards - b.shards,
    },
    {
      title: formatMessage({ id: "indices.field.replicas" }),
      dataIndex: "replicas",
      render: (text, record) => <span>{text || 0}</span>,
      sorter: (a, b) => a.replicas - b.replicas,
    },
    {
      title: formatMessage({ id: "indices.field.docs_count" }),
      dataIndex: "docs_count",
      render: (text, record) => <span>{formatter.number(text || 0)}</span>,
      sorter: (a, b) => a.docs_count - b.docs_count,
    },
    {
      title: formatMessage({ id: "indices.field.store_size" }),
      dataIndex: "store_size",
      render: (text, record) => <span>{record.store_size || 0}</span>,
      sorter: (a, b) => a.store_size_bytes - b.store_size_bytes,
    },
    {
      title: formatMessage({ id: "table.field.actions" }),
      render: (text, record) => (
        <Fragment>
          <a
            onClick={() => {
              this.setState({
                editingIndex: record,
                drawerVisible: true,
              });
            }}
          >
            {formatMessage({ id: "form.button.detail" })}
          </a>
          {hasAuthority("data.index:all")
            ? [
                <Divider type="vertical" />,
                <a onClick={() => this.showDeleteConfirm([record.index])}>
                  {formatMessage({ id: "form.button.delete" })}
                </a>,
              ]
            : null}
          {/* <Divider type="vertical" />
          <Link to={"/data/document?index=" + record.index}>文档管理</Link> */}
        </Fragment>
      ),
    },
  ];

  componentDidMount() {
    this.fetchData();
  }
  componentDidUpdate(oldProps, newState, snapshot) {
    if (oldProps.clusterID != this.props.clusterID) {
      this.fetchData();
    }
  }

  fetchData = () => {
    const { dispatch, clusterID } = this.props;
    if (!clusterID) {
      return {};
    }
    dispatch({
      type: "index/fetchIndices",
      payload: {
        clusterID: clusterID,
      },
    });
  };

  handleFormReset = () => {
    const { form, dispatch } = this.props;
    form.resetFields();
    this.setState({
      formValues: {},
    });
  };

  handleDeleteClick = (indexName) => {
    const that = this;
    const { dispatch, clusterID } = this.props;
    dispatch({
      type: "index/removeIndex",
      payload: {
        index: indexName,
        clusterID,
      },
    }).then(function(value) {
      if (value) {
        that.fetchData();
        message.success("deleted");
        that.setState({
          deleteIndexVisible: false,
        });
      } else {
        message.error("delete failed");
      }
    });
  };

  handleSearch = (val) => {
    this.setState({
      searchValue: val,
    });
  };

  handleModalVisible = (flag) => {
    this.setState({
      modalVisible: !!flag,
    });
  };

  handleAdd = (fields) => {
    const { dispatch, clusterID } = this.props;
    dispatch({
      type: "index/addIndex",
      payload: {
        index: fields.index,
        config: JSON.parse(fields.config || "{}"),
        clusterID,
      },
    });
    this.handleModalVisible();
  };

  handleIndexTabChanged = (activeKey, indexName) => {
    this.setState({
      indexActiveKey: activeKey,
    });
    const { dispatch, clusterID } = this.props;
    if (activeKey == "mappings") {
      if (this.props.index.mappings[indexName]) {
        return;
      }
      dispatch({
        type: "index/fetchMappings",
        payload: {
          index: indexName,
          clusterID,
        },
      });
    } else if (activeKey == "settings") {
      if (this.props.index.settings[indexName]) {
        return;
      }
      dispatch({
        type: "index/fetchSettings",
        payload: {
          index: indexName,
          clusterID,
        },
      });
    }
  };
  handleEditorDidMount = (editorName, editor) => {
    this[editorName] = editor;
  };

  handleIndexSettingsSaveClick = (indexName) => {
    let settings = this.indexSettingsEditor.getValue();
    settings = JSON.parse(settings);
    const { dispatch, clusterID } = this.props;
    dispatch({
      type: "index/saveSettings",
      payload: {
        index: indexName,
        settings: settings,
        clusterID,
      },
    });
  };

  onDeleteIndexCancel = () => {
    this.setState({
      deleteIndexVisible: false,
      deleteIndexConfirm: false,
      deleteIndexItems: [],
    });
  };

  onDeleteIndexOK = () => {
    this.handleDeleteClick(this.state.deleteIndexItems?.join(','));
  };

  onChangeDeleteIndexConfirmState = (state) => {
    this.setState({ deleteIndexConfirm: state });
  };

  showDeleteConfirm = (items) => {
    let hasSpecialIndex = false;
    for (let item of items) {
      if (item.startsWith(".")) {
        hasSpecialIndex = true;
        break;
      }
    }
    this.setState({
      deleteIndexVisible: true,
      deleteIndexConfirm: !hasSpecialIndex,
      deleteIndexItems: items,
    });
  };

  onSelectChange = keys => {
    this.setState({ selectedRowKeys: keys });
  };

  handleBatchDelete = () => {
    this.showDeleteConfirm(this.state.selectedRowKeys)
  }

  render() {
    const { clusterIndices, settings } = this.props.index;
    let indices = [];
    for (let key in clusterIndices) {
      if (!clusterIndices[key]["docs_count"]) {
        clusterIndices[key]["docs_count"] = 0;
      }
      clusterIndices[key]["store_size"] = clusterIndices[key][
        "store_size"
      ]?.toUpperCase();
      clusterIndices[key]["store_size_bytes"] = formatter.bytesReverse(
        clusterIndices[key]["store_size"]
      );
      clusterIndices[key]["pri_store_size"] = clusterIndices[key][
        "pri_store_size"
      ]?.toUpperCase();
      clusterIndices[key]["pri_store_size_bytes"] = formatter.bytesReverse(
        clusterIndices[key]["pri_store_size"]
      );

      if (this.state.searchValue) {
        if (isMatch(this.state.searchValue, key)) {
          indices.push(clusterIndices[key]);
        }
        continue;
      }
      indices.push(clusterIndices[key]);
    }
    if (!this.state.showSystemIndices) {
      indices = indices.filter((item) => !item.index.startsWith("."));
    }
    const {
      modalVisible,
      updateModalVisible,
      updateFormValues,
      editingIndex,
      drawerVisible,
    } = this.state;
    const parentMethods = {
      handleAdd: this.handleAdd,
      handleModalVisible: this.handleModalVisible,
    };
    const updateMethods = {
      handleUpdateModalVisible: this.handleUpdateModalVisible,
      handleUpdate: this.handleUpdate,
    };
    let newSettings = {};
    if (settings && settings[editingIndex.index]) {
      if (settings[editingIndex.index].settings) {
        newSettings = transformSettingsForApi(
          settings[editingIndex.index],
          editingIndex.status === "open",
          this.props.selectedCluster?.version
        );
      } else {
        newSettings = settings[editingIndex.index];
      }
    }
    const {
      form: { getFieldDecorator },
    } = this.props;

    const { loading, selectedRowKeys } = this.state;
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange,
    };
    const hasSelected = selectedRowKeys.length > 0;

    return (
      <PageHeaderWrapper>
        <Card bordered={false}>
          <div className={styles.tableList}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 15,
              }}
            >
              <div style={{ maxWidth: 500, flex: "1 1 auto" }}>
                <Search
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
                <div>
                  {formatMessage({ id: "indices.show_special_index" })}
                  <Switch
                    style={{ marginLeft: 5 }}
                    onChange={(checked) => {
                      this.setState({ showSystemIndices: checked });
                    }}
                    defaultChecked={this.state.showSystemIndices}
                  />
                </div>
                <Button
                  icon="redo"
                  onClick={() => {
                    this.fetchData();
                  }}
                >
                  {formatMessage({ id: "form.button.refresh" })}
                </Button>
                {hasAuthority("data.index:all") ? (
                  <Button
                    icon="plus"
                    type="primary"
                    onClick={() => this.handleModalVisible(true)}
                  >
                    {formatMessage({ id: "form.button.new" })}
                  </Button>
                ) : null}
                {hasAuthority("data.index:all") ? (
                  <Button
                    type="primary"
                    disabled={!hasSelected}
                    onClick={() => this.handleBatchDelete()}
                  >
                    {formatMessage({ id: "form.button.batch_delete" })}
                  </Button>
                ) : null}
              </div>
            </div>
            <Table
              rowSelection={rowSelection} 
              size={"small"}
              bordered
              dataSource={indices}
              rowKey="index"
              pagination={{
                size: "small",
                pageSize: this.state.pageSize,
                showSizeChanger: true,
                onShowSizeChange: (_, size) => {
                  this.setState({
                    pageSize: size,
                  });
                },
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
              }}
              columns={this.columns}
            />
          </div>
        </Card>
        <CreateForm {...parentMethods} modalVisible={modalVisible} />
        <Drawer
          title={editingIndex.index}
          visible={drawerVisible}
          onClose={() => {
            this.setState({
              drawerVisible: false,
              indexActiveKey: "overview",
            });
          }}
          width={720}
        >
          <Tabs
            activeKey={this.state.indexActiveKey}
            onChange={(activeKey) => {
              this.handleIndexTabChanged(activeKey, editingIndex.index);
            }}
          >
            <TabPane
              tab={formatMessage({ id: "indices.overview" })}
              key="overview"
            >
              <Descriptions column={2}>
                <Descriptions.Item
                  label={formatMessage({ id: "indices.field.health" })}
                >
                  <HealthStatusView status={editingIndex.health} />
                </Descriptions.Item>
                <Descriptions.Item
                  label={formatMessage({ id: "indices.field.status" })}
                >
                  {editingIndex.status}
                </Descriptions.Item>
                <Descriptions.Item
                  label={formatMessage({ id: "indices.field.shards" })}
                >
                  {editingIndex.shards || 0}
                </Descriptions.Item>
                <Descriptions.Item
                  label={formatMessage({ id: "indices.field.replicas" })}
                >
                  {editingIndex.replicas || 0}
                </Descriptions.Item>
                <Descriptions.Item
                  label={formatMessage({ id: "indices.field.docs_count" })}
                >
                  {formatter.number(editingIndex.docs_count || 0)}
                </Descriptions.Item>
                <Descriptions.Item
                  label={formatMessage({ id: "indices.field.docs_deleted" })}
                >
                  {formatter.number(editingIndex.docs_deleted || 0)}
                </Descriptions.Item>
                <Descriptions.Item
                  label={formatMessage({ id: "indices.field.store_size" })}
                >
                  {editingIndex.store_size}
                </Descriptions.Item>
                <Descriptions.Item
                  label={formatMessage({
                    id: "indices.field.primary_store_size",
                  })}
                >
                  {editingIndex.pri_store_size}
                </Descriptions.Item>
              </Descriptions>
            </TabPane>
            <TabPane tab="Mappings" key="mappings">
              <JSONWrapper>
                <div
                  style={{
                    background: "#F5F7FA",
                    color: "#343741",
                    padding: 10,
                  }}
                >
                  <pre className="language-json">
                    {JSON.stringify(
                      this.props.index.mappings[editingIndex.index],
                      null,
                      2
                    )}
                  </pre>
                </div>
              </JSONWrapper>
            </TabPane>
            {hasAuthority("data.index:all") ? (
              <TabPane tab="Edit settings" key="settings">
                <div style={{ textAlign: "right", marginBottom: 10 }}>
                  <span style={{ marginRight: 30 }}>
                    Edit, then save your JSON
                  </span>
                  <Button
                    type="primary"
                    onClick={() => {
                      this.handleIndexSettingsSaveClick(editingIndex.index);
                    }}
                  >
                    Save
                  </Button>
                </div>
                <div style={{ border: "1px solid rgb(232, 232, 232)" }}>
                  <Editor
                    height="300px"
                    language="json"
                    theme="light"
                    value={JSON.stringify(newSettings, null, 2)}
                    options={{
                      minimap: {
                        enabled: false,
                      },
                      tabSize: 2,
                      wordBasedSuggestions: true,
                      scrollBeyondLastLine: false,
                    }}
                    onMount={(editor) =>
                      this.handleEditorDidMount("indexSettingsEditor", editor)
                    }
                  />
                </div>
              </TabPane>
            ) : null}
          </Tabs>
          {/* <div style={{ position: "absolute", bottom: 10 }}>
            <Dropdown
              placement="topLeft"
              overlay={
                <Menu>
                  <Menu.Item key="1">
                    <Popconfirm
                      onConfirm={() => {
                        this.handleDeleteClick(editingIndex.index);
                        this.setState({ drawerVisible: false });
                      }}
                      title="sure to delete ?"
                    >
                      <Icon type="delete" />
                      Delete
                    </Popconfirm>
                  </Menu.Item>
                  <Menu.Item key="3">
                    <Icon type="close" />
                    Close
                  </Menu.Item>
                </Menu>
              }
            >
              <Button type="primary">
                Manage <Icon type="up" />
              </Button>
            </Dropdown>
          </div> */}
        </Drawer>
        <DeleteIndexModal
          visible={this.state.deleteIndexVisible}
          onCancel={this.onDeleteIndexCancel}
          onOk={this.onDeleteIndexOK}
          onChangeDeleteIndexConfirmState={this.onChangeDeleteIndexConfirmState}
          deleteIndexConfirm={this.state.deleteIndexConfirm}
          items={this.state.deleteIndexItems}
        />
      </PageHeaderWrapper>
    );
  }
}

export default Index;
