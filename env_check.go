/* Copyright © INFINI Ltd. All rights reserved.
 * web: https://infinilabs.com
 * mail: hello#infini.ltd */

package main

import (
	"fmt"
	"github.com/buger/jsonparser"
	log "github.com/cihub/seelog"
	"infini.sh/console/config"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/env"
	"infini.sh/framework/core/util"
)

func bootstrapRequirementCheck() error{
	err := checkElasticsearchRequire()
	if err != nil {
		return err
	}
	return nil
}


func checkElasticsearchRequire() error{
	log.Trace("start to check elasticsearch requirement")
	var esConfigs = []elastic.ElasticsearchConfig{}
	ok, err := env.ParseConfig("elasticsearch", &esConfigs)
	if err != nil {
		return fmt.Errorf("parse elasticsearch config section error: %v", err)
	}
	if !ok {
		return fmt.Errorf("elasticsearch config section not found")
	}
	appConfig = &config.AppConfig{
		Elasticsearch: "default",
	}
	ok, err = env.ParseConfig("web", appConfig)
	if err != nil {
		return fmt.Errorf("parse web config section error: %v", err)
	}
	if !ok {
		return fmt.Errorf("web config section not found")
	}
	if  appConfig.Elasticsearch == "" {
		return fmt.Errorf("elasticsearch config of web section can not be empty")
	}
	var targetEsConfig *elastic.ElasticsearchConfig
	for _, esConfig := range esConfigs {
		if esConfig.Name == appConfig.Elasticsearch {
			targetEsConfig = &esConfig
		}
	}
	if targetEsConfig == nil {
		return fmt.Errorf("elasticsearch config named %s not found", appConfig.Elasticsearch)
	}
	var req = util.NewGetRequest(targetEsConfig.Endpoint, nil)
	if targetEsConfig.BasicAuth != nil {
		req.SetBasicAuth(targetEsConfig.BasicAuth.Username, targetEsConfig.BasicAuth.Password)
	}

	result, err := util.ExecuteRequest(req)
	if err != nil {
		return fmt.Errorf("check elasticsearch requirement error: %v", err)
	}

	versionNumber, err := jsonparser.GetString(result.Body, "version", "number")
	if err != nil {
		return fmt.Errorf("check elasticsearch requirement error: %v, got response: %s", err, string(result.Body))
	}
	cr, err := util.VersionCompare(versionNumber, "7.3")
	if  err !=nil {
		return fmt.Errorf("check elasticsearch requirement error: %v", err)
	}
	if cr == -1 {
		return fmt.Errorf("elasticsearch cluster version of store data required to be version 7.3 and above, but got %s", versionNumber)
	}
	return nil
}