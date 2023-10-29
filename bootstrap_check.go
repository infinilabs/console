/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package main

import (
	"fmt"
	"github.com/buger/jsonparser"
	log "github.com/cihub/seelog"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/util"
)

func bootstrapRequirementCheck() error{
	err := checkElasticsearchRequirements()
	if err != nil {
		return err
	}
	return nil
}


func checkElasticsearchRequirements() error{
	log.Trace("start to check system cluster requirement")
	var esConfigs = []elastic.ElasticsearchConfig{}
	ok, err := env.ParseConfig("elasticsearch", &esConfigs)
	if err != nil {
		return fmt.Errorf("parse elasticsearch config section error: %v", err)
	}
	if !ok {
		return fmt.Errorf("elasticsearch config section not found")
	}

	elasticsearchID:=global.Lookup(elastic.GlobalSystemElasticsearchID)

	if  elasticsearchID == nil||elasticsearchID=="" {
		return fmt.Errorf("cluster config in web section can not be empty")
	}

	esID:=elasticsearchID.(string)

	var targetEsConfig *elastic.ElasticsearchConfig
	for _, esConfig := range esConfigs {
		if esConfig.ID == esID||(esConfig.ID==""&&esConfig.Name==esID) {
			targetEsConfig = &esConfig
		}
	}

	if targetEsConfig == nil {
		return fmt.Errorf("cluster config %s was not found", esID)
	}
	var req = util.NewGetRequest(targetEsConfig.GetAnyEndpoint(), nil)
	if targetEsConfig.BasicAuth != nil {
		req.SetBasicAuth(targetEsConfig.BasicAuth.Username, targetEsConfig.BasicAuth.Password)
	}

	result, err := util.ExecuteRequest(req)
	if err != nil {
		return fmt.Errorf("check system cluster requirement error: %v", err)
	}

	if result==nil||result.Body==nil||len(result.Body)==0{
		return fmt.Errorf("failed to retrive cluster version info")
	}


	versionNumber, err := jsonparser.GetString(result.Body, "version", "number")
	if err != nil {
		return fmt.Errorf("check system cluster requirement error: %v, got response: %s", err, string(result.Body))
	}
	distribution, _ := jsonparser.GetString(result.Body, "version", "distribution")
	if distribution == elastic.Easysearch || distribution == elastic.Opensearch {
		return nil
	} else if distribution != "" {
		return fmt.Errorf("unkonw cluster distribution: %v", distribution)
	}
	cr, err := util.VersionCompare(versionNumber, "5.3")
	if  err !=nil {
		return fmt.Errorf("check system cluster requirement error: %v", err)
	}
	if cr == -1 {
		return fmt.Errorf("system cluster version with distribution elasticsearch required to be version 5.3 and above, but got %s", versionNumber)
	}
	return nil
}