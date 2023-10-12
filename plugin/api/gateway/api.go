/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package gateway

import (
	"crypto/tls"
	log "github.com/cihub/seelog"
	"infini.sh/framework/core/api"
	"infini.sh/framework/core/api/rbac/enum"
	"net"
	"net/http"
	"net/url"
	"time"
)

type GatewayAPI struct {
	api.Handler
}

func InitAPI() {
	gateway:=GatewayAPI{}
	api.HandleAPIMethod(api.POST, "/gateway/instance/try_connect", gateway.RequireLogin(gateway.tryConnect))
	api.HandleAPIMethod(api.GET, "/gateway/instance/:instance_id", gateway.RequirePermission(gateway.getInstance, enum.PermissionGatewayInstanceRead))
	api.HandleAPIMethod(api.POST, "/gateway/instance", gateway.RequirePermission(gateway.createInstance, enum.PermissionGatewayInstanceWrite))
	api.HandleAPIMethod(api.PUT, "/gateway/instance/:instance_id", gateway.RequirePermission(gateway.updateInstance, enum.PermissionGatewayInstanceWrite))
	api.HandleAPIMethod(api.DELETE, "/gateway/instance/:instance_id", gateway.RequirePermission(gateway.deleteInstance, enum.PermissionGatewayInstanceWrite))
	api.HandleAPIMethod(api.GET, "/gateway/instance/_search", gateway.RequirePermission(gateway.searchInstance, enum.PermissionGatewayInstanceRead))
	api.HandleAPIMethod(api.POST, "/gateway/instance/status", gateway.RequirePermission(gateway.getInstanceStatus, enum.PermissionGatewayInstanceRead))

	api.HandleAPIMethod(api.POST, "/gateway/instance/:instance_id/_proxy", gateway.RequirePermission(gateway.proxy, enum.PermissionGatewayInstanceRead))
	
	api.HandleAPIFunc("/ws_proxy", func(w http.ResponseWriter, req *http.Request) {
		log.Debug(req.RequestURI)
		endpoint := req.URL.Query().Get("endpoint")
		path := req.URL.Query().Get("path")
		var tlsConfig = &tls.Config{
			InsecureSkipVerify: true,
		}
		target, err := url.Parse(endpoint)
		if err != nil {
			log.Error(err)
			return
		}
		newURL, err := url.Parse(path)
		if err != nil {
			log.Error(err)
			return
		}
		req.URL.Path = newURL.Path
		req.URL.RawPath = newURL.RawPath
		req.URL.RawQuery = ""
		req.RequestURI = req.URL.RequestURI()
		req.Header.Set("HOST", target.Host)
		req.Host = target.Host
		wsProxy := NewSingleHostReverseProxy(target)
		wsProxy.Dial = (&net.Dialer{
			Timeout:   30 * time.Second,
			KeepAlive: 30 * time.Second,
		}).Dial
		wsProxy.TLSClientConfig = tlsConfig
		wsProxy.ServeHTTP(w, req)
	})
}