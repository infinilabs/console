import React, { useEffect, useMemo, useState } from "react";
import { Button, Form, Icon, Input, Select, Tooltip } from "antd";
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

  const getInitialAgentCredentialValue = (value) =>
    value?.agent_credential_id
      ? value.agent_credential_id
      : value?.username
      ? MANUAL_VALUE
      : undefined;

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

  const [selectedCredential, setSelectedCredential] = useState(
    getInitialAgentCredentialValue(initialValue)
  );
  const [isManual, setIsManual] = useState(
    getInitialAgentCredentialValue(initialValue) === MANUAL_VALUE
  );
  const canReadCredential =
    hasAuthority("system.credential:all") ||
    hasAuthority("system.credential:read");

  const { loading, value, run } = useFetch(
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
    setSelectedCredential(value);
    setIsManual(value === MANUAL_VALUE);
  };

  const { data } = useMemo(() => {
    return formatESSearchResult(value);
  }, [value]);
  const credentialActionsStyle = {
    display: "flex",
    alignItems: "center",
    gap: 12,
  };
  const credentialGroupStyle = {
    display: "flex",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  };
  const credentialSelectWrapStyle = {
    flex: 1,
    minWidth: 0,
  };
  const refreshButtonSize = 32;
  const refreshButtonStyle = {
    width: refreshButtonSize,
    minWidth: refreshButtonSize,
    height: refreshButtonSize,
    padding: 0,
    marginLeft: -1,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  const refreshButtonWrapStyle = {
    display: "flex",
    alignItems: "center",
    flex: `0 0 ${refreshButtonSize}px`,
  };

  const credentialOptions = useMemo(() => {
    const options = data.map((item) => ({
      id: item.id,
      name: item.name,
    }));
    if (
      initialValue?.agent_credential_id &&
      !options.find((item) => item.id === initialValue.agent_credential_id)
    ) {
      options.unshift({
        id: initialValue.agent_credential_id,
        name: initialValue.agent_credential_id,
      });
    }
    return options;
  }, [data, initialValue?.agent_credential_id]);

  useEffect(() => {
    const nextValue = getInitialAgentCredentialValue(initialValue);
    setSelectedCredential(nextValue);
    setIsManual(nextValue === MANUAL_VALUE);
  }, [initialValue?.agent_credential_id, initialValue?.username]);

  useEffect(() => {
    if (canReadCredential) {
      run();
    }
  }, [canReadCredential, run]);

  useEffect(() => {
    if (canReadCredential && initialValue?.agent_credential_id) {
      run();
    }
  }, [canReadCredential, initialValue?.agent_credential_id, run]);

  if (!needAuth) {
    return null;
  }

  return (
    <>
      <Form.Item
        label={
          <span>
            {formatMessage({
              id: "cluster.regist.step.connect.label.agent_credential",
            })}
            <Tooltip
              title={formatMessage({
                id: "cluster.manage.agent_credential.tip.auto_create",
              })}
            >
              <Icon
                type="info-circle"
                style={{ marginLeft: 8, color: "#1890ff" }}
              />
            </Tooltip>
          </span>
        }
      >
        <div style={credentialActionsStyle}>
          <div style={credentialGroupStyle}>
            <div style={credentialSelectWrapStyle}>
              {getFieldDecorator("agent_credential_id", {
                initialValue: getInitialAgentCredentialValue(initialValue),
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
                  placeholder={formatMessage({
                    id: "cluster.manage.agent_credential.placeholder.auto_create",
                  })}
                >
                  <Select.Option value={MANUAL_VALUE}>
                    {formatMessage({
                      id: "cluster.regist.step.connect.credential.manual",
                    })}
                  </Select.Option>
                  {credentialOptions.map((item) => (
                    <Select.Option key={item.id} value={item.id}>
                      {item.name}
                    </Select.Option>
                  ))}
                </Select>
              )}
            </div>
            <div style={refreshButtonWrapStyle}>
              <Tooltip title={formatMessage({ id: "form.button.refresh" })}>
                <span style={refreshButtonWrapStyle}>
                  <Button
                    icon="reload"
                    onClick={() => run()}
                    loading={loading}
                    disabled={!canReadCredential}
                    style={refreshButtonStyle}
                  />
                </span>
              </Tooltip>
            </div>
          </div>
          {selectedCredential ? (
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
          ) : null}
        </div>
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
