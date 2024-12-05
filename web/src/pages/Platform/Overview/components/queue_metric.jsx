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
import styles from "./Metrics.scss";
import { Spin, Radio, Select, Skeleton, Row, Col, InputNumber, Tooltip, Icon, message } from "antd";
import { formatter, getFormatter, getNumFormatter } from "@/utils/format";
import "./node_metric.scss";
import { calculateBounds } from "@/components/vendor/data/common/query/timefilter";
import moment from "moment";
import { formatMessage } from "umi/locale";
import MetricContainer from "./metric_container";
import _, { cloneDeep } from "lodash";
import { formatTimeRange } from "@/lib/elasticsearch/util";
import NodeSelect from "@/components/NodeSelect";
import Anchor from "@/components/Anchor";
import { CopyToClipboard } from "react-copy-to-clipboard";
import request from "@/utils/request";

export default (props) => {

  const { 
    clusterID,
    timezone,
    timeRange,
    handleTimeChange,
    param,
    setParam,
    bucketSize,
    metrics = []
  } = props

  if (metrics.length == 0) {
    return null;
  }

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
      const nodeNames = value.map(item=>item.host);
      setParam((param) => {
        delete param["top"];
        return {
          ...param,
          node_name: nodeNames,
        };
      });
    },
    [param]
  );

  const { value: nodes } = useFetch(
    `${ESPrefix}/${clusterID}/nodes/realtime`,
    {},
    [clusterID]
  );

  const queryParams = React.useMemo(() => {
    let newParams = formatTimeRange(timeRange);
    if (param.top) {
      newParams.top = param.top;
    }
    if (param.node_name) {
      newParams.node_name = param.node_name;
    }
    if (bucketSize) {
      newParams.bucket_size = bucketSize
    }
    return newParams;
  }, [param, timeRange, bucketSize]);

  const formatedNodes = React.useMemo(() => {
    if (!nodes) {
      return [];
    }
    return (nodes || []).map((item) => {
      return {
        ...item, 
        host: item?.ip + ":" + item?.port
      }
    });
  }, [nodes]);

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
                <NodeSelect nodes={formatedNodes} 
                  mode="multiple"  
                  placeholder="Select node"
                  allowClear
                  onChange={nodeValueChange}/>
              </div>
            </div>
          </div>
        </div>
      ) : (
        ""
      )}

      <div className="px-box">
        <div className="px">
            {metrics.map((item, i) => {
              return (
                <div key={item[0]} style={{ margin: "8px 0" }}>
                  <MetricContainer
                    title={formatMessage({ id: `cluster.metrics.group.${item[0]}` })}
                    collapsed={false}
                    id={item[0]}
                  >
                    <div className="metric-inner-cnt">
                      {
                        item[1].map((metricKey) => (
                          <MetricChart 
                            key={metricKey} 
                            clusterID={clusterID}
                            timezone={timezone} 
                            timeRange={timeRange} 
                            handleTimeChange={handleTimeChange} 
                            metricKey={metricKey} 
                            queryParams={queryParams}
                          />
                        ))
                      }
                    </div>
                  </MetricContainer>
                </div>
              );
            })}
        </div>
        <Anchor links={metrics.map((item) => item[0])}></Anchor>
      </div>
    </div>
  );
};

const MetricChart = (props) => {

  const { 
    clusterID,
    timezone,
    timeRange,
    handleTimeChange,
    metricKey,
    queryParams
   } = props;

   const [loading, setLoading] = React.useState(false)

   const [metric, setMetric] = React.useState()

  const [isInView, setIsInView] = React.useState(false);

  const observerRef = React.useRef({ isInView: false })

  const containerRef = React.useRef(null)

  const fetchData = async (queryParams, clusterID, metricKey) => {
    if (!observerRef.current.isInView) return;
    setLoading(true)
    const res = await request(`${ESPrefix}/${clusterID}/queue_metrics`, {
      method: 'GET',
      queryParams: {
        ...queryParams,
        key: metricKey
      },
    })
    if (res && !res.error) {
      const { metrics = {} } = res || {};
      setMetric(metrics[metricKey]);
    }
    setLoading(false)
  }

  React.useEffect(() => {
    observerRef.current.deps = cloneDeep([queryParams, clusterID, metricKey])
    fetchData(queryParams, clusterID, metricKey)
  }, [JSON.stringify(queryParams), clusterID, metricKey])

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
  const chartTitle = {
    title: formatMessage({id:"cluster.metrics.threadpool.axis." + metricKey + ".title"})
  };
  if (lines[0]?.metric) {
    if (lines[0].metric.formatType.toLowerCase == "bytes") {
      chartTitle.units = lines[0].metric.formatType;
    } else {
      chartTitle.units = lines[0].metric.units;
    }
  }
  return (
    <div key={metricKey} ref={containerRef} className="metric-item">
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
          ticks={8}
        />
        {axis.map((item) => {
          return (
            <Axis
              key={metricKey + "-" + item.id}
              id={metricKey + "-" + item.id}
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
      </Spin>
    </div>
  );
}
