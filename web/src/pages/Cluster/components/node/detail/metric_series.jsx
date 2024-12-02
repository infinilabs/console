import React, { useState, useEffect } from "react";
import { ESPrefix } from "@/services/common";
import useFetch from "@/lib/hooks/use_fetch";
import { calculateBounds } from "@/components/vendor/data/common/query/timefilter";
import { MetricLineList } from "../../detail/metric_line_list";

export const MetricSeries = ({ clusterID, nodeID, timeRange, overview, setSpinning }) => {
  if (!clusterID || !nodeID) {
    return null;
  }
  const queryParams = React.useMemo(() => {
    const bounds = calculateBounds({
      from: timeRange.min,
      to: timeRange.max,
    });
    let params = {
      min: bounds.min.valueOf(),
      max: bounds.max.valueOf(),
    };
    params.overview = overview;
    return params;
  }, [timeRange]);

  const { loading, error, value } = useFetch(
    `${ESPrefix}/${clusterID}/node/${nodeID}/metrics`,
    {
      queryParams: queryParams,
    },
    [clusterID, nodeID, queryParams]
  );
  
  React.useEffect(() => {
    setSpinning(loading);
  }, [loading]);

  const metrics = React.useMemo(() => {
    const { metrics = {} } = value || {};
    return metrics;
  }, [value]);

  return <MetricLineList metrics={metrics} />;
};
