package security

import (
	"fmt"
	"net/http"

	"infini.sh/framework/core/api"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/util"
	"infini.sh/license"
)

var requestConsoleTrialLicenseRemotely = func(url string, body []byte) (*util.Result, error) {
	request := util.NewPostRequest(url, body).AddCommonJSONHeaders()
	return util.ExecuteRequest(request)
}

type consoleLicenseTrialBridge struct {
	api.Handler
}

func registerConsoleLicenseTrialBridge() {
	handler := consoleLicenseTrialBridge{}
	api.HandleUIMethod(api.POST, "/_license/request_trial", handler.RequestTrialLicense, api.RequireLogin())
}

func (handler *consoleLicenseTrialBridge) RequestTrialLicense(w http.ResponseWriter, req *http.Request, _ httprouter.Params) {
	body, err := handler.GetRawBody(req)
	if err != nil {
		handler.Error500(w, err.Error())
		return
	}

	requestBody := license.TrialRequest{}
	if err := util.FromJSONBytes(body, &requestBody); err != nil {
		handler.Error500(w, err.Error())
		return
	}

	remoteURL := "https://api.infini.cloud/_license/request_trial"
	if rawQuery := req.URL.RawQuery; rawQuery != "" {
		remoteURL = fmt.Sprintf("%s?%s", remoteURL, rawQuery)
	}

	response, err := requestConsoleTrialLicenseRemotely(remoteURL, util.MustToJSONBytes(requestBody))
	if err != nil {
		statusCode := http.StatusBadGateway
		if response != nil && response.StatusCode > 0 {
			statusCode = response.StatusCode
		}
		handler.WriteError(w, err.Error(), statusCode)
		return
	}

	result := license.TrialResponse{}
	if err := util.FromJSONBytes(response.Body, &result); err != nil {
		handler.Error500(w, err.Error())
		return
	}

	if result.License != "" {
		ok := license.ApplyLicense(result.License)
		if ok {
			license.PersistLicense(result.License)
		} else {
			result.License = ""
		}
	}

	w.WriteHeader(response.StatusCode)
	_, _ = w.Write(util.MustToJSONBytes(result))
}
