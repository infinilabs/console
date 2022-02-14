/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package gateway

import (
	"crypto/tls"
	"fmt"
	"github.com/segmentio/encoding/json"
	"infini.sh/console/model/gateway"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"infini.sh/framework/lib/fasthttp"
	"net/http"
	log "src/github.com/cihub/seelog"
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

	var groupID = obj.Group
	obj.Group = ""
	err = orm.Create(obj)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	if groupID != "" {
		groupInstance := &gateway.InstanceGroup{}
		groupInstance.InstanceID = obj.ID
		groupInstance.GroupID = groupID
		err = orm.Create(groupInstance)
		if err != nil {
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			log.Error(err)
			return
		}
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
	obj.Group, err = fetchInstanceGroup(id)
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
	oldGroup, err := fetchInstanceGroup(id)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
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
	if obj.Group != oldGroup {
		delQuery := util.MapStr{
			"query": util.MapStr{
				"bool": util.MapStr{
					"must": []util.MapStr{
						//{
						//	"term": util.MapStr{
						//		"group_id": util.MapStr{
						//			"value": oldGroup,
						//		},
						//	},
						//},
						{
							"term": util.MapStr{
								"instance_id": util.MapStr{
									"value": id,
								},
							},
						},
					},
				},
			},
		}
		err = orm.DeleteBy(&gateway.InstanceGroup{}, util.MustToJSONBytes(delQuery))
		if err != nil {
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			log.Error(err)
			return
		}
		err = orm.Create(&gateway.InstanceGroup{
			GroupID: obj.Group,
			InstanceID: id,
		})
		if err != nil {
			h.WriteError(w, err.Error(), http.StatusInternalServerError)
			log.Error(err)
			return
		}
	}

	//protect
	obj.ID = id
	obj.Created = create
	obj.Group = ""
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
		name        = h.GetParameterOrDefault(req, "name", "")
		queryDSL    = `{"query":{"bool":{"must":[%s]}}, "size": %d, "from": %d}`
		strSize     = h.GetParameterOrDefault(req, "size", "20")
		strFrom     = h.GetParameterOrDefault(req, "from", "0")
		mustBuilder = &strings.Builder{}
	)
	if name != "" {
		mustBuilder.WriteString(fmt.Sprintf(`{"prefix":{"name": "%s"}}`, name))
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
	//fetch relationship
	instanceIDs := pickElasticsearchColumnValues(res.Result, "id")
	instanceGroups, err := fetchInstanceGroupByID(instanceIDs)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	//fetch group

	groupIDs := pickElasticsearchColumnValues(instanceGroups, "group_id")
	groups, err := fetchGroupByID(groupIDs)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	groupsMap := getRelationshipMap(groups, "id", "name")
	relationshipMap := getRelationshipMap(instanceGroups, "instance_id", "group_id")

	resultRes := &elastic.SearchResponse{}
	err = util.FromJSONBytes(res.Raw, resultRes)
	if err != nil {
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		log.Error(err)
		return
	}
	for _, hit := range resultRes.Hits.Hits {
		hit.Source["group"] = relationshipMap[hit.ID]
	}

	h.WriteJSON(w, struct{
		elastic.SearchResponse
		Groups interface{} `json:"groups"`
	}{
		SearchResponse: *resultRes,
		Groups: groupsMap,
	}, http.StatusOK)
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