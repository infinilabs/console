package account

import (
	"infini.sh/console/internal/biz"
	"infini.sh/console/internal/dto"
	m "infini.sh/console/internal/middleware"
	"infini.sh/framework/core/api"
	"infini.sh/framework/core/api/router"
	"infini.sh/framework/core/util"
	"net/http"
)

type Account struct {
	api.Handler
}

func init() {
	account := Account{}
	api.HandleAPIMethod(api.POST, "/account/login", account.Login)

	//api.HandleAPIMethod(api.GET, "/account/current_user", account.CurrentUser)

	api.HandleAPIMethod(api.DELETE, "/account/logout", account.Logout)
	api.HandleAPIMethod(api.GET, "/account/profile", m.LoginRequired(account.Profile))
}

const userInSession = "user_in_session"

func (h Account) Login(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {

	var req dto.Login
	err := h.DecodeJSON(r, &req)
	if err != nil {
		h.Error(w, err)
		return
	}

	data, err := biz.Login(req.Username, req.Password)
	if err != nil {
		h.Error(w, err)
		return
	}
	h.WriteOKJSON(w, data)
}

func (h Account) CurrentUser(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	exists, user := api.GetSession(w, req, userInSession)
	if exists {
		data := util.MapStr{
			"name":      user,
			"avatar":    "",
			"userid":    "10001",
			"email":     "hello@infini.ltd",
			"signature": "极限科技 - 专业的开源搜索与实时数据分析整体解决方案提供商。",
			"title":     "首席设计师",
			"group":     "INFINI Labs",
			"tags": []util.MapStr{
				{
					"key":   "0",
					"label": "很有想法的",
				}},
			"notifyCount": 12,
			"country":     "China",
			"geographic": util.MapStr{
				"province": util.MapStr{
					"label": "湖南省",
					"key":   "330000",
				},
				"city": util.MapStr{
					"label": "长沙市",
					"key":   "330100",
				},
			},
			"address": "岳麓区湘江金融中心",
			"phone":   "4001399200",
		}

		h.WriteJSON(w, data, 200)
	} else {
		data := util.MapStr{
			"status":           "error",
			"type":             "account",
			"currentAuthority": "guest",
		}
		h.WriteJSON(w, data, 403)
	}
}
func (h Account) Logout(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {

	h.WriteOKJSON(w, util.MapStr{
		"status": "ok",
	})
}
func (h Account) Profile(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	reqUser, err := biz.FromUserContext(r.Context())
	if err != nil {
		h.Error(w, err)
		return
	}
	h.WriteJSON(w, reqUser, 200)
	return
}
