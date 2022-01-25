package account

import (
	"infini.sh/framework/core/api"
	 "infini.sh/framework/core/api/router"
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

func (handler Account)AccountLogin(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	data := util.MapStr{
		"status":           "ok",
		"type":             "account",
		"currentAuthority": "admin",
		"userid":           "10001",
	}

	handler.WriteJSON(w, data, http.StatusOK)
}

func (handler Account)CurrentUser(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	data := []byte("{ \"name\": \"INFINI Labs\", \"avatar\": \"\", \"userid\": \"10001\", \"email\": \"hello@infini.ltd\", \"signature\": \"极限科技 - 专业的开源搜索与实时数据分析整体解决方案提供商。\", \"title\": \"首席设计师\", \"group\": \"INFINI Labs－UED\", \"tags\": [ { \"key\": \"0\", \"label\": \"很有想法的\" }, { \"key\": \"1\", \"label\": \"专注设计\" }, { \"key\": \"2\", \"label\": \"辣~\" }, { \"key\": \"3\", \"label\": \"大长腿\" }, { \"key\": \"4\", \"label\": \"川妹子\" }, { \"key\": \"5\", \"label\": \"海纳百川\" } ], \"notifyCount\": 12, \"country\": \"China\", \"geographic\": { \"province\": { \"label\": \"湖南省\", \"key\": \"330000\" }, \"city\": { \"label\": \"长沙市\", \"key\": \"330100\" } }, \"address\": \"岳麓区湘江金融中心\", \"phone\": \"4001399200\" }")
	handler.Write(w, data)
}
