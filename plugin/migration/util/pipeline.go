package util

import (
	migration_model "infini.sh/console/plugin/migration/model"
	"infini.sh/framework/core/task"
)

/*
These functions could return nil tasks
*/

func SplitIndexMigrationTasks(ptasks []task.Task) (scrollTask *task.Task, bulkTask *task.Task) {
	for i, ptask := range ptasks {
		if ptask.Metadata.Labels["pipeline_id"] == "bulk_indexing" {
			bulkTask = &ptasks[i]
		} else if ptask.Metadata.Labels["pipeline_id"] == "es_scroll" {
			scrollTask = &ptasks[i]
		}
	}
	return
}

func SplitIndexComparisonTasks(ptasks []task.Task, cfg *migration_model.IndexComparisonTaskConfig) (sourceDumpTask *task.Task, targetDumpTask *task.Task, diffTask *task.Task) {
	for i, ptask := range ptasks {
		if ptask.Metadata.Labels["pipeline_id"] == "dump_hash" {
			// TODO: we can't handle when compare the same cluster & same index
			// catch it earlier when creating the task
			if ptask.Metadata.Labels["cluster_id"] == cfg.Source.ClusterId && ptask.Metadata.Labels["index_name"] == cfg.Source.Indices {
				sourceDumpTask = &ptasks[i]
			} else {
				targetDumpTask = &ptasks[i]
			}
		} else if ptask.Metadata.Labels["pipeline_id"] == "index_diff" {
			diffTask = &ptasks[i]
		}
	}
	return
}
