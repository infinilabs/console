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
    const indexNames = value.map(item=>item.index);
    setParam((param) => {
      delete param["top"];
      return {
        ...param,
        index_name: indexNames,
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
    if (param.index_name) {
      newParams.index_name = param.index_name;
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

  const [charts, setCharts] = useState([])

  useEffect(() => {
    setCharts(() => {
      const cs = {}
      metrics.forEach((item) => {
        if (item[1]?.length > 0) {
          item[1].forEach((metricKey) => {
            cs[metricKey] = createRef()
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
                            instance={charts[metricKey]} 
                            pointerUpdate={pointerUpdate}
                            timezone={timezone} 
                            timeRange={timeRange} 
                            handleTimeChange={handleTimeChange} 
                            fetchUrl={`${ESPrefix}/${clusterID}/index_metrics`}
                            metricKey={metricKey}
                            title={formatMessage({id: "cluster.metrics.index.axis." + metricKey + ".title"})} 
                            queryParams={queryParams}
                            className={"metric-item"}
                            timeout={timeout}
                            refresh={refresh}
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