import { formatter } from "@/utils/format";
import { Line } from "@ant-design/plots";
import styles from "./index.scss";
import MetricLine from "./MetricLine";
import { formatMessage } from "umi/locale";
import { useState } from "react";
import request from "@/utils/request";
import MetricChart from "@/pages/Platform/Overview/components/MetricChart";

export default (props) => {
  const { action, timeRange, timezone, timeout, overview, renderExtraMetric, metrics = [], queryParams } = props

  return (
    <div className={styles.metricChart}>
      {metrics.map((metricKey) => {
        return (
          <MetricChart 
            key={metricKey} 
            timezone={timezone} 
            timeRange={timeRange} 
            fetchUrl={action}
            metricKey={metricKey}
            title={formatMessage({id: "cluster.metrics.axis." + metricKey + ".title"})} 
            queryParams={queryParams}
            timeout={timeout}
            className={styles.lineWrapper}
            height={150}
            formatMetric={(metric) => {
              if (!metric) return metric;
              let units = "";
              const newData = [];
              (metric.lines || []).map((line) => {
                let category = line.metric.label;
                if (!units) {
                  if (line.metric.formatType.toLowerCase() == "bytes") {
                    units = line.metric.formatType;
                  } else {
                    units = line.metric.units;
                  }
                }
          
                return line.data.map((ld) => {
                  newData.push({
                    category: category,
                    x: formatter.dateUserDefined(parseInt(ld[0])),
                    y: ld[1],
                  });
                });
              });
              return { ...metric, data: newData, units };
            }}
            customRenderChart={(metric) => {
              if (!metric) return null
              const config = {
                data: metric.data,
                xField: "x",
                yField: "y",
                seriesField: "category",
                yUnits: metric.units,
              };
              return <MetricLine {...config} key={metric.key} />
            }}
          />
        )
      })}
      {renderExtraMetric ? renderExtraMetric() : null}
    </div>
  );
};