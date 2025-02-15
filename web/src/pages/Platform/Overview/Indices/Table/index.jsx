import React, { useState, useEffect, useMemo } from "react";
import { Tooltip, Progress, Icon, Spin } from "antd";
import { formatter } from "@/utils/format";
import { formatUtcTimeToLocal } from "@/utils/utils";
import { formatMessage } from "umi/locale";
import { HealthStatusView } from "@/components/infini/health_status_view";
import { StatusBlockGroup } from "@/components/infini/status_block";
import CommonTable from "../../components/CommonTable";

export default (props) => {

  return (
    <CommonTable 
      {...props}
      columns={[
        {
          title: "Name",
          dataIndex: "name",
          render: (text, record) => {
            return (
              <>
                <Tooltip
                  placement="topLeft"
                  title={
                    <span>
                      Cluster: {record.metadata?.cluster_name}
                      <br />
                      Aliases: {record.metadata?.aliases?.join(",")}
                      <br />
                      Timestamp: {record.timestamp}
                    </span>
                  }
                >
                  <div style={{ display: "flex", alignContent: "center", gap: 5 }}>
                    <span>
                      <Icon type="table" />
                    </span>
                    <span>{record.metadata?.index_name}</span>
                  </div>
                </Tooltip>
                <Spin />
              </>
            );
          },
        },
        {
          title: "Health",
          dataIndex: "health_status",
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
                  <HealthStatusView
                    status={record.metadata?.labels?.health_status}
                  />
                </div>
              </Tooltip>
            );
          },
        },
        {
          title: "Status",
          dataIndex: "index_status",
          render: (text, record) => {
            return record.metadata?.labels?.state ?? "N/A";
          },
        },
        {
          title: "Store Size",
          dataIndex: "store_size",
          render: (text, record) => {
            return record.summary?.index_info?.store_size?.toUpperCase() || "N/A";
          },
        },
        {
          title: "Shards",
          dataIndex: "Shards",
          render: (text, record) => {
            return (
              <Tooltip
                title={
                  <span>
                    Unassigned Shards:
                    {record.summary?.unassigned_shards || 0}
                    <br />
                    Shards:
                    {record.summary?.index_info?.shards || 0}
                    <br />
                    Replicas:
                    {record.summary?.index_info?.replicas || 0}
                  </span>
                }
              >
                {record.summary?.unassigned_shards || 0} /{" "}
                {record.summary?.index_info?.shards ||
                  0 + (record.summary?.index_info?.replicas || 0)}
              </Tooltip>
            );
          },
        },
        {
          title: "Docs",
          dataIndex: "Docs",
          render: (text, record) => {
            return (
              <Tooltip
                title={
                  <span>
                    Deleted:
                    {formatter.number(record.summary?.docs?.deleted || 0)}
                    <br />
                    Total:
                    {formatter.number(record.summary?.docs?.count || 0)}
                  </span>
                }
              >
                {formatter.numberToHuman(record.summary?.docs?.deleted)} /{" "}
                {formatter.numberToHuman(record.summary?.docs?.count)}
              </Tooltip>
            );
          },
        },
      ]}
      formatData={(dataSource, infos) => {
        const newData = dataSource?.map((item) => {
          const id = item?._source?.metadata?.index_id;
          const metadata = item?._source?.metadata || {};
          const info = id && infos[id] ? infos[id] : {};
          const summary = info.summary || {};
          const metrics = info.metrics || {};
    
          const timestamp = item?._source?.timestamp
            ? formatUtcTimeToLocal(item?._source?.timestamp)
            : "N/A";
          const metrics_status = metrics?.status || {};
    
          return {
            id,
            metadata,
            summary,
            metrics_status,
            timestamp,
          };
        });
        return newData
      }}
    />
  );
};
