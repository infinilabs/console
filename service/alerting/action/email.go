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

package action

import (
	"fmt"
	"infini.sh/console/model/alerting"
	"infini.sh/framework/core/queue"
	"infini.sh/framework/core/util"
)

type EmailAction struct {
	Data *alerting.Email
	Subject string
	Body string
}

const EmailQueueName = "email_messages"

func (act *EmailAction) Execute()([]byte, error){
	queueCfg := queue.GetOrInitConfig(EmailQueueName)
	if act.Data.ServerID == "" {
		return nil, fmt.Errorf("parameter server_id must not be empty")
	}
	emailMsg := util.MapStr{
		"server_id": act.Data.ServerID,
		"email": act.Data.Recipients.To,
		"template": "raw",
		"variables": util.MapStr{
			"subject": act.Subject,
			"body": act.Body,
			"content_type": act.Data.ContentType,
			"cc": act.Data.Recipients.CC,
		},
	}
	emailMsgBytes := util.MustToJSONBytes(emailMsg)
	err := queue.Push(queueCfg, emailMsgBytes)
	return nil, err
}