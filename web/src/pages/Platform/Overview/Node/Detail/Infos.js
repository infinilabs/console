import React from "react";
import { ESPrefix } from "@/services/common";
import { formatter } from "@/utils/format";
import Infos from "@/components/Overview/Detail/Infos";

export default (props) => {
  const nodeID = props.data?._source?.metadata?.node_id;
  const clusterID = props.data?._source?.metadata?.cluster_id;
  if (!nodeID || !clusterID) {
    return null;
  }

  const formatInfo = (value) => {
    const info = {};

    info["status"] = value?.status || "";
    info["is_master_node"] = value?.is_master_node || false;
    info["transport_address"] = value?.transport_address || "";
    info["shards_count"] = value?.shard_info?.shard_count || 0;
    info["indices_count"] = value?.shard_info?.indices_count || 0;
    info["indices_docs_count"] = value?.indices?.docs?.count || 0;
    info["indices_docs_deleted"] = value?.indices?.docs?.deleted || 0;
    info["indices_store_size"] = formatter.bytes(
      value?.indices?.store.size_in_bytes || 0
    );

    const fs_total_in_bytes = value?.fs?.total?.total_in_bytes || 0;
    const fs_available_in_bytes = value?.fs?.total?.available_in_bytes || 0;
    const fs_used_in_bytes = fs_total_in_bytes - fs_available_in_bytes;
    info["disk_usage"] =
      formatter.bytes(fs_used_in_bytes) +
      " / " +
      formatter.bytes(fs_total_in_bytes);

    const jvm_mem_total_in_bytes = value?.jvm?.mem?.heap_max_in_bytes || 0;
    const jvm_mem_used_in_bytes = value?.jvm?.mem?.heap_used_in_bytes || 0;
    info["jvm_heap"] =
      formatter.bytes(jvm_mem_used_in_bytes) +
      " / " +
      formatter.bytes(jvm_mem_total_in_bytes);

    return info;
  };

  return (
    <Infos
      header="Node Info"
      action={`${ESPrefix}/${clusterID}/node/${nodeID}/info`}
      formatInfo={formatInfo}
    />
  );
};
