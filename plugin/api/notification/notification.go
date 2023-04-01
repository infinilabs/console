package notification

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"

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
		log.Error(err)
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
					{ "term": {"user_id": { "value": "%s" } } }
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
	queryDSL = fmt.Sprintf(queryDSL, user.UserId, size, from)
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
