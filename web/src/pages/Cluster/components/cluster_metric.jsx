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
import styles from "../Metrics.scss";
import { Spin, Radio, Select, Skeleton } from "antd";
import { formatter, getFormatter, getNumFormatter } from "@/utils/format";
import "./node_metric.scss";
import moment from "moment";
import { formatMessage } from "umi/locale";
import _ from "lodash";
import { formatTimeRange } from "@/lib/elasticsearch/util";

export default ({
  clusterID,
  timezone,
  timeRange,
  handleTimeChange,
  overview,
  fetchUrl,
}) => {
  if (!clusterID) {
    return null;
  }
  const queryParams = React.useMemo(() => {
    const params = formatTimeRange(timeRange);
    if (overview) {
      params.overview = overview;
    }
    return params;
  }, [timeRange]);
  const { loading, error, value } = useFetch(
    fetchUrl || `${ESPrefix}/${clusterID}/cluster_metrics`,
    {
      queryParams: queryParams,
    },
    [clusterID, queryParams, fetchUrl]
  );

  const metrics = React.useMemo(() => {
    const { metrics = {} } = value || {};
    const sorted = Object.values(metrics).sort((a, b) => a.order - b.order);

    // Fill gaps for auto_date_histogram (which only returns non-empty buckets)
    sorted.forEach((metric) => {
      if (!metric.lines) return;
      metric.lines.forEach((line) => {
        if (!line.data || line.data.length < 2) return;

        if (line.type === "Bar") {
          // Bar chart data: [{x, y, g}, ...] — fill gaps with gray "empty" bars
          const timestamps = [...new Set(line.data.map((d) => d.x))].sort(
            (a, b) => a - b
          );
          if (timestamps.length < 2) return;
          // Infer interval from most common gap
          const gaps = [];
          for (let i = 1; i < timestamps.length; i++) {
            gaps.push(timestamps[i] - timestamps[i - 1]);
          }
          gaps.sort((a, b) => a - b);
          const intervalMs = gaps[Math.floor(gaps.length / 2)]; // median
          if (!intervalMs || intervalMs <= 0) return;

          const existingSet = new Set(timestamps.map(String));
          const filledData = [...line.data];
          const startTs = timestamps[0];
          const endTs = timestamps[timestamps.length - 1];
          const maxSlots = 200;
          let count = 0;
          for (
            let ts = startTs;
            ts <= endTs && count < maxSlots;
            ts += intervalMs
          ) {
            count++;
            if (!existingSet.has(String(ts))) {
              filledData.push({ x: ts, y: 100, g: "empty" });
            }
          }
          filledData.sort((a, b) => a.x - b.x || a.g.localeCompare(b.g));
          line.data = filledData;
        } else {
          // Line chart data: [[timestamp, value], ...] — no gap-fill needed,
          // @elastic/charts LineSeries connects dots naturally
        }
      });
    });

    return sorted;
  }, [value]);

  const chartRefs = React.useRef();
  React.useEffect(() => {
    let refs = [];
    Object.keys(metrics).map((m) => {
      refs.push(React.createRef());
    });
    chartRefs.current = refs;
  }, [metrics]);

  const pointerUpdate = (event) => {
    chartRefs.current.forEach((ref) => {
      if (ref.current) {
        ref.current.dispatchExternalPointerEvent(event);
      }
    });
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
  let refIdx = 0;
  if (Object.keys(metrics).length == 0) {
    return null;
  }

  return (
    <div id="cluster-metric">
      <div className={styles.metricList}>
        <Skeleton active loading={!value} paragraph={{ rows: 20 }}>
          {Object.keys(metrics).map((e, i) => {
            let axis = metrics[e].axis;
            let lines = metrics[e].lines;
            if (lines.length == 0 || (lines && lines[0]?.data?.length == 0)) {
              return null;
            }
            let disableHeaderFormat = false;
            let headerUnit = "";
            let chartTitle = {};
            if (metrics[e].key == "cluster_health") {
              chartTitle.units = "%";
            } else {
              if (lines[0].metric.formatType.toLowerCase == "bytes") {
                chartTitle.units = lines[0].metric.formatType;
              } else {
                chartTitle.units = lines[0].metric.units;
              }
            }
            chartTitle.title = formatMessage({
              id: "cluster.metrics.axis." + metrics[e].key + ".title",
            });

            return (
              <div key={e} className={styles.vizChartContainer}>
                <div className={styles.vizChartItemTitle}>
                  <span>
                    {chartTitle.title}
                    {chartTitle.units ? `(${chartTitle.units})` : ""}
                  </span>
                </div>
                <Chart
                  size={[, 200]}
                  className={styles.vizChartItem}
                  ref={chartRefs[i]}
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
                            `${formatter.full_dates(value)}${
                              headerUnit ? ` ${headerUnit}` : ""
                            }`,
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
                  {metrics[e].key == "cluster_health" ? (
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
                        key={e + "-" + item.id}
                        id={e + "-" + item.id}
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
                            if (yAccessor === "y") {
                              if (g === "empty") return "#D3DAE6";
                              if (["red", "yellow", "green"].includes(g)) {
                                return g;
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
              </div>
            );
          })}
        </Skeleton>
      </div>
    </div>
  );
};
