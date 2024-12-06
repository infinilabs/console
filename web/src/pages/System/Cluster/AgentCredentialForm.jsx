import React, { useEffect, useMemo, useState } from "react";
import { Button, Divider, Form, Input, Select, Row, Col } from "antd";
import { formatMessage } from "umi/locale";
import useFetch from "@/lib/hooks/use_fetch";
import { formatESSearchResult } from "@/lib/elasticsearch/util";
import { MANUAL_VALUE } from "./steps";
import { hasAuthority } from "@/utils/authority";

export default (props) => {
  const {
    btnLoading = false,
    needAuth,
    form: { getFieldDecorator },
    initialValue,
    isEdit,
    tryConnect,
    credentialRequired = false,
  } = props;
  useEffect(() => {}, [credentialRequired]);

  const onTryConnect = async () => {
    const values = await props.form.validateFields((errors, values) => {
      if (errors?.credential_id) {
        delete errors.credential_id;
      }
      if (errors) {
        return false;
      }
      if (!values.agent_credential_id) {
        return false;
      }

      if (
        !values.agent_credential_id &&
        (!values.agent_username || !values.agent_password)
      ) {
        return false;
      }
      values.credential_id =
        values.agent_credential_id !== MANUAL_VALUE
          ? values.agent_credential_id
          : undefined;
      values.basic_auth = {
        username: values.agent_username,
        password: values.agent_password,
      };

      delete values.agent_credential_id;
      delete values.agent_username;
      delete values.agent_password;
      return values;
    });

    tryConnect(values);
  };

  const [isManual, setIsManual] = useState();

  const { loading, error, value, run } = useFetch(
    "/credential/_search",
    {
      queryParams: {
        from: 0,
        size: 1000,
      },
    },
    [],
    false
  );

  const onCredentialChange = (value) => {
    if (value === "manual") {
      setIsManual(true);
    } else {
      setIsManual(false);
    }
  };

  const { data, total } = useMemo(() => {
    return formatESSearchResult(value);
  }, [value]);

  useEffect(() => {
    setIsManual(props.isManual);
  }, [props.isManual]);

  useEffect(() => {
    if (hasAuthority('system.credential:all') || hasAuthority('system.credential:read')) {
      run()
    }
  }, [])

  if (!needAuth) {
    return null;
  }

  return (
    <>
      <Form.Item
        label={formatMessage({
          id: "cluster.regist.step.connect.label.agent_credential",
        })}
      >
        <Row>
          <Col span={16}>
            {getFieldDecorator("agent_credential_id", {
              initialValue: initialValue?.agent_credential_id
                ? initialValue?.agent_credential_id
                : initialValue?.username
                ? MANUAL_VALUE
                : undefined,
              rules: [
                {
                  required: credentialRequired,
                  message: formatMessage({
                    id: "cluster.regist.form.verify.required.agent_credential",
                  }),
                },
              ],
            })(
              <Select
                loading={loading}
                onChange={onCredentialChange}
                allowClear
              >
                {data.map((item) => (
                  <Select.Option value={item.id}>{item.name}</Select.Option>
                ))}
                <Select.Option value={MANUAL_VALUE}>
                  {formatMessage({
                    id: "cluster.regist.step.connect.credential.manual",
                  })}
                </Select.Option>
              </Select>
            )}
          </Col>
          <Col span={6} offset={1}>
            <Button
              loading={btnLoading}
              type="primary"
              onClick={() => {
                tryConnect("agent");
              }}
            >
              {formatMessage({
                id: "cluster.manage.btn.try_connect",
              })}
            </Button>
          </Col>
        </Row>
      </Form.Item>
      {isManual && (
        <>
          <Form.Item
            label={formatMessage({
              id: "cluster.regist.step.connect.label.username",
            })}
          >
            {getFieldDecorator("agent_username", {
              initialValue: initialValue?.username || "",
              rules: [
                {
                  required: credentialRequired,
                  message: formatMessage({
                    id: "cluster.regist.form.verify.required.auth_username",
                  }),
                },
              ],
            })(<Input autoComplete="off" placeholder="Auth username" />)}
          </Form.Item>
          <Form.Item
            label={formatMessage({
              id: "cluster.regist.step.connect.label.password",
            })}
            hasFeedback
          >
            {getFieldDecorator("agent_password", {
              initialValue: initialValue?.password || "",
              rules: [
                {
                  required: credentialRequired,
                  message: formatMessage({
                    id: "cluster.regist.form.verify.required.auth_password",
                  }),
                },
              ],
            })(
              <Input.Password
                autoComplete="off"
                placeholder="Auth user password"
              />
            )}
          </Form.Item>
          {isEdit && (
            <>
              <Form.Item label={" "} colon={false}>
                <div>
                  {formatMessage({
                    id: "cluster.regist.form.credential.manual.desc",
                  })}
                </div>
              </Form.Item>
            </>
          )}
        </>
      )}
    </>
  );
};
