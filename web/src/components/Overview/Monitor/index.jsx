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
import styles from "./index.less"

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

  const [state, setState] = useState(
    formatState({
      timeRange: {
        min: param?.timeRange?.min || "now-15m",
        max: param?.timeRange?.max || "now",
        timeFormatter: formatter.dates(1),
      },
      timeInterval: formatTimeInterval(param?.timeInterval) || allTimeSettingsCache.timeInterval,
      timeout: formatTimeout(param?.timeout)  || allTimeSettingsCache.timeout || '10s',
      param: param,
      refresh: true,
    })
  );

  const [refresh, setRefresh] = useState({ isRefreshPaused: typeof allTimeSettingsCache.isRefreshPaused !== 'undefined' ? allTimeSettingsCache.isRefreshPaused : true, refreshInterval: allTimeSettingsCache.refreshInterval || 30000 });
  const [timeZone, setTimeZone] = useState(() => allTimeSettingsCache.timeZone || getTimezone());

  useEffect(() => {
    setParam({ ...param, timeRange: state.timeRange, timeInterval: state.timeInterval, timeout: state.timeout });
  }, [state.timeRange, state.timeInterval, state.timeout]);

  const handleTimeChange = useCallback(({ start, end, timeInterval, timeout, refresh }) => {
    const bounds = calculateBounds({
      from: start,
      to: end,
    });
    const day = moment
      .duration(bounds.max.valueOf() - bounds.min.valueOf())
      .asDays();
    const intDay = parseInt(day) + 1;
    setState({
      ...state,
      timeRange: {
        min: start,
        max: end,
        timeFormatter: formatter.dates(intDay),
      },
      timeInterval: timeInterval || state.timeInterval,
      timeout: timeout || state.timeout,
      refresh
    });
  }, [state]) 

  const onInfoChange = (info) => {
    setState({
      ...state,
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

  const isAgent = useMemo(() => {
    const { monitor_configs = {} } = selectedCluster || {}
    return monitor_configs?.node_stats?.enabled === false && monitor_configs?.index_stats?.enabled === false
  }, [JSON.stringify(selectedCluster?.monitor_configs)])

  return (
    <div>
      <BreadcrumbList data={breadcrumbList} />

      <Card bodyStyle={{ padding: 16 }}>
        {
          selectedCluster?.id ? (
            <>
              <div style={{ marginBottom: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
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
                    onRefresh={handleTimeChange}
                    showTimeSetting={true}
                    showTimeInterval={true}
                    timeInterval={state.timeInterval}
                    showTimeout={true}
                    timeout={state.timeout}
                    onTimeSettingChange={(timeSetting) => {
                      onTimeSettingsChange({
                        timeInterval: timeSetting.timeInterval,
                        timeout: timeSetting.timeout
                      })
                      setState({
                        ...state,
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
                  <CollectStatus fetchUrl={`${ESPrefix}/${selectedCluster?.id}/_collection_stats`}/>
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
                    <TabPane tab={pane.title} key={pane.key}>
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
