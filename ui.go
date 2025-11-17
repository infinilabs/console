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
	"bytes"
	public "infini.sh/console/.public"
	"infini.sh/framework/core/global"
	"io"
	"net/http"
	"strings"

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

	basePath := "/" + strings.Trim(global.Env().SystemConfig.WebAppConfig.BasePath, "/")

	// a) Create the handler for all static files.
	//    This is the "default" action for most requests in the sub-path.
	staticFilesHandler := vfs.FileServer(vfs.VFS())

	// b) Create the final handler that acts as a dispatcher for the sub-path.
	finalHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Check if the request is for the sub-path's entrypoint.
		if r.Method == "GET" && (r.URL.Path == "/" || r.URL.Path == basePath+"/" || r.URL.Path == basePath) {
			serveDynamicIndex(w, r, basePath)
			return
		}

		// For all other requests, delegate to the static file handler.
		staticFilesHandler.ServeHTTP(w, r)
	})

	// c) Register the final dispatcher to handle the entire sub-path.
	if basePath != "/" {
		api.HandleUI(basePath, finalHandler)
		api.HandleUI(basePath+"/", finalHandler)
	}
	api.HandleUI("/", finalHandler)

	uiapi.Init(h.Config)

	api.HandleAPIFunc("/api/", func(w http.ResponseWriter, req *http.Request) {
		request, err := h.GetRawBody(req)
		if err != nil {
			log.Errorf("api: error reading request body: ", err)
			return
		}

		response := map[string]interface{}{}
		response["request"] = string(request)

		w.Write(util.MustToJSONBytes(request))
	})
}

// Helper function for serving the DYNAMIC index.html with replacements.
func serveDynamicIndex(w http.ResponseWriter, r *http.Request, basePath string) {
	file, err := vfs.VFS().Open("/index.html")
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer file.Close()
	content, err := io.ReadAll(file)
	if err != nil {
		http.Error(w, "Cannot read index.html", http.StatusInternalServerError)
		return
	}

	jsBasePath := basePath + "/"
	if basePath == "/" {
		jsBasePath = basePath
	}

	content = bytes.ReplaceAll(content, []byte(`href="/`), []byte(`href="`+jsBasePath))
	content = bytes.ReplaceAll(content, []byte(`src="/`), []byte(`src="`+jsBasePath))
	content = bytes.ReplaceAll(content, []byte(`window.routerBase = "/";`), []byte(`window.routerBase = "`+jsBasePath+`";`))
	content = bytes.ReplaceAll(content, []byte(`window.publicPath = "/";`), []byte(`window.publicPath = "`+jsBasePath+`";`))

	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write(content)
}
