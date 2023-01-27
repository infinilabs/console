/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package migration

import (
	"fmt"
	log "github.com/cihub/seelog"
	"infini.sh/framework/core/config"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/pipeline"
	task2 "infini.sh/framework/core/task"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/elastic/common"
	"runtime"
	"time"
)

type ClusterMigrationProcessor struct {
	id            string
	config *ClusterMigrationConfig
}

type ClusterMigrationConfig struct {
	Elasticsearch string `config:"elasticsearch,omitempty"`
	IndexName string `config:"index_name"`
	DetectIntervalInMs int  `config:"detect_interval_in_ms"`
	LogIndexName string `config:"log_index_name"`
}

func init() {
	pipeline.RegisterProcessorPlugin("cluster_migration", newClusterMigrationProcessor)
}

func newClusterMigrationProcessor(c *config.Config) (pipeline.Processor, error) {

	cfg := ClusterMigrationConfig{
		DetectIntervalInMs: 5000,
	}
	if err := c.Unpack(&cfg); err != nil {
		log.Error(err)
		return nil, fmt.Errorf("failed to unpack the configuration of cluster migration processor: %s", err)
	}
	if cfg.IndexName == "" || cfg.LogIndexName == "" {
		ormConfig := common.ORMConfig{}
		ok, err := env.ParseConfig("elastic.orm", &ormConfig)
		if ok && err == nil {
			if cfg.IndexName == ""{
				cfg.IndexName = fmt.Sprintf("%stask", ormConfig.IndexPrefix)
			}
			if cfg.LogIndexName == "" {
				cfg.LogIndexName = fmt.Sprintf("%stask-log", ormConfig.IndexPrefix)
			}
		}else{
			err = fmt.Errorf("parse config elastic.orm error: %w", err)
			log.Error(err)
			return nil, err
		}
	}

	processor := ClusterMigrationProcessor{
		id:     util.GetUUID(),
		config: &cfg,
	}

	return &processor, nil
}

func (p *ClusterMigrationProcessor) Name() string {
	return "cluster_migration"
}

func (p *ClusterMigrationProcessor) Process(ctx *pipeline.Context) error {
	defer func() {
		if !global.Env().IsDebug {
			if r := recover(); r != nil {
				var v string
				switch r.(type) {
				case error:
					v = r.(error).Error()
				case runtime.Error:
					v = r.(runtime.Error).Error()
				case string:
					v = r.(string)
				}
				log.Errorf("error in %s processor: %v", p.Name(), v)
			}
		}
		log.Tracef("exit %s processor", p.Name())
	}()

	for {
		if ctx.IsCanceled() {
			return nil
		}
		tasks, err := p.getClusterMigrationTasks(20)
		if err != nil {
			panic(err)
		}
		if len(tasks) == 0 {
			log.Debug("got zero cluster migration task from es")
			if p.config.DetectIntervalInMs > 0 {
				time.Sleep(time.Millisecond * time.Duration(p.config.DetectIntervalInMs))
			}
		}
		for _, t := range tasks {
			if ctx.IsCanceled() {
				return nil
			}
			t.Status = task2.StatusRunning
			t.StartTimeInMillis = time.Now().UnixMilli()
			p.writeTaskLog(&t, &task2.Log{
				ID: util.GetUUID(),
				TaskId: t.ID,
				Status: task2.StatusRunning,
				Type: t.Metadata.Type,
				Action: task2.LogAction{
					Parameters: t.Parameters,
				},
				Content: fmt.Sprintf("starting to execute task [%s]", t.ID),
				Timestamp: time.Now().UTC(),
			})
			err = p.SplitMigrationTask(&t)
			taskLog := &task2.Log{
				ID: util.GetUUID(),
				TaskId: t.ID,
				Status: task2.StatusRunning,
				Type: t.Metadata.Type,
				Action: task2.LogAction{
					Parameters: t.Parameters,
					Result:  &task2.LogResult{
						Success: true,
					},
				},
				Content: fmt.Sprintf("success to split task [%s]", t.ID),
				Timestamp: time.Now().UTC(),
			}
			if err != nil {
				taskLog.Status = task2.StatusError
				taskLog.Content = fmt.Sprintf("failed to split task [%s]: %v", t.ID, err)
				taskLog.Action.Result = &task2.LogResult{
					Success: false,
					Error: err.Error(),
				}
			}
			t.Status = taskLog.Status
			p.writeTaskLog(&t, taskLog)
			if err != nil {
				continue
			}
		}
		//es index refresh
		time.Sleep(time.Millisecond * 1200)
	}
}


