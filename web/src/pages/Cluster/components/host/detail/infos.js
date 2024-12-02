import React, { useState, useEffect }  from 'react';
import { List} from 'antd';

import useFetch from "@/lib/hooks/use_fetch";
import { ESPrefix } from "@/services/common";
import {isFloat} from "@/utils/utils";


export const Infos = (props)=>{
  const id = props.data?._id;
  if (!id) {
    return null;
  }

  const { loading, error, value } = useFetch(
    `${ESPrefix}/host/${id}/info`,
    {},
    [id]
  );

  const formatValue = (value) => {
    if (isFloat(value)) {
      value = value.toFixed(2);
    }
    return value.toString();
  }
  return (
    <div>
      <div style={{maxWidth:"400px", margin:"auto"}}>
        <List
          loading={loading}
          size="small"
          header={<div style={{fontWeight:"bold"}}>Host Info</div>}
          bordered
          dataSource={Object.entries(value || {})}
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
