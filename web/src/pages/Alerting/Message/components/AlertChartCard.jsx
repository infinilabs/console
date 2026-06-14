import Sum from "@/components/Icons/Sum";
import request from "@/utils/request";
import { Card, Icon, Empty, Tooltip, message } from "antd";
import {
  Axis,
  Chart,
  LineSeries,
  Position,
  ScaleType,
  Settings,
  RectAnnotation,
  LineAnnotation,
} from "@elastic/charts";
import { formatter, getFormatter } from "@/utils/format";
import { PriorityColor } from "../../utils/constants";
import { calculateBounds } from "@/components/vendor/data/common/query/timefilter";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import { formatMessage } from "umi/locale";
import metricsStyles from "@/pages/Cluster/Metrics.scss";
import { CopyToClipboard } from "react-copy-to-clipboard";

const resolveAlertTime = (value) => {
  if (!value) return "";
  const parsed = moment(value);
  return parsed.isValid() && parsed.year() > 1 ? value : "";
};

const safeParseJSON = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch (e) {
    return null;
  }
};

const buildCopyRequest = (msgItem, ruleID, min, max) => {
  const queryDSL = safeParseJSON(msgItem?.condition_result?.query_result?.query);
  const objects =
    msgItem?.resource?.objects ||
    msgItem?.resource_objects ||
    msgItem?.objects ||
    [];
  const index = Array.isArray(objects) && objects.length > 0 ? objects.join(",") : "";
  if (queryDSL) {
    if (index) {
      return `GET ${index}/_search\n${JSON.stringify(queryDSL, null, 2)}`;
    }
    return JSON.stringify(queryDSL, null, 2);
  }

  const resourceID = msgItem?.resource_id || msgItem?.resource?.resource_id || "";
  const state = msgItem?.state || "alerting";
  const filters = [
    { term: { rule_id: { value: ruleID } } },
    { term: { resource_id: { value: resourceID } } },
    { term: { state: { value: state } } },
  ].filter((item) => {
    const field = Object.keys(item.term || {})[0];
    return field ? item.term[field].value !== "" : false;
  });

  return `GET .infini_alert-history/_search
${JSON.stringify(
    {
      aggs: {
        filter_agg: {
          aggs: {
            time_buckets: {
              aggs: {
                priority_buckets: {
                  aggs: {
                    a: {
                      value_count: {
                        field: "id",
                      },
                    },
                  },
                  terms: {
                    field: "priority",
                    order: [{ _count: "desc" }],
                    size: 10,
                  },
                },
              },
              auto_date_histogram: {
                field: "created",
                buckets: 120,
              },
            },
          },
          filter: {
            bool: {
              filter: filters,
              must: [
                {
                  range: {
                    created: {
                      gte: Number(min),
                      lte: Number(max),
                    },
                  },
                },
              ],
              must_not: [],
              should: [],
            },
          },
        },
      },
      size: 0,
    },
    null,
    2
  )}`;
};

