import React from "react";
import { ESPrefix } from "@/services/common";
import Infos from "@/components/Overview/Detail/Infos";

export default (props) => {
  const indexID = props.data?._source?.metadata?.index_id;
  const clusterID = props.data?._source?.metadata?.cluster_id;
  if (!indexID || !clusterID) {
    return null;
  }

  const formatInfo = (value) => {
    const info = {};
  
    info["cluster_id"] = clusterID;
    info["id"] = value?.index_info?.id || "N/A";
    info["index"] = value?.index_info?.index || "N/A";
    info["aliases"] = value?.aliases?.join(",") || "N/A";
    info["health"] = value?.index_info?.health || "N/A";
    info["status"] = value?.index_info?.status || "N/A";
    info["shards"] = value?.index_info?.shards || 0;
    info["replicas"] = value?.index_info?.replicas || 0;
    info["unassigned_shards"] = value?.unassigned_shards || 0;
    info["docs_count"] = value?.index_info?.docs_count || 0;
    info["docs_deleted"] = value?.index_info?.docs_deleted || 0;
    info["store_size"] = value?.index_info?.store_size || 0;
    info["pri_store_size"] = value?.index_info?.pri_store_size || 0;
    info["segments_count"] = value?.index_info?.segments_count || 0;

    return info
  }

  return (
    <Infos
      header="Index Info"
      action={`${ESPrefix}/${clusterID}/index/${indexID}/info`}
      formatInfo={formatInfo}
    />
  );
};
