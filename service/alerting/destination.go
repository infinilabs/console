package alerting

import (
	"errors"
	"fmt"
	"infini.sh/console/config"
	"infini.sh/console/model/alerting"
	httprouter "infini.sh/framework/core/api/router"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"net/http"
	"strings"
	"time"
)

func GetDestination(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	conf := getDefaultConfig()
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

	esConfig := getDefaultConfig()
	esClient := elastic.GetClient(esConfig.ID)
	res, err := esClient.SearchWithRawQueryDSL( orm.GetIndexName(alerting.Config{}), util.MustToJSONBytes(reqBody))
	if err != nil {
		writeError(w, err)
		return
	}

	totalDestinations := res.GetTotal()
	rawHits := res.Hits.Hits
	dests := []IfaceMap{}

	for _, hit := range rawHits {
		newItem := IfaceMap{}
		newItem["id"] = hit.ID
		source := queryValue(hit.Source,DESTINATION_FIELD, nil)
		if ms, ok :=  source.(map[string]interface{}); ok {
			assignTo(newItem, ms)
		}
		dests = append(dests, newItem)
	}

	writeJSON(w, IfaceMap{
		"ok": true,
		"destinations": dests,
		"totalDestinations":totalDestinations,
	}, http.StatusOK)
}

func CreateDestination(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	esConfig := getDefaultConfig()
	destId := util.GetUUID()
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
	esClient := elastic.GetClient(esConfig.ID)
	indexRes, err := esClient.Index(orm.GetIndexName(alerting.Config{}), "", destId, IfaceMap{
		DESTINATION_FIELD: toSaveDest,
	})
	if err != nil {
		writeError(w, err)
		return
	}


	writeJSON(w, IfaceMap{
		"ok": true,
		"resp": IfaceMap{
			DESTINATION_FIELD: toSaveDest,
			"_id": indexRes.ID,
			"_version": indexRes.Version,
		},
	}, http.StatusOK)

}

func UpdateDestination(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	destinationId := ps.ByName("destinationId")

	config := getDefaultConfig()
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
	esClient := elastic.GetClient(config.ID)
	indexRes, err := esClient.Index(orm.GetIndexName(alerting.Config{}), "", destinationId,  IfaceMap{
		DESTINATION_FIELD: toSaveDest,
	})
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, IfaceMap{
		"ok": true,
		"version": indexRes.Version,
		"id": indexRes.ID,
	}, http.StatusOK)

}

func DeleteDestination(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	destinationId := ps.ByName("destinationId")

	config := getDefaultConfig()
	esClient := elastic.GetClient(config.ID)
	deleteRes, err := esClient.Delete(orm.GetIndexName(alerting.Config{}), "", destinationId)
	if err != nil {
		writeError(w, err)
		return
	}

	var isOk = false
	if deleteRes.Result == "deleted" {
		isOk = true
	}
	writeJSON(w, IfaceMap{
		"ok": isOk,
	}, http.StatusOK)

}

func getDefaultConfig() *elastic.ElasticsearchConfig {
	elasticsearch := "default"
	if appConfig != nil {
		elasticsearch = appConfig.Elasticsearch
	}
	return elastic.GetConfig(elasticsearch)
}
var appConfig *config.AppConfig
func InitAppConfig(config *config.AppConfig){
	appConfig = config
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
	config := getDefaultConfig()

	var emailAccount = &alerting.EmailAccount{}
	err := decodeJSON(req.Body, &emailAccount)
	if err != nil {
		writeError(w, err)
		return
	}
	//var password = emailAccount.Password
	//emailAccount.Password = ""
	esClient := elastic.GetClient(config.ID)
	indexRes, err := esClient.Index(orm.GetIndexName(alerting.Config{}), "", util.GetUUID(), IfaceMap{
		EMAIL_ACCOUNT_FIELD: emailAccount,
	})
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
			"_id": indexRes.ID,
			"_version":  indexRes.Version,
		},
	}, http.StatusOK)
}

func UpdateEmailAccount(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	emailAccountId := ps.ByName("emailAccountId")
	config := getDefaultConfig()

	var emailAccount = &alerting.EmailAccount{}
	err := decodeJSON(req.Body, &emailAccount)
	if err != nil {
		writeError(w, err)
		return
	}
	esClient := elastic.GetClient(config.ID)
	indexRes, err := esClient.Index(orm.GetIndexName(alerting.Config{}),"", emailAccountId, IfaceMap{
		EMAIL_ACCOUNT_FIELD: emailAccount,
	})
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, IfaceMap{
		"ok": true,
		"id": indexRes.ID,
	}, http.StatusOK)

}

func DeleteEmailAccount(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	emailAccountId := ps.ByName("emailAccountId")
	config := getDefaultConfig()
	esClient := elastic.GetClient(config.ID)
	deleteRes, err := esClient.Delete(orm.GetIndexName(alerting.Config{}), "", emailAccountId, "wait_for")
	if err != nil {
		writeError(w, err)
		return
	}
	var isOk = false
	if deleteRes.Result == "deleted" {
		isOk = true
	}
	writeJSON(w, IfaceMap{
		"ok": isOk,
	}, http.StatusOK)
}

