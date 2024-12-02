import React, { useState, useEffect, useMemo } from "react";
import { Table, Tooltip, Progress, Icon } from "antd";
import { formatter } from "@/utils/format";
import { formatUtcTimeToLocal } from "@/utils/utils";
import { formatMessage } from "umi/locale";
import { SearchEngineIcon } from "@/lib/search_engines";
import { HealthStatusView } from "@/components/infini/health_status_view";
import { StatusBlockGroup } from "@/components/infini/status_block";

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
      const id = item?._source?.metadata?.node_id;
      const metadata = item._source?.metadata || {};
      const info = id && infos[id] ? infos[id] : {};
      const summary = info.summary || {};
      const metrics = info.metrics || {};
      const fs_total_in_bytes = summary?.fs?.total?.total_in_bytes || 0;
      const fs_available_in_bytes = summary?.fs?.total?.available_in_bytes || 0;
      const fs_used_in_bytes = fs_total_in_bytes - fs_available_in_bytes;
      const jvm_mem_total_in_bytes = summary?.jvm?.mem?.heap_max_in_bytes || 0;
      const jvm_mem_used_in_bytes = summary?.jvm?.mem?.heap_used_in_bytes || 0;

      const disk_percent =
        fs_total_in_bytes > 0
          ? Math.round((fs_used_in_bytes / fs_total_in_bytes) * 100)
          : 0;
      const jvm_mem_percent =
        jvm_mem_total_in_bytes > 0
          ? Math.round((jvm_mem_used_in_bytes / jvm_mem_total_in_bytes) * 100)
          : 0;

      const metrics_status = metrics?.status || {};

      return {
        id,
        metadata,
        summary,
        metrics_status,
        fs_total_in_bytes,
        fs_available_in_bytes,
        fs_used_in_bytes,
        jvm_mem_total_in_bytes,
        jvm_mem_used_in_bytes,
        disk_percent,
        jvm_mem_percent,
      };
    });
    return [tableData];
  }, [JSON.stringify(dataSource), JSON.stringify(infos)]);

  const [columns] = useMemo(() => {
    let columns = [
      {
        title: "Name",
        dataIndex: "name",
        render: (text, record) => {
          return (
            <Tooltip
              placement="topLeft"
              title={
                <span>
                  Transport Address:{" "}
                  {record.metadata?.labels?.transport_address}
                  <br />
                  Cluster: {record.metadata?.cluster_name ?? ""}
                  <br />
                  Version: {record.metadata?.labels?.version ?? ""}
                  <br />
                  Roles:{" "}
                  {record.metadata?.labels?.roles
                    ? record.metadata?.labels?.roles?.toString()
                    : ""}
                </span>
              }
            >
              <div style={{ display: "flex", alignContent: "center", gap: 5 }}>
                <span>
                  {record.summary?.is_master_node ? (
                    <Icon type="star" theme="filled" />
                  ) : (
                    <Icon type="database" />
                  )}
                </span>
                <span>{record.metadata?.node_name}</span>
              </div>
            </Tooltip>
          );
        },
      },
      {
        title: "Status",
        dataIndex: "status",
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
                  <span>
                    {record.metrics_status?.metric?.label +
                      "(" +
                      (record.metrics_status?.data?.length || 14) +
                      " " +
                      record.metrics_status?.metric?.units +
                      ")"}
                  </span>
                </span>
              }
            >
              <div>
                <HealthStatusView status={record.metadata?.labels?.status} />
              </div>
            </Tooltip>
          );
        },
      },
      {
        title: "Indices",
        dataIndex: "Indices",
        render: (text, record) => {
          return record.summary?.shard_info?.indices_count || 0;
        },
      },
      {
        title: "Shards",
        dataIndex: "Shards",
        render: (text, record) => {
          return record.summary?.shard_info?.shard_count || 0;
        },
      },
      {
        title: "Docs",
        dataIndex: "Docs",
        render: (text, record) => {
          return (
            <Tooltip
              title={`Docs:${formatter.number(
                record.summary?.indices?.docs?.count
              )}`}
            >
              {formatter.numberToHuman(record.summary?.indices?.docs?.count)}
            </Tooltip>
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
                  Total:{formatter.bytes(record.fs_total_in_bytes)}
                  <br />
                  Used:{formatter.bytes(record.fs_used_in_bytes)}
                  <br />
                  Free:{formatter.bytes(record.fs_available_in_bytes)}
                </span>
              }
            >
              <Progress
                strokeLinecap="square"
                strokeColor="#558EF0"
                strokeWidth={12}
                percent={record.disk_percent}
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
                  Total:{formatter.bytes(record.jvm_mem_total_in_bytes)}
                  <br />
                  Used:{formatter.bytes(record.jvm_mem_used_in_bytes)}
                  <br />
                  Free:
                  {formatter.bytes(
                    record.jvm_mem_total_in_bytes - record.jvm_mem_used_in_bytes
                  )}
                </span>
              }
            >
              <Progress
                strokeLinecap="square"
                strokeColor="#00BFB3"
                strokeWidth={12}
                percent={record.jvm_mem_percent}
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
