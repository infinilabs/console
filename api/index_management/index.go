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
	)
	if len(tags) > 3 {
		tags = tags[0:3]
	}
	rel, err := model2.GetDictList(from, size, name, tags)
	if err != nil {
		handler.Error(w, err)
	}
	resp := map[string]interface{}{
		"errno":  "0",
		"errmsg": "",
		"data":   rel,
	}
	handler.WriteJSON(w, resp, http.StatusOK)
}

func (handler APIHandler) CreateDictItemAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	//id := ps.ByName("id")
	createdAt := time.Now()

	dict := model2.Dict{
		ID:        util.GetUUID(),
		CreatedAt: createdAt,
		UpdatedAt: createdAt,
	}
	err := handler.DecodeJSON(req, &dict)
	if err != nil {
		handler.WriteJSON(w, map[string]interface{}{
			"payload": nil,
			"errno":   "E100001",
			"errmsg":  err.Error(),
		}, http.StatusOK)
		return
	}

	err = orm.Save(dict)
	if err != nil {
		panic(err)
	}
	handler.WriteJSON(w, map[string]interface{}{
		"payload": dict,
		"errno":   "0",
		"errmsg":  "",
	}, http.StatusOK)
}

func (handler APIHandler) DeleteDictItemAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	dict := model2.Dict{}
	dict.ID = id

	err := orm.Delete(dict)
	if err != nil {
		panic(err)
	}
	handler.WriteJSON(w, map[string]interface{}{
		"errno":  "0",
		"errmsg": "",
	}, http.StatusOK)
}

func (handler APIHandler) UpdateDictItemAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	dict := model2.Dict{}
	err := handler.DecodeJSON(req, &dict)
	if err != nil {
		handler.WriteJSON(w, map[string]interface{}{
			"payload": nil,
			"errno":   "E100002",
			"errmsg":  err.Error(),
		}, http.StatusOK)
		return

	}
	dict.UpdatedAt = time.Now()

	err = orm.Update(dict)
	if err != nil {
		panic(err)
	}
	handler.WriteJSON(w, map[string]interface{}{
		"payload": dict,
		"errno":   "0",
		"errmsg":  "",
	}, http.StatusOK)

}

// TaskAction handle task creation and return task list which support parameter: `from`, `size` and `host`, eg:
//curl -XGET http://127.0.0.1:8001/task?from=100&size=10&host=elasticsearch.cn
func (handler APIHandler) TaskAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	//fr := handler.GetParameter(req, "from")
	//si := handler.GetParameter(req, "size")
	//host := handler.GetParameter(req, "host")
	//status := handler.GetIntOrDefault(req, "status", -1)
	//
	//from, err := strconv.Atoi(fr)
	//if err != nil {
	//	from = 0
	//}
	//size, err := strconv.Atoi(si)
	//if err != nil {
	//	size = 10
	//}
	//
	//orm.Search()
	//total, tasks, err := model.GetTaskList(from, size, host, status)
	//if err != nil {
	//	handler.Error(w, err)
	//} else {
	//	handler.WriteJSONListResult(w, total, tasks, http.StatusOK)
}
