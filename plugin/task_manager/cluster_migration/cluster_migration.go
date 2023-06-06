package cluster_migration

import (
	"context"
	"fmt"
	"time"

	log "github.com/cihub/seelog"

	"infini.sh/console/model"
	migration_model "infini.sh/console/plugin/task_manager/model"
	migration_util "infini.sh/console/plugin/task_manager/util"

	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/task"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/elastic/common"
)

type processor struct {
	Elasticsearch string
	IndexName     string
	scheduler     migration_model.Scheduler
}

func NewProcessor(elasticsearch, indexName string, scheduler migration_model.Scheduler) migration_model.Processor {
	return &processor{
		Elasticsearch: elasticsearch,
		IndexName:     indexName,
		scheduler:     scheduler,
	}
}

func (p *processor) Process(t *task.Task) (err error) {
	switch t.Status {
	case task.StatusReady:
		// split & schedule index_migration tasks
		err = p.handleReadyMajorTask(t)
	case task.StatusRunning:
		// check index_migration tasks status
		err = p.handleRunningMajorTask(t)
	case task.StatusPendingStop:
		// mark index_migrations as pending_stop
		err = p.handlePendingStopMajorTask(t)
	}
	return err
}

func (p *processor) handleReadyMajorTask(taskItem *task.Task) error {
	if ok, _ := util.ExtractBool(taskItem.Metadata.Labels["is_split"]); !ok {
		return p.splitMajorMigrationTask(taskItem)
	}
	// update status of subtask to ready
	err := migration_util.UpdateStoppedChildTasksToReady(taskItem, "index_migration")
	if err != nil {
		log.Errorf("failed to update sub task status, err: %v", err)
		return nil
	}
	taskItem.RetryTimes++
	if taskItem.StartTimeInMillis == 0 {
		taskItem.StartTimeInMillis = time.Now().UnixMilli()
	}
	taskItem.Status = task.StatusRunning
	p.saveTaskAndWriteLog(taskItem, &task.TaskResult{
		Success: true,
	}, fmt.Sprintf("major task [%s] started", taskItem.ID))
	p.sendMajorTaskNotification(taskItem)
	return nil
}

