package alerting

import (
	"errors"
	"fmt"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"net/http"
	"strings"
)

func GetDestination(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}

	dstID := ps.ByName("destID")
	reqUrl := fmt.Sprintf("%s/_opendistro/_alerting/monitors/%s", conf.Endpoint, dstID)
	res, err := doRequest(reqUrl, http.MethodGet, nil, nil)
	if err != nil {
		writeError(w, err)
		return
	}
	var resBody = IfaceMap{}
	err = decodeJSON(res.Body, &resBody)
	if err != nil {
		writeError(w, err)
		return
	}
	res.Body.Close()

	if _, ok := resBody["monitor"]; !ok {
		writeJSON(w, IfaceMap{
			"ok": false,
		}, http.StatusOK)
		return
	}

	queryDSL := ` {
            "size": 0,
            "query"": {
              "bool": {
                "must": {
                  "term"": {
                    "monitor_id": "%s",
                  },
                },
              },
            },
            "aggs": {
              "active_count": {
                "terms": {
                  "field": "state",
                }
              },
              "24_hour_count": {
                "date_range": {
                  "field": "start_time",
                  "ranges": [{ "from": "now-24h/h" }]
                }
              }
            }
          }`
	queryDSL = fmt.Sprintf(queryDSL, id)
	reqUrl = fmt.Sprintf("%s/_opendistro/_alerting/monitors/_search", conf.Endpoint)
	res, err = doRequest(reqUrl, http.MethodPost, map[string]string{
		"index": ".opendistro-alerting-alert*",
	}, queryDSL)

	if err != nil {
		writeError(w, err)
		return
	}

	var searchResBody = IfaceMap{}
	err = decodeJSON(res.Body, &searchResBody)
	if err != nil {
		writeError(w, err)
		return
	}
	dayCount := queryValue(searchResBody,  "aggregations.24_hour_count.buckets.0.doc_count", 0)
	activeBuckets := queryValue(searchResBody, "aggregations.active_count.buckets",[]interface{}{})
	activeCount := 0
	if ab, ok := activeBuckets.([]IfaceMap); ok {
		for _, curr := range ab {
			if  curr["key"].(string) == "ACTIVE" {
				activeCount = int(curr["doc_count"].(float64))
			}
		}
	}
	writeJSON(w, IfaceMap{
		"ok": true,
		"resp": resBody["monitor"],
		"activeCount": activeCount,
		"dayCount": dayCount,
		"version": queryValue(resBody, "_version", nil),
		"ifSeqNo": queryValue(resBody, "_seq_no", nil),
		"ifPrimaryTerm": queryValue(resBody, "_primary_term", nil),
	}, http.StatusOK)
}

func GetDestinations(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}
	var (
		from          = getQueryParam(req, "from", "0")
		size          = getQueryParam(req, "size", "20")
		search        = getQueryParam(req, "search", "")
		sortDirection = getQueryParam(req, "sortDirection", "desc")
		sortField     = getQueryParam(req, "sortField", "start_time")
		typ         = getQueryParam(req, "type", "ALL")
	)

	var params = map[string]string{}
	switch (sortField) {
	case "name":
		params =  map[string]string{
			"sortString": "destination.name.keyword",
			"sortOrder": sortDirection,
		}
	case "type":
		params =  map[string]string{
			"sortString": "destination.type",
			"sortOrder": sortDirection,
		}
	default:
	}
	params["startIndex"] = from
	params["size"] = size
	params["searchString"] = search
	params["destinationType"] = typ
	if clearSearch := strings.TrimSpace(search); clearSearch != "" {
		clearSearch = strings.ReplaceAll(clearSearch, " ", "* *")
		params["searchString"] = clearSearch
	}

	reqUrl := fmt.Sprintf("%s/%s/_alerting/destinations", conf.Endpoint, API_PREFIX)
	res, err := doRequest(reqUrl, http.MethodGet, params, nil)

	if err != nil {
		writeError(w, err)
		return
	}

	var resBody = IfaceMap{}
	err = decodeJSON(res.Body, &resBody)
	if err != nil {
		writeError(w, err)
		return
	}
	rawDests := queryValue(resBody, "destinations", []interface{}{})
	dests := []IfaceMap{}

	if ds, ok := rawDests.([]interface{}); ok {
		for _, dest := range ds {
			if destination, ok := dest.(map[string]interface{}); ok {

				destination["version"] = queryValue(destination, "schema_version", "")
				destination["ifSeqNo"] = queryValue(destination, "seq_no", 0)
				destination["ifPrimaryTerm"] = queryValue(destination, "primary_term", 0)
				dests = append(dests, destination)
			}
		}
	}
	writeJSON(w, IfaceMap{
		"ok": true,
		"destinations": dests,
		"totalDestinations": queryValue(resBody, "totalDestinations", 0),
	}, http.StatusOK)
}

