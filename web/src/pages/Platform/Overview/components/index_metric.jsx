import IndexSelect from "@/components/IndexSelect";
import useFetch from "@/lib/hooks/use_fetch";
import { ESPrefix } from "@/services/common";
import { Radio } from "antd";
import "./node_metric.scss";
import { formatMessage } from "umi/locale";
import MetricContainer from "./metric_container";
import { formatTimeRange } from "@/lib/elasticsearch/util";
import NodeSelect from "@/components/NodeSelect";
import Anchor from "@/components/Anchor";
import MetricChart from "./MetricChart";
import { createRef, useEffect, useMemo, useState } from "react";

const normalizeIndexSelection = (value, indices = []) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (!value) {
    return [];
  }
  if (typeof value === "string") {
    return indices.find((item) => item?.index === value) ? indices.filter((item) => item?.index === value) : [{ index: value }];
  }
  return [value];
};

const extractIndexNames = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item : item?.index))
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return [value];
  }
  if (value?.index) {
    return [value.index];
  }
  return [];
};

const INDEX_GROUP_FALLBACK_METRICS = {
  operations: "indexing_rate",
  latency: "indexing_latency",
  storage: "index_storage",
  document: "doc_count",
  memory: "segment_memory",
  cache: "query_cache",
};

const buildChartEntries = (groupKey, metricKeys = []) => {
  const normalizedMetricKeys = metricKeys.filter(Boolean);
  const entries = normalizedMetricKeys.map((metricKey, index) => ({
    metricKey,
    chartId: `${metricKey}__${index}`,
  }));
  if (normalizedMetricKeys.length % 2 === 1 && normalizedMetricKeys.length > 0) {
    const preferredMetric = INDEX_GROUP_FALLBACK_METRICS[groupKey];
    const metricKey = normalizedMetricKeys.includes(preferredMetric)
      ? preferredMetric
      : normalizedMetricKeys[0];
    entries.push({
      metricKey,
      chartId: `${metricKey}__extra`,
    });
  }
  return entries;
};

export default (props) => {

  const { 
    clusterID,
    timezone,
    timeRange,
    handleTimeChange,
    param,
    setParam,
    shardID,
    bucketSize,
    metrics = [],
    timeout,
    refresh,
    handleTimeIntervalChange
  } = props
  
  if (!clusterID || metrics.length == 0) {
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
    setParam((param) => {
      delete param["top"];
      return {
        ...param,
        index_name: value,
      };
    });
  };
  const queryParams = useMemo(() => {
    const newParams = formatTimeRange(timeRange);
    if(shardID){
      newParams.shard_id = shardID;
    }
    if (param.top) {
      newParams.top = param.top;
    }
    const indexNames = extractIndexNames(param.index_name);
    if (indexNames.length > 0) {
      newParams.index_name = indexNames;
    }
    if (bucketSize) {
      newParams.bucket_size = bucketSize
    }
    return newParams;
  }, [param, timeRange, bucketSize]);

  const { value: indices } = useFetch(
    `${ESPrefix}/${clusterID}/_cat/indices`,
    {},
    [clusterID]
  );
  const formatedIndices = useMemo(() => {
    return Object.values(indices || []);
  }, [indices]);
  const selectedIndices = useMemo(() => normalizeIndexSelection(param.index_name, formatedIndices), [param.index_name, formatedIndices]);

  const [charts, setCharts] = useState([])

  useEffect(() => {
    setCharts(() => {
      const cs = {}
      metrics.forEach((item) => {
        if (item[1]?.length > 0) {
          buildChartEntries(item[0], item[1]).forEach((entry) => {
            cs[entry.chartId] = createRef()
          })
        }
      })
      return cs
    })
  }, [JSON.stringify(metrics)])

  const pointerUpdate = (event) => {
    Object.keys(charts).forEach((key) => {
      if (charts[key].current) {
        charts[key].current.dispatchExternalPointerEvent(event);
      }
    });
  };

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
                  value={selectedIndices}
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
            {metrics.filter((item) => !!item && !!item[1]).map((item) => {
              const chartEntries = buildChartEntries(item[0], item[1] || []);
              return (
                <div key={item[0]} style={{ margin: "8px 0" }}>
                  <MetricContainer
                    title={formatMessage({ id: `cluster.metrics.group.${item[0]}` })}
                    collapsed={false}
                    id={item[0]}
                  >
                    <div className="metric-inner-cnt">
                      {
                        chartEntries.map((entry) => (
                          <MetricChart
                            key={entry.chartId}
                            instance={charts[entry.chartId]}
                            pointerUpdate={pointerUpdate}
                            timezone={timezone}
                            timeRange={timeRange}
                            handleTimeChange={handleTimeChange}
                            fetchUrl={`${ESPrefix}/${clusterID}/index_metrics`}
                            metricKey={entry.metricKey}
                            title={formatMessage({id: "cluster.metrics.index.axis." + entry.metricKey + ".title"})}
                            queryParams={queryParams}
                            className={"metric-item"}
                            timeout={timeout}
                            refresh={refresh}
                            handleTimeIntervalChange={handleTimeIntervalChange}
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