func (p *processor) splitMajorMigrationTask(taskItem *task.Task) error {
	clusterMigrationTask := migration_model.ClusterMigrationTaskConfig{}
	err := migration_util.GetTaskConfig(taskItem, &clusterMigrationTask)
	if err != nil {
		log.Errorf("failed to get task config, err: %v", err)
		return err
	}
	esSourceClient := elastic.GetClient(clusterMigrationTask.Cluster.Source.Id)
	targetType := common.GetClusterDocType(clusterMigrationTask.Cluster.Target.Id)

	err = migration_util.DeleteChildTasks(taskItem.ID, "index_migration")
	if err != nil {
		log.Warnf("failed to clear child tasks, err: %v", err)
		return nil
	}

	current := migration_util.GetMapIntValue(taskItem.Metadata.Labels, "next_run_time")
	var step time.Duration
	if clusterMigrationTask.Settings.Execution.Repeat != nil {
		step = clusterMigrationTask.Settings.Execution.Repeat.Interval
	}

	var pids []string
	pids = append(pids, taskItem.ParentId...)
	pids = append(pids, taskItem.ID)

	var totalDocs int64
	ctx := context.Background()

	for i, index := range clusterMigrationTask.Indices {
		source := migration_model.IndexMigrationSourceConfig{
			ClusterId:      clusterMigrationTask.Cluster.Source.Id,
			Indices:        index.Source.Name,
			DocCount:       index.Source.Docs,
			SliceSize:      clusterMigrationTask.Settings.Scroll.SliceSize,
			BatchSize:      clusterMigrationTask.Settings.Scroll.Docs,
			ScrollTime:     clusterMigrationTask.Settings.Scroll.Timeout,
			SkipCountCheck: clusterMigrationTask.Settings.SkipScrollCountCheck,
		}

		if index.IndexRename != nil {
			source.IndexRename = index.IndexRename
		}
		if index.Target.Name != "" {
			source.IndexRename = util.MapStr{
				index.Source.Name: index.Target.Name,
			}
		}
		if index.TypeRename != nil {
			source.TypeRename = index.TypeRename
		}

		if v, ok := index.RawFilter.(string); ok {
			source.QueryString = v
		} else {
			var must []interface{}
			if index.RawFilter != nil {
				must = append(must, index.RawFilter)
			}
			if index.Incremental != nil {
				incrementalFilter, err := index.Incremental.BuildFilter(current, step)
				if err != nil {
					return err
				}
				must = append(must, incrementalFilter)
			}
			if index.Source.DocType != "" {
				if index.Target.DocType != "" {
					source.TypeRename = util.MapStr{
						index.Source.DocType: index.Target.DocType,
					}
				}
				must = append(must, util.MapStr{
					"terms": util.MapStr{
						"_type": []string{index.Source.DocType},
					},
				})
			} else {
				if targetType != "" {
					source.TypeRename = util.MapStr{
						"*": index.Target.DocType,
					}
				}
			}
			if len(must) > 0 {
				source.QueryDSL = util.MapStr{
					"bool": util.MapStr{
						"must": must,
					},
				}
			}
		}

		// NOTE: for repeating tasks, frontend can't get the accurate doc count
		// update here before we split the task, if the index has incremental config and correct delay value,
		// the doc count will not change and will be stable
		var countQuery = util.MapStr{}
		if source.QueryDSL != nil {
			countQuery = util.MapStr{
				"query": source.QueryDSL,
			}
		}
		sourceCount, err := esSourceClient.Count(ctx, index.Source.Name, util.MustToJSONBytes(countQuery))
		if err != nil {
			log.Errorf("failed to count docs, err: %v", err)
			return err
		}

		clusterMigrationTask.Indices[i].Source.Docs = sourceCount.Count
		source.DocCount = sourceCount.Count
		totalDocs += sourceCount.Count

		target := migration_model.IndexMigrationTargetConfig{
			ClusterId:      clusterMigrationTask.Cluster.Target.Id,
			SkipCountCheck: clusterMigrationTask.Settings.SkipBulkCountCheck,
			Bulk: migration_model.IndexMigrationBulkConfig{
				BatchSizeInMB:        clusterMigrationTask.Settings.Bulk.StoreSizeInMB,
				BatchSizeInDocs:      clusterMigrationTask.Settings.Bulk.Docs,
				MaxWorkerSize:        clusterMigrationTask.Settings.Bulk.MaxWorkerSize,
				IdleTimeoutInSeconds: clusterMigrationTask.Settings.Bulk.IdleTimeoutInSeconds,
				SliceSize:            clusterMigrationTask.Settings.Bulk.SliceSize,
				Compress:             clusterMigrationTask.Settings.Bulk.Compress,
			},
		}

		if index.Partition != nil {
			partitionQ := &elastic.PartitionQuery{
				IndexName: index.Source.Name,
				FieldName: index.Partition.FieldName,
				FieldType: index.Partition.FieldType,
				Step:      index.Partition.Step,
			}
			if source.QueryDSL != nil {
				partitionQ.Filter = source.QueryDSL
			}
			partitions, err := elastic.GetPartitions(partitionQ, esSourceClient)
			if err != nil {
				return err
			}
			if len(partitions) == 0 {
				continue
			}
			var (
				partitionID int
			)
			for _, partition := range partitions {
				//skip empty partition
				if partition.Docs <= 0 {
					continue
				}
				partitionID++
				partitionSource := source
				partitionSource.Start = partition.Start
				partitionSource.End = partition.End
				partitionSource.DocCount = partition.Docs
				partitionSource.Step = index.Partition.Step
				partitionSource.PartitionId = partitionID
				partitionSource.QueryDSL = partition.Filter
				partitionSource.QueryString = ""

				partitionMigrationTask := task.Task{
					ParentId:    pids,
					Cancellable: false,
					Runnable:    true,
					Status:      task.StatusReady,
					Metadata: task.Metadata{
						Type: "index_migration",
						Labels: util.MapStr{
							"business_id":       "index_migration",
							"source_cluster_id": clusterMigrationTask.Cluster.Source.Id,
							"target_cluster_id": clusterMigrationTask.Cluster.Target.Id,
							"index_name":        index.Source.Name,
							"unique_index_name": index.Source.GetUniqueIndexName(),
						},
					},
					ConfigString: util.MustToJSON(migration_model.IndexMigrationTaskConfig{
						Source:    partitionSource,
						Target:    target,
						Execution: clusterMigrationTask.Settings.Execution,
						Version:   migration_model.IndexMigrationV1,
					}),
				}
				partitionMigrationTask.ID = util.GetUUID()
				err = orm.Create(nil, &partitionMigrationTask)
				if err != nil {
					return fmt.Errorf("store index migration task(partition) error: %w", err)
				}

			}
		} else {
			indexMigrationTask := task.Task{
				ParentId:    pids,
				Cancellable: true,
				Runnable:    false,
				Status:      task.StatusReady,
				Metadata: task.Metadata{
					Type: "index_migration",
					Labels: util.MapStr{
						"business_id":       "index_migration",
						"source_cluster_id": clusterMigrationTask.Cluster.Source.Id,
						"target_cluster_id": clusterMigrationTask.Cluster.Target.Id,
						"partition_count":   1,
						"index_name":        index.Source.Name,
						"unique_index_name": index.Source.GetUniqueIndexName(),
					},
				},
				ConfigString: util.MustToJSON(migration_model.IndexMigrationTaskConfig{
					Source:    source,
					Target:    target,
					Execution: clusterMigrationTask.Settings.Execution,
					Version:   migration_model.IndexMigrationV1,
				}),
			}

			indexMigrationTask.ID = util.GetUUID()

			err = orm.Create(nil, &indexMigrationTask)
			if err != nil {
				return fmt.Errorf("store index migration task error: %w", err)
			}
		}
	}
	taskItem.ConfigString = util.MustToJSON(clusterMigrationTask)
	taskItem.Metadata.Labels["is_split"] = true
	taskItem.Metadata.Labels["source_total_docs"] = totalDocs
	p.saveTaskAndWriteLog(taskItem, &task.TaskResult{
		Success: true,
	}, fmt.Sprintf("major task [%s] splitted", taskItem.ID))
	return nil
}

