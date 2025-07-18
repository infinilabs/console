import request, { formatResponse } from "@/utils/request";
import { cloneDeep } from "lodash";
import { useEffect, useRef, useState } from "react";
import { formatMessage } from "umi/locale";
import styles from "./Metrics.scss";
import { Alert, Dropdown, Empty, Icon, Menu, message, Spin, Tooltip } from "antd";
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
      timeout,
      refresh,
      handleTimeChange,
      fetchUrl,
      metricKey,
      title,
      queryParams,
      className,
      style,
      formatMetric,
      height = 200,
      customRenderChart,
      instance,
      pointerUpdate,
      handleTimeIntervalChange
    } = props;
  
    const [loading, setLoading] = useState(false)

    const [metric, setMetric] = useState()
  
    const [isInView, setIsInView] = useState(false);

    const [error, setError] = useState();
  
    const observerRef = useRef({ isInView: false })
  
    const containerRef = useRef(null)
  
    const firstFetchRef = useRef(true)

    const [timeInterval, setTimeInterval] = useState()
  
    const fetchData = async (queryParams, fetchUrl, metricKey, timeInterval, showLoading) => {
      if (!observerRef.current.isInView || !fetchUrl) return;
      if (firstFetchRef.current || showLoading) {
        setLoading(true)
      }
      const newQueryParams = {
        ...queryParams,
        key: metricKey,
        timeout
      }
      if (timeInterval) {
        newQueryParams.bucket_size = timeInterval
      }
      const res = await request(fetchUrl, {
        method: 'GET',
        queryParams: newQueryParams,
        ignoreTimeout: true
      }, false, false)
      if (res?.error) {
        const error = formatResponse(res);
        setError(error?.errorObject?.key ? formatMessage({ id: `${error?.errorObject?.key}` }) : res?.error?.reason)
      } else if (res && !res.error) {
        const { metrics = {} } = res || {};
        const metric = metrics[metricKey]
        setError()
        setMetric(formatMetric && metric ? formatMetric(metric) : metric);
      }
      if (firstFetchRef.current || showLoading) {
        setLoading(false)
        firstFetchRef.current = false
      }
    }

    const fixFormat = (formatType, format) => {
      return formatType === 'num' && format ? `${format}a` : format
    }
  
    useEffect(() => {
      observerRef.current.deps = cloneDeep([queryParams, fetchUrl, metricKey, timeInterval, refresh])
      fetchData(queryParams, fetchUrl, metricKey, timeInterval, refresh)
    }, [JSON.stringify(queryParams), fetchUrl, metricKey, timeInterval, refresh])
  
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

    const renderChart = () => {
      if (error) {
        return (
          <div style={{ height, padding: 10 }}>
            <Alert style={{ maxHeight: '100%', overflow: 'auto', wordBreak: 'break-all'}} message={error} type="error"/>
          </div>
        )
      }
      const axis = metric?.axis || [];
      const lines = metric?.lines || [];
      if (lines.every((item) => !item.data || item.data.length === 0)) {
        const emptyProps = {}
        if (metric?.min_bucket_size > 0 && metric?.hits_total > 0) {
          emptyProps.description = (
            <>
              <div style={{ wordBreak: 'break-all', textAlign: 'left', marginBotton: 2 }} >
                {formatMessage({ id: "cluster.metrics.time_interval.empty" }, { min_bucket_size: metric.min_bucket_size})}
              </div>
              <Dropdown overlay={(
                <Menu>
                  <Menu.Item onClick={() => handleTimeIntervalChange(`${metric?.min_bucket_size}s`)}>
                    {formatMessage({ id: `cluster.metrics.time_interval.set.global`})}
                  </Menu.Item>
                  <Menu.Item onClick={() => setTimeInterval(`${metric?.min_bucket_size}s`)}>
                    {formatMessage({ id: `cluster.metrics.time_interval.set.current`})}
                  </Menu.Item>
                </Menu>
              )}>
                <a onClick={e => e.preventDefault()}>
                  {formatMessage({ id: `cluster.metrics.time_interval.apply`})} <Icon type="down" />
                </a>
              </Dropdown>
            </>
          )
        }
        return (
          <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Empty style={{ margin: 0}} image={Empty.PRESENTED_IMAGE_SIMPLE} {...emptyProps} />
          </div>
        )
      }
      if (customRenderChart) {
        return customRenderChart(metric)
      }
      return (
        <Chart
          size={[, height]}
          className={styles.vizChartItem}
          ref={instance}
        >
          <Settings
            pointerUpdateDebounce={0}
            pointerUpdateTrigger="x"
            onPointerUpdate={pointerUpdate}
            showLegend
            legendPosition={Position.Bottom}
            onBrushEnd={handleChartBrush}
            tooltip={{
              headerFormatter: ({ value }) =>
                    `${formatter.full_dates(value)}`,
            }}
            debug={false}
          />
          <Axis
            id={`${metricKey}-bottom`}
            position={Position.Bottom}
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
                  fixFormat(item.formatType, item.tickFormat)
                )}
                tickFormat={getFormatter(
                  item.formatType,
                  fixFormat(item.formatType, item.tickFormat)
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
                  fixFormat(item.metric.formatType, item.metric.format),
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

    const chartTitle = { title };
    const lines = metric?.lines || [];
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
        {
                metric?.request && (
                  <CopyToClipboard text={`GET .infini_metrics/_search\n${metric.request}`}>
                    <Tooltip title={formatMessage({id: "cluster.metrics.request.copy"})}>
                      <Icon 
                        className="copyReq"
                        type="copy" 
                        onClick={() => message.success(formatMessage({id: "cluster.metrics.request.copy.success"}))}
                      />
                    </Tooltip>
                  </CopyToClipboard>
                )
              }
        <Spin spinning={loading}>
        <div className={styles.vizChartItemTitle}>
          <span>
            {chartTitle.title}
            {chartTitle.units ? `(${chartTitle.units})` : ""}
          </span>
          {
            <span>
              {
                timeInterval && (
                  <Tooltip title={formatMessage({id: "cluster.metrics.time_interval.reload"}, { time_interval: queryParams.bucket_size })}>
                    <Icon className={styles.copy} style={{ marginRight: 12 }} type="history" onClick={() => setTimeInterval()}/>
                  </Tooltip>
                )
              }
              <Tooltip title={formatMessage({id: "form.button.refresh"})}>
                <Icon className={styles.copy} type="sync" onClick={() => fetchData(...observerRef.current.deps, true)}/>
              </Tooltip>
            </span>
          }
        </div>
        {renderChart()}
        </Spin>
      </div>
    );
  }