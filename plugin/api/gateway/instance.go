/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package gateway

import (
	"fmt"
	log "github.com/cihub/seelog"
	"github.com/segmentio/encoding/json"
	"infini.sh/console/model/gateway"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"net/http"
	"strconv"
	"strings"
)

func (h *GatewayAPI) createInstance(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var obj = &gateway.Instance{}
	err := h.DecodeJSON(req, obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	err = orm.Create(obj)
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

	obj := gateway.Instance{}
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
	obj := gateway.Instance{}

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
	obj = gateway.Instance{}
	err = h.DecodeJSON(req, &obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}

	//protect
	obj.ID = id
	obj.Created = create
	err = orm.Update(&obj)
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

	obj := gateway.Instance{}
	obj.ID = id

	exists, err := orm.Get(&obj)
	if !exists || err != nil {
		h.WriteJSON(w, util.MapStr{
			"_id":    id,
			"result": "not_found",
		}, http.StatusNotFound)
		return
	}

	err = orm.Delete(&obj)
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
		keyword        = h.GetParameterOrDefault(req, "keyword", "")
		queryDSL    = `{"query":{"bool":{"must":[%s]}}, "size": %d, "from": %d}`
		strSize     = h.GetParameterOrDefault(req, "size", "20")
		strFrom     = h.GetParameterOrDefault(req, "from", "0")
		mustBuilder = &strings.Builder{}
	)
	if keyword != "" {
		mustBuilder.WriteString(fmt.Sprintf(`{"query_string":{"default_field":"*","query": "%s"}}`, keyword))
	}
	size, _ := strconv.Atoi(strSize)
	if size <= 0 {
		size = 20
	}
	from, _ := strconv.Atoi(strFrom)
	if from < 0 {
		from = 0
	}

	q := orm.Query{}
	queryDSL = fmt.Sprintf(queryDSL, mustBuilder.String(), size, from)
	q.RawQuery = []byte(queryDSL)

	err, res := orm.Search(&gateway.Instance{}, &q)
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

	err, res := orm.Search(&gateway.Instance{}, &q)
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
		res, err := doGatewayRequest(&ProxyRequest{
			Endpoint: endpoint.(string),
			Method: http.MethodGet,
			Path: "/stats",
			BasicAuth: gateway.BasicAuth{
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
		util.MustFromJSONBytes(res.Body, &resMap)

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

	obj := gateway.Instance{}
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
	res, err := doGatewayRequest(&ProxyRequest{
		Method: method,
		Endpoint: obj.Endpoint,
		Path: path,
		Body: req.Body,
		BasicAuth: obj.BasicAuth,
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
func (h *GatewayAPI) doConnect(endpoint string, basicAuth gateway.BasicAuth) (*GatewayConnectResponse, error) {
	res, err := doGatewayRequest(&ProxyRequest{
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
		BasicAuth gateway.BasicAuth
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