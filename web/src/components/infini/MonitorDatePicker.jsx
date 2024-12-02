import { formatMessage } from "umi/locale";
import React, { useState } from "react";
import { EuiSuperDatePicker } from "@elastic/eui";
import "./MonitorDatePicker.scss";

export const MonitorDatePicker = ({
  timeRange,
  onChange,
  isLoading,
  paused = false,
  extraProps = {},
}) => {
  const commonlyUsedRanges = [
    {
      from: "now-15m",
      to: "now",
      display: formatMessage({
        id: "cluster.monitor.timepicker.last15minutes",
      }),
    },
    {
      from: "now-30m",
      to: "now",
      display: formatMessage({
        id: "cluster.monitor.timepicker.last30minutes",
      }),
    },
    {
      from: "now-1h",
      to: "now",
      display: formatMessage({
        id: "cluster.monitor.timepicker.lasthour",
      }),
    },
    {
      from: "now-24h",
      to: "now",
      display: formatMessage({
        id: "cluster.monitor.timepicker.lastday",
      }),
    },
    {
      from: "now/d",
      to: "now/d",
      display: formatMessage({
        id: "cluster.monitor.timepicker.today",
      }),
    },
    {
      from: "now/w",
      to: "now/w",
      display: formatMessage({
        id: "cluster.monitor.timepicker.thisweek",
      }),
    },
    {
      from: "now-7d",
      to: "now",
      display: formatMessage({
        id: "cluster.monitor.timepicker.lastweek",
      }),
    },
    {
      from: "now-30d",
      to: "now",
      display: formatMessage({
        id: "cluster.monitor.timepicker.lastmonth",
      }),
    },
    {
      from: "now-90d",
      to: "now",
      display: formatMessage({
        id: "cluster.monitor.timepicker.last3month",
      }),
    },
    {
      from: "now-1y",
      to: "now",
      display: formatMessage({
        id: "cluster.monitor.timepicker.lastyear",
      }),
    },
  ].map(({ from, to, display }) => {
    return {
      start: from,
      end: to,
      label: display,
    };
  });
  // const [recentlyUsedRanges, setRecentlyUsedRanges] = useState([]);
  const [isPaused, setIsPaused] = useState(paused);
  const [refreshInterval, setRefreshInterval] = useState(10000);

  const onTimeChange = ({ start, end }) => {
    onChange({
      start,
      end,
    });
  };

  const onRefresh = ({ start, end, refreshInterval }) => {
    onChange({ start, end });
  };

  const onRefreshChange = ({ isPaused, refreshInterval }) => {
    setIsPaused(isPaused);
    setRefreshInterval(refreshInterval);
  };

  return (
    <EuiSuperDatePicker
      dateFormat=""
      isLoading={isLoading}
      start={timeRange?.min}
      end={timeRange?.max}
      onTimeChange={onTimeChange}
      onRefresh={onRefresh}
      isPaused={isPaused}
      refreshInterval={refreshInterval}
      onRefreshChange={onRefreshChange}
      commonlyUsedRanges={commonlyUsedRanges}
      {...extraProps}
      //   recentlyUsedRanges={recentlyUsedRanges}
    />
  );
};
