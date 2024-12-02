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
// import { loader } from "@monaco-editor/react";
import Editor from "@monaco-editor/react";
import { EuiCodeBlock } from "@elastic/eui";
// loader.config({
//   paths: {
//     vs: "monaco-editor/min/vs",
//   },
// });

import styles from "../../List/TableList.less";
import { transformSettingsForApi } from "@/lib/elasticsearch/edit_settings";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import { TagGenerator } from "@/components/vendor/console/components/CommonCommandModal";
import { formatMessage } from "umi/locale";
import { deleteCommand } from "@/components/vendor/console/modules/mappings/mappings";
import { hasAuthority } from "@/utils/authority";
import "./index.scss";

const FormItem = Form.Item;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Search } = Input;

/* eslint react/no-multi-comp:0 */
@connect(({ command }) => ({
  command,
}))
@Form.create()
class Index extends PureComponent {
  state = {
    modalVisible: false,
    updateModalVisible: false,
    expandForm: false,
    formValues: {},
    drawerVisible: false,
    editingCommand: {},
    indexActiveKey: "1",
    searchValue: "",
    pageSize: 20,
  };
  columns = [
    {
      title: formatMessage({ id: "command.table.field.name" }),
      dataIndex: "title",
      render: (text, record) => (
        <a
          onClick={() => {
            this.setState({
              editingCommand: record,
              drawerVisible: true,
            });
          }}
        >
          {text}
        </a>
      ),
    },
    {
      title: formatMessage({ id: "command.table.field.tag" }),
      dataIndex: "tag",
      render: (val) => {
        return (val || []).join(",");
      },
    },
    {
      title: formatMessage({ id: "table.field.actions" }),
      render: (text, record) => (
        <Fragment>
          {hasAuthority("system.command:all") ? (
            <Popconfirm
              title="Sure to delete?"
              onConfirm={() => this.handleDeleteClick(record.id)}
            >
              <a>{formatMessage({ id: "form.button.delete" })}</a>
            </Popconfirm>
          ) : null}
        </Fragment>
      ),
    },
  ];

  componentDidMount() {
    this.fetchData({
      current: 1,
    });
  }

  fetchData = (params = {}) => {
    const { dispatch } = this.props;
    dispatch({
      type: "command/fetchCommandList",
      payload: {
        ...params,
      },
    });
  };

  handleDeleteClick = (id) => {
    const { dispatch } = this.props;
    dispatch({
      type: "command/removeCommand",
      payload: {
        id: id,
      },
    }).then((res) => {
      if (!res.error) {
        deleteCommand(id);
        message.success(
          formatMessage({
            id: "app.message.delete.success",
          })
        );
      }
    });
  };

  handleSearch = (val) => {
    this.setState({
      searchValue: val,
    });

    this.fetchData({
      keyword: val,
      from: 0,
      size: 10,
      current: 1,
    });
  };

  handleModalVisible = (flag) => {
    this.setState({
      modalVisible: !!flag,
    });
  };

  handleIndexTabChanged = (activeKey, indexName) => {};
  handleEditorDidMount = (editorName, editor) => {
    this[editorName] = editor;
  };

  buildRawCommonCommandRequest(cmd) {
    const { requests } = cmd;
    if (!requests) {
      return "";
    }
    const strReqs = requests.map((req) => {
      const { method, path, body } = req;
      return `${method} ${path}\n${body}`;
    });
    return strReqs.join("\n");
  }
  handleRereshClick = () => {
    const { searchValue } = this.state;
    this.fetchData({
      title: searchValue,
    });
  };

  handleSaveClick = () => {
    // console.log(this.state.editingCommand);
    const { dispatch } = this.props;
    dispatch({
      type: "command/updateCommand",
      payload: {
        ...this.state.editingCommand,
      },
    }).then((res) => {
      if (!res.error) {
        this.setState({
          drawerVisible: false,
          editingCommand: {},
        });
        message.success(formatMessage({ id: "app.message.save.success" }));
        this.fetchData();
      }
    });
  };

