import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Card, Tabs, Breadcrumb, Button, BackTop, Empty, Spin } from "antd";
import { calculateBounds } from "@/components/vendor/data/common/query/timefilter";
import { formatter } from "@/utils/format";
import moment from "moment";
import BreadcrumbList from "@/components/infini/BreadcrumbList";
import { Route } from "umi";
import { JsonParam, QueryParamProvider, useQueryParam } from "use-query-params";
import { formatMessage } from "umi/locale";
import DatePicker from "@/common/src/DatePicker";
import { getLocale } from "umi/locale";
import { getTimezone } from "@/utils/utils";
import { getContext } from "@/pages/DataManagement/context";
import { ESPrefix } from "@/services/common";
import CollectStatus from "@/components/CollectStatus";
import RollupStats from "@/components/RollupStats";
import styles from "./index.less"
import { isSystemCluster } from "@/utils/setup";
import { getRollupEnabled } from "@/utils/authority";

const { TabPane } = Tabs;

const {
  timefilter,
  getTimeBuckets
} = getContext();

const formatTimeInterval = (timeInterval) => {
  if (!timeInterval) return timeInterval
  const value = parseInt(timeInterval)
  if (!value) return undefined
  if (!Number.isInteger(value)) return undefined
  const unit = timeInterval.replace(`${value}`, '');
  if (!['s', 'm', 'h', 'd', 'w', 'M', 'y'].includes(unit)) return undefined
  return timeInterval
}

const formatTimeout = (timeout) => {
  if (!timeout) return timeout
  const value = parseInt(timeout)
  if (!value) return undefined
  if (!Number.isInteger(value)) return undefined
  const unit = timeout.replace(`${value}`, '');
  if (!['s', 'm'].includes(unit)) return undefined
  return timeout
}

export const TIME_SETTINGS_KEY = "monitor-time-settings"

export const getAllTimeSettingsCache = () => {
  const allTimeSettings = localStorage.getItem(TIME_SETTINGS_KEY) || `{}`
  try {
    const object = JSON.parse(allTimeSettings);
    return object || {}
  } catch (error) {
    return {}
  }
}

const getDuration = (from, to) => {
  if (!from || !to) return;
  const bounds = calculateBounds({
    from,
    to,
  });
  return bounds.max.valueOf() - bounds.min.valueOf()
}

export const initState = (state = {}) => {
  const { timeRange, timeInterval, timeout } = state || {}
  const from = timeRange?.min || "now-15m"
  const to = timeRange?.max || "now"
  const duration = getDuration(from, to);
  const gtOneHour = moment.duration(duration).asHours() > 1
  const day = moment.duration(duration).asDays();
  const intDay = parseInt(day) + 1;
  return {
    ...state,
    timeRange: {
      min: from,
      max: to,
      timeFormatter: formatter.dates(intDay),
    },
    timeInterval: gtOneHour ? undefined : timeInterval,
    timeIntervalDisabled: gtOneHour,
    timeout: timeout || '10s',
  }
}