func CreateDestination(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}

	reqUrl := fmt.Sprintf("%s/%s/_alerting/destinations", conf.Endpoint, API_PREFIX)
	res, err := doRequest(reqUrl, http.MethodPost, map[string]string{
		"refresh": "wait_for",
	}, req.Body)
	if err != nil {
		writeError(w, err)
		return
	}

	var resBody = IfaceMap{}
	err = decodeJSON(res.Body, &resBody)
	res.Body.Close()
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, IfaceMap{
		"ok": true,
		"resp": resBody,
	}, http.StatusOK)

}

func UpdateDestination(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}

	destinationId := ps.ByName("destinationId")
	var (
		ifSeqNo = getQueryParam(req, "ifSeqNo")
		ifPrimaryTerm = getQueryParam(req, "ifPrimaryTerm")
	)
	//PUT /_opendistro/_alerting/destinations/2g3CsHsB3EDgQAwRGzgS?if_seq_no=15&if_primary_term=2&refresh=wait_for

	reqUrl := fmt.Sprintf("%s/%s/_alerting/destinations/%s", conf.Endpoint, API_PREFIX, destinationId)
	res, err := doRequest(reqUrl, http.MethodPut, map[string]string{
		"refresh": "wait_for",
		"if_seq_no": ifSeqNo,
		"if_primary_term": ifPrimaryTerm,
	}, req.Body)
	if err != nil {
		writeError(w, err)
		return
	}

	var resBody = IfaceMap{}
	err = decodeJSON(res.Body, &resBody)
	res.Body.Close()
	if err != nil {
		writeError(w, err)
		return
	}
	//TODO error handle: check whether resBody has contains field error

	writeJSON(w, IfaceMap{
		"ok": true,
		"version": queryValue(resBody, "_version", ""),
		"id": queryValue(resBody, "_id", ""),
	}, http.StatusOK)

}

func DeleteDestination(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}

	destinationId := ps.ByName("destinationId")

	reqUrl := fmt.Sprintf("%s/%s/_alerting/destinations/%s", conf.Endpoint, API_PREFIX, destinationId)
	res, err := doRequest(reqUrl, http.MethodDelete, nil, nil)
	if err != nil {
		writeError(w, err)
		return
	}

	var resBody = IfaceMap{}
	err = decodeJSON(res.Body, &resBody)
	res.Body.Close()
	if err != nil {
		writeError(w, err)
		return
	}
	//TODO error handle: check whether resBody has contains field error

	resultIfce := queryValue(resBody, "result", "")
	var isOk = false
	if result, ok := resultIfce.(string); ok && result == "deleted" {
		isOk = true
	}
	writeJSON(w, IfaceMap{
		"ok": isOk,
	}, http.StatusOK)

}

func CreateEmailAccount(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}

	reqUrl := fmt.Sprintf("%s/%s/_alerting/destinations/email_accounts", conf.Endpoint, API_PREFIX)
	res, err := doRequest(reqUrl, http.MethodPost, map[string]string{
		"refresh": "wait_for",
	}, req.Body)
	if err != nil {
		writeError(w, err)
		return
	}

	var resBody = IfaceMap{}
	err = decodeJSON(res.Body, &resBody)
	res.Body.Close()
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, IfaceMap{
		"ok": true,
		"resp": resBody,
	}, http.StatusOK)
}

