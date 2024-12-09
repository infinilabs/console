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
import { createRef, useCallback, useEffect, useMemo, useState } from "react";

export default (props) => {

  const { 
    clusterID,
    timezone,
    timeRange,
    handleTimeChange,
    param,
    setParam,
    bucketSize,
    timeout,
    refresh,
    metrics = []
  } = props

  if (!clusterID || metrics.length == 0) {
    return null;
  }

  const showTop = param.show_top ?? true;

  const topChange = useCallback(
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

  const nodeValueChange = useCallback(
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

  const queryParams = useMemo(() => {
    const newParams = formatTimeRange(timeRange);
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
                            fetchUrl={`${ESPrefix}/${clusterID}/node_metrics`}
                            metricKey={metricKey}
                            title={formatMessage({id:"cluster.metrics.node.axis." + metricKey + ".title"})} 
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