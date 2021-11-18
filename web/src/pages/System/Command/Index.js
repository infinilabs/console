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
import { TagGenerator } from "@/components/kibana/console/components/CommonCommandModal";

const FormItem = Form.Item;
const { TextArea } = Input;
const { TabPane } = Tabs;

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
    showSystemIndices: false,
  };
  columns = [
    {
      title: "名称",
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
      title: "标签",
      dataIndex: "tag",
      render: (val) => {
        return (val || []).join(",");
      },
    },
    {
      title: "操作",
      render: (text, record) => (
        <Fragment>
          <Popconfirm
            title="Sure to delete?"
            onConfirm={() => this.handleDeleteClick(record.id)}
          >
            <a>删除</a>
          </Popconfirm>
        </Fragment>
      ),
    },
  ];

  componentDidMount() {
    this.fetchData();
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

  handleFormReset = () => {
    const { form, dispatch } = this.props;
    form.resetFields();
    this.setState({
      formValues: {},
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
        message.success("删除成功！");
      }
    });
  };

  handleSearch = (e) => {
    e.preventDefault();
    const { dispatch, form } = this.props;

    form.validateFields((err, fieldsValue) => {
      if (err) return;
      this.fetchData({
        keyword: fieldsValue.keyword,
        from: 0,
        size: 10,
      });
      this.setState({
        searchKey: fieldsValue.keyword,
      });
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
    const { searchKey } = this.state;
    this.fetchData({
      title: searchKey,
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
        message.success("保存成功！");
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

  render() {
    const { data, total } = this.props.command;
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
            <div className={styles.tableListForm}>
              <Form onSubmit={this.handleSearch} layout="inline">
                <Row gutter={{ md: 8, lg: 24, xl: 48 }}>
                  <Col md={8} sm={24}>
                    <FormItem label="关键词">
                      {getFieldDecorator("keyword")(
                        <Input placeholder="请输入" />
                      )}
                    </FormItem>
                  </Col>
                  <Col md={8} sm={24}>
                    <span className={styles.submitButtons}>
                      <Button type="primary" htmlType="submit">
                        查询
                      </Button>
                      <Button
                        style={{ marginLeft: 8 }}
                        onClick={this.handleFormReset}
                      >
                        重置
                      </Button>
                    </span>
                  </Col>
                  {/* <Col md={8} sm={24} style={{ textAlign: "right" }}>
                    <Button
                      icon="redo"
                      style={{ marginRight: 10 }}
                      onClick={this.handleRereshClick}
                    >
                      刷新
                    </Button>
                  </Col> */}
                </Row>
              </Form>
            </div>

            <Table
              bordered
              dataSource={data}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              columns={this.columns}
            />
          </div>
        </Card>
        <Drawer
          // title={editingCommand.title}
          title="常用命令"
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
            <div>标题：</div>
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
            <div>标签：</div>
            <div>
              <TagGenerator
                value={editingCommand.tag}
                onChange={this.onEditTagChange}
              />
              {/* <Input  style={{ width: 250 }} /> */}
            </div>
          </div>
          <div>内容：</div>
          <div style={{ border: "1px solid rgb(232, 232, 232)" }}>
            <EuiCodeBlock language="json" style={{ height: 300 }} isCopyable>
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
            <Button type="primary" onClick={this.handleSaveClick}>
              保存
            </Button>
          </div>
        </Drawer>
      </PageHeaderWrapper>
    );
  }
}

export default Index;
