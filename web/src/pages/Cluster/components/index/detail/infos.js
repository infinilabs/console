import React, { useState, useEffect } from "react";
import { List } from "antd";

import useFetch from "@/lib/hooks/use_fetch";
import { ESPrefix } from "@/services/common";
import { isFloat } from "@/utils/utils";
import { formatter } from "@/utils/format";

export const Infos = (props) => {
  const indexID = props.data?._source?.metadata?.index_id;
  const clusterID = props.data?._source?.metadata?.cluster_id;
  if (!indexID || !clusterID) {
    return null;
  }

  const {
    loading,
    error,
    value,
  } = useFetch(`${ESPrefix}/${clusterID}/index/${indexID}/info`, {}, [
    clusterID,
    indexID,
  ]);
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

  const formatValue = (value) => {
    if (isFloat(value)) {
      value = value.toFixed(2);
    }
    if (typeof value == "boolean") {
      value = value.toString();
    }
    return value;
  };
  return (
    <div>
      <div style={{ maxWidth: "400px", margin: "auto" }}>
        <List
          loading={loading}
          size="small"
          header={<div style={{ fontWeight: "bold" }}>Index Info</div>}
          bordered
          dataSource={Object.entries(info || {})}
          renderItem={(item) => (
            <List.Item>
              <div>{item[0]}</div>
              <div>{formatValue(item[1])}</div>
            </List.Item>
          )}
        />
      </div>
    </div>
  );
};
