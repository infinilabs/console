package main

import (
	"fmt"
	log "github.com/cihub/seelog"
	"infini.sh/framework/core/api"
	"infini.sh/framework/core/ui"
	"infini.sh/framework/core/util"
	"infini.sh/framework/core/vfs"
	"infini.sh/search-center/.public"
	"infini.sh/search-center/api/index_management"
	"infini.sh/search-center/config"
	"net/http"
)

type UI struct {
	api.Handler
	config *config.AppConfig
}

func (h UI) InitUI() {

	vfs.RegisterFS(public.StaticFS{StaticFolder: h.config.UILocalPath, TrimLeftPath: h.config.UILocalPath , CheckLocalFirst: h.config.UILocalEnabled, SkipVFS: !h.config.UIVFSEnabled})

	ui.HandleUI("/", vfs.FileServer(vfs.VFS()))

	index_management.Init()

	ui.HandleUIFunc("/api/", func(w http.ResponseWriter, req *http.Request) {
		log.Warn("api: ",req.URL," not implemented")
		request, err := h.GetRawBody(req)
		if err != nil {
			fmt.Println(err)
			return
		}

		response:=map[string]interface{}{}
		response["request"]=string(request)

		w.Write(util.ToJSONBytes(request))
	})
}
