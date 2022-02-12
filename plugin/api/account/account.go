package account

import (
	"infini.sh/framework/core/api"
	 "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/util"
	"net/http"
)

type Account struct {
	api.Handler
}

func init() {
	account:=Account{}
	api.HandleAPIMethod(api.POST, "/account/login", account.AccountLogin)
	api.HandleAPIMethod(api.GET, "/account/current_user", account.CurrentUser)
}

var userInSession string="user_in_session"

func (handler Account)AccountLogin(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	//{"userName":"admin","password":"111111","type":"account"}

	json,err:=handler.GetJSON(req)
	if err!=nil{
		handler.Error(w,err)
		return
	}
	userName,err:=json.String("userName")
	if err!=nil{
		handler.Error(w,err)
		return
	}
	password,err:=json.String("password")
	if err!=nil{
		handler.Error(w,err)
		return
	}

	u,_:=global.Env().GetConfig("bootstrap.username","admin")
	p,_:=global.Env().GetConfig("bootstrap.password","admin")
	if u==userName&&p==password{
		data := util.MapStr{
			"status":           "ok",
			"type":             "account",
			"currentAuthority": "admin",
			"userid":           "10001",
		}
		api.SetSession(w,req, userInSession,userName)
		handler.WriteJSON(w, data, http.StatusOK)
	}else{
		data := util.MapStr{
			"status":           "error",
			"type":             "account",
			"currentAuthority": "guest",
		}
		handler.WriteJSON(w, data, http.StatusOK)
	}
}

func (handler Account)CurrentUser(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	exists,user:=api.GetSession(w,req, userInSession)
	if exists{
		data:=util.MapStr{
			"name": user,
			"avatar": "",
			"userid": "10001",
			"email": "hello@infini.ltd",
			"signature": "极限科技 - 专业的开源搜索与实时数据分析整体解决方案提供商。",
			"title": "首席设计师",
			"group": "INFINI Labs",
			"tags": []util.MapStr{
				{
					"key": "0",
					"label": "很有想法的",
				}},
			"notifyCount": 12,
			"country": "China",
			"geographic": util.MapStr{
				"province": util.MapStr{
					"label": "湖南省",
					"key": "330000",
				},
				"city": util.MapStr{
					"label": "长沙市",
					"key": "330100",
				},
			},
			"address": "岳麓区湘江金融中心",
			"phone": "4001399200",
		}

		handler.WriteJSON(w, data,200)
	}else{
		data := util.MapStr{
			"status":           "error",
			"type":             "account",
			"currentAuthority": "guest",
		}
		handler.WriteJSON(w, data, 403)
	}
}
