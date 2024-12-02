import * as React from "react";
import {
  Axis,
  Chart,
  CurveType,
  LineSeries,
  niceTimeFormatByDay,
  Position,
  ScaleType,
  Settings,
  timeFormatter,
} from "@elastic/charts";
import useFetch from "@/lib/hooks/use_fetch";
import { ESPrefix } from "@/services/common";
import styles from "../Metrics.scss";
import { Spin, Radio, Select, Skeleton, Row, Col } from "antd";
import { formatter, getFormatter, getNumFormatter } from "@/utils/format";
import "./node_metric.scss";
import { calculateBounds } from "@/components/vendor/data/common/query/timefilter";
import moment from "moment";
import { formatMessage } from "umi/locale";
import MetricContainer from "./metric_container";
import _ from "lodash";
import { formatTimeRange } from "@/lib/elasticsearch/util";

const gorupOrder = [
  "operations",
  "latency",
  "system",
  "io",
  "transport",
  "storage",
  "document",
  "http",
  "JVM",
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
}) => {
  // const [filter, setFilter] = React.useState({
  //   top: "5",
  //   node_name: param?.transport,
  // });

  const showTop = param.show_top ?? true;

  const topChange = React.useCallback(
    (e) => {
      // setFilter({
      //   node_name: undefined,
      //   top: e.target.value,
      // });
      setParam((param) => {
        delete param["node_name"];
        return {
          ...param,
          top: e.target.value,
        };
      });
    },
    [param]
  );

  const nodeValueChange = React.useCallback(
    (value) => {
      setParam((param) => {
        delete param["top"];
        return {
          ...param,
          node_name: value,
        };
      });
    },
    [param]
  );
  const queryParams = React.useMemo(() => {
    let newParams = formatTimeRange(timeRange);
    if (param.top) {
      newParams.top = param.top;
    }
    if (param.node_name) {
      newParams.node_name = param.node_name;
    }
    return newParams;
  }, [param, timeRange]);
  const { loading, error, value } = useFetch(
    `${ESPrefix}/${clusterID}/node_metrics`,
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

  const { value: nodes } = useFetch(
    `${ESPrefix}/${clusterID}/nodes/realtime`,
    {},
    [clusterID]
  );
  const nodeNames = React.useMemo(() => {
    if (!nodes) {
      return [];
    }
    return (nodes || []).map((item) => item?.ip + ":" + item?.port);
  }, [nodes]);

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
                  <Radio.Button key="5" value="5">
                    Top5
                  </Radio.Button>
                  <Radio.Button key="10" value="10">
                    Top10
                  </Radio.Button>
                  <Radio.Button key="15" value="15">
                    Top15
                  </Radio.Button>
                  <Radio.Button key="20" value="20">
                    Top20
                  </Radio.Button>
                </Radio.Group>
              </div>
              <div className="value-selector">
                <Select
                  mode="multiple"
                  style={{ width: 200 }}
                  onChange={nodeValueChange}
                  placeholder="Select node"
                  value={param.node_name}
                  showSearch={true}
                >
                  {nodeNames.map((name) => (
                    <Select.Option key={name}>{name}</Select.Option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        </div>
      ) : (
        ""
      )}

      <div className="px">
        <Skeleton active loading={!value} paragraph={{ rows: 20 }}>
          {//Object.keys(metrics)
          gorupOrder.map((e, i) => {
            let hasData = (metrics[e] || []).some(
              (m) => m.lines && m.lines[0]?.data.length > 0
            );
            if (!hasData) {
              return null;
            }
            return (
              <div key={e} style={{ margin: "8px 0" }}>
                <MetricContainer
                  title={formatMessage({ id: `cluster.metrics.group.${e}` })}
                  collapsed={false}
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
                          "cluster.metrics.node.axis." + metric.key + ".title",
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
                            {axis.map((item) => {
                              return (
                                <Axis
                                  key={e + "-" + item.id}
                                  id={e + "-" + item.id}
                                  showGridLines={item.showGridLines}
                                  groupId={item.group}
                                  // title={formatMessage({
                                  //   id:
                                  //     "cluster.metrics.node.axis." +
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
    </div>
  );
};
