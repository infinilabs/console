import { Alert, Button, Form, message } from "antd";
import { useEffect, useState } from "react";
import { formatMessage } from "umi/locale";

import request from "@/utils/request";
import AgentCredentialForm, { MANUAL_VALUE } from "./AgentCredentialForm";
import { ESPrefix } from "@/services/common";

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 5 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 18 },
  },
};

export default Form.create()((props) => {
  const { form, record, loading, tryConnect, onAgentCredentialSave } = props;

  const [isManual, setIsManual] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const needAuth = !!(record.credential_id || record.basic_auth?.username);

  useEffect(() => {
    setIsManual(!record.agent_credential_id && !!record.agent_basic_auth?.username);
  }, [record.agent_credential_id, record.agent_basic_auth?.username]);

  const onConfirm = async () => {
    form.validateFields(async (errors, values) => {
      if (errors) return;
      setSaveLoading(true);
      const { credential_id, basic_auth, metric_collection_mode } = record;
      const isManualCredential = values.agent_credential_id === MANUAL_VALUE;
      const manualAuth = isManualCredential
        ? {
            username: values.agent_username,
            password: values.agent_password,
          }
        : undefined;
      const res = await request(`${ESPrefix}/${record.id}`, {
        method: "PUT",
        body: {
          credential_id,
          basic_auth,
          metric_collection_mode,
          agent_credential_id: isManualCredential
            ? undefined
            : values.agent_credential_id,
          agent_basic_auth: manualAuth,
        },
      });
      if (res?.result === "updated") {
        message.success(
          formatMessage({
            id: "app.message.update.success",
          })
        );
        const latestRecordResponse = await request(`/elasticsearch/${record.id}`);
        if (latestRecordResponse?.found) {
          const latestSource = latestRecordResponse._source || {};
          const nextRecord = {
            ...record,
            ...latestSource,
            id: record.id,
            agent_credential_id: isManualCredential
              ? undefined
              : latestSource.agent_credential_id || values.agent_credential_id,
            agent_basic_auth: isManualCredential
              ? {
                  username:
                    latestSource.agent_basic_auth?.username ||
                    manualAuth?.username,
                  // API read may not return password; keep freshly saved password for test connect.
                  password:
                    latestSource.agent_basic_auth?.password ||
                    manualAuth?.password,
                }
              : latestSource.agent_basic_auth,
          };
          onAgentCredentialSave(nextRecord);
          if (nextRecord?.agent_credential_id) {
            setIsManual(false);
          }
          form.setFieldsValue({
            agent_credential_id: nextRecord?.agent_credential_id
              ? nextRecord?.agent_credential_id
              : nextRecord?.agent_basic_auth?.username
              ? MANUAL_VALUE
              : undefined,
            agent_username: nextRecord.agent_basic_auth?.username,
            agent_password: isManualCredential
              ? manualAuth?.password
              : nextRecord.agent_basic_auth?.password,
          });
        }
      } else {
        message.error(
          formatMessage({
            id: "app.message.update.failed",
          })
        );
      }
      setSaveLoading(false);
    });
  };

  if (!needAuth) {
    return (
      <Alert
        message={formatMessage({ id: "agent.credential.tip" })}
        type="success"
      />
    );
  }

  return (
    <Form {...formItemLayout} colon={false}>
      <AgentCredentialForm
        btnLoading={loading}
        needAuth={needAuth}
        form={form}
        initialValue={{
          ...record,
          username: record.agent_basic_auth?.username,
          password: record.agent_basic_auth?.password,
        }}
        isManual={isManual}
        setIsManual={setIsManual}
        isEdit={true}
        tryConnect={tryConnect}
        credentialRequired={false}
      />
      <Form.Item label=" " colon={false}>
        <div style={{ textAlign: "right" }}>
          <Button loading={loading} type="primary" onClick={() => onConfirm()}>
            {formatMessage({ id: "cluster.regist.step.confirm.title" })}
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
});
