import React, { useState, useEffect }  from 'react';
import { List} from 'antd';

import useFetch from "@/lib/hooks/use_fetch";
import { ESPrefix } from "@/services/common";
import {isFloat} from "@/utils/utils";
import { formatter } from "@/utils/format";


export const Infos = (props)=>{
  const nodeID = props.data?._source?.metadata?.node_id;
  const clusterID = props.data?._source?.metadata?.cluster_id;
  if (!nodeID || !clusterID) {
    return null;
  }

  const { loading, error, value } = useFetch(
    `${ESPrefix}/${clusterID}/node/${nodeID}/info`,
    {},
    [clusterID,nodeID]
  );
  const info = {};
  
  info['status'] = value?.status || '';
  info['is_master_node'] = value?.is_master_node || false;
  info['transport_address'] = value?.transport_address || '';
  info['shards_count'] = value?.shards_count || 0;
  info['indices_count'] = value?.indices_count || 0;
  info['indices_docs_count'] = value?.indices?.docs?.count || 0;
  info['indices_docs_deleted'] = value?.indices?.docs?.deleted || 0;
  info['indices_store_size'] = formatter.bytes(value?.indices?.store.size_in_bytes || 0);

  const fs_total_in_bytes = value?.fs?.total?.total_in_bytes || 0;
  const fs_available_in_bytes = value?.fs?.total?.available_in_bytes || 0;
  const fs_used_in_bytes = fs_total_in_bytes - fs_available_in_bytes;
  info['disk_usage'] = formatter.bytes(fs_used_in_bytes) + ' / ' + formatter.bytes(fs_total_in_bytes);

  const jvm_mem_total_in_bytes = value?.jvm?.mem?.heap_max_in_bytes || 0;
  const jvm_mem_used_in_bytes = value?.jvm?.mem?.heap_used_in_bytes || 0;
  info['jvm_heap'] = formatter.bytes(jvm_mem_used_in_bytes) + ' / ' + formatter.bytes(jvm_mem_total_in_bytes);

  const formatValue = (value) => {
    if (isFloat(value)) {
      value = value.toFixed(2);
    }
    if (typeof value == 'boolean') {
      value = value.toString();
    }
    return value;
  }
  return (
    <div>
      <div style={{maxWidth:"400px", margin:"auto"}}>
        <List
          loading={loading}
          size="small"
          header={<div style={{fontWeight:"bold"}}>Node Info</div>}
          bordered
          dataSource={Object.entries(info || {})}
          renderItem={item => (
            <List.Item>
              <div>{item[0]}</div>
              <div>{formatValue(item[1])}</div>
            </List.Item>
          )}
        />
      </div>
    </div>
  )
}
