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
	MessageTypeNews      MessageType = "news"
	MessageTypeAlerting  MessageType = "alerting"
	MessageTypeMigration MessageType = "migration"
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
