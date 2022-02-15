/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package gateway

import (
	"crypto/tls"
	"fmt"
	log "github.com/cihub/seelog"
	"github.com/segmentio/encoding/json"
	"infini.sh/console/model/gateway"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"infini.sh/framework/lib/fasthttp"
	"net/http"
	"strconv"
	"strings"
	"time"
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
		connRes, err := h.doConnect(endpoint.(string), username.(string), password.(string))
		if err != nil {
			log.Error(err)
		}
		result[gid.(string)] = connRes
	}
	h.WriteJSON(w, result, http.StatusOK)
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
func (h *GatewayAPI) doConnect(endpoint, username, password string) (*GatewayConnectResponse, error) {
	var (
		freq = fasthttp.AcquireRequest()
		fres = fasthttp.AcquireResponse()
	)
	defer func() {
		fasthttp.ReleaseRequest(freq)
		fasthttp.ReleaseResponse(fres)
	}()

	freq.SetRequestURI(fmt.Sprintf("%s/_framework/api/_info", endpoint))
	freq.Header.SetMethod("GET")
	if username != ""{
		freq.SetBasicAuth(username, password)
	}

	client := &fasthttp.Client{
		MaxConnsPerHost: 1000,
		TLSConfig:       &tls.Config{InsecureSkipVerify: true},
		ReadTimeout: time.Second * 5,
	}
	err := client.Do(freq, fres)
	if err != nil {
		return nil, err
	}
	b := fres.Body()
	gres := &GatewayConnectResponse{}
	err = json.Unmarshal(b, gres)
	return gres, err

}

func (h *GatewayAPI) tryConnect(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	var reqBody = struct {
		Endpoint string `json:"endpoint"`
		BasicAuth struct {
			Username string `json:"username"`
			Password string `json:"password"`
		}
	}{}
	err := h.DecodeJSON(req, &reqBody)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	connectRes, err := h.doConnect(reqBody.Endpoint, reqBody.BasicAuth.Username, reqBody.BasicAuth.Password)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteJSON(w, connectRes, http.StatusOK)
}