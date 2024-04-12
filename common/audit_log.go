/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package common

import (
	"infini.sh/framework/core/api"
	"net/http"
	"strings"
)

// GetClientIP 获取客户端 IP 地址
func GetClientIP(req *http.Request) string {
	h := new(api.Handler)
	// 1. 尝试从 XFF 头获取
	xff := h.GetHeader(req, "X-Forwarded-For", "")
	clientIP := strings.Split(xff, ",")[0]
	if len(clientIP) > 0 {
		return clientIP
	}
	// 2. 尝试从 X-Real-IP 头获取
	clientIP = h.GetHeader(req, "X-Real-IP", "")
	if len(clientIP) > 0 {
		return clientIP
	}
	// 3. 从 RemoteAddr 获取
	return strings.Split(req.RemoteAddr, ":")[0]
}
