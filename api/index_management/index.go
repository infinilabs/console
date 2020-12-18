package index_management

import (
	"fmt"
	"infini.sh/framework/core/api"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	model2 "infini.sh/search-center/model"
	"net/http"
)


type APIHandler struct {
	api.Handler
}


func (handler APIHandler)CreateDictItemAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	//id := ps.ByName("id")
	dict:=model2.Dict{}
	dict.ID = util.GetUUID()

	err := orm.Save(dict)
	if err!=nil{
		panic(err)
	}
}

func (handler APIHandler) DeleteDictItemAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	dict:=model2.Dict{}
	dict.ID = id


	err := orm.Delete(dict)
	if err!=nil{
		panic(err)
	}
}

func (handler APIHandler) DeleteDictItemAction2(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	field:=handler.GetParameterOrDefault(req,"help","help message")
	fmt.Println(field)

	json,err:=handler.GetJSON(req)
	if err!=nil{
		handler.Error(w,err)
		return
	}

	id,err:=json.String("id")
	if err!=nil{
		handler.Error(w,err)
		return
	}
	dict:=model2.Dict{}
	dict.ID = id


	err = orm.Delete(dict)
	if err!=nil{
		handler.Error(w,err)
	}
}



// TaskAction handle task creation and return task list which support parameter: `from`, `size` and `host`, eg:
//curl -XGET http://127.0.0.1:8001/task?from=100&size=10&host=elasticsearch.cn
func (handler APIHandler) TaskAction(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {

	//fr := handler.GetParameter(req, "from")
	//si := handler.GetParameter(req, "size")
	//host := handler.GetParameter(req, "host")
	//status := handler.GetIntOrDefault(req, "status", -1)
	//
	//from, err := strconv.Atoi(fr)
	//if err != nil {
	//	from = 0
	//}
	//size, err := strconv.Atoi(si)
	//if err != nil {
	//	size = 10
	//}
	//
	//orm.Search()
	//total, tasks, err := model.GetTaskList(from, size, host, status)
	//if err != nil {
	//	handler.Error(w, err)
	//} else {
	//	handler.WriteJSONListResult(w, total, tasks, http.StatusOK)
	}

