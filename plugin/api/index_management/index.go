package index_management

import (
	"fmt"
	"infini.sh/framework/core/elastic"
	"net/http"
	"strconv"
	"strings"
	"time"

	"infini.sh/console/config"
	model2 "infini.sh/console/model"
	"infini.sh/framework/core/api"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
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
func (h APIHandler) ListIndex(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	clusterIds := h.GetParameterOrDefault(req, "ids", "")
	keyword := h.GetParameterOrDefault(req, "keyword", "")
	ids := strings.Split(clusterIds, ",")
	for i := range ids {
		if i < len(ids)-1 {
			ids[i] = `"` + ids[i] + `",`
		} else {
			ids[i] = `"` + ids[i] + `"`
		}

	}
	if len(ids) == 0 {
		h.Error400(w, "id is required")
		return
	}
	var dsl = `{
	"_source": ["metadata.index_name"],
	"collapse": {
	 "field": "metadata.index_name"
	},
	"size": 100,
	"query": {
	 "bool": {
	   "must": [
	     {
	       "terms": {
	         "metadata.cluster_id": %s
	       }
	     }%s
	   ],
	   "must_not": [
	     {
	       "term": {
	         "metadata.labels.state": {
	           "value": "delete"
	         }
	       }
	     }
	   ]
	 }
	}
	}`

	str := &strings.Builder{}

	if keyword != "" {
		str.WriteString(fmt.Sprintf(`,{"wildcard":{"metadata.index_name":{"value":"*%s*"}}}`, keyword))
	}
	dsl = fmt.Sprintf(dsl, ids, str)

	esClient := elastic.GetClient(h.Config.Elasticsearch)
	resp, err := esClient.SearchWithRawQueryDSL(".infini_index", []byte(dsl))
	if err != nil {

		return
	}
	list := resp.Hits.Hits
	var indexNames []string
	for _, v := range list {
		m := v.Source["metadata"].(map[string]interface{})
		indexNames = append(indexNames, m["index_name"].(string))

	}
	m := make(map[string]interface{})
	m["indexnames"] = indexNames
	h.WriteOKJSON(w, m)

	return
}
