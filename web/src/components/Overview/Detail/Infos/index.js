import React, { useState, useEffect }  from 'react';
import { List} from 'antd';

import useFetch from "@/lib/hooks/use_fetch";
import { ESPrefix } from "@/services/common";
import {isFloat} from "@/utils/utils";

export default (props)=>{
  const { header, action, formatInfo } = props;

  const { loading, error, value } = useFetch(
    action,
    {},
    [action]
  );

  const formatValue = (value) => {
    if (isFloat(value)) {
      value = value.toFixed(2);
    }
    if (typeof value == 'boolean') {
      value = value.toString();
    }
    return value;
  }

  const info = (formatInfo ? formatInfo(value) : value) || {}

  return (
    <List
      loading={loading}
      size="small"
      header={<div style={{fontWeight:"bold"}}>{header}</div>}
      bordered
      dataSource={Object.entries(info)}
      renderItem={item => (
        <List.Item>
          <div>{item[0]}</div>
          <div>{formatValue(item[1])}</div>
        </List.Item>
      )}
    />
  )
}
