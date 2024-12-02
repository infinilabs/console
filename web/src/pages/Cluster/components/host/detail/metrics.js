
import React from 'react';
import { ESPrefix } from "@/services/common";
import useFetch from "@/lib/hooks/use_fetch";
import Treemap from "@/components/infini/charts/Treemap";

export const Metrics = (props)=>{
  const id = props.data?._id || null;
  if (! id) {
    return null;
  }
  const { loading, error, value:treemapResult } = useFetch(
    `${ESPrefix}/${id}/overview/treemap`,
    {
      queryParams: {},
    },
    [id]
  );

  const treemapData = treemapResult?._source?.data ?? {};
  return (
    <div>
      <div style={{marginTop:"10px",marginBottom:"10px"}}>
      <div>{treemapResult?._source?.name}</div>
        <Treemap data={treemapData} colorField={"name"} drilldownEnabled={true}/>
      </div>
    </div>
  )
}