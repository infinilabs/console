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
  Spin, Select,
} from "antd";
import router from "umi/router";

import styles from "./Form.less";
import { connect } from "dva";
import NewCluster from "./Step";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import { formatMessage } from "umi/locale";
import TagEditor from "@/components/infini/TagEditor";
import MonitorConfigsForm from "./MonitorConfigsForm";
import MetadataConfigsForm from "./MetadataConfigsForm";
import { formatConfigsValues } from "./utils";
import CredentialForm from "./CredentialForm";
import AgentCredentialForm from "./AgentCredentialForm";
import { MANUAL_VALUE } from "./steps";
import SearchEngines from "./components/SearchEngines";
import Providers from "./components/Providers";
import TrimSpaceInput from "@/components/TrimSpaceInput";

const InputGroup = Input.Group;
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
      monitored: true,
      isManual: false,
      credentialRequired: true,
      agentCredentialRequired: false,
      btnLoading: false,
      btnLoadingAgent: false,
      submitLoading: false,
    };
  }

  validateFieldNames = [
    "name",
    "host",
    "isTLS",
    "credential_id",
    "username",
    "password",
  ];
  agentValidateFieldNames = [
    "name",
    "host",
    "isTLS",
    "agent_credential_id",
    "agent_username",
    "agent_password",
  ];

  componentDidMount() {
    //console.log(this.props.clusterConfig.editMode)
    const { match, dispatch, clusterConfig } = this.props;
    if (clusterConfig?.editValue) {
      this.setState({
        monitored: clusterConfig?.editValue.hasOwnProperty("monitored")
          ? clusterConfig?.editValue?.monitored
          : false,
      });
    }

    dispatch({
      type: "clusterConfig/fetchCluster",
      payload: {
        id: match.params.id,
      },
    }).then((res) => {
      if (res && res.found) {
        let editValue = res._source;
        let needAuth = false;
        let isManual = false;
        if (editValue.credential_id) {
          needAuth = true;
        } else {
          if (
            editValue.basic_auth &&
            typeof editValue.basic_auth.username !== "undefined"
          ) {
            needAuth = true;
            isManual = true;
          }
        }
        this.setState({
          needAuth,
          isManual,
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

  handleSubmit = async () => {
    const { form, dispatch, clusterConfig, history } = this.props;

    if (this.state.needAuth) {
      this.setState({
        ...this.state,
        credentialRequired: true,
        agentCredentialRequired: false,
      });
      //强制验证用户凭据设置
      let isValidate = true;
      await form.validateFields(
        this.validateFieldNames,
        { force: true },
        (errors, values) => {
          if (errors) {
            isValidate = false;
          }
        }
      );
      if (!isValidate) {
        return;
      }
    }

    form.validateFields({ force: true }, (errors, values) => {
      if (errors) {
        return;
      }
      const monitor_configs_new = formatConfigsValues(values.monitor_configs);
      const metadata_configs_new = formatConfigsValues(values.metadata_configs);

      let newVals = {
        name: values.name,
        host: values.host,
        hosts: values.hosts,
        credential_id:
          values.credential_id !== MANUAL_VALUE
            ? values.credential_id
            : undefined,
        basic_auth: {
          username: values.username,
          password: values.password,
        },

        agent_credential_id:
          values.agent_credential_id !== MANUAL_VALUE
            ? values.agent_credential_id
            : undefined,
        agent_basic_auth: {
          username: values.agent_username,
          password: values.agent_password,
        },

        description: values.description,
        enabled: values.enabled,
        monitored: values.monitored,
        monitor_configs: monitor_configs_new,
        metadata_configs: metadata_configs_new,
        discovery: {
          enabled: values.discovery.enabled,
        },
        version: values.version,
        schema: values.isTLS === true ? "https" : "http",
        tags: values.tags,
        distribution: values.distribution,
        location: values.location,
        // order: values.order,
      };
      if (this.clusterUUID) {
        newVals.cluster_uuid = this.clusterUUID;
      }
      if (clusterConfig.editMode === "NEW") {
        dispatch({
          type: "clusterConfig/addCluster",
          payload: newVals,
        }).then(function(rel) {
          if (rel) {
            message.success(
              formatMessage({
                id: "app.message.add.success",
              })
            );
            router.push("/resource/cluster");
          }
        });
      } else {
        newVals.id = clusterConfig.editValue.id;
        dispatch({
          type: "clusterConfig/updateCluster",
          payload: newVals,
        }).then(function(rel) {
          if (rel) {
            message.success(
              formatMessage({
                id: "app.message.update.success",
              })
            );
            // router.push("/resource/cluster");
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

  tryConnect = async (type) => {
    const { dispatch, form } = this.props;
    if (this.state.needAuth) {
      if (type === "agent") {
        this.setState({
          ...this.state,
          credentialRequired: false,
          agentCredentialRequired: true,
        });
      } else {
        this.setState({
          ...this.state,
          credentialRequired: true,
          agentCredentialRequired: false,
        });
      }
    }
    let fieldNames = this.validateFieldNames;
    if (type === "agent") {
      fieldNames = this.agentValidateFieldNames;
    }
    setTimeout(() => {
      form.validateFields(
        fieldNames,
        { force: true },
        async (errors, values) => {
          if (errors) {
            return false;
          }
          if (!values) {
            return;
          }
          let newVals = {
            name: values.name,
            host: values.host,

            schema: values.isTLS === true ? "https" : "http",
          };
          if (type === "agent") {
            newVals = {
              ...newVals,
              ...{
                credential_id:
                  values.agent_credential_id !== MANUAL_VALUE
                    ? values.agent_credential_id
                    : undefined,
                basic_auth: {
                  username: values.agent_username,
                  password: values.agent_password,
                },
              },
            };
            this.setState({ btnLoadingAgent: true });
          } else {
            newVals = {
              ...newVals,
              ...{
                credential_id:
                  values.credential_id !== MANUAL_VALUE
                    ? values.credential_id
                    : undefined,
                basic_auth: {
                  username: values.username,
                  password: values.password,
                },
              },
            };
            this.setState({ btnLoading: true });
          }

          const res = await dispatch({
            type: "clusterConfig/doTryConnect",
            payload: newVals,
          });
          if (res) {
            message.success(
              formatMessage({
                id: "app.message.connect.success",
              })
            );
            form.setFieldsValue({
              version: res.version,
            });
            this.clusterUUID = res.cluster_uuid;
          }
          if (type === "agent") {
            this.setState({ btnLoadingAgent: false });
          } else {
            this.setState({ btnLoading: false });
          }
        }
      );
    }, 200);
  };

  validateHostsRule = (rule, value, callback) => {
    let vals = value || [];
    for(let i = 0; i < vals.length; i++) {
      if (!/^[\w\.\-_~%]+(\:\d+)?$/.test(vals[i])) {
        return callback(formatMessage({ id: "cluster.regist.form.verify.valid.endpoint" }));
      }
    }
    // validation passed
    callback();
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
    //add host value to hosts field if it's empty
    if(editValue.host){
      if(!editValue.hosts){
        editValue.hosts = [editValue.host];
      }else{
        if (!editValue.hosts.includes(editValue.host)) {
          editValue.hosts.push(editValue.host);
        }
      }
    }
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
                router.push("/resource/cluster");
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
                      message: formatMessage({
                        id: "cluster.regist.form.verify.required.cluster_name",
                      }),
                    },
                  ],
                })(<Input autoComplete="off" placeholder="Cluster name" />)}
              </Form.Item>
              <Form.Item
                label={formatMessage({
                  id: "cluster.manage.label.distribution",
                })}
              >
                {getFieldDecorator("distribution", {
                  initialValue: editValue.distribution,
                })(<SearchEngines />)}
              </Form.Item>
              <Form.Item
                label={formatMessage({
                  id: "cluster.manage.label.provider",
                })}
              >
                {getFieldDecorator("location.provider", {
                  initialValue: editValue.location?.provider,
                })(<Providers />)}
              </Form.Item>
              <Form.Item
                label={formatMessage({
                  id: "cluster.manage.label.region",
                })}
              >
                {getFieldDecorator("location.region", {
                  initialValue: editValue.location?.region,
                })(<Input placeholder="beijing | shanghai" />)}
              </Form.Item>
              <Form.Item
                label={formatMessage({
                  id: "cluster.manage.label.cluster_host",
                })}
              >
                {getFieldDecorator("hosts", {
                  initialValue: editValue.hosts,
                  rules: [
                    {
                      validator: this.validateHostsRule,
                    },
                    {
                      required: true,
                      message: formatMessage({
                        id: "cluster.regist.form.verify.required.endpoint",
                      }),
                    },
                  ],
                })(<Select placeholder="127.0.0.1:9200" mode="tags" />)}
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
                  valuePropName: "checked",
                })(
                  <Switch
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
              <CredentialForm
                showTestAction={true}
                btnLoading={this.state.btnLoading}
                needAuth={this.state.needAuth}
                form={this.props.form}
                initialValue={{
                  ...editValue,
                  username: editValue.basic_auth?.username,
                  password: editValue.basic_auth?.password,
                }}
                isManual={this.state.isManual}
                isEdit={true}
                tryConnect={this.tryConnect}
                credentialRequired={this.state.credentialRequired}
              />
              <AgentCredentialForm
                btnLoading={this.state.btnLoadingAgent}
                needAuth={this.state.needAuth}
                form={this.props.form}
                initialValue={{
                  ...editValue,
                  username: editValue.agent_basic_auth?.username,
                  password: editValue.agent_basic_auth?.password,
                }}
                isManual={this.state.isManual}
                isEdit={true}
                tryConnect={this.tryConnect}
                credentialRequired={this.state.agentCredentialRequired}
              />

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
                  id: "cluster.manage.table.column.discovery.enabled",
                })}
              >
                {getFieldDecorator("discovery.enabled", {
                  valuePropName: "checked",
                  initialValue: editValue?.discovery?.enabled ?? false,
                })(
                  <Switch
                    checkedChildren={<Icon type="check" />}
                    unCheckedChildren={<Icon type="close" />}
                  />
                )}
              </Form.Item>
              <Form.Item
                label={formatMessage({
                  id: "cluster.manage.table.column.monitored",
                })}
              >
                {getFieldDecorator("monitored", {
                  valuePropName: "checked",
                  initialValue: this.state.monitored,
                })(
                  <Switch
                    checkedChildren={<Icon type="check" />}
                    unCheckedChildren={<Icon type="close" />}
                    onChange={(checked) => {
                      this.setState({
                        monitored: checked,
                      });
                    }}
                  />
                )}
              </Form.Item>
              <MonitorConfigsForm
                form={this.props.form}
                editValue={editValue}
                visible={this.state.monitored}
              />
              <MetadataConfigsForm
                form={this.props.form}
                editValue={editValue}
              />
              <Form.Item label="Tags">
                {getFieldDecorator("tags", {
                  initialValue: editValue.tags,
                  rules: [],
                })(<TagEditor />)}
              </Form.Item>

              {/* <Form.Item
                label={formatMessage({
                  id: "cluster.manage.table.column.project",
                })}
              >
                {getFieldDecorator("project", {
                  required: true,
                  message: "Project is required!",
                })(<Input placeholder="project" />)}
              </Form.Item>
              <Form.Item
                label={formatMessage({
                  id: "cluster.manage.table.column.owner",
                })}
              >
                {getFieldDecorator("owner", {
                  required: true,
                  message: "owner is required!",
                })(<Input placeholder="owner" />)}
              </Form.Item>
              <Form.Item
                label={formatMessage({
                  id: "cluster.manage.table.column.area",
                })}
              >
                {getFieldDecorator("area", {})(<Input placeholder="area" />)}
              </Form.Item>
              <Form.Item
                label={formatMessage({
                  id: "cluster.manage.table.column.location",
                })}
              >
                {getFieldDecorator(
                  "location",
                  {}
                )(<Input placeholder="location" />)}
              </Form.Item> */}
              <Form.Item {...tailFormItemLayout}>
                <Button type="primary" onClick={this.handleSubmit}>
                  {formatMessage({
                    id:
                      editMode === "NEW"
                        ? "form.button.regist"
                        : "form.button.save",
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
