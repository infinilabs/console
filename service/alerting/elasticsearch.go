package alerting

import (
	"errors"
	"fmt"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"net/http"
	"runtime/debug"
	"strings"
)

type SearchBody struct {
	Query IfaceMap `json:"query"`
	Index string `json:"index"`
	Size int `json:"size"`
}

func Search(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}
	var body = SearchBody{}
	err := decodeJSON(req.Body, &body)
	if err != nil {
		writeError(w, err)
		return
	}
	config := getDefaultConfig()
	reqUrl := fmt.Sprintf("%s/%s/_search", config.Endpoint, body.Index)

	body.Query["size"] = body.Size
	res, err := doRequest(reqUrl, http.MethodPost, nil, body.Query)
	if err != nil {
		writeError(w, err)
		return
	}
	defer res.Body.Close()
	var resBody = IfaceMap{}
	err = decodeJSON(res.Body, &resBody)
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, IfaceMap{
		"ok": true,
		"resp": resBody,
	}, http.StatusOK)

}

func GetIndices(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}

	var body = struct{
		Index string `json:"index"`
	}{}
	err := decodeJSON(req.Body, &body)
	if err != nil {
		writeError(w, err)
		return
	}
	reqUrl := fmt.Sprintf("%s/_cat/indices/%s", conf.Endpoint, body.Index)
	params := map[string]string{
		"format": "json",
		"h": "health,index,status",
	}
	res, err := doRequest(reqUrl, http.MethodGet, params, nil)
	if err != nil {
		writeError(w, err)
		return
	}
	defer res.Body.Close()
	var resBody = []IfaceMap{}
	err = decodeJSON(res.Body, &resBody)
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, IfaceMap{
		"ok": true,
		"resp": resBody,
	}, http.StatusOK)
}

func GetAliases(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	defer func() {
		if err := recover(); err != nil {
			debug.PrintStack()
		}
	}()
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}

	var body = struct{
		Alias string `json:"alias"`
	}{}
	err := decodeJSON(req.Body, &body)
	if err != nil {
		writeError(w, err)
		return
	}
	reqUrl := fmt.Sprintf("%s/_cat/aliases/%s", conf.Endpoint, body.Alias)
	params := map[string]string{
		"format": "json",
		"h": "alias,index",
	}
	res, err := doRequest(reqUrl, http.MethodGet, params, nil)
	if err != nil {
		writeError(w, err)
		return
	}
	defer res.Body.Close()
	var resBody = []IfaceMap{}
	err = decodeJSON(res.Body, &resBody)
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, IfaceMap{
		"ok": true,
		"resp": resBody,
	}, http.StatusOK)
}

func GetMappings(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}

	var body = struct{
		Index []string `json:"index"`
	}{}
	err := decodeJSON(req.Body, &body)
	if err != nil {
		writeError(w, err)
		return
	}
	reqUrl := fmt.Sprintf("%s/%s/_mapping", conf.Endpoint, strings.Join(body.Index, ","))
	res, err := doRequest(reqUrl, http.MethodGet, nil, nil)
	if err != nil {
		writeError(w, err)
		return
	}
	defer res.Body.Close()
	var resBody = IfaceMap{}
	err = decodeJSON(res.Body, &resBody)
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, IfaceMap{
		"ok": true,
		"resp": resBody,
	}, http.StatusOK)
}


func GetPlugins(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}

	reqUrl := fmt.Sprintf("%s/_cat/plugins", conf.Endpoint)
	res, err := doRequest(reqUrl, http.MethodGet, map[string]string{
		"format": "json",
		"h": "component",
	}, nil)
	if err != nil {
		writeError(w, err)
		return
	}
	defer res.Body.Close()
	var resBody = []IfaceMap{}
	err = decodeJSON(res.Body, &resBody)
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, IfaceMap{
		"ok": true,
		"resp": resBody,
	}, http.StatusOK)
}

func GetSettings(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}

	// /_cluster/settings?include_defaults=true
	reqUrl := fmt.Sprintf("%s/_cluster/settings", conf.Endpoint)
	res, err := doRequest(reqUrl, http.MethodGet, map[string]string{
		"include_defaults": "true",
	}, nil)
	if err != nil {
		writeError(w, err)
		return
	}
	defer res.Body.Close()
	var resBody = IfaceMap{}
	err = decodeJSON(res.Body, &resBody)
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, IfaceMap{
		"ok": true,
		"resp": resBody,
	}, http.StatusOK)
}