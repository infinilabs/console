package alerting

import (
	"errors"
	"fmt"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"infini.sh/search-center/model/alerting"
	"net/http"
	"runtime/debug"
	"strings"
	"time"
)

func GetDestination(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}

	dstID := ps.ByName("destID")
	reqUrl := fmt.Sprintf("%s/%s/_doc/%s", conf.Endpoint, orm.GetIndexName(alerting.Config{}), dstID)
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

	writeJSON(w, IfaceMap{
		"ok": true,
		"destination": queryValue(resBody, "_source.destination", nil),
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
		sortField     = getQueryParam(req, "sortField", "")
		typ         = getQueryParam(req, "type", "")
	)

	must := []IfaceMap{
		{
			"exists": IfaceMap{
				"field": DESTINATION_FIELD,
			},
		},
		//{
		//	"match": IfaceMap{
		//		"cluster_id": id,
		//	},
		//},
	}

	if clearSearch := strings.TrimSpace(search); clearSearch != "" {
		clearSearch = strings.ReplaceAll(clearSearch, " ", "* *")
		must = append(must, IfaceMap{
			"query_string": IfaceMap{
				//"default_field": "destination.name",
				"default_operator": "AND",
				"query": fmt.Sprintf(`*%s*`, clearSearch),
			},
		})
	}

	var sort interface{} = IfaceMap{}
	switch (sortField) {
	case "name":
		sort =  IfaceMap{ "destination.name.keyword": sortDirection }
	case "type":
		sort = IfaceMap{ "destination.type": sortDirection }
	default:
	}
	if typ != "" && typ != "ALL" {
		must = append(must, IfaceMap{
			"match": IfaceMap{
				"destination.type": typ,
			},
		})
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

	config := getDefaultConfig()
	reqUrl := fmt.Sprintf("%s/%s/_search", config.Endpoint, orm.GetIndexName(alerting.Config{}))

	res, err := doRequest(reqUrl, http.MethodGet, nil, reqBody)

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

	totalDestinations := queryValue(resBody, "hits.total.value", 0)
	rawHits := queryValue(resBody, "hits.hits", []interface{}{})
	dests := []IfaceMap{}

	if rh, ok := rawHits.([]interface{}); ok {
		for _, hit := range rh {
			if destination, ok := hit.(map[string]interface{}); ok {
				newItem := IfaceMap{}
				newItem["id"] = queryValue(destination, "_id", "")
				source := queryValue(destination, "_source."+DESTINATION_FIELD, nil)
				if ms, ok :=  source.(map[string]interface{}); ok {
					assignTo(newItem, ms)
				}
				dests = append(dests, newItem)
			}
		}
	}

	writeJSON(w, IfaceMap{
		"ok": true,
		"destinations": dests,
		"totalDestinations":totalDestinations,
	}, http.StatusOK)
}

func CreateDestination(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}

	config := getDefaultConfig()
	destId := util.GetUUID()
	reqUrl := fmt.Sprintf("%s/%s/_doc/%s", config.Endpoint, orm.GetIndexName(alerting.Config{}), destId)
	var destination = &alerting.Destination{}
	err := decodeJSON(req.Body, &destination)
	if err != nil {
		writeError(w, err)
		return
	}
	destination.LastUpdateTime = time.Now().UnixNano()/1e6
	var toSaveDest = IfaceMap{
		"type": destination.Type,
		"name": destination.Name,
		"last_update_time": destination.LastUpdateTime,
		"schema_version": destination.SchemaVersion,
		"id": destId,
	}
	switch destination.Type {
	case "email" :
		toSaveDest[destination.Type] = destination.Email
	case "custom_webhook":
		toSaveDest[destination.Type] = destination.CustomWebhook
	default:
		writeError(w, errors.New("type unsupported"))
		return
	}
	res, err := doRequest(reqUrl, http.MethodPost, map[string]string{
		"refresh": "wait_for",
	}, IfaceMap{
		"cluster_id": id,
		DESTINATION_FIELD: toSaveDest,
	})
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
		"resp": IfaceMap{
			DESTINATION_FIELD: toSaveDest,
			"_id": queryValue(resBody, "_id", ""),
			"_version":  queryValue(resBody, "_version", 0),
		},
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

	config := getDefaultConfig()
	reqUrl := fmt.Sprintf("%s/%s/_doc/%s", config.Endpoint, orm.GetIndexName(alerting.Config{}), destinationId)
	var destination = &alerting.Destination{}
	err := decodeJSON(req.Body, &destination)
	if err != nil {
		writeError(w, err)
		return
	}
	destination.LastUpdateTime = time.Now().UnixNano()/1e6
	var toSaveDest = IfaceMap{
		"type": destination.Type,
		"name": destination.Name,
		"last_update_time": destination.LastUpdateTime,
		"schema_version": destination.SchemaVersion,
		"id": destinationId,
	}
	switch destination.Type {
	case "email" :
		toSaveDest[destination.Type] = destination.Email
	case "custom_webhook":
		toSaveDest[destination.Type] = destination.CustomWebhook
	default:
		writeError(w, errors.New("type unsupported"))
		return
	}
	res, err := doRequest(reqUrl, http.MethodPut, map[string]string{
		"refresh": "wait_for",
	}, IfaceMap{
		"cluster_id": id,
		DESTINATION_FIELD: toSaveDest,
	})
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

	config := getDefaultConfig()
	reqUrl := fmt.Sprintf("%s/%s/_doc/%s", config.Endpoint, orm.GetIndexName(alerting.Config{}), destinationId)
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

	resultIfce := queryValue(resBody, "result", "")
	var isOk = false
	if result, ok := resultIfce.(string); ok && result == "deleted" {
		isOk = true
	}
	writeJSON(w, IfaceMap{
		"ok": isOk,
	}, http.StatusOK)

}

