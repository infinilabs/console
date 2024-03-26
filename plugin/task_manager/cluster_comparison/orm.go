package cluster_comparison

import (
	"errors"
	"fmt"

	migration_model "infini.sh/console/plugin/task_manager/model"
	migration_util "infini.sh/console/plugin/task_manager/util"
	"infini.sh/framework/core/api/rbac"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/task"
	"infini.sh/framework/core/util"
)

func RepeatTask(oldTask *task.Task) (*task.Task, error) {
	config := migration_model.ClusterComparisonTaskConfig{}
	err := migration_util.GetTaskConfig(oldTask, &config)
	if err != nil {
		return nil, err
	}

	t, err := buildTask(&config, &rbac.ShortUser{
		Username: config.Creator.Name,
		UserId:   config.Creator.Id,
	}, true)
	if err != nil {
		return nil, err
	}
	t.ParentId = []string{oldTask.ID}
	if len(oldTask.ParentId) > 0 {
		t.ParentId = oldTask.ParentId
	}

	migration_util.CopyRepeatState(oldTask.Metadata.Labels, t.Metadata.Labels)
	err = migration_util.UpdateRepeatState(config.Settings.Execution.Repeat, t.Metadata.Labels)
	if err != nil {
		return nil, fmt.Errorf("repeat invalid: %v", err)
	}

	err = orm.Create(nil, t)
	if err != nil {
		return nil, err
	}
	return t, nil
}

func CreateTask(config *migration_model.ClusterComparisonTaskConfig, creator *rbac.ShortUser) (*task.Task, error) {
	t, err := buildTask(config, creator, false)
	if err != nil {
		return nil, err
	}

	err = migration_util.UpdateRepeatState(config.Settings.Execution.Repeat, t.Metadata.Labels)
	if err != nil {
		return nil, fmt.Errorf("repeat invalid: %v", err)
	}

	ctx := &orm.Context{
		Refresh: "wait_for",
	}
	err = orm.Create(ctx, t)
	if err != nil {
		return nil, err
	}
	return t, nil
}

func buildTask(config *migration_model.ClusterComparisonTaskConfig, creator *rbac.ShortUser, repeat bool) (*task.Task, error) {
	if len(config.Indices) == 0 {
		return nil, errors.New("indices must not be empty")
	}
	if creator == nil {
		return nil, errors.New("missing creator info")
	}
	config.Creator.Name = creator.Username
	config.Creator.Id = creator.UserId

	srcClusterCfg := elastic.GetConfig(config.Cluster.Source.Id)
	config.Cluster.Source.Distribution = srcClusterCfg.Distribution
	dstClusterCfg := elastic.GetConfig(config.Cluster.Target.Id)
	config.Cluster.Target.Distribution = dstClusterCfg.Distribution

	clearTaskConfig(config)

	var sourceTotalDocs int64
	var targetTotalDocs int64

	for _, index := range config.Indices {
		if index.Incremental != nil {
			if repeat {
				index.Incremental.Full = false
			} else {
				index.Incremental.Full = true
			}
		}
		sourceTotalDocs += index.Source.Docs
		targetTotalDocs += index.Target.Docs
	}

	t := task.Task{
		Metadata: task.Metadata{
			Type: "cluster_comparison",
			Labels: util.MapStr{
				"business_id":       "cluster_comparison",
				"source_cluster_id": config.Cluster.Source.Id,
				"target_cluster_id": config.Cluster.Target.Id,
				"source_total_docs": sourceTotalDocs,
				"target_total_docs": targetTotalDocs,
				"permit_nodes": config.Settings.Execution.Nodes.Permit,
				"name": config.Name,
			},
		},
		Cancellable:  true,
		Runnable:     false,
		Status:       task.StatusInit,
		ConfigString: util.MustToJSON(config),
	}
	if len(config.Tags) > 0 {
		t.Metadata.Labels["tags"] = config.Tags
	}
	t.ID = util.GetUUID()
	return &t, nil
}

// sync with getDataComparisonTaskInfo
func clearTaskConfig(config *migration_model.ClusterComparisonTaskConfig) {
	for i := range config.Indices {
		config.Indices[i].ScrollPercent = 0
		config.Indices[i].ErrorPartitions = 0
	}
}
