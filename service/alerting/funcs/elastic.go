/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package funcs

import (
	log "github.com/cihub/seelog"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"strings"
)

func lookup(directory string, id string) interface{}{
	directory = strings.TrimSpace(directory)
	if directory == "" {
		return "empty_directory"
	}
	parts := strings.Split(directory, ",")
	kvs := map[string]string{}
	for _, part := range parts {
		kv := strings.Split(part, "=")
		if len(kv) == 2 {
			k := strings.TrimSpace(kv[0])
			kvs[k]= strings.TrimSpace(kv[1])
		}else{
			log.Debugf("got unexpected directory part: %s", part)
		}
	}

	switch kvs["category"] {
	case "metadata":
		return lookupMetadata(kvs["object"], kvs["property"], kvs["default"], id)
	}
	return kvs["default"]
}

func lookupMetadata(object string, property string, defaultValue string, id string) interface{}{
	var (
		cfgM = util.MapStr{}
		buf []byte
	)
	switch object {
	case "cluster":
		cfg := elastic.GetConfig(id)
		buf = util.MustToJSONBytes(cfg)
		err := util.FromJSONBytes(buf, &cfgM)
		if err != nil {
			log.Error(err)
			return defaultValue
		}
		delete(cfgM, "basic_auth")
	case "node":
		cfg := elastic.NodeConfig{}
		cfg.ID = id
		err, result := orm.GetBy("metadata.node_id", id, &cfg)
		if err != nil {
			log.Error(err)
			return defaultValue
		}
		if len(result.Result) == 0 {
			return defaultValue
		}
		buf = util.MustToJSONBytes(result.Result[0])
		err = util.FromJSONBytes(buf, &cfgM)
		if err != nil {
			log.Error(err)
			return defaultValue
		}
	case "index":
		cfg := elastic.IndexConfig{}
		q := &orm.Query{
			Size: 1,
		}
		q.Conds = orm.And(orm.Eq("metadata.index_id", id))
		err, result := orm.Search(cfg, q)
		if err != nil {
			log.Error(err)
			return defaultValue
		}
		if len(result.Result) == 0 {
			return defaultValue
		}
		buf = util.MustToJSONBytes(result.Result[0])
		err = util.FromJSONBytes(buf, &cfgM)
		if err != nil {
			log.Error(err)
			return defaultValue
		}
	}
	if buf == nil {
		return defaultValue
	}
	if property == "*" || property == "" {
		return cfgM
	}
	v, _ := cfgM.GetValue(property)
	if v != nil {
		return v
	}
	return defaultValue
}