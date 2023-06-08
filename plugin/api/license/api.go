/* Copyright © INFINI LTD. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package license

import (
	"infini.sh/framework/core/api"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/util"
	"infini.sh/license"
	"net/http"
)

type LicenseAPI struct {
	api.Handler
}
func InitAPI() {
	handler := LicenseAPI{}
	api.HandleAPIMethod(api.POST, "/_license/request_trial", handler.RequestTrialLicense)
}

func (handler *LicenseAPI) RequestTrialLicense(w http.ResponseWriter, req *http.Request, p httprouter.Params) {
	body, err := handler.GetRawBody(req)
	if err != nil {
		handler.Error500(w, err.Error())
		return
	}

	v := license.TrialRequest{}
	err=util.FromJSONBytes(body, &v)
	if err != nil {
		handler.Error500(w, err.Error())
		return
	}

	//TODO implement config for the api endpoint
	request:=util.NewPostRequest("https://api.infini.sh/_license/request_trial", util.MustToJSONBytes(v))
	response,err:=util.ExecuteRequest(request)
	if err!=nil{
		handler.WriteError(w,err.Error(),response.StatusCode)
		return
	}

	r:=license.TrialResponse{}
	err=util.FromJSONBytes(response.Body, &r)
	if err != nil {
		handler.Error500(w, err.Error())
		return
	}

	if r.License!=""{
		ok := license.ApplyLicense(r.License)
		if ok {
			license.PersistLicense(r.License)
		}else{
			r.License=""
		}
	}

	w.WriteHeader(response.StatusCode)
	w.Write(util.MustToJSONBytes(r))
}