func (p *ClusterMigrationProcessor) SplitMigrationTask(taskItem *task2.Task) error {
	if taskItem.Metadata.Labels == nil {
		return fmt.Errorf("empty metadata labels, unexpected cluster migration task: %s", util.MustToJSON(taskItem))
	}
	if taskItem.Metadata.Labels["pipeline_id"] != p.Name() {
		log.Tracef("got unexpect task type of %s with task id [%s] in cluster migration processor", taskItem.Metadata.Type, taskItem.ID)
		return nil
	}
	parameters := util.MapStr(taskItem.Parameters)
	migrationConfig, err := parameters.GetValue("pipeline.config")
	if err != nil {
		return err
	}
	buf := util.MustToJSONBytes(migrationConfig)
	clusterMigrationTask := ElasticDataConfig{}
	err = util.FromJSONBytes(buf, &clusterMigrationTask)
	if err != nil {
		return err
	}
	defer func() {
		parameters.Put("pipeline.config", clusterMigrationTask)
	}()
	esSourceClient := elastic.GetClient(clusterMigrationTask.Cluster.Source.Id)
	esTargetClient := elastic.GetClient(clusterMigrationTask.Cluster.Target.Id)
	esClient := elastic.GetClient(p.config.Elasticsearch)

	for i, index := range clusterMigrationTask.Indices {
		source := util.MapStr{
			"cluster_id": clusterMigrationTask.Cluster.Source.Id,
			"indices": index.Source.Name,
			//"slice_size": 10,
			"batch_size": clusterMigrationTask.Settings.ScrollSize.Docs,
			"scroll_time": clusterMigrationTask.Settings.ScrollSize.Timeout,
		}
		if index.IndexRename != nil {
			source["index_rename"] = index.IndexRename
		}
		if index.Target.Name != "" {
			source["index_rename"] = util.MapStr{
				index.Source.Name: index.Target.Name,
			}
		}
		if index.TypeRename != nil {
			source["type_rename"] = index.TypeRename
		}

		if v, ok := index.RawFilter.(string); ok {
			source["query_string"] = v
		}else{
			source["query_dsl"] = index.RawFilter
			if index.Source.DocType != "" {
				if index.Target.DocType != "" {
					source["type_rename"] = util.MapStr{
						index.Source.DocType: index.Target.DocType,
					}
				}
				must := []interface{}{
					util.MapStr{
						"terms": util.MapStr{
							"_type": []string{index.Source.DocType},
						},
					},
				}
				if index.RawFilter != nil {
					must = append(must, index.RawFilter)
				}
				source["query_dsl"] = util.MapStr{
					"bool": util.MapStr{
						"must": must,
					},
				}
			}else{
				if esSourceClient.GetMajorVersion() >= 8 {
					source["type_rename"] = util.MapStr{
						"*": index.Target.DocType,
					}
				}
			}
		}
		var targetMust []interface{}
		if index.RawFilter != nil {
			targetMust = append(targetMust, index.RawFilter)
		}
		if index.Target.DocType != "" && esTargetClient.GetMajorVersion() < 8 {
			targetMust = append(targetMust, util.MapStr{
				"terms": util.MapStr{
					"_type": []string{index.Target.DocType},
				},
			})
		}

		target := util.MapStr{
			"cluster_id": clusterMigrationTask.Cluster.Target.Id,
			//"max_worker_size": 10,
			//"detect_interval": 100,
			"bulk": util.MapStr{
				"batch_size_in_mb": clusterMigrationTask.Settings.BulkSize.StoreSizeInMB,
				"batch_size_in_docs":  clusterMigrationTask.Settings.BulkSize.Docs,
			},
		}
		indexParameters := map[string]interface{}{
			"pipeline": util.MapStr{
				"id": "index_migration",
				"config": util.MapStr{
					"source": source,
					"target": target,
					"execution": clusterMigrationTask.Settings.Execution,
				},
			},
		}
		indexMigrationTask := task2.Task{
			ParentId: []string{taskItem.ID},
			Cancellable: true,
			Runnable: false,
			Status: task2.StatusRunning,
			StartTimeInMillis: time.Now().UnixMilli(),
			Metadata: task2.Metadata{
				Type: "pipeline",
				Labels: util.MapStr{
					"pipeline_id": "index_migration",
					"source_cluster_id": clusterMigrationTask.Cluster.Source.Id,
					"target_cluster_id":  clusterMigrationTask.Cluster.Target.Id,
					"level": "index",
					"partition_count": 1,
				},
			},
			Parameters: indexParameters,
		}

		indexMigrationTask.ID=util.GetUUID()

		clusterMigrationTask.Indices[i].TaskID = indexMigrationTask.ID
		if index.Partition != nil {
			partitionQ := &elastic.PartitionQuery{
				IndexName: index.Source.Name,
				FieldName: index.Partition.FieldName,
				FieldType: index.Partition.FieldType,
				Step: index.Partition.Step,
				//Filter: index.RawFilter,
				Filter: source["query_dsl"],
			}
			partitions, err := elastic.GetPartitions(partitionQ, esSourceClient)
			if err != nil {
				return err
			}
			if partitions == nil || len(partitions) == 0{
				return fmt.Errorf("empty data with filter: %s", util.MustToJSON(index.RawFilter))
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
				partitionSource := util.MapStr{
					"start": partition.Start,
					"end": partition.End,
					"doc_count": partition.Docs,
					"step": index.Partition.Step,
					"partition_id": partitionID,
				}
				for k, v := range source{
					if k == "query_string"{
						continue
					}
					partitionSource[k] = v
				}
				partitionSource["query_dsl"] = partition.Filter
				var must []interface{}

				if partition.Other {
					must = append(must, partition.Filter)
				}else{
					must = append(must, util.MapStr{
						"range": util.MapStr{
							index.Partition.FieldName: util.MapStr{
								"gte": partition.Start,
								"lt": partition.End,
							},
						},
					})
				}

				if targetMust != nil {
					must = append(must, targetMust...)
				}
				if len(must) > 0 {
					target["query_dsl"] = util.MapStr{
						"bool": util.MapStr{
							"must": must,
						},
					}
				}

				partitionMigrationTask := task2.Task{
					ParentId: []string{taskItem.ID, indexMigrationTask.ID},
					Cancellable: false,
					Runnable: true,
					Status: task2.StatusReady,
					Metadata:  task2.Metadata{
						Type: "pipeline",
						Labels: util.MapStr{
							"pipeline_id": "index_migration",
							"source_cluster_id": clusterMigrationTask.Cluster.Source.Id,
							"target_cluster_id":  clusterMigrationTask.Cluster.Target.Id,
							"level": "partition",
							"index_name": index.Source.Name,
							"execution": util.MapStr{
								"nodes": util.MapStr{
									"permit": clusterMigrationTask.Settings.Execution.Nodes.Permit,
								},
							},
						},
					},
					Parameters: map[string]interface{}{
						"pipeline": util.MapStr{
							"id": "index_migration",
							"config": util.MapStr{
								"source": partitionSource,
								"target": target,
								"execution": clusterMigrationTask.Settings.Execution,
							},
						},
					},
				}
				partitionMigrationTask.ID=util.GetUUID()

				_, err = esClient.Index(p.config.IndexName, "", partitionMigrationTask.ID, partitionMigrationTask, "")
				delete(target, "query_dsl")
				if err != nil {
					return fmt.Errorf("store index migration task(partition) error: %w", err)
				}

			}
			indexMigrationTask.Metadata.Labels["partition_count"] = partitionID
		}else{
			source["doc_count"] = index.Source.Docs
			if targetMust != nil {
				target["query_dsl"] = util.MapStr{
					"bool": util.MapStr{
						"must": targetMust,
					},
				}
			}
			partitionMigrationTask := task2.Task{
				ParentId: []string{taskItem.ID, indexMigrationTask.ID},
				Cancellable: false,
				Runnable: true,
				Status: task2.StatusReady,
				Metadata:  task2.Metadata{
					Type: "pipeline",
					Labels: util.MapStr{
						"pipeline_id": "index_migration",
						"source_cluster_id": clusterMigrationTask.Cluster.Source.Id,
						"target_cluster_id":  clusterMigrationTask.Cluster.Target.Id,
						"level": "partition",
						"index_name": index.Source.Name,
						"execution": util.MapStr{
							"nodes": util.MapStr{
								"permit": clusterMigrationTask.Settings.Execution.Nodes.Permit,
							},
						},
					},
				},
				Parameters: indexParameters,
			}
			partitionMigrationTask.ID=util.GetUUID()

			_, err = esClient.Index(p.config.IndexName, "", partitionMigrationTask.ID, partitionMigrationTask, "")
			delete(target, "query_dsl")
			if err != nil {
				return fmt.Errorf("store index migration task(partition) error: %w", err)
			}
		}
		_, err = esClient.Index(p.config.IndexName, "", indexMigrationTask.ID, indexMigrationTask, "")
		if err != nil {
			return fmt.Errorf("store index migration task error: %w", err)
		}
	}
	return nil
}

