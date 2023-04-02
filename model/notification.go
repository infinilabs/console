package model

import (
	"infini.sh/framework/core/orm"
)

type NotificationType string

const (
	NotificationTypeNotification NotificationType = "NOTIFICATION"
	NotificationTypeTodo         NotificationType = "TODO"
)

type MessageType string

const (
	MessageTypeNews      MessageType = "NEWS"
	MessageTypeAlerting  MessageType = "ALERTING"
	MessageTypeMigration MessageType = "MIGRATION"
)

type NotificationStatus string

const (
	NotificationStatusNew  NotificationStatus = "NEW"
	NotificationStatusRead NotificationStatus = "READ"
)

type Notification struct {
	orm.ORMObjectBase

	UserId           string             `json:"user_id,omitempty" elastic_mapping:"user_id: { type: keyword }"`
	NotificationType NotificationType   `json:"notification_type,omitempty" elastic_mapping:"notification_type:{type:keyword,fields:{text: {type: text}}}"`
	MessageType      MessageType        `json:"message_type,omitempty" elastic_mapping:"message_type:{type:keyword,fields:{text: {type: text}}}"`
	Status           NotificationStatus `json:"status,omitempty" elastic_mapping:"status: { type: keyword }"`
	Title            string             `json:"title,omitempty" elastic_mapping:"title: { type: keyword }"`
	Body             string             `json:"body,omitempty" elastic_mapping:"body: { type: keyword }"`
	Link             string             `json:"link,omitempty" elastic_mapping:"link: { type: keyword }"`
}
