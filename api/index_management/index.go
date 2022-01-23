package index_management

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"infini.sh/framework/core/api"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"infini.sh/search-center/config"
	model2 "infini.sh/search-center/model"
)

type APIHandler struct {
	Config *config.AppConfig
	api.Handler
}

func (handler APIHandler) GetDictListAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var (
		fromStr = handler.GetParameterOrDefault(req, "from", "0")
		sizeStr = handler.GetParameterOrDefault(req, "size", "6")
		tag     = handler.GetParameterOrDefault(req, "tags", "")
		name    = handler.GetParameterOrDefault(req, "name", "")
		from, _ = strconv.Atoi(fromStr)
		size, _ = strconv.Atoi(sizeStr)
		tags    = strings.Split(tag, ",")
		resp    = newResponseBody()
	)
	if len(tags) > 3 {
		tags = tags[0:3]
	}
	rel, err := model2.GetDictList(from, size, name, tags, handler.Config.Elasticsearch)
	if err != nil {
		resp["error"] = err
		resp["status"] = false
		handler.WriteJSON(w, resp, http.StatusOK)
		return
	}
	resp["payload"] = rel
	handler.WriteJSON(w, resp, http.StatusOK)
}

func (handler APIHandler) CreateDictItemAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	if strings.Trim(id, "/") == "" {
		id = util.GetUUID()
	}
	createdAt := time.Now()

	resp := newResponseBody()
	dict := model2.Dict{
		ID:        id,
		CreatedAt: createdAt,
		UpdatedAt: createdAt,
	}
	err := handler.DecodeJSON(req, &dict)
	if err != nil {
		resp["status"] = false
		resp["error"] = err
		handler.WriteJSON(w, resp, http.StatusOK)
		return
	}

	err = orm.Create(&dict)
	if err != nil {
		resp["status"] = false
		resp["error"] = err
		handler.WriteJSON(w, resp, http.StatusOK)
		return
	}
	resp["payload"] = dict
	handler.WriteJSON(w, resp, http.StatusOK)
}

func (handler APIHandler) DeleteDictItemAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	dict := model2.Dict{}
	dict.ID = id
	resp := newResponseBody()

	err := orm.Delete(dict)
	if err != nil {
		resp["status"] = false
		resp["error"] = err
		handler.WriteJSON(w, resp, http.StatusOK)
		return
	}
	handler.WriteJSON(w, resp, http.StatusOK)
}

func (handler APIHandler) UpdateDictItemAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	dict := model2.Dict{}
	err := handler.DecodeJSON(req, &dict)
	resp := newResponseBody()
	if err != nil {
		resp["status"] = false
		resp["error"] = err
		handler.WriteJSON(w, resp, http.StatusOK)
		return

	}
	dict.UpdatedAt = time.Now()

	err = orm.Update(dict)
	if err != nil {
		resp["status"] = false
		resp["error"] = err
		handler.WriteJSON(w, resp, http.StatusOK)
		return
	}
	resp["payload"] = dict
	handler.WriteJSON(w, resp, http.StatusOK)

}

func (handler APIHandler) AccountLogin(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	data := util.MapStr{
		"status":           "ok",
		"type":             "account",
		"currentAuthority": "admin",
		"userid":           "10001",
	}

	handler.WriteJSON(w, data, http.StatusOK)
}

func (handler APIHandler) CurrentUser(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	data := []byte("{ \"name\": \"INFINI Labs\", \"avatar\": \"\", \"userid\": \"10001\", \"email\": \"hello@infini.ltd\", \"signature\": \"极限科技 - 专业的开源搜索与实时数据分析整体解决方案提供商。\", \"title\": \"首席设计师\", \"group\": \"INFINI Labs－UED\", \"tags\": [ { \"key\": \"0\", \"label\": \"很有想法的\" }, { \"key\": \"1\", \"label\": \"专注设计\" }, { \"key\": \"2\", \"label\": \"辣~\" }, { \"key\": \"3\", \"label\": \"大长腿\" }, { \"key\": \"4\", \"label\": \"川妹子\" }, { \"key\": \"5\", \"label\": \"海纳百川\" } ], \"notifyCount\": 12, \"country\": \"China\", \"geographic\": { \"province\": { \"label\": \"湖南省\", \"key\": \"330000\" }, \"city\": { \"label\": \"长沙市\", \"key\": \"330100\" } }, \"address\": \"岳麓区湘江金融中心\", \"phone\": \"4001399200\" }")
	handler.Write(w, data)
}
