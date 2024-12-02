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

package audit_log

import (
	"context"
	"infini.sh/console/common"
	"infini.sh/console/core/security"
	"infini.sh/console/model"
	"infini.sh/console/service"
	"infini.sh/framework/core/api"
	"net/http"
	"regexp"
	"strings"
)

var overviewRegexp = regexp.MustCompile(`/elasticsearch/([^/]+)/(cluster_metrics|metrics|nodes/realtime|indices/realtime)`)

var _ api.Interceptor = (*MonitoringInterceptor)(nil)

type MonitoringInterceptor struct{}

func (m *MonitoringInterceptor) Match(request *http.Request) bool {
	return overviewRegexp.MatchString(request.URL.Path)
}

func (m *MonitoringInterceptor) PreHandle(c context.Context, _ http.ResponseWriter,
	request *http.Request) (context.Context, error) {
	handler := &api.Handler{}
	targetClusterID := ""
	eventName := ""
	matches := overviewRegexp.FindStringSubmatch(request.URL.Path)
	if len(matches) > 1 {
		targetClusterID = matches[1]
		eventName = strings.Replace(matches[2], "/", " ", -1)
	}
	claims, auditLogErr := security.ValidateLogin(request.Header.Get("Authorization"))
	if auditLogErr == nil && handler.GetHeader(request, "Referer", "") != "" {
		auditLog, _ := model.NewAuditLogBuilderWithDefault().WithOperator(claims.Username).
			WithLogTypeAccess().WithResourceTypeClusterManagement().
			WithEventName("monitoring " + eventName).WithEventSourceIP(common.GetClientIP(request)).
			WithResourceName(targetClusterID).WithOperationTypeAccess().WithEventRecord(request.URL.RawQuery).Build()
		_ = service.LogAuditLog(auditLog)
	}
	return c, nil
}

func (m *MonitoringInterceptor) PostHandle(_ context.Context, _ http.ResponseWriter, _ *http.Request) {
}

func (m *MonitoringInterceptor) Name() string {
	return "monitoring_interceptor"
}