func UpdateEmailAccount(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}

	emailAccountId := ps.ByName("emailAccountId")
	var (
		ifSeqNo = getQueryParam(req, "ifSeqNo")
		ifPrimaryTerm = getQueryParam(req, "ifPrimaryTerm")
	)

	reqUrl := fmt.Sprintf("%s/%s/_alerting/destinations/email_accounts/%s", conf.Endpoint, API_PREFIX, emailAccountId)
	res, err := doRequest(reqUrl, http.MethodPut, map[string]string{
		"refresh": "wait_for",
		"if_seq_no": ifSeqNo,
		"if_primary_term": ifPrimaryTerm,
	}, req.Body)
	if err != nil {
		writeError(w, err)
		return
	}

	var resBody = IfaceMap{}
	err = decodeJSON(res.Body, &resBody)
	res.Body.Close()
	if err != nil {
		writeError(w, err)
		return
	}
	//TODO error handle: check whether resBody has contains field error

	writeJSON(w, IfaceMap{
		"ok": true,
		"id": queryValue(resBody, "_id", ""),
	}, http.StatusOK)

}

func DeleteEmailAccount(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}

	emailAccountId := ps.ByName("emailAccountId")

	reqUrl := fmt.Sprintf("%s/%s/_alerting/destinations/email_accounts/%s", conf.Endpoint, API_PREFIX, emailAccountId)
	res, err := doRequest(reqUrl, http.MethodDelete, nil, nil)
	if err != nil {
		writeError(w, err)
		return
	}

	var resBody = IfaceMap{}
	err = decodeJSON(res.Body, &resBody)
	res.Body.Close()
	if err != nil {
		writeError(w, err)
		return
	}
	//TODO error handle: check whether resBody has contains field error

	resultIfce := queryValue(resBody, "result", "")
	var isOk = false
	if result, ok := resultIfce.(string); ok && result == "deleted" {
		isOk = true
	}
	writeJSON(w, IfaceMap{
		"ok": isOk,
	}, http.StatusOK)

}

func GetEmailAccounts(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}
	var (
		from          = getQueryParam(req, "from", "0")
		size          = getQueryParam(req, "size", "20")
		search        = getQueryParam(req, "search", "")
		sortDirection = getQueryParam(req, "sortDirection", "desc")
		sortField     = getQueryParam(req, "sortField", "name")
	)

	must := IfaceMap{
		"match_all": IfaceMap{},
	}

	if clearSearch := strings.TrimSpace(search); clearSearch != "" {
		clearSearch = strings.ReplaceAll(clearSearch, " ", "* *")
		must = IfaceMap{
			"query_string": IfaceMap{
				"default_field": "email_account.name",
				"default_operator": "AND",
				"query": fmt.Sprintf(`*%s*`, clearSearch),
			},
		}
	}

	sortQueryMap := IfaceMap{ "name": IfaceMap{ "email_account.name.keyword": sortDirection } }
	var sort interface{}
	 if sortQuery, ok := sortQueryMap[sortField]; ok {
		sort = sortQuery
	}
	reqBody := IfaceMap{
		"from": from,
		"size": size,
		"sort": sort,
		"query": IfaceMap{
			"bool": IfaceMap{
				"must": must,
			},
		},
	}

	reqUrl := fmt.Sprintf("%s/%s/_alerting/destinations/email_accounts/_search", conf.Endpoint, API_PREFIX)
	res, err := doRequest(reqUrl, http.MethodPost, nil, reqBody)
	if err != nil {
		writeError(w, err)
		return
	}

	var resBody = IfaceMap{}
	err = decodeJSON(res.Body, &resBody)
	if err != nil {
		writeError(w, err)
		return
	}
	totalEmailAccounts := queryValue(resBody, "hits.total.value", 0)
	rawHits := queryValue(resBody, "hits.hits", []interface{}{})
	emailAccounts := []IfaceMap{}

	if rh, ok := rawHits.([]interface{}); ok {
		for _, hit := range rh {
			if emailAccount, ok := hit.(map[string]interface{}); ok {
				newItem := IfaceMap{}
				newItem["id"] = queryValue(emailAccount, "_id", "")
				source := queryValue(emailAccount, "_source", nil)
				if ms, ok :=  source.(map[string]interface{}); ok {
					assignTo(newItem, ms)
				}
				newItem["ifSeqNo"] = queryValue(emailAccount, "_seq_no", 0)
				newItem["ifPrimaryTerm"] = queryValue(emailAccount, "_primary_term", 0)
				emailAccounts = append(emailAccounts, newItem)
			}
		}
	}
	writeJSON(w, IfaceMap{
		"ok": true,
		"emailAccounts": emailAccounts,
		"totalEmailAccounts": totalEmailAccounts,
	}, http.StatusOK)
}