func GetEmailAccounts(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
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
	esClient := elastic.GetClient(config.ID)
	searchRes, err := esClient.SearchWithRawQueryDSL( orm.GetIndexName(alerting.Config{}), util.MustToJSONBytes(reqBody))
	if err != nil {
		writeError(w, err)
		return
	}

	totalEmailAccounts := searchRes.GetTotal()
	rawHits := searchRes.Hits.Hits
	emailAccounts := []IfaceMap{}

	for _, hit := range rawHits {
		newItem := IfaceMap{}
		newItem["id"] = hit.ID
		source := queryValue(hit.Source, EMAIL_ACCOUNT_FIELD, nil)
		if ms, ok :=  source.(map[string]interface{}); ok {
			assignTo(newItem, ms)
		}
		emailAccounts = append(emailAccounts, newItem)
	}
	writeJSON(w, IfaceMap{
		"ok": true,
		"emailAccounts": emailAccounts,
		"totalEmailAccounts": totalEmailAccounts,
	}, http.StatusOK)
}

func GetEmailAccount(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	emailAccountId := ps.ByName("emailAccountId")

	config := getDefaultConfig()
	esClient := elastic.GetClient(config.ID)
	getRes, err := esClient.Get(orm.GetIndexName(alerting.Config{}), "", emailAccountId)
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
		"resp": queryValue(getRes.Source, "email_account", nil),
	}, http.StatusOK)
}


// --- email group

func CreateEmailGroup(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	config := getDefaultConfig()
	var emailGroup = &alerting.EmailGroup{}
	err := decodeJSON(req.Body, &emailGroup)
	if err != nil {
		writeError(w, err)
		return
	}
	esClient := elastic.GetClient(config.ID)
	indexRes, err := esClient.Index(orm.GetIndexName(alerting.Config{}), "", util.GetUUID(),  IfaceMap{
		EMAIL_GROUP_FIELD: emailGroup,
	})
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
			"_id": indexRes.ID,
			"_version": indexRes.Version,
		},
	}, http.StatusOK)
}

func UpdateEmailGroup(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	emailGroupId := ps.ByName("emailGroupId")
	config := getDefaultConfig()
	var emailGroup = &alerting.EmailGroup{}
	err := decodeJSON(req.Body, &emailGroup)
	if err != nil {
		writeError(w, err)
		return
	}
	esClient := elastic.GetClient(config.ID)
	indexRes, err := esClient.Index( orm.GetIndexName(alerting.Config{}), "", emailGroupId,  IfaceMap{
		EMAIL_GROUP_FIELD: emailGroup,
	})
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, IfaceMap{
		"ok": true,
		"id": indexRes.ID,
	}, http.StatusOK)

}

func DeleteEmailGroup(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	emailGroupId := ps.ByName("emailGroupId")
	config := getDefaultConfig()
	esClient := elastic.GetClient(config.ID)
	res, err := esClient.Delete(orm.GetIndexName(alerting.Config{}), "", emailGroupId)
	if err != nil {
		writeError(w, err)
		return
	}

	var isOk = false
	if res.Result == "deleted" {
		isOk = true
	}
	writeJSON(w, IfaceMap{
		"ok": isOk,
	}, http.StatusOK)

}

func GetEmailGroups(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
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
	esClient := elastic.GetClient(config.ID)
	res, err := esClient.SearchWithRawQueryDSL(orm.GetIndexName(alerting.Config{}), util.MustToJSONBytes(reqBody))
	if err != nil {
		writeError(w, err)
		return
	}

	totalEmailGroups := res.GetTotal()
	rawHits := res.Hits.Hits
	emailGroups := []IfaceMap{}

	for _, hit := range rawHits {
		newItem := IfaceMap{}
		newItem["id"] = hit.ID
		source := queryValue(hit.Source, EMAIL_GROUP_FIELD, nil)
		if ms, ok :=  source.(map[string]interface{}); ok {
			assignTo(newItem, ms)
		}
		emailGroups = append(emailGroups, newItem)
	}
	writeJSON(w, IfaceMap{
		"ok":               true,
		"emailGroups":    emailGroups,
		"totalEmailGroups": totalEmailGroups,
	}, http.StatusOK)
}

func GetEmailGroup(w http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	emailGroupId := ps.ByName("emailGroupId")

	config := getDefaultConfig()
	esClient := elastic.GetClient(config.ID)
	getRes, err := esClient.Get(orm.GetIndexName(alerting.Config{}), "", emailGroupId)
	if err != nil {
		writeError(w, err)
		return
	}

	emailGroup := queryValue(getRes.Source, EMAIL_GROUP_FIELD, nil)
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

