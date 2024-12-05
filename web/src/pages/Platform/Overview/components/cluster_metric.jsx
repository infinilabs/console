import * as React from "react";
import {
  Axis,
  Chart,
  CurveType,
  LineSeries,
  BarSeries,
  niceTimeFormatByDay,
  Position,
  ScaleType,
  Settings,
  timeFormatter,
} from "@elastic/charts";
import useFetch from "@/lib/hooks/use_fetch";
import { ESPrefix } from "@/services/common";
import styles from "./Metrics.scss";
import { Spin, Radio, Select, Skeleton, message, Icon, Tooltip } from "antd";
import { formatter, getFormatter, getNumFormatter } from "@/utils/format";
import "./node_metric.scss";
import { calculateBounds } from "@/components/vendor/data/common/query/timefilter";
import moment from "moment";
import { formatMessage } from "umi/locale";
import _, { cloneDeep, method } from "lodash";
import { CopyToClipboard } from "react-copy-to-clipboard";
import request from "@/utils/request";

export default (props) => {

  const { fetchUrl, metrics = [], renderExtra, timeRange, timezone, bucketSize, handleTimeChange } = props

  if (!fetchUrl || metrics.length === 0) {
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
    if (bucketSize) {
      params.bucket_size = bucketSize
    }
    return params;
  }, [timeRange, bucketSize]);
  
  const extra = renderExtra ? renderExtra() : null;

  return (
    <div id="cluster-metric">
      <div className={styles.metricList}>
        {metrics.map((metricKey, i) => (
          <MetricChart 
            key={metricKey} 
            timezone={timezone} 
            timeRange={timeRange} 
            handleTimeChange={handleTimeChange} 
            fetchUrl={fetchUrl}
            metricKey={metricKey} 
            queryParams={queryParams}
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

const MetricChart = (props) => {

  const { 
    timezone,
    timeRange,
    handleTimeChange,
    fetchUrl,
    metricKey,
    queryParams
   } = props;

   const [loading, setLoading] = React.useState(false)

   const [metric, setMetric] = React.useState()

  const [isInView, setIsInView] = React.useState(false);

  const observerRef = React.useRef({ isInView: false })

  const containerRef = React.useRef(null)

  const fetchData = async (queryParams, fetchUrl, metricKey) => {
    if (!observerRef.current.isInView) return;
    setLoading(true)
    const res = await request(fetchUrl, {
      method: 'GET',
      queryParams: {
        ...queryParams,
        key: metricKey
      },
    })
    if (res && !res.error) {
      const { metrics = {} } = res || {};
      const metric = metrics[metricKey]
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
      setMetric(metric);
    }
    setLoading(false)
  }

  React.useEffect(() => {
    observerRef.current.deps = cloneDeep([queryParams, fetchUrl, metricKey])
    fetchData(queryParams, fetchUrl, metricKey)
  }, [JSON.stringify(queryParams), fetchUrl, metricKey])

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            observerRef.current.isInView = true
            if (JSON.stringify(observerRef.current.deps) !== JSON.stringify(observerRef.current.lastDeps)) {
              observerRef.current.lastDeps = cloneDeep(observerRef.current.deps)
              fetchData(...observerRef.current.deps)
            }
          } else {
            observerRef.current.isInView = false
          }
        });
      },
      {
        root: null,
        threshold: 0,
      }
    );
 
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
 
    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [isInView]);

  const chartRef = React.useRef();

  const pointerUpdate = (event) => {
    if (chartRef.current) {
      chartRef.current.dispatchExternalPointerEvent(event);
    }
  };

  const handleChartBrush = ({ x }) => {
    if (!x) {
      return;
    }
    let [from, to] = x;
    if (typeof handleTimeChange == "function") {
      if (to - from < 20 * 1000) {
        from -= 10 * 1000;
        to += 10 * 1000;
      }
      handleTimeChange({
        start: moment(from).toISOString(),
        end: moment(to).toISOString(),
      });
    }
  };

  const axis = metric?.axis || [];
  const lines = metric?.lines || [];
  let disableHeaderFormat = false;
  let chartTitle = {};
  if (metricKey == "cluster_health") {
    chartTitle.units = "%";
  } else {
    if (lines[0]?.metric) {
      if (lines[0].metric.formatType.toLowerCase == "bytes") {
        chartTitle.units = lines[0].metric.formatType;
      } else {
        chartTitle.units = lines[0].metric.units;
      }
    }
  }
  chartTitle.title = formatMessage({
    id: "cluster.metrics.axis." + metricKey + ".title",
  });

  return (
    <div key={metricKey} ref={containerRef} className={styles.vizChartContainer} style={{ flex: metricKey == "cluster_health" ? '0 0 calc(100%)' : '0 0 calc(50% - 5px)'}}>
      <Spin spinning={loading}>
      <div className={styles.vizChartItemTitle}>
        <span>
          {chartTitle.title}
          {chartTitle.units ? `(${chartTitle.units})` : ""}
        </span>
        {
          metric?.request && (
            <span>
              <CopyToClipboard text={metric.request}>
                <Tooltip title={formatMessage({id: "cluster.metrics.dsl.copy"})}>
                  <Icon 
                    className={styles.copy}
                    type="copy" 
                    onClick={() => message.success(formatMessage({id: "cluster.metrics.dsl.copy.success"}))}
                  />
                </Tooltip>
              </CopyToClipboard>
            </span>
          )
        }
      </div>
      <Chart
        size={[, 200]}
        className={styles.vizChartItem}
        ref={chartRef}
      >
        <Settings
          pointerUpdateDebounce={0}
          pointerUpdateTrigger="x"
          // externalPointerEvents={{
          //   tooltip: { visible: true },
          // }}
          onPointerUpdate={pointerUpdate}
          // theme={theme}
          showLegend
          legendPosition={Position.Bottom}
          onBrushEnd={handleChartBrush}
          tooltip={{
            headerFormatter: disableHeaderFormat
              ? undefined
              : ({ value }) =>
                  `${formatter.full_dates(value)}`,
          }}
          debug={false}
        />
        <Axis
          id="{e}-bottom"
          position={Position.Bottom}
          showOverlappingTicks
          labelFormat={timeRange.timeFormatter}
          tickFormat={timeRange.timeFormatter}
        />
        {metricKey == "cluster_health" ? (
          <Axis
            id="cluster_health"
            // title={formatMessage({
            //   id:
            //     "dashboard.charts.title." +
            //     metrics[e].key +
            //     ".axis.percent",
            // })}
            position={Position.Left}
            tickFormat={(d) => Number(d).toFixed(0) + "%"}
          />
        ) : null}

        {axis.map((item) => {
          return (
            <Axis
              key={metricKey + "-" + item.id}
              id={metricKey + "-" + item.id}
              showGridLines={item.showGridLines}
              groupId={item.group}
              // title={formatMessage({
              //   id:
              //     "dashboard.charts.title." +
              //     metrics[e].key +
              //     ".axis." +
              //     item.title,
              // })}
              position={item.position}
              ticks={item.ticks}
              labelFormat={getFormatter(
                item.formatType,
                item.labelFormat
              )}
              tickFormat={getFormatter(
                item.formatType,
                item.tickFormat
              )}
            />
          );
        })}

        {lines.map((item) => {
          if (item.type == "Bar") {
            return (
              <BarSeries
                key={item.metric.label}
                xScaleType={ScaleType.Time}
                yScaleType={ScaleType.Linear}
                xAccessor="x"
                yAccessors={["y"]}
                stackAccessors={["x"]}
                splitSeriesAccessors={["g"]}
                data={item.data}
                color={({ specId, yAccessor, splitAccessors }) => {
                  const g = splitAccessors.get("g");
                  if (
                    yAccessor === "y"
                   
                  ) {
                    if( ["red", "yellow", "green"].includes(g)){
                      return g;
                    }
                    if(g == "online" || g == "available"){
                      return "green";
                    }
                    if(g == "offline" || g == "unavailable" || g == "N/A"){
                      return "gray";
                    }
                    
                  }
                  return null;
                }}
              />
            );
          }
          return (
            <LineSeries
              key={item.metric.label}
              id={item.metric.label}
              groupId={item.metric.group}
              timeZone={timezone}
              color={item.color}
              xScaleType={ScaleType.Time}
              yScaleType={ScaleType.Linear}
              xAccessor={0}
              tickFormat={getFormatter(
                item.metric.formatType,
                item.metric.tickFormat,
                item.metric.units
              )}
              yAccessors={[1]}
              data={item.data}
              curve={CurveType.CURVE_MONOTONE_X}
            />
          );
        })}
      </Chart>
      </Spin>
    </div>
  );
}
