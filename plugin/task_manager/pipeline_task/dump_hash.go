package pipeline_task

import (
	"errors"
	"fmt"
	"time"

	log "github.com/cihub/seelog"
	migration_util "infini.sh/console/plugin/task_manager/util"
	"infini.sh/framework/core/task"
)

func (p *processor) handleRunningDumpHashPipelineTask(taskItem *task.Task) error {
	scrolledDocs, totalHits, scrolled, err := p.getDumpHashTaskState(taskItem)

	if !scrolled {
		return nil
	}

	var errMsg string
	if err != nil {
		errMsg = err.Error()
	}
	if errMsg == "" {
		if scrolledDocs < totalHits {
			errMsg = fmt.Sprintf("scrolled finished but docs count unmatch: %d / %d", scrolledDocs, totalHits)
		}
	}

	now := time.Now()
	taskItem.CompletedTime = &now
	taskItem.Metadata.Labels["scrolled_docs"] = scrolledDocs
	if errMsg != "" {
		taskItem.Status = task.StatusError
	} else {
		taskItem.Status = task.StatusComplete
	}

	p.saveTaskAndWriteLog(taskItem, &task.TaskResult{
		Success: errMsg == "",
		Error:   errMsg,
	}, fmt.Sprintf("[dump_hash] pipeline task [%s] completed", taskItem.ID))
	p.cleanGatewayPipeline(taskItem)
	return nil
}

func (p *processor) getDumpHashTaskState(taskItem *task.Task) (scrolledDocs int64, totalHits int64, scrolled bool, err error) {
	hits, err := p.getPipelineLogs(taskItem, []string{"FINISHED", "FAILED"}, taskItem.Updated.UnixMilli())
	if err != nil {
		log.Errorf("failed to get pipeline logs for task [%s], err: %v", taskItem.ID, err)
		err = nil
		return
	}
	if len(hits) == 0 {
		log.Debugf("scroll task [%s] not finished yet since last start", taskItem.ID)
		return
	}
	for _, m := range hits {
		scrolled = true

		errStr := migration_util.GetMapStringValue(m, "payload.pipeline.logging.result.error")
		if errStr != "" {
			err = errors.New(errStr)
			return
		}

		var (
			scroll = migration_util.GetMapIntValue(m, "payload.pipeline.logging.context.dump_hash.scrolled_docs")
			total  = migration_util.GetMapIntValue(m, "payload.pipeline.logging.context.dump_hash.total_hits")
		)

		scrolledDocs += scroll
		totalHits += total
	}
	return
}

func (p *processor) clearDumpHashLabels(labels map[string]interface{}) {
	delete(labels, "scrolled_docs")
}
