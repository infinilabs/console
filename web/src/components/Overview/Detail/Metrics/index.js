import React, { useState, useMemo } from "react";
import { Tabs, Button } from "antd";
import { ESPrefix } from "@/services/common";
import useFetch from "@/lib/hooks/use_fetch";
import { formatter } from "@/utils/format";
import { parseUrl, isJSONString } from "@/utils/utils";
import { calculateBounds } from "@/components/vendor/data/common/query/timefilter";
import moment from "moment";
import { Link } from "react-router-dom";
import styles from "./index.scss";
import MetricSeries from "./MetricSeries";
import MetricNodes from "./MetricNodes";
import MetricIndices from "./MetricIndices";
import { formatMessage } from "umi/locale";
import DatePicker from "@/common/src/DatePicker";
import { getLocale } from "umi/locale";
import { getTimezone } from "@/utils/utils";
import { TIMEOUT_CACHE_KEY } from "../../Monitor";

const { TabPane } = Tabs;

export default (props) => {
  const {
    metricAction,
    renderExtraMetric,
    params = {},
    linkMore,
    overviews,
    extra,
    metrics = [],
  } = props;

  const [spinning, setSpinning] = useState(false);
  const [state, setState] = useState({
    timeRange: {
      min: "now-15m",
      max: "now",
      timeFormatter: formatter.dates(1),
    },
    timeInterval: '',
    timeout: localStorage.getItem(TIMEOUT_CACHE_KEY) || '120s',
  });

  const [refresh, setRefresh] = useState({ isRefreshPaused: false });
  const [timeZone, setTimeZone] = useState(() => getTimezone());

  const handleTimeChange = ({ start, end, timeInterval, timeout }) => {
    const bounds = calculateBounds({
      from: start,
      to: end,
    });
    const day = moment
      .duration(bounds.max.valueOf() - bounds.min.valueOf())
      .asDays();
    const intDay = parseInt(day) + 1;
    setState({
      timeRange: {
        min: start,
        max: end,
        timeFormatter: formatter.dates(intDay),
      },
      timeInterval: timeInterval || state.timeInterval,
      timeout: timeout || state.timeout
    });
    setSpinning(true);
  };

  const [linkMoreNew] = useMemo(() => {
    let urlObj = parseUrl(linkMore);
    let query = urlObj.query;
    if (!query.hasOwnProperty("_g")) {
      query._g = "{}";
    }
    if (isJSONString(query?._g)) {
      let _gObj = JSON.parse(query._g);
      _gObj = { ..._gObj, timeRange: state.timeRange };
      query = { ...query, _g: JSON.stringify(_gObj) };
    }
    let linkMoreNew = urlObj.pathname + "?";
    for (let key in query) {
      linkMoreNew += `${key}=${query[key]}&`;
    }
    linkMoreNew = _.trim(linkMoreNew, "&");
    return [linkMoreNew];
  }, [linkMore, state.timeRange.min, state.timeRange.max]);

  return (
    <div className={styles.metrics}>
      <div className={styles.monitorDatePickerWrapper}>
        <div style={{ flexGrow: 1, minWidth: 400 }}>
          <DatePicker
            locale={getLocale()}
            start={state.timeRange.min}
            end={state.timeRange.max}
            onRangeChange={handleTimeChange}
            {...refresh}
            onRefreshChange={setRefresh}
            onRefresh={handleTimeChange}
            showTimeSetting={true}
            showTimeInterval={true}
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
            recentlyUsedRangesKey={'overview-detail'}
          />
        </div>
      </div>

      <div className={styles.metricWrapper}>
        <MetricSeries
          action={metricAction}
          timeZone={timeZone}
          overview={1}
          setSpinning={setSpinning}
          renderExtraMetric={renderExtraMetric}
          metrics={metrics}
          {...state}
          bucketSize={state.timeInterval}
        />
      </div>

      {overviews && (
        <div className={styles.metricWrapper}>
          <Tabs size={"small"}>
            {overviews.map((item) => (
              <TabPane tab={item.title} key={item.key}>
                <item.component
                  timeRange={state.timeRange}
                  action={item.action}
                  {...params}
                />
              </TabPane>
            ))}
          </Tabs>
        </div>
      )}
      {extra}
      {linkMoreNew && (
        <div className={styles.detailMore}>
          <Link to={linkMoreNew}>
            <Button type="primary">
              {formatMessage({ id: "overview.card.detail.click_for_more" })}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};
