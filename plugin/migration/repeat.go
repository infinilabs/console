package migration

import (
	"errors"
	"fmt"
	"time"

	log "github.com/cihub/seelog"
	"infini.sh/console/plugin/migration/cluster_comparison"
	"infini.sh/console/plugin/migration/cluster_migration"
	migration_util "infini.sh/console/plugin/migration/util"
	"infini.sh/framework/core/pipeline"
	"infini.sh/framework/core/task"
	"infini.sh/framework/core/util"
)

func (p *DispatcherProcessor) handleRepeatingTasks(ctx *pipeline.Context, taskType string) {
	tasks, err := p.getPendingExecutionTasks(taskType, p.config.TaskBatchSize)
	if err != nil {
		log.Errorf("failed to get pending [%s] tasks, err: %v", taskType, err)
		return
	}
	if len(tasks) == 0 {
		return
	}
	log.Debugf("handling pending [%s] tasks, count: %d", taskType, len(tasks))
	// refresh index after each batch
	defer func() {
		p.refreshTask()
	}()
	for i := range tasks {
		if ctx.IsCanceled() {
			return
		}
		taskItem := &tasks[i]
		err := p.handleTask(taskItem, p.handleRepeatingTask)
		if err != nil {
			log.Errorf("failed to handle task [%s]: [%v]", taskItem.ID, err)

			taskItem.Status = task.StatusError
			tn := time.Now()
			taskItem.CompletedTime = &tn
			p.saveTaskAndWriteLog(taskItem, &task.TaskResult{
				Success: false,
				Error:   err.Error(),
			}, fmt.Sprintf("failed to handle task [%s]", taskItem.ID))
		}
	}
	return
}

func (p *DispatcherProcessor) getPendingExecutionTasks(taskType string, size int) ([]task.Task, error) {
	queryDsl := util.MapStr{
		"size": size,
		"sort": []util.MapStr{
			{
				"created": util.MapStr{
					"order": "asc",
				},
			},
		},
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"metadata.type": taskType,
						},
					},
					{
						"term": util.MapStr{
							"metadata.labels.repeat_triggered": util.MapStr{
								"value": false,
							},
						},
					},
					{
						"range": util.MapStr{
							"metadata.labels.next_run_time": util.MapStr{
								"lte": time.Now().UnixMilli(),
							},
						},
					},
				},
			},
		},
	}
	return migration_util.GetTasks(queryDsl)
}

// NOTE: we handle repeating in two iterations:
// - the first iteration will mark the task as ready to run
// - the second iteration will trigger the next repeat, and update the status accordingly
// This will make the second step automatically retryable
func (p *DispatcherProcessor) handleRepeatingTask(taskItem *task.Task) error {
	if taskItem.Status == task.StatusInit {
		taskItem.Status = task.StatusReady
		p.saveTaskAndWriteLog(taskItem, &task.TaskResult{
			Success: true,
		}, fmt.Sprintf("task started automatically"))
		return nil
	}
	repeatDone := migration_util.GetMapBoolValue(taskItem.Metadata.Labels, "repeat_done")
	if repeatDone {
		taskItem.Metadata.Labels["repeat_triggered"] = true
		p.saveTaskAndWriteLog(taskItem, &task.TaskResult{
			Success: true,
		}, fmt.Sprintf("task repeat ended"))
		return nil
	}
	var nextTask *task.Task
	var err error
	switch taskItem.Metadata.Type {
	case "cluster_migration":
		nextTask, err = cluster_migration.RepeatTask(taskItem)
	case "cluster_comparison":
		nextTask, err = cluster_comparison.RepeatTask(taskItem)
	default:
		return errors.New("invalid type")
	}
	if err != nil {
		log.Errorf("failed to repeat task [%s], err: %v", taskItem.ID, err)
		return nil
	}
	taskItem.Metadata.Labels["repeat_triggered"] = true
	p.saveTaskAndWriteLog(taskItem, &task.TaskResult{
		Success: true,
	}, fmt.Sprintf("next repeat task [%s] created", nextTask.ID))
	return nil
}
