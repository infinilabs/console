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

export default ({ clusterID, timezone, timeRange, handleTimeChange }) => {
  const [filter, setFilter] = React.useState({
    top: "5",
    node_name: undefined,
  });

  const topChange = (e) => {
    setFilter({
      node_name: undefined,
      top: e.target.value,
    });
  };

  const nodeValueChange = (value) => {
    setFilter({
      top: undefined,
      node_name: value,
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
    `${ESPrefix}/${clusterID}/node_metrics`,
    {
      queryParams: queryParams,
    },
    [clusterID, queryParams]
  );

  const metrics = React.useMemo(() => {
    return Object.values(value?.metrics || {}).sort(
      (a, b) => a.order - b.order
    );
  }, [value]);

  const chartRefs = React.useRef();
  React.useEffect(() => {
    chartRefs.current = metrics.map(() => {
      return React.createRef();
    });
  }, [metrics]);

  const { value: nodes } = useFetch(`${ESPrefix}/${clusterID}/nodes`, {}, [
    clusterID,
  ]);
  const nodeNames = React.useMemo(() => {
    return Object.keys(nodes || {}).map((k) => nodes[k].name);
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
    const [from, to] = x;
    if (typeof handleTimeChange == "function") {
      handleTimeChange({
        start: moment(from).toISOString(),
        end: moment(to).toISOString(),
      });
    }
  };

  return (
    <div>
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
                onChange={nodeValueChange}
                placeholder="请选择节点"
                value={filter.node_name}
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
      <div className="px">
        <Skeleton active loading={loading} paragraph={{ rows: 20 }}>
          {Object.keys(metrics).map((e, i) => {
            let axis = metrics[e].axis;
            let lines = metrics[e].lines;
            let disableHeaderFormat = false;
            let headerUnit = "";
            return (
              <div key={e} className={styles.vizChartContainer}>
                <Chart
                  size={[, 200]}
                  className={styles.vizChartItem}
                  ref={chartRefs.current[i]}
                >
                  <Settings
                    // theme={theme}
                    pointerUpdateDebounce={0}
                    pointerUpdateTrigger="x"
                    externalPointerEvents={{
                      tooltip: { visible: true },
                    }}
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
                  />
                  {axis.map((item) => {
                    return (
                      <Axis
                        key={e + "-" + item.id}
                        id={e + "-" + item.id}
                        showGridLines={item.showGridLines}
                        groupId={item.group}
                        title={item.title}
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
        </Skeleton>
      </div>
    </div>
  );
};
