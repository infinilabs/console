package pipeline_task

import (
	"fmt"
	"strings"
	"time"

	log "github.com/cihub/seelog"
	migration_util "infini.sh/console/plugin/task_manager/util"
	"infini.sh/framework/core/task"
)

func (p *processor) handleRunningBulkIndexingPipelineTask(taskItem *task.Task) error {
	successDocs, indexDocs, bulked, totalInvalidDocs, totalInvalidReasons, totalFailureDocs, totalFailureReasons, errs := p.getBulkIndexingTaskState(taskItem)
	if !bulked {
		return nil
	}

	var errMsg string
	if len(errs) > 0 {
		errMsg = fmt.Sprintf("bulk finished with error(s): %v", errs)
	}
	now := time.Now()
	taskItem.CompletedTime = &now
	taskItem.Metadata.Labels["index_docs"] = indexDocs
	taskItem.Metadata.Labels["success_docs"] = successDocs
	taskItem.Metadata.Labels["invalid_docs"] = strings.Join(totalInvalidDocs, ",")
	taskItem.Metadata.Labels["invalid_reasons"] = strings.Join(totalInvalidReasons, ",")
	taskItem.Metadata.Labels["failure_docs"] = strings.Join(totalFailureDocs, ",")
	taskItem.Metadata.Labels["failure_reasons"] = strings.Join(totalFailureReasons, ",")
	if errMsg != "" {
		taskItem.Status = task.StatusError
	} else {
		taskItem.Status = task.StatusComplete
	}

	p.saveTaskAndWriteLog(taskItem, &task.TaskResult{
		Success: errMsg == "",
		Error:   errMsg,
	}, fmt.Sprintf("[bulk_indexing] pipeline task [%s] completed", taskItem.ID))
	p.cleanGatewayPipeline(taskItem)
	return nil
}

func (p *processor) getBulkIndexingTaskState(taskItem *task.Task) (successDocs int64, indexDocs int64, bulked bool, totalInvalidDocs []string, totalInvalidReasons []string, totalFailureDocs []string, totalFailureReasons []string, errs []string) {
	newHits, err := p.getPipelineLogs(taskItem, []string{"FINISHED", "FAILED"}, taskItem.Updated.UnixMilli())
	if err != nil {
		log.Errorf("failed to get latest pipeline logs for task [%s], err: %v", taskItem.ID, err)
		return
	}
	if len(newHits) == 0 {
		log.Debugf("bulk task [%s] not finished yet since last start", taskItem.ID)
		return
	}

	hits, err := p.getPipelineLogs(taskItem, []string{"FINISHED", "FAILED"}, 0)
	if err != nil {
		log.Errorf("failed to get all pipeline logs for task [%s], err: %v", taskItem.ID, err)
		return
	}

	for _, m := range hits {
		bulked = true

		errStr := migration_util.GetMapStringValue(m, "payload.pipeline.logging.result.error")
		if errStr != "" {
			errs = append(errs, errStr)
		}

		var (
			success = migration_util.GetMapIntValue(m, "payload.pipeline.logging.context.bulk_indexing.success.count")
			failure = migration_util.GetMapIntValue(m, "payload.pipeline.logging.context.bulk_indexing.failure.count")
			invalid = migration_util.GetMapIntValue(m, "payload.pipeline.logging.context.bulk_indexing.invalid.count")
		)
		successDocs += success
		indexDocs += success + invalid + failure

		var (
			invalidDocs    = migration_util.GetMapStringSliceValue(m, "payload.pipeline.logging.context.bulk_indexing.detail.invalid.documents")
			invalidReasons = migration_util.GetMapStringSliceValue(m, "payload.pipeline.logging.context.bulk_indexing.detail.invalid.reasons")
			failureDocs    = migration_util.GetMapStringSliceValue(m, "payload.pipeline.logging.context.bulk_indexing.detail.failure.documents")
			failureReasons = migration_util.GetMapStringSliceValue(m, "payload.pipeline.logging.context.bulk_indexing.detail.failure.reasons")
		)
		totalInvalidDocs = append(totalInvalidDocs, invalidDocs...)
		totalInvalidReasons = append(invalidReasons, invalidReasons...)
		totalFailureDocs = append(totalFailureDocs, failureDocs...)
		totalFailureReasons = append(totalFailureReasons, failureReasons...)
	}
	return
}

func (p *processor) clearBulkIndexLabels(labels map[string]interface{}) {
	delete(labels, "index_docs")
	delete(labels, "success_docs")
	delete(labels, "invalid_docs")
	delete(labels, "invalid_reasons")
	delete(labels, "failure_docs")
	delete(labels, "failure_reasons")
}
