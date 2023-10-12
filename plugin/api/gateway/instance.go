/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package gateway

import (
	"fmt"
	log "github.com/cihub/seelog"
	"github.com/segmentio/encoding/json"
	"infini.sh/console/model"
	"infini.sh/framework/core/agent"
	httprouter "infini.sh/framework/core/api/router"
	elastic2 "infini.sh/framework/core/elastic"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/proxy"
	"infini.sh/framework/core/task"
	"infini.sh/framework/core/util"
	"infini.sh/framework/modules/elastic"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

func (h *GatewayAPI) createInstance(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var obj = &model.Instance{}
	err := h.DecodeJSON(req, obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	res, err := h.doConnect(obj.Endpoint, obj.BasicAuth)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	obj.ID = res.ID

	exists, err := orm.Get(obj)
	if err != nil && err != elastic.ErrNotFound {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	if exists {
		h.WriteError(w, "gateway instance already registered", http.StatusInternalServerError)
		return
	}
	err = orm.Create(nil, obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	h.WriteJSON(w, util.MapStr{
		"_id":    obj.ID,
		"result": "created",
	}, 200)

}

func (h *GatewayAPI) getInstance(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("instance_id")

	obj := model.Instance{}
	obj.ID = id

	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":   id,
			"found": false,
		}, http.StatusNotFound)
		return
	}
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	h.WriteJSON(w, util.MapStr{
		"found":   true,
		"_id":     id,
		"_source": obj,
	}, 200)
}

func (h *GatewayAPI) updateInstance(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("instance_id")
	obj := model.Instance{}

	obj.ID = id
	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":    id,
			"result": "not_found",
		}, http.StatusNotFound)
		return
	}

	id = obj.ID
	create := obj.Created
	obj = model.Instance{}
	err = h.DecodeJSON(req, &obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	//protect
	obj.ID = id
	obj.Created = create
	err = orm.Update(nil, &obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	h.WriteJSON(w, util.MapStr{
		"_id":    obj.ID,
		"result": "updated",
	}, 200)
}

func (h *GatewayAPI) deleteInstance(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.MustGetParameter("instance_id")

	obj := model.Instance{}
	obj.ID = id

	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":    id,
			"result": "not_found",
		}, http.StatusNotFound)
		return
	}

	//check reference
	query := util.MapStr{
		"size": 1,
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"metadata.labels.permit_nodes.id": util.MapStr{
								"value": id,
							},
						},
					},
					{
						"terms": util.MapStr{
							"metadata.type": []string{"cluster_migration", "cluster_comparison"},
						},
					},
				},
				"must_not": []util.MapStr{
					{
						"terms": util.MapStr{
							"status": []string{task.StatusError, task.StatusComplete},
						},
					},
				},
			},
		},
	}
	q := &orm.Query{
		RawQuery: util.MustToJSONBytes(query),
	}
	err, result := orm.Search(task.Task{}, q)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	if len(result.Result) > 0 {
		var taskId interface{}
		if m, ok := result.Result[0].(map[string]interface{}); ok {
			taskId = m["id"]
		}
		h.WriteError(w, fmt.Sprintf("failed to delete gateway instance [%s] since it is used by task [%v]", id, taskId), http.StatusInternalServerError)
		return
	}

	err = orm.Delete(nil, &obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	h.WriteJSON(w, util.MapStr{
		"_id":    obj.ID,
		"result": "deleted",
	}, 200)
}

func (h *GatewayAPI) searchInstance(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var (
		keyword     = h.GetParameterOrDefault(req, "keyword", "")
		strSize     = h.GetParameterOrDefault(req, "size", "20")
		strFrom     = h.GetParameterOrDefault(req, "from", "0")
		sort = h.GetParameterOrDefault(req, "sort", "created:desc")
	)
	mustQ := []interface{}{}
	if keyword != "" {
		mustQ = append(mustQ, util.MapStr{
			"query_string": util.MapStr{"default_field":"*","query": fmt.Sprintf("*%s*", keyword)},
		})
	}
	size, _ := strconv.Atoi(strSize)
	if size <= 0 {
		size = 20
	}
	from, _ := strconv.Atoi(strFrom)
	if from < 0 {
		from = 0
	}
	var (
		sortField string
		sortDirection string
	)
	sortParts := strings.Split(sort, ":")
	sortField = sortParts[0]
	if len(sortParts) >= 2 {
		sortDirection = sortParts[1]
	}
	if sortDirection == "" {
		sortDirection = "asc"
	}
	query := util.MapStr{
		"size": size,
		"from": from,
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": mustQ,
			},
		},
		"sort": []util.MapStr{
			{
				sortField: util.MapStr{
					"order": sortDirection,
				},
			},
		},
	}

	q := orm.Query{
		RawQuery: util.MustToJSONBytes(query),
	}

	err, res := orm.Search(&model.Instance{}, &q)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.Write(w, res.Raw)
}

