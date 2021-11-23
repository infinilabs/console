package main

import (
	"fmt"
	public "infini.sh/search-center/.public"
	"net/http"

	log "github.com/cihub/seelog"
	"infini.sh/framework/core/api"
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

	api.HandleUI("/", vfs.FileServer(vfs.VFS()))

	uiapi.Init(h.Config)

	//var apiEndpoint = h.Config.UI.APIEndpoint
	//apiConfig := &global.Env().SystemConfig.APIConfig
	//
	//api.HandleUIFunc("/config", func(w http.ResponseWriter, req *http.Request){
	//	if(strings.TrimSpace(apiEndpoint) == ""){
	//		hostParts := strings.Split(req.Host, ":")
	//		apiEndpoint = fmt.Sprintf("%s//%s:%s", apiConfig.GetSchema(), hostParts[0], apiConfig.NetworkConfig.GetBindingPort())
	//	}
	//	buf, _ := json.Marshal(util.MapStr{
	//		"api_endpoint": apiEndpoint,
	//	})
	//	w.Write(buf)
	//})

	api.HandleUIFunc("/api/", func(w http.ResponseWriter, req *http.Request) {
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
