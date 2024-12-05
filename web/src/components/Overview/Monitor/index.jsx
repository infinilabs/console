import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Card, Tabs, Breadcrumb, Button, BackTop } from "antd";
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
      param: param,
    })
  );

  const [refresh, setRefresh] = useState({ isRefreshPaused: false, refreshInterval: 30000 });
  const [timeZone, setTimeZone] = useState(() => getTimezone());

  useEffect(() => {
    setParam({ ...param, timeRange: state.timeRange, timeInterval: state.timeInterval });
  }, [state.timeRange, state.timeInterval]);

  const handleTimeChange = useCallback(({ start, end, timeInterval }) => {
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
      timeInterval: timeInterval || state.timeInterval
    });
    setSpinning(true);
  }, [state]) 

  const onInfoChange = (info) => {
    setState({
      ...state,
      info,
    });
  };

  const breadcrumbList = getBreadcrumbList(state);

  return (
    <div>
      <BreadcrumbList data={breadcrumbList} />

      <Card bodyStyle={{ padding: 15 }}>
        <div style={{ marginBottom: 5 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flexGrow: 0, minWidth: 400 }}>
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
                onTimeSettingChange={(timeSetting) => {
                  setState({
                    ...state,
                    timeInterval: timeSetting.timeInterval
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
              <StatisticBar
                setSpinning={setSpinning}
                onInfoChange={onInfoChange}
                {...state}
                {...extraParams}
              />
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
