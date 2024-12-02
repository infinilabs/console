import React, { useState, useEffect, useMemo } from "react";
import { Table, Tooltip, Progress } from "antd";
import { formatter } from "@/utils/format";
import { formatUtcTimeToLocal } from "@/utils/utils";
import { formatMessage } from "umi/locale";
import { SearchEngineIcon } from "@/lib/search_engines";
import { HealthStatusView } from "@/components/infini/health_status_view";
import { StatusBlockGroup } from "@/components/infini/status_block";
import { OSPlatformIcon } from "@/lib/os_platforms";

export default (props) => {
  const {
    infos,
    dataSource,
    total,
    from,
    pageSize,
    loading,
    onPageChange,
    onPageSizeChange,
    onRowClick,
  } = props;

  const [tableData] = useMemo(() => {
    let tableData = dataSource?.map((item) => {
      const id = item?._id;
      const metadata = item._source || {};
      const info = id && infos[id] ? infos[id] : {};
      const summary = info.summary || {};
      const metrics = info.metrics || {};

      const { cpu = {}, memory = {}, filesystem_summary = {} } = summary;
      const cpuUsedPercent = Math.round(cpu?.used_percent || 0);
      const memoryTotal = memory["total.bytes"] || 0;
      const memoryUsed = memory["used.bytes"] || 0;
      const memoryFree = memory["available.bytes"] || 0;
      const memoryUsedPercent = Math.round(memory["used.percent"] || 0);

      const diskTotal = filesystem_summary["total.bytes"] || 0;
      const diskUsed = filesystem_summary["used.bytes"] || 0;
      const diskFree = filesystem_summary["free.bytes"] || 0;
      const diskUsedPercent = Math.round(
        filesystem_summary["used.percent"] || 0
      );

      const metrics_status = metrics?.agent_status || {};

      return {
        id,
        metadata,
        summary,
        metrics_status,
        cpuUsedPercent,
        memoryTotal,
        memoryUsed,
        memoryFree,
        memoryUsedPercent,
        diskTotal,
        diskUsed,
        diskFree,
        diskUsedPercent,
      };
    });
    return [tableData];
  }, [JSON.stringify(dataSource), JSON.stringify(infos)]);

  const [columns] = useMemo(() => {
    let columns = [
      {
        title: "Transport Address",
        dataIndex: "host",
        render: (text, record) => {
          return (
            <Tooltip
              placement="topLeft"
              title={
                <span>
                  OS: {record.metadata.os_info?.platform} /{" "}
                  {record.metadata.os_info?.kernel_arch}
                </span>
              }
            >
              <div style={{ display: "flex", alignContent: "center", gap: 5 }}>
                <OSPlatformIcon
                  platform={record.metadata.os_info?.platform}
                  width="20px"
                  height="20px"
                />
                <span>{record.metadata?.ip}</span>
              </div>
            </Tooltip>
          );
        },
      },
      {
        title: "Status",
        dataIndex: "host_status",
        render: (text, record) => {
          return (
            <Tooltip
              title={
                <span
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                    padding: 5,
                  }}
                >
                  <StatusBlockGroup data={record.metrics_status?.data} />
                  <span>Recent Host Status(14 day)</span>
                </span>
              }
            >
              <div>
                <HealthStatusView status={record.metadata?.agent_status} />
              </div>
            </Tooltip>
          );
        },
      },
      {
        title: "Host Name",
        dataIndex: "host_name",
        render: (text, record) => {
          return (
            <span
              style={{
                maxWidth: 150,
                wordBreak: "break-all",
                display: "inline-block",
              }}
            >
              {record.metadata?.name || "-"}
            </span>
          );
        },
      },
      {
        title: "Agent Status",
        dataIndex: "agent_status",
        render: (text, record) => {
          return (
            <HealthStatusView
              status={record.metadata?.agent_status || "offline"}
              label={record.metadata?.agent_status || "N/A"}
            />
          );
        },
      },
      {
        title: "CPU Usage",
        dataIndex: "CPU Usage",
        render: (text, record) => {
          return (
            <Progress
              strokeLinecap="square"
              strokeColor="#FEC514"
              strokeWidth={12}
              percent={record.cpuUsedPercent}
              format={(percent) => `${percent}%`}
            />
          );
        },
      },
      {
        title: "Disk Usage",
        dataIndex: "DiskUsage",
        render: (text, record) => {
          return (
            <Tooltip
              title={
                <span>
                  Total:{formatter.bytes(record.diskTotal)}
                  <br />
                  Used:{formatter.bytes(record.diskUsed)}
                  <br />
                  Free:{formatter.bytes(record.diskFree)}
                </span>
              }
            >
              <Progress
                strokeLinecap="square"
                strokeColor="#558EF0"
                strokeWidth={12}
                percent={record.diskUsedPercent}
                format={(percent) => `${percent}%`}
              />
            </Tooltip>
          );
        },
      },
      {
        title: "JVM Heap",
        dataIndex: "JVMHeap",
        render: (text, record) => {
          return (
            <Tooltip
              title={
                <span>
                  Total:{formatter.bytes(record.memoryTotal)}
                  <br />
                  Used:{formatter.bytes(record.memoryUsed)}
                  <br />
                  Free:
                  {formatter.bytes(record.memoryFree)}
                </span>
              }
            >
              <Progress
                strokeLinecap="square"
                strokeColor="#00BFB3"
                strokeWidth={12}
                percent={record.memoryUsedPercent}
                format={(percent) => `${percent}%`}
              />
            </Tooltip>
          );
        },
      },
    ];
    return [columns];
  }, []);

  return (
    <div className="table-wrap">
      <Table
        size={"small"}
        loading={loading}
        columns={columns}
        dataSource={tableData}
        rowKey={"id"}
        pagination={{
          size: "small",
          total,
          pageSize,
          onChange: onPageChange,
          showSizeChanger: true,
          onShowSizeChange: (_, size) => {
            onPageSizeChange(size);
          },
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        onRow={(record, i) => {
          return {
            onClick: (event) => {
              onRowClick(dataSource[i]);
            },
          };
        }}
      />
    </div>
  );
};
