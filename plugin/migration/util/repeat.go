package util

import (
	"time"

	migration_model "infini.sh/console/plugin/migration/model"
	"infini.sh/framework/core/util"
)

func UpdateRepeatState(repeat *migration_model.Repeat, labels util.MapStr) error {
	if labels == nil {
		return nil
	}

	if !isValidRepeat(repeat) {
		labels["repeat_done"] = true
		return nil
	}
	labels["is_repeat"] = true

	runTimes := GetMapIntValue(labels, "run_times")
	runTimes += 1
	labels["run_times"] = runTimes

	if repeat.TotalRun >= 1 && runTimes >= repeat.TotalRun {
		labels["repeat_done"] = true
	}
	if _, ok := labels["next_run_time"]; !ok {
		if repeat.NextRunTime != nil {
			labels["next_run_time"] = repeat.NextRunTime.UnixMilli()
		}
	} else {
		nextRunTime := GetMapIntValue(labels, "next_run_time")
		labels["next_run_time"] = nextRunTime + repeat.Interval.Milliseconds()
	}
	labels["repeat_triggered"] = false
	return nil
}

func CopyRepeatState(oldLabels, newLabels util.MapStr) {
	newLabels["run_times"] = oldLabels["run_times"]
	newLabels["next_run_time"] = oldLabels["next_run_time"]
}

func IsRepeating(repeat *migration_model.Repeat, labels map[string]interface{}) bool {
	if !isValidRepeat(repeat) {
		return false
	}
	if repeat.TotalRun < 1 {
		return true
	}
	if repeat.TotalRun == 1 {
		return false
	}
	nextRunTime := GetMapIntValue(labels, "next_run_time")
	// not started yet
	if nextRunTime == 0 {
		return false
	}
	endTime := time.UnixMilli(nextRunTime).Add(time.Duration(repeat.TotalRun-1) * repeat.Interval)
	if time.Now().Before(endTime) {
		return true
	}
	return false
}

func isValidRepeat(repeat *migration_model.Repeat) bool {
	if repeat == nil {
		return false
	}
	if repeat.Interval < time.Minute {
		return false
	}
	return true
}
