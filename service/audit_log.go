/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package service

import (
	"infini.sh/console/model"
	"infini.sh/framework/core/queue"
	"infini.sh/framework/core/util"
)

const AuditLogQueueName = "logging-audit-log-queue"

type AuditLogAction struct {
	log *model.AuditLog
}

func NewAuditLogAction(log *model.AuditLog) *AuditLogAction {
	return &AuditLogAction{
		log: log,
	}
}

func (action AuditLogAction) Execute() ([]byte, error) {
	queueCfg := queue.GetOrInitConfig(AuditLogQueueName)
	msg := util.MustToJSONBytes(action.log)
	err := queue.Push(queueCfg, msg)
	return nil, err
}

// LogAuditLog 记录审计日志
func LogAuditLog(log *model.AuditLog) (err error) {
	if err = log.Validate(); err != nil {
		return err
	}
	_, err = NewAuditLogAction(log).Execute()
	return
}
