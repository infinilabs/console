import request from "@/utils/request";
import { message, Table, Tooltip, Spin } from "antd";
import { useState } from "react";
import { formatMessage } from "umi/locale";

import { MANUAL_VALUE } from "./AgentCredentialForm";
import styles from "./SetAgentCredential.less";
import AgentCredential from "./AgentCredential";
import { ESPrefix } from "@/services/common";
import { cloneDeep } from "lodash";
import { connect } from "dva";

export default connect()((props) => {
  const { selectedCluster, setSelectedCluster, dispatch } = props

  const [status, setStatus] = useState({});
  const [testLoading, setTestLoading] = useState(false);

  const onAgentCredentialSave = async (values) => {
    const newSelectedCluster = cloneDeep(selectedCluster);
    const index = newSelectedCluster.findIndex((item) => item.id === values.id);
    if (index !== -1) {
      newSelectedCluster[index] = values;
      setSelectedCluster(newSelectedCluster);
    }
    dispatch({
        type: "global/fetchClusterList",
        payload: {
            size: 200,
            name: "",
        },
    });
    dispatch({
        type: "global/fetchClusterStatus",
    })
  };

  const expandedRowRender = (record) => {
    return (
      <AgentCredential
        record={record}
        onAgentCredentialSave={(values) => onAgentCredentialSave(values)}
      />
    );
  };

  const tryConnect = async (values) => {
    setTestLoading(true);
    const body = {
      basic_auth: {
        username: values.agent_basic_auth?.username,
        password: values.agent_basic_auth?.password,
      },
      host: values.host,
      credential_id:
        values.agent_credential_id !== MANUAL_VALUE
          ? values.agent_credential_id
          : undefined,
      schema: values.schema || "http",
    };
    if (
      values.credential_id &&
      !body.credential_id &&
      (!body.basic_auth.username || !body.basic_auth.password)
    ) {
      message.warning(formatMessage({ id: "agent.instance.associate.tips.connected.check" }));
      setTestLoading(false);
      return;
    }
    const res = await request(`${ESPrefix}/try_connect`, {
      method: "POST",
      body,
      showErrorInner: true,
    }, false, false);
    setStatus({
      ...status,
      [values.id]: {
        status: res?.status,
        error: res?.error,
      },
    });
    setTestLoading(false);
  };

  return (
    <>
      <div style={{ marginTop: 32 }}>
        <div
          style={{
            fontSize: 16,
            color: "rgba(16, 16, 16, 1)",
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          {formatMessage({ id: "agent.instance.associate.set_credential" })}
        </div>
        <div>{formatMessage({ id: "agent.instance.associate.set_credential.tips" })}</div>
      </div>
      
      <div style={{ marginTop: 15 }}>
        <Table
          size="small"
          rowKey={"id"}
          dataSource={selectedCluster || []}
          className={styles.table}
          columns={[
            {
              title: formatMessage({
                id: "agent.instance.associate.labels.cluster_name",
              }),
              dataIndex: "name",
              key: "name",
            },
            {
              title: formatMessage({ id: "guide.cluster.auth" }),
              dataIndex: "credential_id",
              key: "credential_id",
              render: (text, record) => {
                return record.credential_id || record.basic_auth?.username
                  ? formatMessage({
                      id: "cluster.regist.step.complete.tls.yes",
                    })
                  : formatMessage({
                      id: "cluster.regist.step.complete.tls.no",
                    });
              },
            },
            {
              title: formatMessage({ id: "agent.label.agent_credential" }),
              dataIndex: "agent_credential_id",
              key: "agent_credential_id",
              render: (text, record) => {
                return record.agent_credential_id ? "Set" : "No set";
              },
            },
            {
              title: formatMessage({ id: "alert.rule.table.columnns.status" }),
              dataIndex: "status",
              key: "Status",
              render: (text, record) => {
                if (!status[record.id]) return "-";
                if (status[record.id].error) {
                  return (
                    <Tooltip title={status[record.id].error}>
                      <span style={{ color: "red" }}>{formatMessage({ id: "alert.rule.table.columnns.status.failed"})}</span>
                    </Tooltip>
                  );
                }
                return (
                  <span style={{ color: "green" }}>{formatMessage({ id: "alert.rule.table.columnns.status.succeeded"})}</span>
                );
              },
            },
            {
              title: formatMessage({ id: "table.field.actions" }),
              dataIndex: "",
              key: "",
              render: (record) =>
                testLoading ? (
                  <Spin />
                ) : (
                  <a onClick={() => tryConnect(record)}>
                    {formatMessage({ id: "guide.cluster.test.connection" })}
                  </a>
                ),
            },
          ]}
          expandedRowRender={expandedRowRender}
        />
      </div>
    </>
  );
});
