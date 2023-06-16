package util

import (
	"time"

	migration_model "infini.sh/console/plugin/task_manager/model"
	"infini.sh/framework/core/util"
)

/*
is_repeat: task will repeat for more than 1 time
run_times: the total number of runs of a repeating task
repeat_done: task has reached the last repeat
next_run_time: the time this task will get picked by scheduler to start
repeat_triggered: the task has been picked by scheduler and started
*/
func UpdateRepeatState(repeat *migration_model.Repeat, labels util.MapStr) error {
	if labels == nil {
		return nil
	}
	if repeat == nil {
		labels["repeat_done"] = true
		return nil
	}

	if repeat.Interval >= time.Minute {
		labels["is_repeat"] = true
	} else {
		labels["repeat_done"] = true
	}

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
	if repeat == nil {
		return false
	}
	if repeat.Interval < time.Minute {
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