const Monitor = (props) => {
  const {
    selectedCluster,
    formatState,
    getBreadcrumbList,
    StatisticBar,
    extraParams = {},
    panes,
    checkPaneParams,
  } = props;

  const allTimeSettingsCache = getAllTimeSettingsCache()

  const [param, setParam] = useQueryParam("_g", JsonParam);

  const [spinning, setSpinning] = useState(false);

  const [state, setState] = useState(formatState(initState({
    timeRange: {
      min: param?.timeRange?.min || "now-15m",
      max: param?.timeRange?.max || "now",
    },
    timeInterval: formatTimeInterval(param?.timeInterval) || allTimeSettingsCache.timeInterval,
    timeout: formatTimeout(param?.timeout)  || allTimeSettingsCache.timeout || '10s',
    param: param,
    refresh: true,
  })));

  const [refresh, setRefresh] = useState({ isRefreshPaused: typeof allTimeSettingsCache.isRefreshPaused !== 'undefined' ? allTimeSettingsCache.isRefreshPaused : true, refreshInterval: allTimeSettingsCache.refreshInterval || 30000 });
  const [timeZone, setTimeZone] = useState(() => allTimeSettingsCache.timeZone || getTimezone());

  useEffect(() => {
    setParam({ ...param, timeRange: state.timeRange, timeInterval: state.timeInterval, timeout: state.timeout });
  }, [state.timeRange, state.timeInterval, state.timeout]);

  const handleTimeChange = ({ start, end, timeInterval, timeout, refresh }) => {
    setState(initState({
      ...state,
      param,
      timeRange: {
        min: start,
        max: end,
      },
      timeInterval: timeInterval || state.timeInterval,
      timeout: timeout || state.timeout,
      refresh
    }));
  }

  const onInfoChange = (info) => {
    setState({
      ...state,
      param,
      info,
    });
  };

  const onTimeSettingsChange = (timeSettings) => {
    let allTimeSettings = getAllTimeSettingsCache();
    allTimeSettings = {
      ...(allTimeSettings || {}),
      ...(timeSettings || {})
    }
    localStorage.setItem(TIME_SETTINGS_KEY, JSON.stringify(allTimeSettings))
  }

  const breadcrumbList = getBreadcrumbList(state);
  const collectionStatsFilter = useMemo(() => {
    if(breadcrumbList && breadcrumbList.length === 5){
      const pageCate = breadcrumbList[3].title;
      if(pageCate === "Nodes"){
        return {
          node_name: breadcrumbList[4].title
        };
      }else if (pageCate === "Indices"){
        const shardID = new URLSearchParams(window.location.search).get('shard_id');
        if(shardID){
          return {
            shard_id: shardID
          };
        }
        return {
          index_name: breadcrumbList[4].title
        };
      }
    }
    return null;
  }, [selectedCluster?.id, breadcrumbList]);

  const isAgent = useMemo(() => {
    const { metric_collection_mode, monitor_configs = {} } = selectedCluster || {}
    if (typeof metric_collection_mode === 'undefined') {
      return monitor_configs?.node_stats?.enabled === false && monitor_configs?.index_stats?.enabled === false
    }
    return metric_collection_mode === 'agent'
  }, [JSON.stringify(selectedCluster)])

  return (
    <div>
      <BreadcrumbList data={breadcrumbList} />

      <Card bodyStyle={{ padding: 16 }}>
        {
          selectedCluster?.id ? (
            <>
              <div style={{ marginBottom: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ maxWidth: 600 }}>
                    <DatePicker
                      locale={getLocale()}
                      start={state.timeRange.min}
                      end={state.timeRange.max}
                      onRangeChange={({ start, end }) => {
                        handleTimeChange({ start, end })
                      }}
                      {...refresh}
                      onRefreshChange={(newRefresh) => {
                        onTimeSettingsChange(newRefresh)
                        setRefresh(newRefresh)
                      }}
                      onRefresh={(value) => handleTimeChange({ ...(value || {}), refresh: new Date().valueOf()})}
                      showTimeSetting={true}
                      showTimeInterval={true}
                      timeInterval={state.timeInterval}
                      timeIntervalDisabled={state.timeIntervalDisabled}
                      showTimeout={true}
                      timeout={state.timeout}
                      onTimeSettingChange={(timeSetting) => {
                        onTimeSettingsChange({
                          timeInterval: timeSetting.timeInterval,
                          timeout: timeSetting.timeout
                        })
                        setState({
                          ...state,
                          param,
                          timeInterval: timeSetting.timeInterval,
                          timeout: timeSetting.timeout
                        });
                      }}
                      timeZone={timeZone}
                      onTimeZoneChange={(timeZone) => {
                        onTimeSettingsChange({
                          timeZone,
                        })
                        setTimeZone(timeZone)
                      }}
                      recentlyUsedRangesKey={'monitor'}
                    />
                  </div>
                  <div style={{display: "flex"}}>
                    {isSystemCluster(selectedCluster?.id) && getRollupEnabled() === "true" && <RollupStats
                      fetchUrl={`${ESPrefix}/${selectedCluster?.id}/_proxy?method=GET&path=/_rollup/jobs/*/_explain`}
                      style={{ marginRight: 100 }}/>}
                    <CollectStatus filter={collectionStatsFilter} fetchUrl={`${ESPrefix}/${selectedCluster?.id}/_collection_stats`}/>
                  </div>
                </div>
              </div>
              <div className={styles.tabs}>
                <Tabs
                  activeKey={param?.tab || panes[0]?.key}
                  onChange={(key) => {
                    setParam({ ...param, tab: key });
                  }}
                  tabBarGutter={10}
                  destroyInactiveTabPane
                  animated={false}
                >
                  {panes.map((pane) => (
                    <TabPane tab={formatMessage({id: `cluster.monitor.tabs.${pane.key}`})} key={pane.key}>
                      <Spin spinning={spinning && !!state.refresh}>
                        <StatisticBar
                          setSpinning={setSpinning}
                          onInfoChange={onInfoChange}
                          {...state}
                          {...extraParams}
                        />
                      </Spin>
                      <div style={{ marginTop: 15 }}>
                        {checkPaneParams({
                          ...state,
                          ...extraParams,
                        }) ? (
                          typeof pane.component == "string" ? (
                            pane.component
                          ) : (
                            <pane.component
                              selectedCluster={selectedCluster}
                              isAgent={isAgent}
                              {...state}
                              handleTimeChange={handleTimeChange}
                              handleTimeIntervalChange={(timeInterval) => {
                                onTimeSettingsChange({
                                  timeInterval,
                                })
                                setState({
                                  ...state,
                                  param,
                                  timeInterval,
                                });
                              }}
                              setSpinning={setSpinning}
                              {...extraParams}
                              bucketSize={state.timeInterval}
                            />
                          )
                        ) : null}
                      </div>
                    </TabPane>
                  ))}
                </Tabs>
              </div>
            </>
          ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        }
        
      </Card>

      <BackTop />
    </div>
  );
};

export default (props) => {
  return (
    <QueryParamProvider ReactRouterRoute={Route}>
      <Monitor {...props} />
    </QueryParamProvider>
  );
};
