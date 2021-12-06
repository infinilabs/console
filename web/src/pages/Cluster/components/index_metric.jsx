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
import styles from "../Metrics.less";
import { Spin, Radio, Select, Skeleton } from "antd";
import { formatter, getFormatter, getNumFormatter } from "../format";
import "./node_metric.scss";
import { calculateBounds } from "@/components/kibana/data/common/query/timefilter";
import moment from "moment";
import { formatMessage } from "umi/locale";
import MetricContainer from "./metric_container";
import _ from "lodash";

const gorupOrder = [
  "storage",
  "document",
  "operations",
  "latency",
  "memory",
  "cache",
];
export default ({ clusterID, timezone, timeRange, handleTimeChange }) => {
  if (!clusterID) {
    return null;
  }
  const [filter, setFilter] = React.useState({
    top: "5",
    index_name: undefined,
  });

  const topChange = (e) => {
    setFilter({
      index_name: undefined,
      top: e.target.value,
    });
  };

  const indexValueChange = (value) => {
    setFilter({
      top: undefined,
      index_name: value,
    });
  };
  const queryParams = React.useMemo(() => {
    const bounds = calculateBounds({
      from: timeRange.min,
      to: timeRange.max,
    });
    return {
      ...filter,
      min: bounds.min.valueOf(),
      max: bounds.max.valueOf(),
    };
  }, [filter, timeRange]);
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
      metrics[k] = (grpMetrics[k] || []).sort((a, b) => a.order - b.order);
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
  const indexNames = React.useMemo(() => {
    return Object.keys(indices || {});
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
    const [from, to] = x;
    if (typeof handleTimeChange == "function") {
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
      <div className="px">
        <div className="metric-control">
          <div className="selector">
            <div className="top_radio">
              <Radio.Group onChange={topChange} value={filter.top}>
                <Radio.Button value="5">Top5</Radio.Button>
                <Radio.Button value="10">Top10</Radio.Button>
                <Radio.Button value="15">Top15</Radio.Button>
                <Radio.Button value="20">Top20</Radio.Button>
              </Radio.Group>
            </div>
            <div className="value-selector">
              <Select
                style={{ width: 200 }}
                onChange={indexValueChange}
                placeholder="Select index"
                value={filter.index_name}
                showSearch={true}
              >
                {indexNames.map((name) => (
                  <Select.Option key={name}>{name}</Select.Option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </div>
      <div className="px">
        <Skeleton active loading={!value} paragraph={{ rows: 20 }}>
          {gorupOrder.map((e, i) => {
            if (!metrics[e]) {
              return null;
            }
            return (
              <div style={{ margin: "8px 0" }}>
                <MetricContainer
                  title={formatMessage({ id: `cluster.metrics.group.${e}` })}
                  collapsed={false}
                >
                  <div className="metric-inner-cnt">
                    {metrics[e].map((metric) => {
                      let axis = metric.axis;
                      let lines = metric.lines;
                      let disableHeaderFormat = false;
                      let headerUnit = "";
                      return (
                        <div key={metric.key} className="metric-item">
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
                              legendPosition={Position.Top}
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
                                  title={formatMessage({
                                    id:
                                      "cluster.metrics.index.axis." +
                                      metric.key +
                                      ".title",
                                  })}
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
