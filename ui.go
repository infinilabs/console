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

package main

import (
	"fmt"
	public "infini.sh/console/.public"
	"net/http"

	log "github.com/cihub/seelog"
	"infini.sh/console/config"
	uiapi "infini.sh/console/plugin/api"
	"infini.sh/framework/core/api"
	"infini.sh/framework/core/util"
	"infini.sh/framework/core/vfs"
)

type UI struct {
	api.Handler
	Config *config.AppConfig
}

func (h UI) InitUI() {

	vfs.RegisterFS(public.StaticFS{StaticFolder: h.Config.UI.LocalPath, TrimLeftPath: h.Config.UI.LocalPath, CheckLocalFirst: h.Config.UI.LocalEnabled, SkipVFS: !h.Config.UI.VFSEnabled})

	api.HandleUI("/", vfs.FileServer(vfs.VFS()))

	uiapi.Init(h.Config)

	//var apiEndpoint = h.Config.UI.APIEndpoint
	//apiConfig := &global.Env().SystemConfig.APIConfig
	//
	//api.HandleUIFunc("/config", func(w http.ResponseWriter, req *http.Request){
	//	if(strings.TrimSpace(apiEndpoint) == ""){
	//		hostParts := strings.Split(req.RemoteIP, ":")
	//		apiEndpoint = fmt.Sprintf("%s//%s:%s", apiConfig.GetSchema(), hostParts[0], apiConfig.NetworkConfig.GetBindingPort())
	//	}
	//	buf, _ := json.Marshal(util.MapStr{
	//		"api_endpoint": apiEndpoint,
	//	})
	//	w.Write(buf)
	//})

	api.HandleAPIFunc("/api/", func(w http.ResponseWriter, req *http.Request) {
		log.Warn("api: ", req.URL, " not implemented")
		request, err := h.GetRawBody(req)
		if err != nil {
			fmt.Println(err)
			return
		}

		response := map[string]interface{}{}
		response["request"] = string(request)

		w.Write(util.MustToJSONBytes(request))
	})
}
