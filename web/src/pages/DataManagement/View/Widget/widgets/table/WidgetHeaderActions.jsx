import { Icon, Popover } from "antd"
import { useEffect, useState } from "react";
import { ColumnsSelect } from "./Config/Source";

export default (props) => {

    const { record, globalQueries, onRecordChange } = props;
    const { id, title, series = [] } = record;
    const { metric = {}, type, queries = {}, columns = [] } = series[0] || {}
    
    const clusterId = queries.cluster_id || globalQueries.cluster_id;
    const indices = (queries.cluster_id ? queries.indices : globalQueries.indices) || [];
    const timeField = queries.indices && queries.indices.length > 0 ? queries.time_field : globalQueries.time_field;

    const content = (
      <ColumnsSelect 
        indices={indices} 
        clusterId={clusterId} 
        value={columns}
        onChange={(columns) => {
          const newRecord = { ...record };
          const { id, title, series = [] } = newRecord;
          const { type, queries = {} } = series[0] || {}
          newRecord.series = [{
            columns,
            type,
            queries,
          }]
          onRecordChange(newRecord)
        }}
      />
    )

    return (
      <Popover placement="bottomRight" content={content} trigger="click" overlayStyle={{ width: 620 }}>
        <Icon type="plus" />
      </Popover>               
    )
}