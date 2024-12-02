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

package model

import (
	"infini.sh/framework/core/orm"
)

type NotificationType string

const (
	NotificationTypeNotification NotificationType = "notification"
	NotificationTypeTodo         NotificationType = "todo"
)

type MessageType string

const (
	MessageTypeNews       MessageType = "news"
	MessageTypeAlerting   MessageType = "alerting"
	MessageTypeMigration  MessageType = "migration"
	MessageTypeComparison MessageType = "comparison"
)

type NotificationStatus string

const (
	NotificationStatusNew  NotificationStatus = "new"
	NotificationStatusRead NotificationStatus = "read"
)

type Notification struct {
	orm.ORMObjectBase

	UserId      string             `json:"user_id,omitempty" elastic_mapping:"user_id: { type: keyword }"`
	Type        NotificationType   `json:"type,omitempty" elastic_mapping:"type:{type:keyword,fields:{text: {type: text}}}"`
	MessageType MessageType        `json:"message_type,omitempty" elastic_mapping:"message_type:{type:keyword,fields:{text: {type: text}}}"`
	Status      NotificationStatus `json:"status,omitempty" elastic_mapping:"status: { type: keyword }"`
	Title       string             `json:"title,omitempty" elastic_mapping:"title: { type: text }"`
	Body        string             `json:"body,omitempty" elastic_mapping:"body: { type: text }"`
	Link        string             `json:"link,omitempty" elastic_mapping:"link: { type: keyword }"`
}
