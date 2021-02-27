package main

import (
	"fmt"
	"net/http"

	public "infini.sh/search-center/.public"

	log "github.com/cihub/seelog"
	"infini.sh/framework/core/api"
	"infini.sh/framework/core/ui"
	"infini.sh/framework/core/util"
	"infini.sh/framework/core/vfs"
	uiapi "infini.sh/search-center/api"
	"infini.sh/search-center/config"
)

type UI struct {
	api.Handler
	Config *config.AppConfig
}

func (h UI) InitUI() {

	vfs.RegisterFS(public.StaticFS{StaticFolder: h.Config.UILocalPath, TrimLeftPath: h.Config.UILocalPath, CheckLocalFirst: h.Config.UILocalEnabled, SkipVFS: !h.Config.UIVFSEnabled})

	ui.HandleUI("/", vfs.FileServer(vfs.VFS()))

	uiapi.Init(h.Config)

	ui.HandleUIFunc("/api/", func(w http.ResponseWriter, req *http.Request) {
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
