package alerting

import (
	"errors"
	"fmt"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/util"
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
	var body = SearchBody{}
	err := decodeJSON(req.Body, &body)
	if err != nil {
		writeError(w, err)
		return
	}
	config := getDefaultConfig()
	esClient := elastic.GetClient(config.ID)
	body.Query["size"] = body.Size
	searchRes, err := esClient.SearchWithRawQueryDSL(body.Index, util.MustToJSONBytes(body.Query))
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, IfaceMap{
		"ok": true,
		"resp": searchRes,
	}, http.StatusOK)

}

func GetIndices(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	esClient := elastic.GetClient(id)
	if esClient == nil {
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

	indexInfos, err := esClient.GetIndices( body.Index)
	if err != nil {
		writeError(w, err)
		return
	}
	indices := make([]elastic.IndexInfo, 0, len(*indexInfos))
	for _, info := range *indexInfos {
		indices = append(indices, info)
	}
	writeJSON(w, IfaceMap{
		"ok": true,
		"resp": indices,
	}, http.StatusOK)
}

func GetAliases(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	defer func() {
		if err := recover(); err != nil {
			debug.PrintStack()
		}
	}()
	id := ps.ByName("id")
	esClient := elastic.GetClient(id)
	if esClient == nil {
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
	//reqUrl := fmt.Sprintf("%s/_cat/aliases/%s", meta.GetActiveEndpoint(), body.Alias)
	//params := map[string]string{
	//	"format": "json",
	//	"h": "alias,index",
	//}
	res, err := esClient.GetAliases()
	if err != nil {
		writeError(w, err)
		return
	}
	aliases := make([]elastic.AliasInfo, 0, len(*res))
	for _, alias := range *res {
		aliases =append(aliases, alias)
	}
	writeJSON(w, IfaceMap{
		"ok": true,
		"resp": aliases,
	}, http.StatusOK)
}

func GetMappings(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	esClient := elastic.GetClient(id)
	if esClient == nil {
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
	_, _, mappings, err := esClient.GetMapping(false, strings.Join(body.Index, ","))
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, IfaceMap{
		"ok": true,
		"resp": mappings,
	}, http.StatusOK)
}

func GetSettings(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	// /_cluster/settings?include_defaults=true
	config := getDefaultConfig()
	reqUrl := fmt.Sprintf("%s/_cluster/settings", config.Endpoint)
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