func (p *processor) handleRunningMajorTask(taskItem *task.Task) error {
	ts, err := p.getMajorTaskState(taskItem)
	if err != nil {
		return err
	}
	if !(ts.Status == task.StatusComplete || ts.Status == task.StatusError) {
		return nil
	}

	totalDocs := migration_util.GetMapIntValue(util.MapStr(taskItem.Metadata.Labels), "source_total_docs")
	var errMsg string
	if ts.Status == task.StatusError {
		errMsg = "index migration(s) failed"
	}

	if errMsg == "" {
		if totalDocs != ts.IndexDocs {
			errMsg = fmt.Sprintf("cluster migration completed but docs count unmatch: %d / %d", ts.IndexDocs, totalDocs)
		}
	}

	if errMsg == "" {
		taskItem.Status = task.StatusComplete
	} else {
		taskItem.Status = task.StatusError
	}
	taskItem.Metadata.Labels["target_total_docs"] = ts.IndexDocs
	tn := time.Now()
	taskItem.CompletedTime = &tn
	p.sendMajorTaskNotification(taskItem)
	p.saveTaskAndWriteLog(taskItem, &task.TaskResult{
		Success: errMsg == "",
		Error:   errMsg,
	}, fmt.Sprintf("major task [%s] finished with status [%s]", taskItem.ID, taskItem.Status))
	return nil
}

