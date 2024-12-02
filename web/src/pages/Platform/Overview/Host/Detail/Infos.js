import React from "react";
import Infos from "@/components/Overview/Detail/Infos";
import Table from "@/components/Overview/Detail/Infos/Table";
import { formatter } from "@/utils/format";
import moment from "moment";
import { formatMessage } from "umi/locale";

export default (props) => {
  const id = props.data?._id;

  if (!id) {
    return null;
  }

  const formatInfo = (value) => {
    if (!value || !value._source) return {};

    const data = value._source;

    const info = {};

    info["cpu"] = data.cpu_info?.model;
    const physical_cpu_core = data.cpu_info?.physical_cpu || 0;
    const logical_cpu_core = data.cpu_info?.logical_cpu || 0;
    info["cpu_core"] = physical_cpu_core + logical_cpu_core;
    info["physical_cpu_core"] = physical_cpu_core;
    info["logical_cpu_core"] = logical_cpu_core;
    info["memory_size"] = formatter.bytes(data.memory_size || 0);
    info["disk_size"] = formatter.bytes(data.disk_size || 0);
    info["os"] = data.os_info.platform;
    info["os_version"] = data.os_info.platform_version;
    info["os_kernel_arch"] = data.os_info.kernel_arch;
    info["os_kernel_version"] = data.os_info.kernel_version;

    return info;
  };

  return (
    <>
      <Infos
        header={formatMessage({ id: "host.info.host_info.title" })}
        action={`/host/${id}`}
        formatInfo={formatInfo}
      />
      {props.data?._source?.agent_id && (
        <Table
          title={formatMessage({ id: "host.info.collect.title" })}
          action={`/host/${id}/metric/_stats`}
          rowKey="metric_name"
          columns={[
            {
              title: formatMessage({ id: "host.info.table.column.metric" }),
              dataIndex: "metric_name",
              key: "metric_name",
            },
            {
              title: formatMessage({ id: "host.info.table.column.status" }),
              dataIndex: "status",
              key: "status",
            },
            {
              title: formatMessage({ id: "host.info.table.column.last_time" }),
              dataIndex: "timestamp",
              key: "timestamp",
              render: (value) => moment(value).format("YYYY-MM-DD HH:mm:ss"),
            },
          ]}
        />
      )}
    </>
  );
};
