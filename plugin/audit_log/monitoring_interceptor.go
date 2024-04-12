/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package audit_log

import (
	"context"
	"infini.sh/console/common"
	"infini.sh/console/model"
	"infini.sh/console/service"
	"infini.sh/framework/core/api"
	"infini.sh/framework/core/api/rbac"
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
	claims, auditLogErr := rbac.ValidateLogin(request.Header.Get("Authorization"))
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
