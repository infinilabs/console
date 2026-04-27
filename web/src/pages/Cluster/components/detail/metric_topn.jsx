import React, { useState } from "react";
import { ESPrefix } from "@/services/common";
import useFetch from "@/lib/hooks/use_fetch";
import Treemap from "@/components/infini/charts/Treemap";
import { getLocalizedTreemapTitle } from "@/utils/treemap_title";

export const MetricTopN = (props) => {
  const clusterID = props.data?._id || null;
  if (!clusterID) {
    return null;
  }
  const {
    loading,
    error,
    value: treemapResult,
  } = useFetch(`${ESPrefix}/${clusterID}/overview/treemap`, {}, [props.data]);
  const treemapData = treemapResult?._source?.data || {};

  return (
    <div>
      <div style={{ marginTop: "10px", marginBottom: "10px" }}>
        <div>{getLocalizedTreemapTitle(treemapResult?._source?.name)}</div>
        {treemapData.children ? (
          <Treemap
            data={treemapData}
            colorField={"name"}
            unit={treemapResult?._source?.unit}
            drilldownEnabled={true}
          />
        ) : null}
      </div>
    </div>
  );
};
