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

package model

import (
	"errors"
	"fmt"
	"infini.sh/framework/core/util"
	"net"
	"strings"
	"time"
)

// 错误定义
var (
	ErrCreatedTimeNotProvided   = errors.New("created time not provided")
	ErrOperatorNotProvided      = errors.New("operator not provided")
	ErrLogTypeNotProvided       = errors.New("log type not provided or invalid")
	ErrResourceTypeNotProvided  = errors.New("resource type not provided or invalid")
	ErrEventNotProvided         = errors.New("event not provided")
	ErrEventSourceIPNotProvided = errors.New("event source ip not provided or invalid")
	ErrOperationNotProvided     = errors.New("operation not provided or invalid")
)

const (
	// LogTypeOperation 表示操作日志
	LogTypeOperation = "operation"
	// LogTypeAccess 表示访问日志
	LogTypeAccess = "access"

	// ResourceTypeAuditLog 表示审计日志
	ResourceTypeAuditLog = "audit_log"
	// ResourceTypeAccountCenter 表示账户中心
	ResourceTypeAccountCenter = "account_center"
	// ResourceTypeClusterManagement 表示集群管理
	ResourceTypeClusterManagement = "cluster_management"
	// ResourceTypeDevTool 表示开发工具
	ResourceTypeDevTool = "dev_tool"
	// ResourceTypeDataMigration 表示数据迁移
	ResourceTypeDataMigration = "data_migration"

	// OperationTypeLogin 表示登录
	OperationTypeLogin = "login"
	// OperationTypeDeletion 表示删除
	OperationTypeDeletion = "deletion"
	// OperationTypeModification 表示修改
	OperationTypeModification = "modification"
	// OperationTypeNew 表示新建
	OperationTypeNew = "new"
	// OperationTypeAccess 表示访问
	OperationTypeAccess = "access"
)

// CheckLogType 检查日志类型是否合法
func CheckLogType(logType string) bool {
	switch logType {
	case LogTypeOperation, LogTypeAccess:
		return true
	}
	return false
}

// CheckResourceType 检查资源类型是否合法
func CheckResourceType(resourceType string) bool {
	switch resourceType {
	case ResourceTypeAuditLog,
		ResourceTypeAccountCenter,
		ResourceTypeClusterManagement,
		ResourceTypeDevTool,
		ResourceTypeDataMigration:
		return true
	}
	return false
}

// CheckOperationType 检查操作类型是否合法
func CheckOperationType(operationType string) bool {
	switch operationType {
	case OperationTypeLogin, OperationTypeDeletion,
		OperationTypeModification, OperationTypeNew, OperationTypeAccess:
		return true
	}
	return false
}

// AuditLog 表示审计日志
type AuditLog struct {
	// 日志 ID，插入后返回
	ID string `json:"id,omitempty" elastic_meta:"_id" elastic_mapping:"id:{type:keyword}"`
	// 日志条目的创建时间
	Timestamp time.Time `json:"timestamp" elastic_mapping:"timestamp:{type:date}"`
	// 日志元数据
	Metadata AuditLogMetadata `json:"metadata" elastic_mapping:"metadata:{type:object}"`
}

// AuditLogMetadata 表示审计日志元数据
type AuditLogMetadata struct {
	// 操作者。比如 Zora
	Operator string `json:"operator"`
	// 日志类型。比如操作日志
	LogType string `json:"log_type" elastic_mapping:"log_type:{type:keyword}"`
	// 资源类型。比如审计日志
	ResourceType string `json:"resource_type" elastic_mapping:"resource_type:{type:keyword}"`
	// 事件定义。包括：
	// - event_name：事件名称。比如删除 ES 集群实例
	// - event_source_ip：事件源 IP。比如 175.0.24.182(中国 湖南省 长沙市 中国电信)
	// - team：团队。比如运维团队
	// - resource_name：资源名称。比如 es-7104
	// - operation：操作。比如删除
	// - event_record：事件记录。比如操作语句和查询参数
	Labels util.MapStr `json:"labels"  elastic_mapping:"labels:{type:object}"`
}

// Reset 将一些字段重置。比如在插入前清空 ID 等
func (log *AuditLog) Reset() *AuditLog {
	log.ID = ""
	if log.Timestamp.IsZero() {
		log.Timestamp = time.Now()
	}
	return log
}

