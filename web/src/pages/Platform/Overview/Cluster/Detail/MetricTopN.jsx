import React, { useState } from "react";
import { Spin, Empty } from 'antd';
import { formatMessage } from "umi/locale";
import { ESPrefix } from "@/services/common";
import useFetch from "@/lib/hooks/use_fetch";
import Treemap from "@/components/infini/charts/Treemap";

const TREEMAP_TITLE_MAP = {
  "Search latency by index": "cluster.monitor.treemap.search_latency_by_index",
  "Avg search latency by index": "cluster.monitor.treemap.search_latency_by_index",
};

const getLocalizedTreemapTitle = (title) => {
  if (!title) {
    return title;
  }

  const localeId = TREEMAP_TITLE_MAP[title];
  if (!localeId) {
    return title;
  }

  return formatMessage({
    id: localeId,
    defaultMessage: title,
  });
};

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
        ) : (<div style={{textAlign: 'center'}}>
              {treemapData.name ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> : <Spin />}
            </div>)
        }
      </div>
    </div>
  );
};