func (p *processor) getMajorTaskState(majorTask *task.Task) (taskState migration_model.ClusterMigrationTaskState, err error) {
	query := util.MapStr{
		"size": 0,
		"aggs": util.MapStr{
			"total_docs": util.MapStr{
				"sum": util.MapStr{
					"field": "metadata.labels.index_docs",
				},
			},
			"grp": util.MapStr{
				"terms": util.MapStr{
					"field": "status",
				},
			},
		},
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"parent_id": util.MapStr{
								"value": majorTask.ID,
							},
						},
					},
					{
						"term": util.MapStr{
							"metadata.type": util.MapStr{
								"value": "index_migration",
							},
						},
					},
				},
			},
		},
	}
	esClient := elastic.GetClient(p.Elasticsearch)
	res, err := esClient.SearchWithRawQueryDSL(p.IndexName, util.MustToJSONBytes(query))
	if err != nil {
		log.Errorf("search es failed, err: %v", err)
		return taskState, nil
	}
	if v, err := util.ExtractInt(res.Aggregations["total_docs"].Value); err == nil {
		taskState.IndexDocs = v
	}
	var (
		hasError bool
	)
	for _, bk := range res.Aggregations["grp"].Buckets {
		status, _ := util.ExtractString(bk["key"])
		if migration_util.IsRunningState(status) {
			taskState.Status = task.StatusRunning
			return taskState, nil
		}
		if status == task.StatusError {
			hasError = true
		}
	}
	if hasError {
		taskState.Status = task.StatusError
	} else {
		taskState.Status = task.StatusComplete
	}
	return taskState, nil
}

func (p *processor) handlePendingStopMajorTask(taskItem *task.Task) error {
	err := migration_util.UpdatePendingChildTasksToPendingStop(taskItem, "index_migration")
	if err != nil {
		log.Errorf("failed to update sub task status, err: %v", err)
		return nil
	}

	tasks, err := migration_util.GetPendingChildTasks(taskItem.ID, "index_migration")
	if err != nil {
		log.Errorf("failed to get sub tasks, err: %v", err)
		return nil
	}

	// all subtask stopped or error or complete
	if len(tasks) == 0 {
		taskItem.Status = task.StatusStopped
		p.sendMajorTaskNotification(taskItem)
		p.saveTaskAndWriteLog(taskItem, nil, fmt.Sprintf("task [%s] stopped", taskItem.ID))
		// NOTE: we don't know how many running index_migration's stopped, so do a refresh from ES
		p.scheduler.RefreshInstanceJobsFromES()
	}
	return nil
}

func (p *processor) saveTaskAndWriteLog(taskItem *task.Task, taskResult *task.TaskResult, message string) {
	esClient := elastic.GetClient(p.Elasticsearch)
	_, err := esClient.Index(p.IndexName, "", taskItem.ID, taskItem, "")
	if err != nil {
		log.Errorf("failed to update task, err: %v", err)
	}
	if message != "" {
		migration_util.WriteLog(taskItem, taskResult, message)
	}
}

func (p *processor) sendMajorTaskNotification(taskItem *task.Task) {
	// don't send notification for repeating child tasks
	if len(taskItem.ParentId) > 0 {
		return
	}

	config := migration_model.ClusterMigrationTaskConfig{}
	err := migration_util.GetTaskConfig(taskItem, &config)
	if err != nil {
		log.Errorf("failed to parse config info from major task, id: %s, err: %v", taskItem.ID, err)
		return
	}

	creatorID := config.Creator.Id

	var title, body string
	body = fmt.Sprintf("From Cluster: [%s (%s)], To Cluster: [%s (%s)]", config.Cluster.Source.Id, config.Cluster.Source.Name, config.Cluster.Target.Id, config.Cluster.Target.Name)
	link := fmt.Sprintf("/#/data_tools/migration/%s/detail", taskItem.ID)
	switch taskItem.Status {
	case task.StatusReady:
		log.Debugf("skip sending notification for ready task, id: %s", taskItem.ID)
		return
	case task.StatusStopped:
		title = fmt.Sprintf("Data Migration Stopped")
	case task.StatusComplete:
		title = fmt.Sprintf("Data Migration Completed")
	case task.StatusError:
		title = fmt.Sprintf("Data Migration Failed")
	case task.StatusRunning:
		title = fmt.Sprintf("Data Migration Started")
	default:
		log.Warnf("skip sending notification for invalid task status, id: %s", taskItem.ID)
		return
	}
	notification := &model.Notification{
		UserId:      util.ToString(creatorID),
		Type:        model.NotificationTypeNotification,
		MessageType: model.MessageTypeMigration,
		Status:      model.NotificationStatusNew,
		Title:       title,
		Body:        body,
		Link:        link,
	}
	err = orm.Create(nil, notification)
	if err != nil {
		log.Errorf("failed to create notification, err: %v", err)
		return
	}
	return
}
