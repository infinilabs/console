import React from "react";
import { ESPrefix } from "@/services/common";
import Infos from "@/components/Overview/Detail/Infos";
import { formatMessage } from "umi/locale";

export default (props)=>{
  const id = props.data?._id
  if (!props.data?._id) {
    return null;
  }

  return (
    <Infos
      header={formatMessage({ id: "overview.info.cluster" })}
      action={`${ESPrefix}/${id}/info`}
    />
  )
}
