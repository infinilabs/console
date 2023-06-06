package pipeline_task

import (
	"fmt"
	"strings"
	"time"

	log "github.com/cihub/seelog"
	migration_util "infini.sh/console/plugin/task_manager/util"
	"infini.sh/framework/core/task"
)

func (p *processor) handleRunningIndexDiffPipelineTask(taskItem *task.Task) error {

	diffed, onlyInSourceCount, totalOnlyInSourceDocs, onlyInTargetCount, totalOnlyInTargetDocs, diffBothCount, totalDiffBothDocs, errs := p.getIndexDiffTaskState(taskItem)
	if !diffed {
		return nil
	}

	var errMsg string
	if len(errs) > 0 {
		errMsg = fmt.Sprintf("index diff finished with error(s): %v", errs)
	}

	now := time.Now()
	taskItem.CompletedTime = &now
	// NOTE: only_in_source/only_in_target is likely useless because we'll skip diff if doc count unmatch
	taskItem.Metadata.Labels["only_in_source_count"] = onlyInSourceCount
	taskItem.Metadata.Labels["only_in_source_keys"] = strings.Join(totalOnlyInSourceDocs, ",")
	taskItem.Metadata.Labels["only_in_target_count"] = onlyInTargetCount
	taskItem.Metadata.Labels["only_in_target_keys"] = strings.Join(totalOnlyInTargetDocs, ",")
	taskItem.Metadata.Labels["diff_both_count"] = diffBothCount
	taskItem.Metadata.Labels["diff_both_keys"] = strings.Join(totalDiffBothDocs, ",")

	if errMsg != "" {
		taskItem.Status = task.StatusError
	} else {
		taskItem.Status = task.StatusComplete
	}

	p.saveTaskAndWriteLog(taskItem, &task.TaskResult{
		Success: errMsg == "",
		Error:   errMsg,
	}, fmt.Sprintf("[index_diff] pipeline task [%s] finished with status [%s]", taskItem.ID, taskItem.Status))
	p.cleanGatewayPipeline(taskItem)
	return nil
}

func (p *processor) getIndexDiffTaskState(taskItem *task.Task) (diffed bool, onlyInSourceCount int64, totalOnlyInSourceDocs []string, onlyInTargetCount int64, totalOnlyInTargetDocs []string, diffBothCount int64, totalDiffBothDocs []string, errs []string) {
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
		diffed = true

		errStr := migration_util.GetMapStringValue(m, "payload.pipeline.logging.result.error")
		if errStr != "" {
			errs = append(errs, errStr)
		}

		var (
			onlyInSource = migration_util.GetMapIntValue(m, "payload.pipeline.logging.context.index_diff.only_in_source.count")
			onlyInTarget = migration_util.GetMapIntValue(m, "payload.pipeline.logging.context.index_diff.only_in_target.count")
			diffBoth     = migration_util.GetMapIntValue(m, "payload.pipeline.logging.context.index_diff.diff_both.count")
		)
		onlyInSourceCount += onlyInSource
		onlyInTargetCount += onlyInTarget
		diffBothCount += diffBoth

		var (
			onlyInSourceDocs = migration_util.GetMapStringSliceValue(m, "payload.pipeline.logging.context.index_diff.only_in_source.keys")
			onlyInTargetDocs = migration_util.GetMapStringSliceValue(m, "payload.pipeline.logging.context.index_diff.only_in_target.keys")
			diffBothDocs     = migration_util.GetMapStringSliceValue(m, "payload.pipeline.logging.context.index_diff.diff_both.keys")
		)
		totalOnlyInSourceDocs = append(totalOnlyInSourceDocs, onlyInSourceDocs...)
		totalOnlyInTargetDocs = append(totalOnlyInTargetDocs, onlyInTargetDocs...)
		totalDiffBothDocs = append(totalDiffBothDocs, diffBothDocs...)
	}
	return
}

func (p *processor) clearIndexDiffLabels(labels map[string]interface{}) {
	delete(labels, "only_in_source_count")
	delete(labels, "only_in_source_keys")
	delete(labels, "only_in_target_count")
	delete(labels, "only_in_target_keys")
	delete(labels, "diff_both_count")
	delete(labels, "diff_both_keys")
}
