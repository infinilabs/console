import { Table, Button, Divider, Tag, Icon, Empty, Tooltip, message } from "antd";
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
  LineAnnotation,
  RectAnnotation,
} from "@elastic/charts";
import { formatMessage } from "umi/locale";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatESSearchResult } from "@/lib/elasticsearch/util";
import { formatter, getFormatter } from "@/utils/format";
import moment from "moment";
import Link from "umi/link";
import request from "@/utils/request";
import { formatUtcTimeToLocal } from "@/utils/utils";
import { HealthStatusView } from "@/components/infini/health_status_view";
import { PriorityColor, RuleStautsColor } from "../../utils/constants";
import { MonitorDatePicker } from "@/components/infini/MonitorDatePicker";
import { calculateBounds } from "@/components/vendor/data/common/query/timefilter";
import metricsStyles from "@/pages/Cluster/Metrics.scss";
import _ from "lodash";
import { CopyToClipboard } from "react-copy-to-clipboard";

const buildCopyRequestText = (requestPayload) => {
  const index = requestPayload?.index;
  const query = requestPayload?.query;
  if (!index || !query) {
    return "";
  }
  return `GET ${index}/_search\n${JSON.stringify(query, null, 2)}`;
};

const RuleMetricChart = ({ conditions, values }) => {
  const [timeRange, setTimeRange] = React.useState(
    timeRange || {
      min: "auto",
      max: "auto",
      timeFormatter: formatter.dates(1),
    }
  );

  //RectAnnotation coordinates
  const [shadowCoordinates, setShadowCoordinates] = React.useState({
    x0: 0,
    x1: 0,
    y0: 0,
    y1: 0,
  });

  const [metricData, setMetricData] = useState({});
  const [latestRequest, setLatestRequest] = useState("");
  const hasMetricData = useMemo(() => {
    if (!Array.isArray(metricData?.lines)) {
      return false;
    }
    return metricData.lines.some((line) => Array.isArray(line?.data) && line.data.length > 0);
  }, [metricData]);

  const [lineAnnotations] = useMemo(() => {
    //LineAnnotation
    let lineAnnotations = conditions?.items?.map((item) => {
      let sortValues = item.values.sort((a, b) => a - b);
      let dataValues = sortValues.map((dv, dk) => {
        return {
          dataValue: parseInt(dv),
          details: (
            <span>
              Priority:{item.priority}
              {sortValues.length > 1 ? "-" + dk : ""}
              {item.expression ? (
                <span>
                  <br />
                  Expression:{item.expression}
                </span>
              ) : null}
            </span>
          ),
        };
      });
      return {
        dataValues: dataValues,
        lineColor: PriorityColor[item.priority],
      };
    });
    return [lineAnnotations];
  }, [conditions, timeRange]);

  const fetchAlertMetrics = () => {
    const bounds = calculateBounds({
      from: timeRange.min,
      to: timeRange.max,
    });

    const fetchData = async () => {
      let url = `/alerting/rule/preview_metric`;
      const res = await request(url, {
        method: "POST",
        body: values,
      });
      if (res && !res.error) {
        setMetricData(res.metric);
        setLatestRequest(buildCopyRequestText(res.request));
      }
      console.log("preview_metric res:", res);
    };
    fetchData();
  };

  useEffect(() => {
    let isContinue = true;
    if (values?.metrics && values?.conditions && values?.resource) {
      Object.keys(values || {}).map((k) => {
        if (k == "metrics") {
          values[k].items.map((mi) => {
            if (!mi?.field) {
              console.log("!mi?.field");
              isContinue = false;
            }
          });
        }
      });
    } else {
      isContinue = false;
    }

    if (isContinue) {
      fetchAlertMetrics();
    }
  }, [values, timeRange]);
  let disableHeaderFormat = false;
  let headerUnit = "";

  if (!hasMetricData) {
    return (
      <div
        className={metricsStyles.vizChartContainer}
        style={{
          border: "none",
          margin: 0,
          flex: "1 1 100%",
          minHeight: 240,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无数据"
          style={{ padding: 0, width: "100%" }}
        />
      </div>
    );
  }

  return (
    <div
      className={metricsStyles.vizChartContainer}
      style={{ border: "none", margin: 0, flex: "1 1 100%", position: "relative" }}
    >
      <Chart size={[, 240]} className={metricsStyles.vizChartItem}>
        <Settings
          debug={false}
          showLegend
          legendPosition={Position.Bottom}
          tooltip={{
            headerFormatter: disableHeaderFormat
              ? undefined
              : ({ value }) =>
                  `${formatter.full_dates(value)}${
                    headerUnit ? ` ${headerUnit}` : ""
                  }`,
          }}
        />
        {lineAnnotations?.map((item, i) => {
          return (
            <LineAnnotation
              key={`LineAnnotation_${i}`}
              id={`LineAnnotation_${i}`}
              domainType={"YDomain"}
              dataValues={item.dataValues}
              marker={<Icon type="warning" />}
              style={{
                line: {
                  dash: [5, 5],
                  stroke: item.lineColor || "black",
                  opacity: 0.8,
                  strokeWidth: 1,
                },
              }}
            />
          );
        })}

        <RectAnnotation
          dataValues={[
            {
              coordinates: shadowCoordinates,
              details: "Alerting duration",
            },
          ]}
          id="rect1"
          style={{ fill: "lightgray" }}
        />
        <Axis
          id="bottom"
          position={Position.Bottom}
          showOverlappingTicks
          labelFormat={timeRange.timeFormatter}
          tickFormat={timeRange.timeFormatter}
        />
        {metricData?.axis?.map((item, i) => {
          return (
            <Axis
              key={item.id}
              id={item.id}
              position={item.position}
              labelFormat={getFormatter(item.formatType, item.labelFormat)}
              tickFormat={getFormatter(item.formatType, item.tickFormat)}
            />
          );
        })}
        {metricData?.lines?.map((item, i) => {
          return (
            <LineSeries
              key={item.metric.label || `line${i}`}
              id={item.metric.label || `line${i}`}
              xScaleType={ScaleType.Time}
              yScaleType={ScaleType.Linear}
              xAccessor={0}
              yAccessors={[1]}
              data={item.data || []}
              tickFormat={getFormatter(
                item.metric.formatType,
                item.metric.tickFormat,
                item.metric.units
              )}
            />
          );
        })}
      </Chart>
      {latestRequest ? (
        <div style={{ position: "absolute", right: 8, bottom: 8, zIndex: 1 }}>
          <CopyToClipboard
            text={latestRequest}
            onCopy={() =>
              message.success(formatMessage({ id: "cluster.metrics.request.copy.success" }))
            }
          >
            <Tooltip title={formatMessage({ id: "cluster.metrics.request.copy" })}>
              <Icon type="copy" style={{ color: "rgb(0, 127, 255)" }} />
            </Tooltip>
          </CopyToClipboard>
        </div>
      ) : null}
    </div>
  );
};

export default RuleMetricChart;
