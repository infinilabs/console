package notification

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	log "github.com/cihub/seelog"
	"infini.sh/console/model"
	"infini.sh/framework/core/api/rbac"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
)

func (h *NotificationAPI) listNotifications(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
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

	var (
		queryDSL = `{
			"sort": [
				{ "created": {"order": "desc"} }
			],
			"query": {
				"bool": { "must": [
					{ "term": {"user_id": { "value": "%s" } } },
					{ "term": {"status": { "value": "%s" } } }
				] }
			},
			"size": %d, "from": %d
		}`
		strSize = h.GetParameterOrDefault(req, "size", "20")
		strFrom = h.GetParameterOrDefault(req, "from", "0")
	)
	size, _ := strconv.Atoi(strSize)
	if size <= 0 {
		size = 20
	}
	from, _ := strconv.Atoi(strFrom)
	if from < 0 {
		from = 0
	}

	q := orm.Query{}
	queryDSL = fmt.Sprintf(queryDSL, user.UserId, model.NotificationStatusNew, size, from)
	q.RawQuery = util.UnsafeStringToBytes(queryDSL)

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
	Ids []string `json:"ids"`
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

	var reqData = SetNotificationsReadRequest{}
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
				"must": []util.MapStr{
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
