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
	"io/ioutil"
	"net/http"
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
	req, err := http.NewRequest(http.MethodGet, targetEsConfig.Endpoint, nil)
	if err != nil {
		return fmt.Errorf("new request error: %v", err)
	}
	if targetEsConfig.BasicAuth != nil {
		req.SetBasicAuth(targetEsConfig.BasicAuth.Username, targetEsConfig.BasicAuth.Password)
	}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("check elasticsearch requirement error: %v", err)
	}
	defer res.Body.Close()
	resBytes, err := ioutil.ReadAll(res.Body)
	if err != nil {
		return fmt.Errorf("check elasticsearch requirement error: %v", err)
	}
	versionNumber, err := jsonparser.GetString(resBytes, "version", "number")
	if err != nil {
		return fmt.Errorf("check elasticsearch requirement error: %v", err)
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