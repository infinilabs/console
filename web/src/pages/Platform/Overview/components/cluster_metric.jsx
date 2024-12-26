import styles from "./Metrics.scss";
import "./node_metric.scss";
import { calculateBounds } from "@/components/vendor/data/common/query/timefilter";
import MetricChart from "./MetricChart";
import { createRef, useEffect, useMemo, useRef, useState } from "react";
import { formatMessage } from "umi/locale";
import { formatTimeRange } from "@/lib/elasticsearch/util";

export default (props) => {

  const { fetchUrl, overview, metrics = [], renderExtra, timeRange, timeout, timezone, refresh, bucketSize, handleTimeChange, handleTimeIntervalChange } = props

  if (!fetchUrl || metrics.length === 0) {
    return null;
  }

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
  
  const extra = renderExtra ? renderExtra() : null;

  const [charts, setCharts] = useState([])

  useEffect(() => {
    setCharts(() => {
      const cs = {}
      metrics.forEach((metricKey) => {
        cs[metricKey] = createRef()
      })
      return cs
    })
  }, [JSON.stringify(metrics)])

  const pointerUpdate = (event) => {
    Object.keys(charts).forEach((key) => {
      if (charts[key].current) {
        charts[key].current.dispatchExternalPointerEvent(event);
      }
    });
  };

  return (
    <div id="cluster-metric">
      <div className={styles.metricList}>
        {metrics.filter((item) => !!item).map((metricKey) => (
          <MetricChart 
            key={metricKey}
            instance={charts[metricKey]} 
            pointerUpdate={pointerUpdate}
            timezone={timezone} 
            timeRange={timeRange} 
            timeout={timeout}
            refresh={refresh}
            handleTimeChange={handleTimeChange} 
            fetchUrl={fetchUrl}
            metricKey={metricKey}
            title={formatMessage({
              id: "cluster.metrics.axis." + metricKey + ".title",
            })} 
            queryParams={queryParams}
            className={styles.vizChartContainer}
            style={{ flex: metricKey == "cluster_health" ? '0 0 calc(100%)' : '0 0 calc(50% - 5px)'}}
            formatMetric={(metric) => {
              if (metric) {
                const lines = metric.lines || []
                metric.lines = lines.map((line) => {
                  const data = line.data || [];
                  if (data.length > 1) {
                    line.data = line.data.slice(0, data.length - 1);
                  }
                  return line;
                });
              }
              return metric
            }}
            handleTimeIntervalChange={handleTimeIntervalChange}
          />
        ))}
        {
          extra && (
            <div key={"metric_extra"} className={styles.vizChartContainer}>
              {extra}
            </div>
          )
        }
      </div>
    </div>
  );
};