import React from "react";
import { ESPrefix } from "@/services/common";
import Infos from "@/components/Overview/Detail/Infos";

export default (props)=>{
  const id = props.data?._id
  if (!props.data?._id) {
    return null;
  }

  return (
    <Infos
      header="Cluster Info"
      action={`${ESPrefix}/${id}/info`}
    />
  )
}
