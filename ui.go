package main

import (
	"fmt"
	"infini.sh/framework/core/global"
	"net/http"
	"src/github.com/segmentio/encoding/json"
	"strings"

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

	vfs.RegisterFS(public.StaticFS{StaticFolder: h.Config.UI.LocalPath, TrimLeftPath: h.Config.UI.LocalPath, CheckLocalFirst: h.Config.UI.LocalEnabled, SkipVFS: !h.Config.UI.VFSEnabled})

	ui.HandleUI("/", vfs.FileServer(vfs.VFS()))

	uiapi.Init(h.Config)

	var apiEndpoint = h.Config.UI.APIEndpoint
	if strings.TrimSpace(apiEndpoint) == "" {
		apiConfig := &global.Env().SystemConfig.APIConfig
		apiEndpoint = fmt.Sprintf("%s://%s", apiConfig.GetSchema(), apiConfig.NetworkConfig.GetPublishAddr())
	}

	ui.HandleUIFunc("/config", func(w http.ResponseWriter, req *http.Request){
		buf, _ := json.Marshal(util.MapStr{
			"api_endpoint": apiEndpoint,
		})
		w.Write(buf)
	})

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