// Validate 检查字段是否合法
func (log *AuditLog) Validate() error {
	if log.Timestamp.IsZero() {
		return ErrCreatedTimeNotProvided
	}
	// 操作者不能为空
	if log.Metadata.Operator == "" {
		return ErrOperatorNotProvided
	}
	if !CheckLogType(log.Metadata.LogType) {
		return ErrLogTypeNotProvided
	}
	if !CheckResourceType(log.Metadata.ResourceType) {
		return ErrResourceTypeNotProvided
	}
	if log.Metadata.Labels == nil {
		return ErrEventNotProvided
	}
	// 事件名称可以为空
	// 检查事件源 IP 是否合法
	eventSourceIPAny, found := log.Metadata.Labels["event_source_ip"]
	if !found {
		return ErrEventSourceIPNotProvided
	}
	eventSourceIP, ok := eventSourceIPAny.(string)
	if !ok {
		return ErrEventSourceIPNotProvided
	}
	leftParenthesisIndex := strings.Index(eventSourceIP, "(")
	if leftParenthesisIndex < 0 {
		// 如果没有括号，那么将字段视为 IP 地址
		if net.ParseIP(eventSourceIP) == nil {
			return ErrEventSourceIPNotProvided
		}
	} else {
		ipPart := eventSourceIP[:leftParenthesisIndex]
		if net.ParseIP(ipPart) == nil {
			return ErrEventSourceIPNotProvided
		}
		ipPlacePart := eventSourceIP[leftParenthesisIndex:]
		if len(ipPlacePart) < 2 {
			// 允许 IP 归属地为空
			return ErrEventSourceIPNotProvided
		}
	}
	// 团队可以为空
	// 资源名称可以为空
	operationAny, found := log.Metadata.Labels["operation"]
	if !found {
		return ErrOperationNotProvided
	}
	operation, ok := operationAny.(string)
	if !ok || !CheckOperationType(operation) {
		return ErrOperationNotProvided
	}
	// 事件记录可以为空

	// ID 可以为空

	return nil
}

// AuditLogBuilder 用于构造 AuditLog 实例
type AuditLogBuilder struct {
	id        string
	timestamp time.Time
	metaData  AuditLogMetadata
}

// NewAuditLogBuilder 构造空的 AuditLogBuilder 实例
func NewAuditLogBuilder() *AuditLogBuilder {
	builder := new(AuditLogBuilder)
	builder.metaData.Labels = make(util.MapStr)
	return builder
}

// NewAuditLogBuilderWithDefault 构造带默认值的 Builder
func NewAuditLogBuilderWithDefault() *AuditLogBuilder {
	return NewAuditLogBuilder().
		WithOperator("").
		WithLogTypeAccess().
		WithResourceTypeAuditLog().
		WithEventName("").
		WithTimestampNow().
		WithEventSourceIP(net.IPv4zero.String()).
		WithTeam("").
		WithResourceName("").
		WithOperationTypeAccess().
		WithEventRecord("")
}

// WithID 设置 ID
func (builder *AuditLogBuilder) WithID(id string) *AuditLogBuilder {
	builder.id = id
	return builder
}

// WithOperator 设置操作者
func (builder *AuditLogBuilder) WithOperator(operator string) *AuditLogBuilder {
	if operator == "" {
		operator = "unknown"
	}
	builder.metaData.Operator = operator
	return builder
}

// WithLogTypeOperation 将日志类型日志设置为操作日志
func (builder *AuditLogBuilder) WithLogTypeOperation() *AuditLogBuilder {
	builder.metaData.LogType = LogTypeOperation
	return builder
}

// WithLogTypeAccess 将日志类型设置为访问日志
func (builder *AuditLogBuilder) WithLogTypeAccess() *AuditLogBuilder {
	builder.metaData.LogType = LogTypeAccess
	return builder
}

// WithResourceTypeAuditLog 将资源类型设置为审计日志
func (builder *AuditLogBuilder) WithResourceTypeAuditLog() *AuditLogBuilder {
	builder.metaData.ResourceType = ResourceTypeAuditLog
	return builder
}

// WithResourceTypeAccountCenter 将资源类型设置为账户中心
func (builder *AuditLogBuilder) WithResourceTypeAccountCenter() *AuditLogBuilder {
	builder.metaData.ResourceType = ResourceTypeAccountCenter
	return builder
}

// WithResourceTypeClusterManagement 将资源类型设置为集群管理
func (builder *AuditLogBuilder) WithResourceTypeClusterManagement() *AuditLogBuilder {
	builder.metaData.ResourceType = ResourceTypeClusterManagement
	return builder
}

