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

export const TIMEOUT_CACHE_KEY = "monitor-timeout"

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

  const [param, setParam] = useQueryParam("_g", JsonParam);

  const [spinning, setSpinning] = useState(false);

  const [state, setState] = useState(
    formatState({
      timeRange: {
        min: param?.timeRange?.min || "now-15m",
        max: param?.timeRange?.max || "now",
        timeFormatter: formatter.dates(1),
      },
      timeInterval: formatTimeInterval(param?.timeInterval),
      timeout: formatTimeout(param?.timeout) || localStorage.getItem(TIMEOUT_CACHE_KEY) || '120s',
      param: param,
      refresh: true
    })
  );

  const [refresh, setRefresh] = useState({ isRefreshPaused: false, refreshInterval: 30000 });
  const [timeZone, setTimeZone] = useState(() => getTimezone());

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

  const breadcrumbList = getBreadcrumbList(state);

  const isAgent = useMemo(() => {
    const { monitor_configs = {} } = selectedCluster || {}
    return monitor_configs?.node_stats?.enabled === false && monitor_configs?.index_stats?.enabled === false
  }, [JSON.stringify(selectedCluster?.monitor_configs)])

  console.log("spinning")
  console.log(spinning)
  console.log("state.refresh")
  console.log(state.refresh)


  return (
    <div>
      <BreadcrumbList data={breadcrumbList} />

      <Card bodyStyle={{ padding: 15 }}>
        {
          selectedCluster ? (
            <>
              <div style={{ marginBottom: 5 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flexGrow: 0 }}>
                    <DatePicker
                      locale={getLocale()}
                      start={state.timeRange.min}
                      end={state.timeRange.max}
                      onRangeChange={({ start, end }) => {
                        handleTimeChange({ start, end })
                      }}
                      {...refresh}
                      onRefreshChange={setRefresh}
                      onRefresh={handleTimeChange}
                      showTimeSetting={true}
                      showTimeInterval={true}
                      timeInterval={state.timeInterval}
                      showTimeout={true}
                      timeout={state.timeout}
                      onTimeSettingChange={(timeSetting) => {
                        localStorage.setItem(TIMEOUT_CACHE_KEY, timeSetting.timeout)
                        setState({
                          ...state,
                          timeInterval: timeSetting.timeInterval,
                          timeout: timeSetting.timeout
                        });
                      }}
                      timeZone={timeZone}
                      onTimeZoneChange={setTimeZone}
                      recentlyUsedRangesKey={'monitor'}
                    />
                  </div>
                </div>
              </div>

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
