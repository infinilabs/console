import { Table, Button, Divider, Tag, Icon } from "antd";
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

const RuleRecordChart = ({ data: messageDetail }) => {
  if (!messageDetail?.message_id) {
    return null;
  }
  const ruleID = messageDetail.rule_id;
  const clusterID = messageDetail.resource_id;

  //RectAnnotation coordinates
  const [shadowCoordinates, setShadowCoordinates] = React.useState({
    x0: 0,
    x1: 0,
    y0: 0,
    y1: 0,
  });

  const [timeRange, setTimeRange] = React.useState({
    min: "now-1d",
    max: "now",
    timeFormatter: formatter.dates(1),
  });

  const [metricData, setMetricData] = useState({});

  const [lineAnnotations] = useMemo(() => {
    let startTimestamp = moment(messageDetail.created).valueOf();
    let endTimestamp = moment().valueOf();

    let from = startTimestamp - parseInt(messageDetail.duration / 4);
    let to = endTimestamp;
    if (messageDetail?.status == "recovered") {
      endTimestamp = moment(messageDetail.updated).valueOf();
      to = endTimestamp + parseInt(messageDetail.duration / 4);
    }
    setTimeRange({
      ...timeRange,
      min: moment(from).format(),
      max: moment(to).format(),
    });

    let vDataMaxArr = [];
    let lines = metricData?.lines?.map((line) => {
      let vArr =
        line?.data?.map((item) => {
          return item[1];
        }) || [];
      vDataMaxArr.push(Math.max(...vArr));
    });
    setShadowCoordinates({
      x0: startTimestamp,
      x1: endTimestamp,
      y0: 0,
      y1: Math.max(...vDataMaxArr),
    });

    //LineAnnotation
    let lineAnnotations = messageDetail.conditions.items.map((item) => {
      let sortValues = item.values.sort((a, b) => a - b);
      let dataValues = sortValues.map((dv, dk) => {
        return {
          dataValue: parseInt(dv),
          details: (
            <span>
              Priority:{item.priority}
              {sortValues.length > 1 ? "-" + dk : ""}
              <br />
              Expression:{item.expression}
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
  }, [messageDetail, metricData]);

  const fetchAlertMetrics = () => {
    const bounds = calculateBounds({
      from: timeRange.min,
      to: timeRange.max,
    });

    const fetchData = async () => {
      let url = `/alerting/rule/${ruleID}/metric`;
      const res = await request(url, {
        method: "GET",
        queryParams: {
          min: bounds.min.valueOf(),
          max: bounds.max.valueOf(),
        },
      });
      if (res && !res.error) {
        setMetricData(res.metric);
        if(res.bucket_label && res.bucket_label.enabled === true){
          fetchBucketLabels(res.metric, res.bucket_label.template);
        }
      }
    };
    fetchData();
  };

  useEffect(() => {
    fetchAlertMetrics();
  }, [ruleID]);
  let disableHeaderFormat = false;
  let headerUnit = "";

  const [customLabels, setCustomLabels] = useState({});
  const fetchBucketLabels = async (metric, template) => {
    let url = `/elasticsearch/${clusterID}/map_label/_render`;
    const reqBody = {
      template: template,
      contexts:[],
    };
    (metric.bucket_groups || []).forEach((group, i)=>{
      reqBody.contexts.push({
        key: metric.lines[i].metric.label,
        value: {
          group_values: group,
        }
      })
    });
    const res = await request(url, {
      method: "POST",
      body: reqBody,
    });
    if (res && res.labels) {
      setCustomLabels(res.labels)
    }
  };

  return (
    <div className={metricsStyles.vizChartContainer}>
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
              details: (
                <span>
                  Alerting duration <br /> Start:
                  {formatter.full_dates(shadowCoordinates.x0)}
                  <br /> End:{formatter.full_dates(shadowCoordinates.x1)}
                </span>
              ),
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
              key={customLabels[item.metric.label] || `line${i}`}
              id={customLabels[item.metric.label] || item.metric.label || `line${i}`}
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
    </div>
  );
};

export default RuleRecordChart;