func (h *GatewayAPI) getInstanceStatus(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var instanceIDs = []string{}
	err := h.DecodeJSON(req, &instanceIDs)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if len(instanceIDs) == 0 {
		h.WriteJSON(w, util.MapStr{}, http.StatusOK)
		return
	}
	q := orm.Query{}
	queryDSL := util.MapStr{
		"query": util.MapStr{
			"terms": util.MapStr{
				"_id": instanceIDs,
			},
		},
	}
	q.RawQuery = util.MustToJSONBytes(queryDSL)

	err, res := orm.Search(&model.Instance{}, &q)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	result := util.MapStr{}
	for _, item := range res.Result {
		instance := util.MapStr(item.(map[string]interface{}))
		if err != nil {
			log.Error(err)
			continue
		}
		endpoint, _ := instance.GetValue("endpoint")
		username, _ := instance.GetValue("basic_auth.username")
		if username == nil {
			username = ""
		}
		password, _ := instance.GetValue("basic_auth.password")
		if  password == nil {
			password = ""
		}
		gid, _ := instance.GetValue("id")
		res, err :=  proxy.DoProxyRequest(&proxy.Request{
			Endpoint: endpoint.(string),
			Method: http.MethodGet,
			Path: "/stats",
			BasicAuth: agent.BasicAuth{
				Username: username.(string),
				Password: password.(string),
			},
		})
		if err != nil {
			log.Error(err)
			result[gid.(string)] = util.MapStr{}
			continue
		}
		var resMap = util.MapStr{}
		err = util.FromJSONBytes(res.Body, &resMap)
		if err != nil {
			result[gid.(string)] = util.MapStr{}
			log.Errorf("get stats of %v error: %v", endpoint, err)
			continue
		}

		result[gid.(string)] = resMap
	}
	h.WriteJSON(w, result, http.StatusOK)
}
func (h *GatewayAPI) proxy(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var (
		method = h.Get(req, "method", "GET")
		path = h.Get(req, "path", "")
	)
	instanceID := ps.MustGetParameter("instance_id")

	obj := model.Instance{}
	obj.ID = instanceID

	exists, err := orm.Get(&obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	if !exists  {
		h.WriteJSON(w, util.MapStr{
			"error": "gateway instance not found",
		}, http.StatusNotFound)
		return
	}
	res, err :=  proxy.DoProxyRequest(&proxy.Request{
		Method: method,
		Endpoint: obj.Endpoint,
		Path: path,
		Body: req.Body,
		BasicAuth: obj.BasicAuth,
		ContentLength: int(req.ContentLength),
	})
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	h.WriteHeader(w, res.StatusCode)
	h.Write(w, res.Body)
}

type GatewayConnectResponse struct {
	ID string `json:"id"`
	Name string `json:"name"`
	Tagline string `json:"tagline"`
	Version struct {
		BuildDate string `json:"build_date"`
		BuildHash string `json:"build_hash"`
		EOLDate string `json:"eol_date"`
		Number string `json:"number"`
	} `json:"version"`

}
func (h *GatewayAPI) doConnect(endpoint string, basicAuth agent.BasicAuth) (*GatewayConnectResponse, error) {
	res, err := proxy.DoProxyRequest(&proxy.Request{
		Method: http.MethodGet,
		Endpoint: endpoint,
		Path: "/_framework/api/_info",
		BasicAuth: basicAuth,
	})
	if err != nil {
		return nil, err
	}
	if res.StatusCode == http.StatusNotFound {
		return nil, fmt.Errorf("unknow gateway version")
	}
	b := res.Body
	gres := &GatewayConnectResponse{}
	err = json.Unmarshal(b, gres)
	return gres, err

}

func (h *GatewayAPI) tryConnect(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var reqBody = struct {
		Endpoint string `json:"endpoint"`
		BasicAuth agent.BasicAuth
	}{}
	err := h.DecodeJSON(req, &reqBody)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	connectRes, err := h.doConnect(reqBody.Endpoint, reqBody.BasicAuth)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteJSON(w, connectRes, http.StatusOK)
}

func (h *GatewayAPI) getExecutionNodes(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	var (
		keyword        = h.GetParameterOrDefault(req, "keyword", "")
		strSize     = h.GetParameterOrDefault(req, "size", "10")
		strFrom     = h.GetParameterOrDefault(req, "from", "0")
	)
	size, _ := strconv.Atoi(strSize)
	if size <= 0 {
		size = 10
	}
	from, _ := strconv.Atoi(strFrom)
	if from < 0 {
		from = 0
	}
	gatewayIndexName := orm.GetIndexName(model.Instance{})

	query := util.MapStr{
		"size": size,
		"from": from,
		"sort": []util.MapStr{
			{
				"created": util.MapStr{
					"order": "desc",
				},
			},
		},
	}
	if keyword != "" {
		query["query"] = util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"prefix": util.MapStr{
							"name": util.MapStr{
								"value": keyword,
							},
						},
					},
				},
			},
		}
	}
	q := orm.Query{
		IndexName: gatewayIndexName,
		RawQuery: util.MustToJSONBytes(query),
	}
	err, result := orm.Search(nil, &q)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	searchRes := elastic2.SearchResponse{}
	err = util.FromJSONBytes(result.Raw, &searchRes)
	if err != nil||searchRes.ESError!=nil {
		msg:=fmt.Sprintf("%v,%v",err,searchRes.ESError)
		h.WriteError(w, msg, http.StatusInternalServerError)
		return
	}
	var nodes = []util.MapStr{}

	for _, hit := range searchRes.Hits.Hits {
		buf := util.MustToJSONBytes(hit.Source)
		inst := model.Instance{}
		err = util.FromJSONBytes(buf, &inst)
		if err != nil {
			log.Error(err)
			continue
		}
		node := util.MapStr{
			"id": inst.ID,
			"name": inst.Name,
			"available": false,
			"type": "gateway",
		}
		ul, err := url.Parse(inst.Endpoint)
		if err != nil {
			log.Error(err)
			continue
		}
		node["host"] = ul.Host
		err = inst.TryConnectWithTimeout(time.Second)
		if err != nil {
			log.Error(err)
		}else{
			node["available"] = true
		}

		nodes = append(nodes, node)
	}
	h.WriteJSON(w, nodes, http.StatusOK)
}
