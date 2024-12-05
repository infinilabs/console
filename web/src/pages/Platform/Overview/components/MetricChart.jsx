import request from "@/utils/request";
import { cloneDeep } from "lodash";
import { useEffect, useRef, useState } from "react";
import { formatMessage } from "umi/locale";
import styles from "./Metrics.scss";
import { Empty, Icon, message, Spin, Tooltip } from "antd";
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
import { formatter, getFormatter, getNumFormatter } from "@/utils/format";
import { CopyToClipboard } from "react-copy-to-clipboard";
import moment from "moment";
import { ESPrefix } from "@/services/common";

export default (props) => {

    const { 
      timezone,
      timeRange,
      handleTimeChange,
      fetchUrl,
      metricKey,
      title,
      queryParams,
      className,
      style,
      formatMetric
    } = props;
  
    const [loading, setLoading] = useState(false)

    const [metric, setMetric] = useState()
  
    const [isInView, setIsInView] = useState(false);
  
    const observerRef = useRef({ isInView: false })
  
    const containerRef = useRef(null)
  
    const firstFetchRef = useRef(true)
  
    const fetchData = async (queryParams, fetchUrl, metricKey) => {
      if (!observerRef.current.isInView) return;
      if (firstFetchRef.current) {
        setLoading(true)
      }
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
        setMetric(formatMetric ? formatMetric(metric) : metric);
      }
      if (firstFetchRef.current) {
        setLoading(false)
        firstFetchRef.current = false
      }
    }
  
    useEffect(() => {
      observerRef.current.deps = cloneDeep([queryParams, fetchUrl, metricKey])
      fetchData(queryParams, fetchUrl, metricKey)
    }, [JSON.stringify(queryParams), fetchUrl, metricKey])
  
    useEffect(() => {
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
  
    const chartRef = useRef();
  
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
    const chartTitle = { title };
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
  
    return (
      <div key={metricKey} ref={containerRef} className={className} style={style}>
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
        {
          lines.every((item) => !item.data || item.data.length === 0) ? (
            <Empty style={{ height: 200, margin: 0, paddingTop: 64 }} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
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
                id={`${metricKey}-bottom`}
                position={Position.Bottom}
                showOverlappingTicks
                labelFormat={timeRange.timeFormatter}
                tickFormat={timeRange.timeFormatter}
              />
              {metricKey == "cluster_health" ? (
                <Axis
                  id="cluster_health"
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
          )
        }
        </Spin>
      </div>
    );
  }