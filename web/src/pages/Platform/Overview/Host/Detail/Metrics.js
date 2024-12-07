import React from "react";
import Metrics from "@/components/Overview/Detail/Metrics";
import MetricNodes from "@/components/Overview/Detail/Metrics/MetricNodes";
import MetricIndices from "@/components/Overview/Detail/Metrics/MetricIndices";
import useFetch from "@/lib/hooks/use_fetch";
import { formatter } from "@/utils/format";
import Table from "@/components/Overview/Detail/Infos/Table";
import { Button } from "antd";
import { formatMessage } from "umi/locale";
import { getDocPathByLang, getWebsitePathByLang } from "@/utils/utils";

export default (props) => {
  const id = props.data?._id;

  if (!id) {
    return null;
  }

  const hasAgent = !!props.data?._source?.agent_id;

  return (
    <>
      <Metrics
        metricAction={`/host/${id}/metrics`}
        renderExtraMetric={() =>
          !hasAgent && (
            <div
              style={{
                height: 150,
                width: "48.8%",
                border: "1px solid #e8e8e8",
                borderRadius: 2,
                display: "flex",
                flexDirection: "column",
                justifySelf: "center",
                alignItems: "center",
                textAlign: "center",
                padding: "40px 30px",
              }}
            >
              <div style={{ marginBottom: 12, textAlign: "center" }}>
                More Monitored Metrics
              </div>
              <Button
                style={{ width: 120 }}
                type="primary"
                onClick={() =>
                  window.open(
                    `${getDocPathByLang()}/reference/agent/install/`
                  )
                }
              >
                Install Agent
              </Button>
            </div>
          )
        }
        extra={
          hasAgent && (
            <>
              <Agent id={id} />
              <Process id={id} />
            </>
          )
        }
        linkMore={`/cluster/monitor/hosts/${id}`}
      />
    </>
  );
};

const Agent = (props) => {
  return (
    <Table
      title={formatMessage({ id: "host.detail.agent.title" })}
      action={`/host/${props.id}/agent/info`}
      rowKey="agent_id"
      columns={[
        {
          title: "Endpoint",
          dataIndex: "endpoint",
          key: "endpoint",
        },
        {
          title: formatMessage({ id: "host.detail.table.column.status" }),
          dataIndex: "status",
          key: "status",
        },
        {
          title: formatMessage({ id: "host.detail.table.column.version" }),
          dataIndex: "version",
          key: "version",
        },
        // {
        //   title: "TLS",
        //   dataIndex: "isTLS",
        //   key: 'isTLS',
        //   render: (value) => `${value}`
        // }
      ]}
      formatValue={(value) =>
        value
          ? [
              {
                id: value.agent_id,
                ip: value.ip,
                port: value.port,
                status: value.status,
                version: value.version?.number,
                isTLS: value.schema === "https",
                endpoint: value.endpoint,
              },
            ]
          : []
      }
      renderExtra={(props) => (
        <Button onClick={() => props.refresh()}>
          {formatMessage({ id: "form.button.refresh" })}
        </Button>
      )}
    />
  );
};

const Process = (props) => {
  return (
    <Table
      title={formatMessage({ id: "host.detail.processes.title" })}
      action={`/host/${props.id}/processes`}
      rowKey="pid"
      columns={[
        {
          title: "PID",
          dataIndex: "pid",
          key: "pid",
        },
        {
          title: formatMessage({ id: "host.detail.table.column.cluster" }),
          dataIndex: "cluster_name",
          key: "cluster_name",
        },
        {
          title: formatMessage({ id: "host.detail.table.column.node" }),
          dataIndex: "node_name",
          key: "node_name",
        },
        {
          title: formatMessage({ id: "host.detail.table.column.status" }),
          dataIndex: "pid_status",
          key: "pid_status",
        },
        {
          title: formatMessage({ id: "host.detail.table.column.uptime" }),
          dataIndex: "uptime_in_ms",
          key: "uptime_in_ms",
          render: (value) => formatter.uptime(value),
        },
      ]}
      formatValue={(value) => value?.elastic_processes || []}
      renderExtra={(props) => (
        <Button onClick={() => props.refresh()}>
          {formatMessage({ id: "form.button.refresh" })}
        </Button>
      )}
    />
  );
};
