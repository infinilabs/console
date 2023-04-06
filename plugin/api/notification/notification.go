package notification

import (
	"errors"
	"fmt"
	"net/http"
	"time"

	log "github.com/cihub/seelog"
	"infini.sh/console/model"
	"infini.sh/framework/core/api/rbac"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
)

type SearchNotificationsRequest struct {
	From    int                        `json:"from"`
	Size    int                        `json:"size"`
	Keyword string                     `json:"keyword"`
	Status  []model.NotificationStatus `json:"status"`
	Types   []model.NotificationType   `json:"types"`
}

func (h *NotificationAPI) searchNotifications(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	user, err := rbac.FromUserContext(req.Context())
	if err != nil {
		log.Error("failed to get user from context, err: %v", err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if user == nil {
		log.Error(errors.New("no user info"))
		h.WriteError(w, "no user info", http.StatusInternalServerError)
		return
	}

	var reqData = SearchNotificationsRequest{
		From: 0,
		Size: 20,
	}
	err = h.DecodeJSON(req, &reqData)
	if err != nil {
		log.Error("failed to parse request: ", err)
		h.WriteError(w, err.Error(), http.StatusBadRequest)
		return
	}

	musts := []util.MapStr{
		{"term": util.MapStr{"user_id": util.MapStr{"value": user.UserId}}},
	}
	if len(reqData.Status) > 0 {
		musts = append(musts, util.MapStr{"terms": util.MapStr{"status": reqData.Status}})
	}
	if len(reqData.Types) > 0 {
		musts = append(musts, util.MapStr{"terms": util.MapStr{"type": reqData.Types}})
	}
	if len(reqData.Keyword) > 0 {
		musts = append(musts, util.MapStr{"query_string": util.MapStr{"default_field": "*", "query": reqData.Keyword}})
	}

	var (
		queryDSL = util.MapStr{
			"sort": []util.MapStr{
				{"created": util.MapStr{"order": "desc"}},
			},
			"query": util.MapStr{
				"bool": util.MapStr{
					"must": musts,
				},
			},
			"size": reqData.Size, "from": reqData.From,
		}
	)

	q := orm.Query{}
	q.RawQuery = util.MustToJSONBytes(queryDSL)

	err, res := orm.Search(&model.Notification{}, &q)
	if err != nil {
		log.Error(err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.WriteJSONHeader(w)
	h.Write(w, res.Raw)
}

type SetNotificationsReadRequest struct {
	Ids   []string                 `json:"ids"`
	Types []model.NotificationType `json:"types"`
}

func (h *NotificationAPI) setNotificationsRead(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	user, err := rbac.FromUserContext(req.Context())
	if err != nil {
		log.Error("failed to get user from context, err: %v", err)
		h.WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if user == nil {
		log.Error(errors.New("no user info"))
		h.WriteError(w, "no user info", http.StatusInternalServerError)
		return
	}

	var reqData = SetNotificationsReadRequest{
		Ids:   []string{},
		Types: []model.NotificationType{},
	}
	err = h.DecodeJSON(req, &reqData)
	if err != nil {
		log.Error("failed to parse request: ", err)
		h.WriteError(w, err.Error(), http.StatusBadRequest)
		return
	}
	now := time.Now().Format(time.RFC3339Nano)

	queryDsl := util.MapStr{
		"query": util.MapStr{
			"bool": util.MapStr{
				"should": []util.MapStr{
					util.MapStr{
						"bool": util.MapStr{
							"must": []util.MapStr{
								{"term": util.MapStr{"user_id": util.MapStr{"value": user.UserId}}},
								{
									"terms": util.MapStr{
										"_id": reqData.Ids,
									},
								},
								{
									"term": util.MapStr{
										"status": util.MapStr{
											"value": model.NotificationStatusNew,
										},
									},
								},
							},
						},
					},
					util.MapStr{
						"bool": util.MapStr{
							"must": []util.MapStr{
								{"term": util.MapStr{"user_id": util.MapStr{"value": user.UserId}}},
								{
									"terms": util.MapStr{
										"type": reqData.Types,
									},
								},
								{
									"term": util.MapStr{
										"status": util.MapStr{
											"value": model.NotificationStatusNew,
										},
									},
								},
							},
						},
					},
				},
				"minimum_should_match": 1,
			},
		},
		"script": util.MapStr{
			"source": fmt.Sprintf("ctx._source['status'] = '%s';ctx._source['updated'] = '%s'", model.NotificationStatusRead, now),
		},
	}

	err = orm.UpdateBy(model.Notification{}, util.MustToJSONBytes(queryDsl))
	if err != nil {
		log.Errorf("failed to update notifications, err: %v", err)
		h.WriteError(w, "update notifications failed", http.StatusInternalServerError)
		return
	}

	h.WriteAckOKJSON(w)
}
