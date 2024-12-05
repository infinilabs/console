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
import { Spin, Radio, Select, Skeleton } from "antd";
import { formatter, getFormatter, getNumFormatter } from "@/utils/format";
import "./node_metric.scss";
import { calculateBounds } from "@/components/vendor/data/common/query/timefilter";
import moment from "moment";
import { formatMessage } from "umi/locale";
import MetricContainer from "./metric_container";
import _ from "lodash";
import IndexSelect from "@/components/IndexSelect";
import Anchor from "@/components/Anchor";

const gorupOrder = [
  "operations",
  "latency",
  "storage",
  "document",
  "memory",
  "cache",
];
export default ({
  clusterID,
  timezone,
  timeRange,
  handleTimeChange,
  param,
  setParam,
  shardID,
  bucketSize
}) => {
  if (!clusterID) {
    return null;
  }
  const showTop = param.show_top ?? true;

  const topChange = (e) => {
    setParam((param) => {
      delete param["index_name"];
      return {
        ...param,
        top: e.target.value,
      };
    });
  };

  const indexValueChange = (value) => {
    const indexNames = value.map(item=>item.index);
    setParam((param) => {
      delete param["top"];
      return {
        ...param,
        index_name: indexNames,
      };
    });
  };
  const queryParams = React.useMemo(() => {
    const bounds = calculateBounds({
      from: timeRange.min,
      to: timeRange.max,
    });
    let newParams = {
      min: bounds.min.valueOf(),
      max: bounds.max.valueOf(),
    };
    if(shardID){
      newParams.shard_id = shardID;
    }
    if (param.top) {
      newParams.top = param.top;
    }
    if (param.index_name) {
      newParams.index_name = param.index_name;
    }
    if (bucketSize) {
      newParams.bucket_size = bucketSize
    }
    return newParams;
  }, [param, timeRange, bucketSize]);
  const { loading, error, value } = useFetch(
    `${ESPrefix}/${clusterID}/index_metrics`,
    {
      queryParams: queryParams,
    },
    [clusterID, queryParams]
  );

  const metrics = React.useMemo(() => {
    const grpMetrics = _.groupBy(value?.metrics, "group");
    let metrics = {};
    Object.keys(grpMetrics).forEach((k) => {
      metrics[k] = (grpMetrics[k] || [])
        .sort((a, b) => a.order - b.order)
    });
    return metrics;
  }, [value]);

  const chartRefs = React.useRef();
  React.useEffect(() => {
    let refs = [];
    Object.values(metrics).map((m) => {
      m.forEach(() => {
        refs.push(React.createRef());
      });
    });
    chartRefs.current = refs;
  }, [metrics]);

  const { value: indices } = useFetch(
    `${ESPrefix}/${clusterID}/_cat/indices`,
    {},
    [clusterID]
  );
  const formatedIndices = React.useMemo(() => {
    return Object.values(indices || []);
  }, [indices]);

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
    <div id="node-metric">
      {showTop ? (
        <div className="px">
          <div className="metric-control">
            <div className="selector">
              <div className="top_radio">
                <Radio.Group onChange={topChange} value={param.top}>
                  <Radio.Button value="5">Top5</Radio.Button>
                  <Radio.Button value="10">Top10</Radio.Button>
                  <Radio.Button value="15">Top15</Radio.Button>
                  <Radio.Button value="20">Top20</Radio.Button>
                </Radio.Group>
              </div>
              <div className="value-selector">
                <IndexSelect indices={formatedIndices} 
                  mode="multiple"  
                  placeholder="Select index"
                  allowClear
                  onChange={indexValueChange}/>
              </div>
            </div>
          </div>
        </div>
      ) : (
        ""
      )}

      <div className="px-box">
        <div className="px">
          <Skeleton active loading={!value} paragraph={{ rows: 20 }}>
            {gorupOrder.map((e, i) => {
              if (!metrics[e]) {
                return null;
              }
              return (
                <div key={e} style={{ margin: "8px 0" }}>
                  <MetricContainer
                    title={formatMessage({ id: `cluster.metrics.group.${e}` })}
                    collapsed={false}
                    id={e}
                  >
                    <div className="metric-inner-cnt">
                      {metrics[e].map((metric) => {
                        let axis = metric.axis;
                        let lines = metric.lines;
                        if (
                          lines.length == 0 ||
                          (lines && lines[0]?.data?.length == 0)
                        ) {
                          return null;
                        }
                        let disableHeaderFormat = false;
                        let headerUnit = "";
                        let chartTitle = {};
                        if (lines[0].metric.formatType.toLowerCase == "bytes") {
                          chartTitle.units = lines[0].metric.formatType;
                        } else {
                          chartTitle.units = lines[0].metric.units;
                        }
                        chartTitle.title = formatMessage({
                          id:
                            "cluster.metrics.index.axis." + metric.key + ".title",
                        });
                        return (
                          <div key={metric.key} className="metric-item">
                            <div className={styles.vizChartItemTitle}>
                              <span>
                                {chartTitle.title}
                                {chartTitle.units ? `(${chartTitle.units})` : ""}
                              </span>
                            </div>
                            <Chart
                              size={[, 200]}
                              className={styles.vizChartItem}
                              ref={chartRefs.current[refIdx++]}
                            >
                              <Settings
                                // theme={theme}
                                pointerUpdateDebounce={0}
                                pointerUpdateTrigger="x"
                                // externalPointerEvents={{
                                //   tooltip: { visible: true },
                                // }}
                                onPointerUpdate={pointerUpdate}
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
                                ticks={8}
                              />
                              {lines[0].type == "Bar" ? (
                                <Axis
                                  id={"axis_left"}
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
                                    //     "cluster.metrics.index.axis." +
                                    //     metric.key +
                                    //     ".title",
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
                                      color={({
                                        specId,
                                        yAccessor,
                                        splitAccessors,
                                      }) => {
                                        const g = splitAccessors.get("g");
                                        if (
                                          yAccessor === "y" &&
                                          ["red", "yellow", "green"].includes(g)
                                        ) {
                                          return g;
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
                    </div>
                  </MetricContainer>
                </div>
              );
            })}
          </Skeleton>
        </div>
        <Anchor links={gorupOrder}></Anchor>
      </div>
      
    </div>
  );
};
