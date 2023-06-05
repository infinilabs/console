package cluster_migration

import (
	"errors"
	"fmt"

	migration_model "infini.sh/console/plugin/migration/model"
	migration_util "infini.sh/console/plugin/migration/util"
	"infini.sh/framework/core/api/rbac"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/task"
	"infini.sh/framework/core/util"
)

func RepeatTask(oldTask *task.Task) (*task.Task, error) {
	config := migration_model.ClusterMigrationTaskConfig{}
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

func CreateTask(config *migration_model.ClusterMigrationTaskConfig, creator *rbac.ShortUser) (*task.Task, error) {
	t, err := buildTask(config, creator, false)
	if err != nil {
		return nil, err
	}

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

func buildTask(config *migration_model.ClusterMigrationTaskConfig, creator *rbac.ShortUser, repeat bool) (*task.Task, error) {
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

	var totalDocs int64
	for _, index := range config.Indices {
		if index.Incremental != nil {
			if repeat {
				index.Incremental.Full = false
			} else {
				index.Incremental.Full = true
			}
		}
		totalDocs += index.Source.Docs
	}

	t := task.Task{
		Metadata: task.Metadata{
			Type: "cluster_migration",
			Labels: util.MapStr{
				"business_id":       "cluster_migration",
				"source_cluster_id": config.Cluster.Source.Id,
				"target_cluster_id": config.Cluster.Target.Id,
				"source_total_docs": totalDocs,
			},
		},
		Cancellable:  true,
		Runnable:     false,
		Status:       task.StatusInit,
		ConfigString: util.MustToJSON(config),
	}
	t.ID = util.GetUUID()
	return &t, nil
}

// sync with getDataMigrationTaskInfo
func clearTaskConfig(config *migration_model.ClusterMigrationTaskConfig) {
	for i := range config.Indices {
		config.Indices[i].Target.Docs = 0
		config.Indices[i].Percent = 0
		config.Indices[i].ErrorPartitions = 0
	}
}
