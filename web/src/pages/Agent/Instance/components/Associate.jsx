import { useGlobal } from "@/layouts/GlobalContext";
import request from "@/utils/request";
import { Form, Input, Switch, Icon, Button, Select } from "antd";
import { useMemo, useRef, useState } from "react";
import { Link, router } from "umi";
import { formatMessage } from "umi/locale";
import CredentialForm from "../../../System/Cluster/CredentialForm";

export const Associate = Form.create({ name: "associate_form" })((props) => {
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
  const { record, form, agentID, onAssociateComplete } = props;
  const { getFieldDecorator } = form;
  const resultSt = {
    showResult: false,
    resultData: {},
  };
  if (record.cluster_info.cluster_uuid) {
    (resultSt.showResult = true), (resultSt.resultData = record);
    resultSt.resultData.showConnect = false;
  }
  const [state, setState] = useState({
    needAuth: false,
    isManual: false,
    ...resultSt,
  });
  const handleAuthChange = (val) => {
    setState((st) => {
      return {
        ...st,
        needAuth: val,
      };
    });
  };

  const onConnectClick = async () => {
    const values = await form.validateFields((errors, values) => {
      if (errors) {
        return false;
      }

      return values;
    });

    if (!values) {
      return;
    }
    const newValues = {
      host: values.host,
      credential_id: values.credential_id,
    };
    if (values.isTLS === true) {
      newValues.schema = "https";
    } else {
      newValues.schema = "http";
    }
    if (values.username || values.password) {
      newValues.basic_auth = {
        username: values.username,
        password: values.password,
      };
    }
    const res = await request(
      `/instance/${agentID}/elasticsearch/try_connect`,
      {
        method: "POST",
        body: {
          host: values.host,
          schema: newValues.schema,
          basic_auth: newValues.basic_auth,
          credential_id: values.credential_id,
        },
      }
    );
    if (res && !res.error) {
      setState((st) => {
        return {
          ...st,
          showResult: true,
          resultData: res,
        };
      });
    }
  };

  return (
    <div>
      {state.showResult ? (
        <Result
          data={state.resultData}
          onComplete={onAssociateComplete}
          loading={props.loading}
        />
      ) : (
        <div>
          <div
            style={{
              marginBottom: 15,
              padding: "10px 0",
              background: "rgb(250, 250, 250)",
              textAlign: "center",
            }}
          >
            {formatMessage({
              id: "agent.instance.associate.tips.access_failed",
            })}
          </div>
          <Form {...formItemLayout}>
            <Form.Item
              label={formatMessage({
                id: "agent.instance.associate.labels.node_adress",
              })}
            >
              {getFieldDecorator("host", {
                initialValue: record?.node_info?.http?.publish_address,
                rules: [
                  // {
                  //   type: "string",
                  //   pattern: /^[\w\.\-_~%]+(\:\d+)?$/,
                  //   message: formatMessage({
                  //     id: "cluster.regist.form.verify.valid.endpoint",
                  //   }),
                  // },
                  {
                    required: true,
                    message: formatMessage({
                      id: "cluster.regist.form.verify.required.endpoint",
                    }),
                  },
                ],
              })(<Input placeholder="127.0.0.1:9200" />)}
            </Form.Item>
            <Form.Item label="TLS">
              {getFieldDecorator("isTLS", {
                initialValue: record?.schema === "https",
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
                checked={state.needAuth}
                onChange={handleAuthChange}
                checkedChildren={<Icon type="check" />}
                unCheckedChildren={<Icon type="close" />}
              />
            </Form.Item>
            <CredentialForm
              needAuth={state.needAuth}
              form={props.form}
              initialValue={{
                username: "",
                password: "",
              }}
              isManual={state.isManual}
            />
            <Form.Item {...tailFormItemLayout}>
              <Button type="primary" onClick={onConnectClick}>
                Connect
              </Button>
            </Form.Item>
          </Form>
        </div>
      )}
    </div>
  );
});

const Result = ({ data, onComplete, loading = false }) => {
  const { clusterList = [] } = useGlobal();
  const clusters = useMemo(
    () => {
      if (!data.cluster_info.cluster_uuid) {
        return [];
      }
      return clusterList.filter((item) => {
        return item.cluster_uuid == data.cluster_info.cluster_uuid;
      });
    },
    clusterList,
    data.cluster_info.cluster_uuid
  );
  const selectedID = clusters[0]?.id || "";
  const clusterRef = useRef();

  const onAssociateClick = () => {
    if (typeof onComplete === "function") {
      const clusterID = clusterRef.current.rcSelect.state?.value[0] || "";
      onComplete({
        cluster_id: clusterID,
        cluster_name: data?.cluster_info?.cluster_name,
        cluster_uuid: data?.cluster_info?.cluster_uuid,
        node_uuid: data?.id, //node info id
        publish_address: data?.node_info?.http?.publish_address,
        node_name: data?.node_info?.name,
        path_home: data?.node_info?.settings?.path?.home,
        path_logs: data?.node_info?.settings?.path?.logs,
        // credential_id:values.credential_id,
      });
    }
  };

  return (
    <div>
      <div style={{ background: "rgb(250, 250, 250)", padding: 20 }}>
        {data?.showConnect === true ? (
          <div style={{ fontSize: 20, color: "rgb(0, 127, 255)" }}>
            {formatMessage({
              id: "agent.instance.associate.tips.connected",
            })}
          </div>
        ) : null}
        <div
          style={{ fontSize: 20, color: "rgb(0, 127, 255)", marginBottom: 15 }}
        >
          {formatMessage({
            id: "agent.instance.associate.tips.associate",
          })}
        </div>
        <div style={{ color: "rgb(136, 136, 136)", lineHeight: "1.8em" }}>
          <div>
            {formatMessage({
              id: "agent.instance.associate.labels.cluster_name",
            })}
            ：{data?.cluster_info?.cluster_name}
          </div>
          <div>
            {" "}
            {formatMessage({
              id: "agent.instance.associate.labels.cluster_version",
            })}
            ：{data?.cluster_info?.version?.number}
          </div>
          <div>Cluster UUID：{data?.cluster_info?.cluster_uuid}</div>
          {/* <div>Cluster Health：{data?.status}</div> */}
          <div>Node Name：{data?.node_info?.name}</div>
          <div>Node UUID：{data?.id}</div>
          <div>Publish Address：{data?.node_info?.http?.publish_address}</div>
          <div>Path Home：{data?.node_info?.settings?.path?.home}</div>
          <div>Path Log：{data?.node_info?.settings?.path?.logs}</div>
        </div>
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center", marginTop: 15 }}>
          <div style={{ paddingRight: 10 }}>
            {" "}
            {formatMessage({
              id: "agent.instance.associate.labels.select_cluster",
            })}
          </div>
          <div style={{ flex: "1 1 auto" }}>
            <Select
              style={{ width: "100%" }}
              defaultValue={selectedID}
              ref={clusterRef}
            >
              {clusters.map((item) => {
                return (
                  <Select.Option key={item.id} value={item.id}>
                    {item.name} | {item.id}
                  </Select.Option>
                );
              })}
            </Select>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 10, textAlign: "right" }}>
        <div style={{ marginBottom: 15, color: "rgba(130,129,136,1)" }}>
          {clusters.length == 0 ? (
            <span>
              {formatMessage({
                id: "agent.instance.associate.tips.unregister",
              })}
              <a
                onClick={() => {
                  router.push({
                    pathname: "/resource/cluster/regist",
                    query: {
                      schema: data.schema,
                      host: data.publish_address,
                    },
                  });
                }}
              >
                {formatMessage({
                  id: "agent.instance.associate.tips.to_register",
                })}
              </a>
            </span>
          ) : (
            <span>
              {formatMessage({
                id: "agent.instance.associate.tips.metric",
              })}
            </span>
          )}
        </div>
        <Button
          type="primary"
          disabled={clusters.length === 0}
          onClick={onAssociateClick}
          loading={loading}
        >
          {formatMessage({ id: "agent.instance.table.operation.associate" })}
        </Button>
      </div>
    </div>
  );
};
