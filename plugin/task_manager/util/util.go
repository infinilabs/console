package util

import (
	log "github.com/cihub/seelog"

	"infini.sh/framework/core/event"
	"infini.sh/framework/core/task"
	"infini.sh/framework/core/util"
)

func WriteLog(taskItem *task.Task, taskResult *task.TaskResult, message string) {
	labels := util.MapStr{}
	labels.Update(util.MapStr(taskItem.Metadata.Labels))
	labels["task_type"] = taskItem.Metadata.Type
	labels["task_id"] = taskItem.ID
	labels["parent_task_id"] = taskItem.ParentId
	labels["retry_times"] = taskItem.RetryTimes
	event.SaveLog(&event.Event{
		Metadata: event.EventMetadata{
			Category: "task",
			Name:     "logging",
			Datatype: "event",
			Labels:   labels,
		},
		Fields: util.MapStr{
			"task": util.MapStr{
				"logging": util.MapStr{
					"config":  taskItem.ConfigString,
					"status":  taskItem.Status,
					"message": message,
					"result":  taskResult,
				},
			},
		},
	})
}

var runningTaskStatus = []string{task.StatusRunning, task.StatusReady}

func IsRunningState(status string) bool {
	return util.StringInArray(runningTaskStatus, status)
}

var pendingTaskStatus = []string{task.StatusRunning, task.StatusReady, task.StatusPendingStop}

func IsPendingState(status string) bool {
	return util.StringInArray(pendingTaskStatus, status)
}

func GetDirectParentId(parentIDs []string) string {
	if len(parentIDs) == 0 {
		return ""
	}
	return parentIDs[len(parentIDs)-1]
}

func GetTaskConfig(task *task.Task, config interface{}) error {
	if task.Config_ == nil {
		return util.FromJSONBytes([]byte(task.ConfigString), config)
	}
	buf, err := util.ToJSONBytes(task.Config_)
	if err != nil {
		return err
	}
	return util.FromJSONBytes(buf, config)
}

func GetMapIntValue(m util.MapStr, key string) int64 {
	v, err := m.GetValue(key)
	if err != nil {
		return 0
	}
	vv, err := util.ExtractInt(v)
	if err != nil {
		log.Errorf("got %s but failed to extract, err: %v", key, err)
		return 0
	}
	return vv
}

func GetMapBoolValue(m util.MapStr, key string) bool {
	v, err := m.GetValue(key)
	if err != nil {
		return false
	}
	vv, err := util.ExtractBool(v)
	if err != nil {
		log.Errorf("got %s but failed to extract, err: %v", key, err)
		return false
	}
	return vv
}

func GetMapStringValue(m util.MapStr, key string) string {
	v, err := m.GetValue(key)
	if err != nil {
		return ""
	}
	vv, err := util.ExtractString(v)
	if err != nil {
		log.Errorf("got %s but failed to extract, err: %v", key, err)
		return ""
	}
	return vv
}

func GetMapStringSliceValue(m util.MapStr, key string) []string {
	v, err := m.GetValue(key)
	if err != nil {
		return nil
	}
	if v == nil {
		return nil
	}
	vv, ok := v.([]string)
	if !ok {
		vv, ok := v.(map[string]interface{})
		if !ok {
			log.Errorf("got %s but failed to extract, type: %T", key, v)
			return nil
		}
		ret := make([]string, 0, len(vv))
		for _, item := range vv {
			itemV, err := util.ExtractString(item)
			if err != nil {
				log.Errorf("got %s but failed to extract, err: %v", key, err)
				return nil
			}
			ret = append(ret, itemV)
		}
		return ret
	}
	return vv
}