// WithResourceTypeDevTool 将资源类型设置为开发工具
func (builder *AuditLogBuilder) WithResourceTypeDevTool() *AuditLogBuilder {
	builder.metaData.ResourceType = ResourceTypeDevTool
	return builder
}

// WithResourceTypeDataMigration 将资源类型设置为数据迁移
func (builder *AuditLogBuilder) WithResourceTypeDataMigration() *AuditLogBuilder {
	builder.metaData.ResourceType = ResourceTypeDataMigration
	return builder
}

// WithEventName 设置事件名称
func (builder *AuditLogBuilder) WithEventName(eventName string) *AuditLogBuilder {
	builder.metaData.Labels["event_name"] = eventName
	return builder
}

// WithTimestamp 设置时间戳
func (builder *AuditLogBuilder) WithTimestamp(eventTime time.Time) *AuditLogBuilder {
	builder.timestamp = eventTime
	return builder
}

// WithTimestampNow 将时间戳设置为当前时间
func (builder *AuditLogBuilder) WithTimestampNow() *AuditLogBuilder {
	return builder.WithTimestamp(time.Now())
}

// WithEventSourceIPAndPlace 设置事件源 IP 和 IP 归属地
func (builder *AuditLogBuilder) WithEventSourceIPAndPlace(eventSourceIP, ipPlace string) *AuditLogBuilder {
	if net.ParseIP(eventSourceIP) == nil {
		// 对于无效 IP，保存为 0.0.0.0
		eventSourceIP = net.IPv4zero.String()
	}
	// 如果 IP 归属地为空，那么省略括号中的部分
	s := eventSourceIP
	if ipPlace != "" {
		s = fmt.Sprintf("%s(%s)", eventSourceIP, ipPlace)
	}
	builder.metaData.Labels["event_source_ip"] = s
	return builder
}

// WithEventSourceIP 设置事件源 IP，将根据 IP 地址获取其归属地
func (builder *AuditLogBuilder) WithEventSourceIP(eventSourceIP string) *AuditLogBuilder {
	ipPlace := ""
	// TODO：根据 IP 地址获取归属地
	return builder.WithEventSourceIPAndPlace(eventSourceIP, ipPlace)
}

// WithTeam 设置团队
func (builder *AuditLogBuilder) WithTeam(team string) *AuditLogBuilder {
	builder.metaData.Labels["team"] = team
	return builder
}

// WithResourceName 设置资源名称
func (builder *AuditLogBuilder) WithResourceName(resourceName string) *AuditLogBuilder {
	builder.metaData.Labels["resource_name"] = resourceName
	return builder
}

// WithOperationTypeLogin 将操作类型设置为登录
func (builder *AuditLogBuilder) WithOperationTypeLogin() *AuditLogBuilder {
	builder.metaData.Labels["operation"] = OperationTypeLogin
	return builder
}

// WithOperationTypeDeletion 将操作类型设置为删除
func (builder *AuditLogBuilder) WithOperationTypeDeletion() *AuditLogBuilder {
	builder.metaData.Labels["operation"] = OperationTypeDeletion
	return builder
}

// WithOperationTypeModification 将操作类型设置为修改
func (builder *AuditLogBuilder) WithOperationTypeModification() *AuditLogBuilder {
	builder.metaData.Labels["operation"] = OperationTypeModification
	return builder
}

// WithOperationTypeNew 将操作类型设置为新建
func (builder *AuditLogBuilder) WithOperationTypeNew() *AuditLogBuilder {
	builder.metaData.Labels["operation"] = OperationTypeNew
	return builder
}

// WithOperationTypeAccess 将操作类型设置为访问
func (builder *AuditLogBuilder) WithOperationTypeAccess() *AuditLogBuilder {
	builder.metaData.Labels["operation"] = OperationTypeAccess
	return builder
}

// WithEventRecord 设置事件记录，比如操作语句或查询参数
func (builder *AuditLogBuilder) WithEventRecord(eventRecord string) *AuditLogBuilder {
	builder.metaData.Labels["event_record"] = eventRecord
	return builder
}

func (builder *AuditLogBuilder) Build() (a *AuditLog, err error) {
	// 构造对象
	a = new(AuditLog)
	a.ID = builder.id
	a.Timestamp = builder.timestamp
	a.Metadata = builder.metaData
	// 校验构造的对象
	err = a.Validate()
	return
}
