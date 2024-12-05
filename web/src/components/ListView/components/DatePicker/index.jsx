import { useState, useMemo } from "react";
import moment from "moment";
import { message } from "antd";
import request from "@/utils/request";
import DatePicker from "@/common/src/DatePicker";

export default (props) => {
  const {
    locale = "en-US",
    timeZone = "Asia/Shanghai",
    timeFields = [],
    timeRange = {},
    onTimeRangeChange,
    autoFitConfig = {},
    isRefreshPaused = true,
    onRefresh,
    recentlyUsedRangesKey = "listview-recently-used-ranges",
  } = props;

  if (timeFields.length == 0) {
    return null;
  }

  const [range] = useMemo(() => {
    let range = {
      start: timeRange.from || "now-15m",
      end: timeRange.to || "now",
      timeField: timeRange.timeField || "",
    };
    return [range];
  }, [timeRange]);

  const onRangeChange = ({ start, end }) => {
    onTimeRangeChange({ ...range, start, end });
  };

  const onTimeFieldChange = (value) => {
    onTimeRangeChange({ ...range, timeField: value });
  };

  const [refresh, setRefresh] = useState({
    isRefreshPaused: isRefreshPaused,
    refreshInterval: 10000,
  });

  const [autoFitLoading, setAutoFitLoading] = useState(false);

  const [timeSetting, setTimeSetting] = useState({
    showTimeSetting: true,
    showTimeField: true,
    timeFields: timeFields,
    showTimeInterval: true,
    timeInterval: "15s",
    showTimeout: true,
    timeout: "120s",
  });

  const [currentTimeZone, setCurrentTimeZone] = useState(timeZone);

  // const onAutoFit = async () => {
  //   setAutoFitLoading(true);
  //   const { url, index: index_pattern } = autoFitConfig;

  //   const res = await request(url, {
  //     method: "POST",
  //     body: {
  //       index_pattern,
  //       time_field: range.timeField,
  //       filter: {
  //         bool: {
  //           must: [],
  //           filter: [],
  //           should: [],
  //           must_not: [],
  //         },
  //       },
  //     },
  //   });
  //   if (res?.doc_count > 0) {
  //     let time = res.time_fields.timestamp;
  //     const start = moment(time.max)
  //       .subtract(15, "m")
  //       .toISOString();
  //     const end = moment(time.max).toISOString();
  //     onRangeChange({ start, end });
  //   } else {
  //     console.log(`onAutoFit res:`, res);
  //     message.warn("no data");
  //   }
  //   setAutoFitLoading(false);
  // };

  return (
    <div style={{ minWidth: 60, maxWidth: 400 }}>
      <DatePicker
        locale={locale}
        {...range}
        onRangeChange={onRangeChange}
        {...refresh}
        onRefreshChange={setRefresh}
        onRefresh={onRefresh}
        {...timeSetting}
        onTimeSettingChange={(newTimeSetting) => {
          setTimeSetting({ ...timeSetting, ...newTimeSetting });
          if (newTimeSetting.timeField != timeRange?.timeField) {
            onTimeFieldChange(newTimeSetting.timeField);
          }
        }}
        autoFitLoading={autoFitLoading}
        onAutoFit={null}
        timeZone={currentTimeZone}
        onTimeZoneChange={setCurrentTimeZone}
        recentlyUsedRangesKey={recentlyUsedRangesKey}
      />
    </div>
  );
};
