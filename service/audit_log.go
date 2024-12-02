// Copyright (C) INFINI Labs & INFINI LIMITED.
//
// The INFINI Console is offered under the GNU Affero General Public License v3.0
// and as commercial software.
//
// For commercial licensing, contact us at:
//   - Website: infinilabs.com
//   - Email: hello@infini.ltd
//
// Open Source licensed under AGPL V3:
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

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
