package alerting

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"io"
	"net/http"
	"net/url"
	"strings"
)

func getQueryParam(req *http.Request, key string, or ...string) string {
	query := req.URL.Query()
	val :=  query.Get(key)
	if val == "" && len(or)>0 {
		return or[0]
	}
	return val
}

func GetAlerts (w http.ResponseWriter, req *http.Request, ps httprouter.Params){
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}

	var (
		from = getQueryParam(req, "from", "0")
		size = getQueryParam(req, "size", "20")
		search = getQueryParam(req, "search")
		sortDirection = getQueryParam(req, "sortDirection", "desc")
		sortField = getQueryParam(req, "sortField", "start_time")
		severityLevel = getQueryParam(req, "severityLevel", "ALL")
		alertState = getQueryParam(req, "alertState", "ALL")
		//monitorIds = getQueryParam(req, "monitorIds")
		params = map[string]string{
			"startIndex": from,
			"size": size,
			"severityLevel": severityLevel,
			"alertState": alertState,
			"searchString": search,
		}
	)

	switch sortField {
	case "monitor_name", "trigger_name":
		params["sortString"] = fmt.Sprintf(`%s.keyword`, sortField)
		params["sortOrder"] = sortDirection
	case "start_time":
		params["sortString"] = sortField
		params["sortOrder"] = sortDirection
	case "end_time":
		params["sortString"] = sortField
		params["sortOrder"] = sortDirection
		params["missing"] = "_first"
		if sortDirection == "asc" {
			params["missing"] = "_last"
		}
	case "acknowledged_time":
		params["sortString"] = sortField
		params["sortOrder"] = sortDirection
		params["missing"] = "_last"
	}

	if clearSearch := strings.TrimSpace(search); clearSearch != ""{
		searches := strings.Split(clearSearch, " ")
		clearSearch = strings.Join(searches, "* *")
		params["searchString"] = fmt.Sprintf("*%s*", clearSearch)
	}
	reqUrl := conf.Endpoint + "/_opendistro/_alerting/monitors/alerts"

	res, err := doRequest(reqUrl, http.MethodGet, params, nil)
	if err != nil {
		writeError(w, err)
		return
	}
	var alertRes = AlertResponse{}
	err = decodeJSON(res.Body, &alertRes)
	defer res.Body.Close()
	if err != nil {
		writeError(w, err)
		return
	}

	var alerts = []IfaceMap{}
	for _, hit := range alertRes.Alerts {
		alert := IfaceMap{
			"id": hit["alert_id"],
		}
		for k, v := range hit {
			alert[k] = v
		}
		alert["version"] = hit["alert_version"]
	}
	writeJSON(w, IfaceMap{
		"ok": true,
		"alerts": alerts,
		"totalAlerts": alertRes.TotalAlerts,
	}, http.StatusOK)

}
func writeError(w http.ResponseWriter, err error) {
	writeJSON(w, map[string]interface{}{
		"body": map[string]interface{}{
			"ok": false,
			"err": err.Error(),
		},
	}, http.StatusOK)
}

type IfaceMap map[string]interface{}

type AlertResponse struct {
	Alerts []IfaceMap `json:"alerts"`
	TotalAlerts int `json:"totalAlerts"`
}

func decodeJSON(reader io.Reader, obj interface{}) error{
	dec := json.NewDecoder(reader)
	return dec.Decode(obj)
}

func writeJSON(w http.ResponseWriter, data interface{}, statusCode int){
	w.WriteHeader(statusCode)
	w.Header().Set("content-type", "application/json")
	buf, _ := json.Marshal(data)
	w.Write(buf)
}

var alertClient = http.Client{
	Transport: &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	},
}

func doRequest(requestUrl string, method string, params map[string]string, body interface{}) (*http.Response, error){
	var req *http.Request
	if params != nil && len(params) > 0 {
		var queryValues  = url.Values{}
		for k, v := range params {
			queryValues.Set(k, v)
		}
		requestUrl += "?"+ queryValues.Encode()
	}
	var reader io.Reader
	if body != nil {
		switch body.(type) {
		case string:
			reader = bytes.NewBufferString(body.(string))
		case io.Reader:
			reader = body.(io.Reader)
		default:
			rw := &bytes.Buffer{}
			enc := json.NewEncoder(rw)
			err := enc.Encode(body)
			if err != nil {
				return nil, err
			}
			reader = rw
		}
	}
	req, _ = http.NewRequest(method, requestUrl, reader)
	req.Header.Set("content-type", "application/json")
	return alertClient.Do(req)
}