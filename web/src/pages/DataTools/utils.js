import moment from "moment";
import { formatter } from "@/utils/format";
import { formatUtcTimeToLocal } from "@/utils/utils";

export const parseTaskConfig = (item = {}) => {
  if (item.config) {
    return item.config;
  }

  if (item.config_string) {
    try {
      return JSON.parse(item.config_string);
    } catch (e) {
      console.error("failed to parse task config", e);
    }
  }

  return {};
};

export const getTaskTotal = (total) => {
  if (typeof total === "number") {
    return total;
  }

  return total?.value || 0;
};

export const formatCount = (value) => {
  return Number.isFinite(value) ? formatter.number(value) : "N/A";
};

export const formatTime = (value) => {
  if (!value) {
    return "-";
  }

  return moment(value).format("YYYY-MM-DD HH:mm:ss");
};

export const formatTaskLastRunTime = (record = {}) => {
  const lastRunTime = record.repeat?.is_repeat && record.repeat?.last_run_time > 0
    ? record.repeat.last_run_time
    : record.start_time_in_millis;

  if (!lastRunTime) {
    return "-";
  }

  return formatUtcTimeToLocal(lastRunTime);
};

export const getTaskRunningState = (record = {}) => {
  let runningState = record.running_children > 0 ? 1 : 0;

  if (
    record.running_children === 0 &&
    ["init", "ready", "pending_stop"].includes(record.status)
  ) {
    runningState = 0;
  }

  return runningState;
};

export const getTaskLifecycle = (record = {}) => {
  if (record.status === "complete") {
    return "complete";
  }

  if (record.status === "error") {
    return "failed";
  }

  if (record.status === "pending_stop") {
    return "stopping";
  }

  if (record.status === "running" || getTaskRunningState(record) === 1) {
    return "running";
  }

  if (record.repeat?.is_repeat && !record.repeat?.repeating) {
    return "paused";
  }

  if (["init", "ready"].includes(record.status)) {
    return "not_started";
  }

  if (record.status === "stopped") {
    return "stopped";
  }

  return "pending";
};
