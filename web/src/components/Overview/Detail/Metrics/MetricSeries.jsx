import React, { useMemo, useEffect } from "react";
import MetricLineList from "./MetricLineList";
import { formatTimeRange } from "@/lib/elasticsearch/util";

export default (props) => {

  const { action, bucketSize, timeRange, overview, setSpinning, renderExtraMetric, metrics = [] } = props

  const queryParams = useMemo(() => {
    const newParams = formatTimeRange(timeRange);
    if (overview) {
      newParams.overview = overview;
    }
    if (bucketSize) {
      newParams.bucket_size = bucketSize
    }
    return newParams;
  }, [timeRange, bucketSize]);

  return <MetricLineList {...props} queryParams={queryParams} />;
};