func (p *ClusterMigrationProcessor) getClusterMigrationTasks(size int)([]task2.Task, error){
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
							"status": task2.StatusReady,
						},
					},
					{
						"term": util.MapStr{
							"metadata.labels.pipeline_id": p.Name(),
						},
					},
				},
			},
		},
	}
	esClient := elastic.GetClient(p.config.Elasticsearch)
	res, err := esClient.SearchWithRawQueryDSL(p.config.IndexName, util.MustToJSONBytes(queryDsl))
	if err != nil {
		return nil, err
	}
	if res.GetTotal() == 0 {
		return nil, nil
	}
	var migrationTasks []task2.Task
	for _, hit := range res.Hits.Hits {
		buf, err := util.ToJSONBytes(hit.Source)
		if err != nil {
			return nil, err
		}
		tk := task2.Task{}
		err = util.FromJSONBytes(buf, &tk)
		if err != nil {
			return nil, err
		}
		migrationTasks = append(migrationTasks, tk)
	}
	return migrationTasks, nil
}

func (p *ClusterMigrationProcessor) writeTaskLog(taskItem *task2.Task, logItem *task2.Log) {
	esClient := elastic.GetClient(p.config.Elasticsearch)
	_, err := esClient.Index(p.config.IndexName,"", logItem.TaskId, taskItem, "" )
	if err != nil{
		log.Error(err)
	}
	_, err = esClient.Index(p.config.LogIndexName,"", logItem.ID, logItem, "" )
	if err != nil{
		log.Error(err)
	}
}
