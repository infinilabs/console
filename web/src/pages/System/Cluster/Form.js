import React from "react";
import {
  Card,
  Form,
  Icon,
  Input,
  InputNumber,
  Button,
  Switch,
  message,
  Spin,
} from "antd";
import router from "umi/router";

import styles from "./Form.less";
import { connect } from "dva";
import NewCluster from "./Step";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import { formatMessage } from "umi/locale";

@Form.create()
@connect(({ clusterConfig }) => ({
  clusterConfig,
}))
class ClusterForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      confirmDirty: false,
      isLoading: false,
    };
  }

  componentDidMount() {
    //console.log(this.props.clusterConfig.editMode)
    const { match, dispatch, clusterConfig } = this.props;
    dispatch({
      type: "clusterConfig/fetchCluster",
      payload: {
        id: match.params.id,
      },
    }).then((res) => {
      if (res && res.found) {
        let editValue = res._source;
        let needAuth = false;
        if (
          editValue.basic_auth &&
          typeof editValue.basic_auth.username !== "undefined"
        ) {
          needAuth = true;
        }
        this.setState({
          needAuth: needAuth,
        });
      }
    });
  }

  compareToFirstPassword = (rule, value, callback) => {
    const { form } = this.props;
    if (value && value !== form.getFieldValue("password")) {
      callback("Two passwords that you enter is inconsistent!");
    } else {
      callback();
    }
  };

  validateToNextPassword = (rule, value, callback) => {
    const { form } = this.props;
    if (value && this.state.confirmDirty) {
      form.validateFields(["confirm"], { force: true });
    }
    callback();
  };

  handleSubmit = () => {
    const { form, dispatch, clusterConfig, history } = this.props;
    form.validateFields((errors, values) => {
      if (errors) {
        return;
      }
      //console.log(values);
      let newVals = {
        name: values.name,
        host: values.host,
        basic_auth: {
          username: values.username,
          password: values.password,
        },
        description: values.description,
        enabled: values.enabled,
        monitored: values.monitored,
        version: values.version,
        schema: values.isTLS === true ? "https" : "http",
        // order: values.order,
      };
      if (clusterConfig.editMode === "NEW") {
        dispatch({
          type: "clusterConfig/addCluster",
          payload: newVals,
        }).then(function(rel) {
          if (rel) {
            message.success("添加成功");
            router.push("/system/cluster");
          }
        });
      } else {
        newVals.id = clusterConfig.editValue.id;
        dispatch({
          type: "clusterConfig/updateCluster",
          payload: newVals,
        }).then(function(rel) {
          if (rel) {
            message.success("修改成功");
            // router.push("/system/cluster");
            history.go(-1);
          }
        });
      }
    });
  };

  handleAuthChange = (val) => {
    this.setState({
      needAuth: val,
    });
  };

  tryConnect = async () => {
    const { dispatch, form } = this.props;
    const values = await form.validateFields((errors, values) => {
      if (errors) {
        return false;
      }

      return values;
    });

    if (!values) {
      return;
    }
    let newVals = {
      name: values.name,
      host: values.host,
      basic_auth: {
        username: values.username,
        password: values.password,
      },
      schema: values.isTLS === true ? "https" : "http",
    };
    this.setState({ isLoading: true });
    const res = await dispatch({
      type: "clusterConfig/doTryConnect",
      payload: newVals,
    });
    if (res) {
      message.success("连接成功！");
      form.setFieldsValue({
        version: res.version,
      });
    }
    this.setState({ isLoading: false });
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 },
      },
    };
    const tailFormItemLayout = {
      wrapperCol: {
        xs: {
          span: 24,
          offset: 0,
        },
        sm: {
          span: 16,
          offset: 6,
        },
      },
    };
    const { editValue, editMode } = this.props.clusterConfig;
    return (
      <PageHeaderWrapper>
        <Card
          title={formatMessage({
            id:
              editMode === "NEW"
                ? "cluster.regist.title"
                : "cluster.edit.title",
          })}
          extra={[
            <Button
              type="primary"
              onClick={() => {
                router.push("/system/cluster");
              }}
            >
              {formatMessage({
                id: "form.button.goback",
              })}
            </Button>,
          ]}
        >
          <Spin spinning={this.state.isLoading}>
            <Form {...formItemLayout}>
              <Form.Item
                label={formatMessage({
                  id: "cluster.manage.label.cluster_name",
                })}
              >
                {getFieldDecorator("name", {
                  initialValue: editValue.name,
                  rules: [
                    {
                      required: true,
                      message: "Please input cluster name!",
                    },
                  ],
                })(<Input autoComplete="off" placeholder="cluster-name" />)}
              </Form.Item>
              <Form.Item
                label={formatMessage({
                  id: "cluster.manage.label.cluster_host",
                })}
              >
                {getFieldDecorator("host", {
                  initialValue: editValue.host,
                  rules: [
                    {
                      type: "string",
                      pattern: /^[\w\.\-_~%]+(\:\d+)?$/,
                      message: "请输入域名或 IP 地址和端口号",
                    },
                    {
                      required: true,
                      message: "请输入域名或 IP 地址和端口号!",
                    },
                  ],
                })(<Input placeholder="127.0.0.1:9200" />)}
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                {getFieldDecorator("version", {
                  initialValue: editValue.version,
                  rules: [],
                })(<Input type="hidden" />)}
              </Form.Item>
              <Form.Item label="TLS">
                {getFieldDecorator("isTLS", {
                  initialValue: editValue?.schema === "https",
                })(
                  <Switch
                    defaultChecked={editValue?.schema === "https"}
                    checkedChildren={<Icon type="check" />}
                    unCheckedChildren={<Icon type="close" />}
                  />
                )}
              </Form.Item>
              <Form.Item
                label={formatMessage({
                  id: "cluster.regist.step.connect.label.auth",
                })}
              >
                <Switch
                  checked={this.state.needAuth}
                  onChange={this.handleAuthChange}
                  checkedChildren={<Icon type="check" />}
                  unCheckedChildren={<Icon type="close" />}
                />
              </Form.Item>
              {this.state.needAuth === true ? (
                <div>
                  <Form.Item
                    label={formatMessage({
                      id: "cluster.regist.step.connect.label.username",
                    })}
                  >
                    {getFieldDecorator("username", {
                      initialValue: editValue.basic_auth?.username,
                      rules: [],
                    })(<Input autoComplete="off" />)}
                  </Form.Item>
                  <Form.Item
                    label={formatMessage({
                      id: "cluster.regist.step.connect.label.password",
                    })}
                    hasFeedback
                  >
                    {getFieldDecorator("password", {
                      initialValue: editValue.basic_auth?.password,
                      rules: [],
                    })(<Input.Password />)}
                  </Form.Item>
                </div>
              ) : (
                ""
              )}
              {/* <Form.Item label="排序权重">
          {getFieldDecorator('order', {
            initialValue: editValue.order || 0,
          })(<InputNumber />)}
        </Form.Item> */}
              <Form.Item
                label={formatMessage({
                  id: "cluster.manage.table.column.description",
                })}
              >
                {getFieldDecorator("description", {
                  initialValue: editValue.description,
                })(<Input.TextArea placeholder="Cluster Descirption" />)}
              </Form.Item>
              {/* <Form.Item label="是否启用">
          {getFieldDecorator('enabled', {
            valuePropName: 'checked',
            initialValue: typeof editValue.enabled === 'undefined' ? true: editValue.enabled,
          })(<Switch
            checkedChildren={<Icon type="check" />}
            unCheckedChildren={<Icon type="close" />}
          />)}
        </Form.Item> */}
              <Form.Item
                label={formatMessage({
                  id: "cluster.manage.table.column.monitored",
                })}
              >
                {getFieldDecorator("monitored", {
                  valuePropName: "checked",
                  initialValue:
                    typeof editValue.monitored === "undefined"
                      ? true
                      : editValue.monitored,
                })(
                  <Switch
                    checkedChildren={<Icon type="check" />}
                    unCheckedChildren={<Icon type="close" />}
                  />
                )}
              </Form.Item>
              <Form.Item {...tailFormItemLayout}>
                <Button type="primary" onClick={this.handleSubmit}>
                  {formatMessage({
                    id:
                      editMode === "NEW"
                        ? "form.button.regist"
                        : "form.button.save",
                  })}
                </Button>
                <Button style={{ marginLeft: 15 }} onClick={this.tryConnect}>
                  {formatMessage({
                    id: "cluster.manage.btn.try_connect",
                  })}
                </Button>
              </Form.Item>
            </Form>
          </Spin>
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default ClusterForm;
