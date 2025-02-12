import React, { useEffect, useMemo, useState } from "react";
import { Button, Divider, Form, Input, Select, Row, Col } from "antd";
import { formatMessage } from "umi/locale";

import useFetch from "@/lib/hooks/use_fetch";
import { formatESSearchResult } from "@/lib/elasticsearch/util";

export const MANUAL_VALUE = "manual";

export default (props) => {
  const {
    btnLoading = false,
    needAuth,
    form: { getFieldDecorator },
    initialValue,
    isEdit,
    tryConnect,
    credentialRequired = false,
    isManual,
    setIsManual,
  } = props;

  const { loading, error, value, run } = useFetch(
    "/credential/_search",
    {
      queryParams: {
        from: 0,
        size: 1000,
      },
    },
    []
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
          <Select loading={loading} onChange={onCredentialChange} allowClear>
            <Select.Option value={MANUAL_VALUE}>
              {formatMessage({
                id: "cluster.regist.step.connect.credential.manual",
              })}
            </Select.Option>
            {data.map((item) => (
              <Select.Option value={item.id}>{item.name}</Select.Option>
            ))}
          </Select>
        )}
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
            })(<Input autoComplete="off" placeholder={formatMessage({id: "agent.form.placeholder.auth.username"})} />)}
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
                placeholder={formatMessage({
                  id: "cluster.regist.form.verify.required.auth_password",
                })}
              />
            )}
          </Form.Item>
          {isEdit && (
            <>
              <Form.Item label={" "}>
                <div style={{ lineHeight: "20px" }}>
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
