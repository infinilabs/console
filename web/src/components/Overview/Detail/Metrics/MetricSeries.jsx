import React, { useMemo, useEffect } from "react";
import { ESPrefix } from "@/services/common";
import useFetch from "@/lib/hooks/use_fetch";
import { calculateBounds } from "@/components/vendor/data/common/query/timefilter";
import MetricLineList from "./MetricLineList";

export default ({ action, timeRange, overview, setSpinning, renderExtraMetric }) => {

  const queryParams = useMemo(() => {
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
    action,
    { queryParams },
    [action, queryParams]
  );
  
  useEffect(() => {
    setSpinning(loading);
  }, [loading]);

  const metrics = useMemo(() => {
    const { metrics = {} } = value || {};
    return metrics;
  }, [value]);

  return <MetricLineList metrics={metrics} renderExtraMetric={renderExtraMetric}/>;
};