func GetEmailAccount(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}

	emailAccountId := ps.ByName("emailAccountId")

	reqUrl := fmt.Sprintf("%s/%s/_alerting/destinations/email_accounts/%s", conf.Endpoint, API_PREFIX, emailAccountId)
	res, err := doRequest(reqUrl, http.MethodGet,nil, req.Body)
	if err != nil {
		writeError(w, err)
		return
	}

	var resBody = IfaceMap{}
	err = decodeJSON(res.Body, &resBody)
	res.Body.Close()
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, IfaceMap{
		"ok": true,
		"resp": queryValue(resBody, "email_account", nil),
		"ifSeqNo":  queryValue(resBody, "_seq_no", 0),
		"ifPrimaryTerm": queryValue(resBody, "_primary_term", 0),
	}, http.StatusOK)

}


// --- email group

func CreateEmailGroup(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}

	reqUrl := fmt.Sprintf("%s/%s/_alerting/destinations/email_groups", conf.Endpoint, API_PREFIX)
	res, err := doRequest(reqUrl, http.MethodPost, map[string]string{
		"refresh": "wait_for",
	}, req.Body)
	if err != nil {
		writeError(w, err)
		return
	}

	var resBody = IfaceMap{}
	err = decodeJSON(res.Body, &resBody)
	res.Body.Close()
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, IfaceMap{
		"ok": true,
		"resp": resBody,
	}, http.StatusOK)
}

func UpdateEmailGroup(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}

	emailGroupId := ps.ByName("emailGroupId")
	var (
		ifSeqNo = getQueryParam(req, "ifSeqNo")
		ifPrimaryTerm = getQueryParam(req, "ifPrimaryTerm")
	)

	reqUrl := fmt.Sprintf("%s/%s/_alerting/destinations/email_groups/%s", conf.Endpoint, API_PREFIX, emailGroupId)
	res, err := doRequest(reqUrl, http.MethodPut, map[string]string{
		"refresh": "wait_for",
		"if_seq_no": ifSeqNo,
		"if_primary_term": ifPrimaryTerm,
	}, req.Body)
	if err != nil {
		writeError(w, err)
		return
	}

	var resBody = IfaceMap{}
	err = decodeJSON(res.Body, &resBody)
	res.Body.Close()
	if err != nil {
		writeError(w, err)
		return
	}
	//TODO error handle: check whether resBody has contains field error

	writeJSON(w, IfaceMap{
		"ok": true,
		"id": queryValue(resBody, "_id", ""),
	}, http.StatusOK)

}

func DeleteEmailGroup(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}

	emailGroupId := ps.ByName("emailGroupId")

	reqUrl := fmt.Sprintf("%s/%s/_alerting/destinations/email_groups/%s", conf.Endpoint, API_PREFIX, emailGroupId)
	res, err := doRequest(reqUrl, http.MethodDelete, nil, nil)
	if err != nil {
		writeError(w, err)
		return
	}

	var resBody = IfaceMap{}
	err = decodeJSON(res.Body, &resBody)
	res.Body.Close()
	if err != nil {
		writeError(w, err)
		return
	}
	//TODO error handle: check whether resBody has contains field error

	resultIfce := queryValue(resBody, "result", "")
	var isOk = false
	if result, ok := resultIfce.(string); ok && result == "deleted" {
		isOk = true
	}
	writeJSON(w, IfaceMap{
		"ok": isOk,
	}, http.StatusOK)

}