  onEditTitleChange = (e) => {
    this.setState({
      editingCommand: {
        ...this.state.editingCommand,
        title: e.target.value,
      },
    });
  };
  onEditTagChange = (val) => {
    this.setState({
      editingCommand: {
        ...this.state.editingCommand,
        tag: val,
      },
    });
  };
  handleTableChange = (pagination, filters, sorter, extra) => {
    const { form } = this.props;
    const { pageSize, current } = pagination;
    this.fetchData({
      from: (current - 1) * pageSize,
      size: pageSize,
      keyword: form.getFieldValue("keyword"),
      current,
    });
  };

  render() {
    const { data, total, current } = this.props.command;
    const {
      modalVisible,
      updateModalVisible,
      updateFormValues,
      drawerVisible,
      editingCommand,
    } = this.state;
    const parentMethods = {
      handleAdd: this.handleAdd,
      handleModalVisible: this.handleModalVisible,
    };
    const updateMethods = {
      handleUpdateModalVisible: this.handleUpdateModalVisible,
      handleUpdate: this.handleUpdate,
    };
    const {
      form: { getFieldDecorator },
    } = this.props;

    return (
      <PageHeaderWrapper>
        <Card bordered={false}>
          <div className={styles.tableList}>
            <div
              style={{
                display: "flex",
                marginBottom: 10,
                flex: "1 1 auto",
                justifyContent: "space-between",
                alignItems: "center",
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
                <Button
                  icon="redo"
                  onClick={() => {
                    this.fetchData({
                      from: (current - 1) * this.state.pageSize,
                      size: this.state.pageSize,
                      keyword: this.state.searchValue,
                      current,
                    });
                  }}
                >
                  {formatMessage({ id: "form.button.refresh" })}
                </Button>
              </div>
            </div>

            <Table
              size={"small"}
              bordered
              dataSource={data}
              rowKey="id"
              pagination={{
                size: "small",
                pageSize: this.state.pageSize,
                current: current,
                total: total?.value || total,
                showSizeChanger: true,
                onShowSizeChange: (_, size) => {
                  this.setState({ pageSize: size });
                },
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
              }}
              onChange={this.handleTableChange}
              columns={this.columns.filter((item) => {
                if (item.dataIndex) return true;
                if (hasAuthority("system.command:all")) return true
                return false
              })}
            />
          </div>
        </Card>
        <Drawer
          className="command-detail"
          // title={editingCommand.title}
          title={formatMessage({ id: "command.manage.edit.title" })}
          visible={drawerVisible}
          onClose={() => {
            this.setState({
              drawerVisible: false,
              indexActiveKey: "1",
            });
          }}
          width={720}
        >
          <div
            style={{ display: "flex", alignItems: "center", marginBottom: 15 }}
          >
            <div>{formatMessage({ id: "command.table.field.name" })}：</div>
            <div>
              <Input
                value={editingCommand.title}
                onChange={this.onEditTitleChange}
                style={{ width: 250 }}
              />
            </div>
          </div>
          <div
            style={{ display: "flex", alignItems: "center", marginBottom: 15 }}
          >
            <div>{formatMessage({ id: "command.table.field.tag" })}：</div>
            <div>
              <TagGenerator
                value={editingCommand.tag || []}
                onChange={this.onEditTagChange}
              />
              {/* <Input  style={{ width: 250 }} /> */}
            </div>
          </div>
          <div>{formatMessage({ id: "command.table.field.content" })}：</div>
          <div style={{ border: "1px solid rgb(232, 232, 232)" }}>
            <EuiCodeBlock language="json" isCopyable>
              {this.buildRawCommonCommandRequest(editingCommand)}
            </EuiCodeBlock>
            {/* <Editor
              height="300px"
              language="text"
              theme="light"
              value={this.buildRawCommonCommandRequest(editingCommand)}
              options={{
                readOnly: true,
                minimap: {
                  enabled: false,
                },
                tabSize: 2,
                wordBasedSuggestions: true,
              }}
              onMount={(editor) =>
                this.handleEditorDidMount("commandEditor", editor)
              }
            /> */}
          </div>
          <div style={{ marginTop: 15, textAlign: "right" }}>
            {hasAuthority("system.command:all") ? (
              <Button type="primary" onClick={this.handleSaveClick}>
                {formatMessage({ id: "form.button.save" })}
              </Button>
            ) : null}
          </div>
        </Drawer>
      </PageHeaderWrapper>
    );
  }
}

export default Index;
