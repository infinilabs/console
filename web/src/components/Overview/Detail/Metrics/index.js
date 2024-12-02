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

const { TabPane } = Tabs;

export default (props) => {
  const {
    metricAction,
    renderExtraMetric,
    params = {},
    linkMore,
    overviews,
    extra,
  } = props;

  const [spinning, setSpinning] = useState(false);
  const [state, setState] = useState({
    timeRange: {
      min: "now-15m",
      max: "now",
      timeFormatter: formatter.dates(1),
    },
  });

  const [refresh, setRefresh] = useState({ isRefreshPaused: false });
  const [timeZone, setTimeZone] = useState(() => getTimezone());

  const handleTimeChange = ({ start, end }) => {
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
            timeZone={timeZone}
            onTimeZoneChange={setTimeZone}
            recentlyUsedRangesKey={'overview-detail'}
          />
        </div>
        <Button onClick={() => {
          handleTimeChange({ start: state.timeRange.min, end: state.timeRange.max})
        }} loading={spinning} icon={"reload"} type="primary" />
      </div>

      <div className={styles.metricWrapper}>
        <MetricSeries
          action={metricAction}
          timeRange={state.timeRange}
          overview={1}
          setSpinning={setSpinning}
          renderExtraMetric={renderExtraMetric}
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