func getDefaultConfig() *elastic.ElasticsearchConfig {
	return elastic.GetConfig("default")
}

//var (
//	ks keystore.WritableKeystore
//	ksOnce = &sync.Once{}
//)
//func getKeystore() keystore.WritableKeystore {
//	ksOnce.Do(func() {
//		tempKS, err := keystore.Factory(nil, "data/search-center/keystore")
//		if err != nil {
//			panic(err)
//		}
//		ks, err = keystore.AsWritableKeystore(tempKS)
//		if err != nil {
//			panic(err)
//		}
//	})
//	return ks
//}

func CreateEmailAccount(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	defer func() {
		if err := recover(); err != nil {
			debug.PrintStack()
		}
	}()
	id := ps.ByName("id")
	conf := elastic.GetConfig(id)
	if conf == nil {
		writeError(w, errors.New("cluster not found"))
		return
	}
	config := getDefaultConfig()

	reqUrl := fmt.Sprintf("%s/%s/_doc", config.Endpoint, orm.GetIndexName(alerting.Config{}))
	var emailAccount = &alerting.EmailAccount{}
	err := decodeJSON(req.Body, &emailAccount)
	if err != nil {
		writeError(w, err)
		return
	}
	//var password = emailAccount.Password
	//emailAccount.Password = ""
	res, err := doRequest(reqUrl, http.MethodPost, map[string]string{
		"refresh": "wait_for",
	}, IfaceMap{
		EMAIL_ACCOUNT_FIELD: emailAccount,
		"cluster_id": id,
	})
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

	//kk := fmt.Sprintf("search-center_alerting.destination.email.%s.password", emailAccount.Name)
	//secStr, _ := getKeystore().Retrieve(kk)
	//kst := getKeystore()
	//if secStr == nil {
	//	kst.Store(kk, []byte(password))
	//	kst.Save()
	//}else{
	//	oldPwd, _ := secStr.Get()
	//	if bytes.Compare(oldPwd, []byte(password)) != 0 {
	//		kst.Store(kk, []byte(password))
	//	}
	//	kst.Save()
	//}

	writeJSON(w, IfaceMap{
		"ok": true,
		"resp": IfaceMap{
			EMAIL_ACCOUNT_FIELD: emailAccount,
			"_id": queryValue(resBody, "_id", ""),
			"_version":  queryValue(resBody, "_version", 0),
		},
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
	config := getDefaultConfig()

	reqUrl := fmt.Sprintf("%s/%s/_doc/%s", config.Endpoint, orm.GetIndexName(alerting.Config{}), emailAccountId)
	var emailAccount = &alerting.EmailAccount{}
	err := decodeJSON(req.Body, &emailAccount)
	if err != nil {
		writeError(w, err)
		return
	}

	res, err := doRequest(reqUrl, http.MethodPut, map[string]string{
		"refresh": "wait_for",
	}, IfaceMap{
		"cluster_id": id,
		EMAIL_ACCOUNT_FIELD: emailAccount,
	})
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
	config := getDefaultConfig()

	reqUrl := fmt.Sprintf("%s/%s/_doc/%s", config.Endpoint, orm.GetIndexName(alerting.Config{}), emailAccountId)

	res, err := doRequest(reqUrl, http.MethodDelete, map[string]string{
		"refresh": "wait_for",
	}, nil)
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

	must := []IfaceMap{
		{
			"exists": IfaceMap{
				"field": EMAIL_ACCOUNT_FIELD,
			},
		},
	}

	if clearSearch := strings.TrimSpace(search); clearSearch != "" {
		clearSearch = strings.ReplaceAll(clearSearch, " ", "* *")
		must = append(must, IfaceMap{
			"query_string": IfaceMap{
				"default_field": "email_account.name",
				"default_operator": "AND",
				"query": fmt.Sprintf(`*%s*`, clearSearch),
			},
		})
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

	config := getDefaultConfig()

	reqUrl := fmt.Sprintf("%s/%s/_search", config.Endpoint, orm.GetIndexName(alerting.Config{}))

	res, err := doRequest(reqUrl, http.MethodGet, nil, reqBody)
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
				source := queryValue(emailAccount, "_source."+EMAIL_ACCOUNT_FIELD, nil)
				if ms, ok :=  source.(map[string]interface{}); ok {
					assignTo(newItem, ms)
				}
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

	config := getDefaultConfig()

	reqUrl := fmt.Sprintf("%s/%s/_doc/%s", config.Endpoint, orm.GetIndexName(alerting.Config{}), emailAccountId)

	res, err := doRequest(reqUrl, http.MethodGet,nil, nil)
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
	//name :=  queryValue(resBody,"_source.email_account.name", "")
	//kk := fmt.Sprintf("search-center_alerting.destination.email.%s.password", name)
	//secStr, _ := getKeystore().Retrieve(kk)
	//if secStr != nil {
	//	pwd, _ := secStr.Get()
	//	fmt.Println(string(pwd))
	//}

	writeJSON(w, IfaceMap{
		"ok": true,
		"resp": queryValue(resBody, "_source.email_account", nil),
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

	config := getDefaultConfig()
	reqUrl := fmt.Sprintf("%s/%s/_doc", config.Endpoint, orm.GetIndexName(alerting.Config{}))
	var emailGroup = &alerting.EmailGroup{}
	err := decodeJSON(req.Body, &emailGroup)
	if err != nil {
		writeError(w, err)
		return
	}
	res, err := doRequest(reqUrl, http.MethodPost, map[string]string{
		"refresh": "wait_for",
	}, IfaceMap{
		"cluster_id": id,
		EMAIL_GROUP_FIELD: emailGroup,
	})
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
		"resp": IfaceMap{
			EMAIL_GROUP_FIELD: IfaceMap{
				"emails": emailGroup.Emails,
				"name": emailGroup.Name,
				"schema_version": emailGroup.SchemaVersion,
			},
			"_id": queryValue(resBody, "_id", ""),
			"_version":  queryValue(resBody, "_version", 0),
		},
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
	config := getDefaultConfig()
	reqUrl := fmt.Sprintf("%s/%s/_doc/%s", config.Endpoint, orm.GetIndexName(alerting.Config{}), emailGroupId)
	var emailGroup = &alerting.EmailGroup{}
	err := decodeJSON(req.Body, &emailGroup)
	if err != nil {
		writeError(w, err)
		return
	}
	res, err := doRequest(reqUrl, http.MethodPut, map[string]string{
		"refresh": "wait_for",
	}, IfaceMap{
		"cluster_id": id,
		EMAIL_GROUP_FIELD: emailGroup,
	})
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
	config := getDefaultConfig()
	reqUrl := fmt.Sprintf("%s/%s/_doc/%s", config.Endpoint, orm.GetIndexName(alerting.Config{}), emailGroupId)

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

	must := []IfaceMap{
		{
			"exists": IfaceMap{
				"field": EMAIL_GROUP_FIELD,
			},
		},
	}

	if clearSearch := strings.TrimSpace(search); clearSearch != "" {
		clearSearch = strings.ReplaceAll(clearSearch, " ", "* *")
		must = append(must, IfaceMap{
			"query_string": IfaceMap{
				"default_field": "email_group.name",
				"default_operator": "AND",
				"query": fmt.Sprintf(`*%s*`, clearSearch),
			},
		})
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

	config := getDefaultConfig()
	reqUrl := fmt.Sprintf("%s/%s/_search", config.Endpoint, orm.GetIndexName(alerting.Config{}))

	res, err := doRequest(reqUrl, http.MethodGet, nil, reqBody)
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
				source := queryValue(emailGroup, "_source."+EMAIL_GROUP_FIELD, nil)
				if ms, ok :=  source.(map[string]interface{}); ok {
					assignTo(newItem, ms)
				}
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

	emailGroupId := ps.ByName("emailGroupId")

	config := getDefaultConfig()
	reqUrl := fmt.Sprintf("%s/%s/_doc/%s", config.Endpoint, orm.GetIndexName(alerting.Config{}), emailGroupId)
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
	emailGroup := queryValue(resBody, "_source."+EMAIL_GROUP_FIELD, nil)
	if emailGroup == nil {
		writeJSON(w, IfaceMap{
			"ok": false,
		}, http.StatusOK)
		return
	}

	writeJSON(w, IfaceMap{
		"ok": true,
		"resp": emailGroup,
	}, http.StatusOK)

}