func GetEmailGroups(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}
	var (
		from          = getQueryParam(req, "from", "0")
		size          = getQueryParam(req, "size", "20")
		search        = getQueryParam(req, "search", "")
		sortDirection = getQueryParam(req, "sortDirection", "desc")
		sortField     = getQueryParam(req, "sortField", "name")
	)

	must := IfaceMap{
		"match_all": IfaceMap{},
	}

	if clearSearch := strings.TrimSpace(search); clearSearch != "" {
		clearSearch = strings.ReplaceAll(clearSearch, " ", "* *")
		must = IfaceMap{
			"query_string": IfaceMap{
				"default_field": "email_group.name",
				"default_operator": "AND",
				"query": fmt.Sprintf(`*%s*`, clearSearch),
			},
		}
	}

	sortQueryMap := IfaceMap{ "name": IfaceMap{ "email_group.name.keyword": sortDirection } }
	var sort interface{}
	if sortQuery, ok := sortQueryMap[sortField]; ok {
		sort = sortQuery
	}
	reqBody := IfaceMap{
		"from": from,
		"size": size,
		"sort": sort,
		"query": IfaceMap{
			"bool": IfaceMap{
				"must": must,
			},
		},
	}

	reqUrl := fmt.Sprintf("%s/%s/_alerting/destinations/email_groups/_search", conf.Endpoint, API_PREFIX)
	res, err := doRequest(reqUrl, http.MethodPost, nil, reqBody)
	//TODO to handle api error in doRequest function
	if err != nil {
		writeError(w, err)
		return
	}

	var resBody = IfaceMap{}
	err = decodeJSON(res.Body, &resBody)
	if err != nil {
		writeError(w, err)
		return
	}
	totalEmailGroups := queryValue(resBody, "hits.total.value", 0)
	rawHits := queryValue(resBody, "hits.hits", []interface{}{})
	emailGroups := []IfaceMap{}

	if rh, ok := rawHits.([]interface{}); ok {
		for _, hit := range rh {
			if emailGroup, ok := hit.(map[string]interface{}); ok {
				newItem := IfaceMap{}
				newItem["id"] = queryValue(emailGroup, "_id", "")
				source := queryValue(emailGroup, "_source", nil)
				if ms, ok :=  source.(map[string]interface{}); ok {
					assignTo(newItem, ms)
				}
				newItem["ifSeqNo"] = queryValue(emailGroup, "_seq_no", 0)
				newItem["ifPrimaryTerm"] = queryValue(emailGroup, "_primary_term", 0)
				emailGroups = append(emailGroups, newItem)
			}
		}
	}
	writeJSON(w, IfaceMap{
		"ok":               true,
		"emailGroups":    emailGroups,
		"totalEmailGroups": totalEmailGroups,
	}, http.StatusOK)
}

func GetEmailGroup(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}

	emailAccountId := ps.ByName("emailGroupId")

	reqUrl := fmt.Sprintf("%s/%s/_alerting/destinations/email_groups/%s", conf.Endpoint, API_PREFIX, emailAccountId)
	res, err := doRequest(reqUrl, http.MethodGet,nil, req.Body)
	if err != nil {
		writeError(w, err)
		return
	}

	var resBody = IfaceMap{}
	err = decodeJSON(res.Body, &resBody)
	res.Body.Close()
	if err != nil {
		writeError(w, err)
		return
	}
	emailGroup := queryValue(resBody, "email_group", nil)
	if emailGroup == nil {
		writeJSON(w, IfaceMap{
			"ok": false,
		}, http.StatusOK)
		return
	}

	writeJSON(w, IfaceMap{
		"ok": true,
		"resp": emailGroup,
		"ifSeqNo":  queryValue(resBody, "_seq_no", 0),
		"ifPrimaryTerm": queryValue(resBody, "_primary_term", 0),
	}, http.StatusOK)

}