export default ({ msgItem, range, onRangeChange }) => {
  const { rule_id, expression } = msgItem;
  const created = resolveAlertTime(msgItem?.trigger_at) || msgItem?.created;
  const updated = resolveAlertTime(msgItem?.resolve_at) || msgItem?.updated;

  const [rule, setRule] = useState();
  const [loading, setLoading] = useState(false);
  const [metricData, setMetricData] = useState({});
  const [latestRequest, setLatestRequest] = useState("");

  const fetchRule = async (id) => {
    if (!id) { setRule(); return; }
    const res = await request(`/alerting/rule/${id}`);
    setRule(res?._source || undefined);
  };

  const fetchHistoryMetric = async (id, min, max) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await request(`/alerting/rule/${id}/history_metric`, {
        method: "GET",
        queryParams: { min, max },
      });
      setLatestRequest(buildCopyRequest(msgItem, id, min, max));
      if (res && !res.error) {
        setMetricData(res.metric || {});
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRule(rule_id);
  }, [rule_id]);

  useEffect(() => {
    if (!rule_id) return;
    // expand time range slightly beyond the alert window so context is visible
    const from = created ? moment(created).subtract(5, "minutes") : moment().subtract(1, "hour");
    const to = updated ? moment(updated).add(5, "minutes") : moment();
    fetchHistoryMetric(rule_id, from.valueOf(), to.valueOf());
  }, [rule_id, created, updated]);

  const lineAnnotations = useMemo(() => {
    if (!rule?.conditions?.items) return [];
    return rule.conditions.items.map((item) => {
      const sortValues = [...(item.values || [])].sort((a, b) => a - b);
      return {
        dataValues: sortValues.map((dv, dk) => ({
          dataValue: parseInt(dv),
          details: (
            <span>
              Priority: {item.priority}
              {sortValues.length > 1 ? `-${dk}` : ""}
              {item.expression ? <><br />Expression: {item.expression}</> : null}
            </span>
          ),
        })),
        lineColor: PriorityColor[item.priority],
      };
    });
  }, [rule]);

  const highlightCoords = useMemo(() => {
    if (!created) return { x0: 0, x1: 0, y0: 0, y1: 0 };
    const x0 = moment(created).valueOf();
    const x1 = updated ? moment(updated).valueOf() : moment().valueOf();
    return { x0, x1, y0: 0, y1: Number.MAX_SAFE_INTEGER };
  }, [created, updated]);

  return (
    <Card
      size="small"
      title={
        <>
          {formatMessage({ id: "alert.message.detail.alert_metric_status" })}
          <Tooltip title={expression}>
            <Icon component={Sum} style={{ color: "rgb(0, 127, 255)", backgroundColor: "#efefef", marginLeft: 5 }} />
          </Tooltip>
        </>
      }
      bodyStyle={{ height: 250, padding: 1 }}
      loading={loading}
    >
      {metricData?.lines?.length > 0 ? (
        <div style={{ position: "relative" }}>
          <Chart size={[, 240]} className={metricsStyles.vizChartItem}>
            <Settings
              showLegend
              legendPosition={Position.Bottom}
              tooltip={{
                headerFormatter: ({ value }) => formatter.full_dates(value),
              }}
              theme={{
                lineSeriesStyle: {
                  line: { visible: false, strokeWidth: 0 },
                  point: { visible: true, radius: 2, strokeWidth: 0 },
                },
              }}
            />
            <RectAnnotation
              id="alert_window"
              dataValues={[{ coordinates: highlightCoords, details: "Alert window" }]}
              style={{ fill: "lightgray", opacity: 0.4 }}
            />
            {lineAnnotations.map((item, i) => (
              <LineAnnotation
                key={i}
                id={`threshold_${i}`}
                domainType="YDomain"
                dataValues={item.dataValues}
                marker={<Icon type="warning" />}
                style={{
                  line: { dash: [5, 5], stroke: item.lineColor || "black", opacity: 0.8, strokeWidth: 1 },
                }}
              />
            ))}
            <Axis
              id="bottom"
              position={Position.Bottom}
              showOverlappingTicks
              labelFormat={formatter.dates(1)}
              tickFormat={formatter.dates(1)}
            />
            {metricData.axis?.map((item) => (
              <Axis
                key={item.id}
                id={item.id}
                position={item.position}
                labelFormat={getFormatter(item.formatType, item.labelFormat)}
                tickFormat={getFormatter(item.formatType, item.tickFormat)}
              />
            ))}
            {metricData.lines?.map((item, i) => (
              <LineSeries
                key={item.metric?.label || `line${i}`}
                id={item.metric?.label || `line${i}`}
                xScaleType={ScaleType.Time}
                yScaleType={ScaleType.Linear}
                xAccessor={0}
                yAccessors={[1]}
                data={item.data || []}
                tickFormat={getFormatter(item.metric?.formatType, item.metric?.tickFormat, item.metric?.units)}
              />
            ))}
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
      ) : (
        <Empty description={formatMessage({ id: "alert.message.detail.no_history_data" })} />
      )}
    </Card>
  );
};
